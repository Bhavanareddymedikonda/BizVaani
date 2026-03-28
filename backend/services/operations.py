"""Deterministic operational actions for voice/chat."""
from __future__ import annotations

import re
from datetime import date
from typing import Any

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import Product
from services.inventory import (
    apply_stock_change,
    find_product_by_name,
    list_inventory_snapshot,
    list_stock_transactions,
    upsert_sales_entry_and_adjust_stock,
)

CONFIRM_WORDS = {"confirm", "yes", "ok", "okay", "done", "proceed"}
CANCEL_WORDS = {"cancel", "stop", "no", "discard"}


def _is_confirmation(query: str) -> bool:
    normalized = query.strip().lower()
    return normalized in CONFIRM_WORDS


def _is_cancellation(query: str) -> bool:
    normalized = query.strip().lower()
    return normalized in CANCEL_WORDS


def _reply(
    *,
    text: str,
    why: str = "",
    what: str = "",
    rupees_impact: float = 0,
    action: dict | None = None,
    pending_action: dict | None = None,
) -> dict:
    return {
        "handled": True,
        "response_text": text,
        "why_text": why,
        "what_text": what,
        "rupees_impact": rupees_impact,
        "action": action,
        "pending_action": pending_action,
    }


async def _product_payload(product: Product) -> dict:
    return {
        "product_id": product.id,
        "product_name": product.name,
        "unit": product.unit,
        "selling_price": float(product.selling_price or 0),
    }


async def _parse_stock_update(query: str, shop_id: int, db: AsyncSession) -> dict | None:
    pattern = re.search(
        r"(restock|add|increase|update stock(?: for)?|reduce|remove|decrease)\s+(\d+(?:\.\d+)?)\s*(?:kg|kgs|pcs|pieces|units|packets)?\s+(?:of\s+)?(.+)",
        query,
        re.IGNORECASE,
    )
    if not pattern:
        return None

    verb = pattern.group(1).lower()
    qty = float(pattern.group(2))
    product_name = pattern.group(3).strip(" .")
    product = await find_product_by_name(db, shop_id, product_name)
    if not product:
        return _reply(text=f"I could not find a product matching '{product_name}'.")

    quantity_delta = qty if verb in {"restock", "add", "increase", "update stock", "update stock for"} else -qty
    transaction_type = "restock" if quantity_delta > 0 else "manual_adjustment"
    payload = {
        **await _product_payload(product),
        "quantity_delta": quantity_delta,
        "transaction_type": transaction_type,
        "notes": f"Voice stock update: {verb}",
    }
    summary = f"{'Add' if quantity_delta > 0 else 'Reduce'} {abs(quantity_delta):g} {product.unit} for {product.name}"
    return _reply(
        text=f"Ready to update stock for {product.name}.",
        why=f"This will change the current stock by {quantity_delta:g} {product.unit}.",
        what="Say confirm to commit this stock update, or cancel to discard it.",
        action={
            "kind": "stock_update",
            "status": "draft",
            "requires_confirmation": True,
            "summary": summary,
            "payload": payload,
        },
        pending_action={"kind": "stock_update", "payload": payload},
    )


async def _parse_sales_entry(query: str, shop_id: int, db: AsyncSession) -> dict | None:
    pattern = re.search(
        r"(?:sold|record sale(?: of)?|sale of)\s+(\d+(?:\.\d+)?)\s*(?:kg|kgs|pcs|pieces|units|packets)?\s+(?:of\s+)?(.+?)(?:\s+for\s+(?:rs\.?\s*)?(\d+(?:\.\d+)?))?$",
        query,
        re.IGNORECASE,
    )
    if not pattern:
        return None

    qty = float(pattern.group(1))
    product_name = pattern.group(2).strip(" .")
    revenue_text = pattern.group(3)
    product = await find_product_by_name(db, shop_id, product_name)
    if not product:
        return _reply(text=f"I could not find a product matching '{product_name}'.")

    revenue = float(revenue_text) if revenue_text else round(qty * float(product.selling_price or 0), 2)
    payload = {
        **await _product_payload(product),
        "quantity_sold": qty,
        "revenue": revenue,
        "entry_date": date.today().isoformat(),
        "source": "voice",
    }
    return _reply(
        text=f"Ready to record today's sale for {product.name}.",
        why=f"This will set today's sold quantity to {qty:g} {product.unit} with revenue Rs.{revenue:,.2f}.",
        what="Say confirm to save this sales entry and adjust stock by the delta.",
        rupees_impact=revenue,
        action={
            "kind": "sales_entry",
            "status": "draft",
            "requires_confirmation": True,
            "summary": f"Record sale: {qty:g} {product.unit} {product.name} for Rs.{revenue:,.2f}",
            "payload": payload,
        },
        pending_action={"kind": "sales_entry", "payload": payload},
    )


async def _parse_invoice_request(query: str, shop_id: int, db: AsyncSession) -> dict | None:
    if not re.search(r"\b(invoice|receipt|bill)\b", query, re.IGNORECASE):
        return None

    customer_match = re.search(
        r"(?:invoice|receipt|bill)\s+(?:for\s+)?([a-zA-Z][a-zA-Z\s]+?)\s+(?:for|with)\s+(.+)$",
        query,
        re.IGNORECASE,
    )
    if not customer_match:
        return _reply(
            text="I can generate invoices from chat, but I need a customer and items in one line.",
            what="Try: create invoice for Ramesh with 2 rice at 50 and 1 sugar at 40",
            action={"kind": "invoice_draft", "status": "needs_input", "requires_confirmation": False},
        )

    customer_name = customer_match.group(1).strip()
    items_text = customer_match.group(2).strip()
    item_matches = re.findall(
        r"(\d+(?:\.\d+)?)\s+([a-zA-Z][a-zA-Z\s]+?)(?:\s+at\s+(\d+(?:\.\d+)?))?(?=,| and |$)",
        items_text,
        re.IGNORECASE,
    )
    if not item_matches:
        return _reply(
            text="I could not parse any invoice items from that request.",
            what="Try: create invoice for Ramesh with 2 rice at 50 and 1 sugar at 40",
        )

    items: list[dict[str, Any]] = []
    subtotal = 0.0
    for qty_text, name_text, price_text in item_matches:
        product = await find_product_by_name(db, shop_id, name_text.strip())
        unit_price = float(price_text) if price_text else float(product.selling_price if product else 0)
        qty = float(qty_text)
        amount = round(qty * unit_price, 2)
        subtotal += amount
        items.append(
            {
                "product_id": product.id if product else None,
                "product": product.name if product else name_text.strip(),
                "qty": qty,
                "unit_price": unit_price,
                "gst_rate": 5,
                "amount": amount,
                "stock_available": float(product.stock_qty or 0) if product else None,
            }
        )

    total_gst = round(subtotal * 0.05, 2)
    total = round(subtotal + total_gst, 2)
    payload = {
        "customer_name": customer_name,
        "items": items,
        "subtotal": round(subtotal, 2),
        "cgst": round(total_gst / 2, 2),
        "sgst": round(total_gst / 2, 2),
        "total": total,
    }
    return _reply(
        text=f"Invoice draft ready for {customer_name}.",
        why=f"I parsed {len(items)} line item(s) with an estimated total of Rs.{total:,.2f}.",
        what="Say confirm to generate the invoice and deduct stock for matched products.",
        rupees_impact=total,
        action={
            "kind": "invoice_draft",
            "status": "draft",
            "requires_confirmation": True,
            "summary": f"Invoice for {customer_name} totalling Rs.{total:,.2f}",
            "payload": payload,
        },
        pending_action={"kind": "invoice_draft", "payload": payload},
    )


async def _handle_inventory_query(query: str, shop_id: int, db: AsyncSession) -> dict | None:
    lowered = query.lower()
    if not any(keyword in lowered for keyword in ["inventory", "stock", "transaction history", "recent transactions"]):
        return None

    if "history" in lowered or "transactions" in lowered:
        transactions = await list_stock_transactions(db, shop_id=shop_id, limit=8)
        summary = [
            f"{tx['transaction_type']} {tx['product_name']} {tx['quantity_delta']:g} -> {tx['balance_after']:g}"
            for tx in transactions[:5]
        ]
        return _reply(
            text="Here is your recent stock transaction history.",
            why="This view shows the latest inventory movements across sales, restocks, and manual adjustments.",
            what="\n".join(summary) if summary else "No transactions recorded yet.",
            action={
                "kind": "inventory_query",
                "status": "info",
                "requires_confirmation": False,
                "transactions": transactions,
            },
        )

    inventory = await list_inventory_snapshot(db, shop_id)
    critical = [item for item in inventory if item["status"] == "CRITICAL"][:5]
    low = [item for item in inventory if item["status"] == "LOW_STOCK"][:5]
    lines = [f"{item['name']}: {item['in_stock']:g} {item['unit']} ({item['status']})" for item in (critical + low)]
    return _reply(
        text="Here is the live inventory snapshot.",
        why="Stock levels are calculated from current product balances with recent sales-based thresholds.",
        what="\n".join(lines) if lines else "All tracked products are currently above the low-stock threshold.",
        action={
            "kind": "inventory_query",
            "status": "info",
            "requires_confirmation": False,
            "inventory": inventory[:12],
        },
    )


async def execute_pending_action(
    pending_action: dict,
    *,
    shop_id: int,
    db: AsyncSession,
) -> dict:
    kind = pending_action.get("kind")
    payload = pending_action.get("payload", {})

    if kind == "stock_update":
        transaction = await apply_stock_change(
            db,
            shop_id=shop_id,
            product_id=payload["product_id"],
            quantity_delta=float(payload["quantity_delta"]),
            transaction_type=payload["transaction_type"],
            notes=payload.get("notes"),
        )
        await db.commit()
        return _reply(
            text=f"Stock updated for {payload['product_name']}.",
            why=f"The new balance is {transaction.balance_after:g} {payload['unit']}.",
            what="You can ask for recent stock transactions or another inventory update.",
            action={
                "kind": "stock_update",
                "status": "committed",
                "requires_confirmation": False,
                "payload": {
                    **payload,
                    "balance_after": float(transaction.balance_after),
                    "transaction_id": transaction.id,
                },
            },
        )

    if kind == "sales_entry":
        _, quantity_diff = await upsert_sales_entry_and_adjust_stock(
            db,
            shop_id=shop_id,
            product_id=payload["product_id"],
            entry_date=date.fromisoformat(payload["entry_date"]),
            quantity_sold=float(payload["quantity_sold"]),
            revenue=float(payload["revenue"]),
            source=payload["source"],
        )
        await db.commit()
        return _reply(
            text=f"Sales entry saved for {payload['product_name']}.",
            why=f"Today's sales now reflect {payload['quantity_sold']:g} {payload['unit']}, and stock was adjusted by {-quantity_diff:g}.",
            what="You can add another sale or ask for stock history.",
            rupees_impact=float(payload["revenue"]),
            action={
                "kind": "sales_entry",
                "status": "committed",
                "requires_confirmation": False,
                "payload": payload,
            },
        )

    if kind == "invoice_draft":
        from api.invoice import GenerateInvoiceRequest, InvoiceItem, generate_invoice

        invoice_req = GenerateInvoiceRequest(
            shop_id=shop_id,
            customer_name=payload["customer_name"],
            items=[
                InvoiceItem(
                    product_id=item.get("product_id"),
                    product=item["product"],
                    qty=item["qty"],
                    unit_price=item["unit_price"],
                    gst_rate=item.get("gst_rate", 5),
                )
                for item in payload["items"]
            ],
        )
        # Reuse API route logic to keep invoice creation and stock deduction consistent.
        result = await generate_invoice(invoice_req, current_user=type("T", (), {"shop_id": shop_id})(), db=db)
        return _reply(
            text=f"Invoice generated for {payload['customer_name']}.",
            why=f"Invoice total is Rs.{payload['total']:,.2f}.",
            what="Use the invoice link to view or download the receipt PDF.",
            rupees_impact=float(payload["total"]),
            action={
                "kind": "invoice_draft",
                "status": "committed",
                "requires_confirmation": False,
                "payload": {
                    **payload,
                    "invoice_id": result["invoice_id"],
                    "invoice_number": result["invoice_number"],
                    "detail_url": result["detail_url"],
                    "pdf_url": result["pdf_url"],
                },
            },
        )

    raise HTTPException(status_code=400, detail="Unsupported pending action")


async def handle_operational_query(
    query: str,
    *,
    shop_id: int,
    db: AsyncSession,
    pending_action: dict | None,
) -> dict | None:
    if pending_action and _is_confirmation(query):
        return await execute_pending_action(pending_action, shop_id=shop_id, db=db)

    if pending_action and _is_cancellation(query):
        return _reply(
            text="Pending action cancelled.",
            what="You can ask for a new stock update, sales entry, or invoice draft.",
            action={
                "kind": pending_action.get("kind", "action"),
                "status": "cancelled",
                "requires_confirmation": False,
            },
            pending_action=None,
        )

    for parser in (_parse_stock_update, _parse_sales_entry, _parse_invoice_request):
        result = await parser(query, shop_id, db)
        if result:
            return result

    return await _handle_inventory_query(query, shop_id, db)
