"""Invoice routes — production implementation with PDF generation.

POST /api/invoice/generate → create invoice + generate PDF
GET  /api/invoice/{id}/pdf  → download PDF

Ref: BACKEND_STRUCTURE.md Section 4 (Invoice endpoints)
"""
import io
import os
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db.models import Invoice, Shop
from core.auth_utils import get_current_user, TokenData

router = APIRouter()


class InvoiceItem(BaseModel):
    product: str
    qty: float
    unit_price: float
    gst_rate: float = 5


class GenerateInvoiceRequest(BaseModel):
    shop_id: int
    customer_name: str
    customer_gstin: str | None = None
    items: list[InvoiceItem]


@router.post("/generate", status_code=201)
async def generate_invoice(
    req: GenerateInvoiceRequest,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    shop_id = current_user.shop_id

    # Get shop for header info
    shop_result = await db.execute(select(Shop).where(Shop.id == shop_id))
    shop = shop_result.scalar_one_or_none()

    # Calculate totals
    subtotal = 0
    items_data = []
    for item in req.items:
        amount = item.qty * item.unit_price
        gst_amount = amount * (item.gst_rate / 100)
        subtotal += amount
        items_data.append({
            "product": item.product,
            "qty": item.qty,
            "unit_price": item.unit_price,
            "gst_rate": item.gst_rate,
            "amount": round(amount, 2),
            "gst_amount": round(gst_amount, 2),
        })

    total_gst = sum(i["gst_amount"] for i in items_data)
    cgst = round(total_gst / 2, 2)
    sgst = round(total_gst / 2, 2)
    total = round(subtotal + total_gst, 2)

    # Generate invoice number
    count_result = await db.execute(
        select(func.count(Invoice.id)).where(Invoice.shop_id == shop_id)
    )
    count = (count_result.scalar() or 0) + 1
    year = datetime.now(timezone.utc).year
    invoice_number = f"BV-{year}-{count:03d}"

    # Save to DB
    invoice = Invoice(
        shop_id=shop_id,
        invoice_number=invoice_number,
        customer_name=req.customer_name,
        customer_gstin=req.customer_gstin,
        items=items_data,
        subtotal=round(subtotal, 2),
        cgst=cgst,
        sgst=sgst,
        total=total,
    )
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)

    return {
        "invoice_id": invoice.invoice_number,
        "pdf_url": f"/api/invoice/{invoice.id}/pdf",
        "total": total,
        "gst_breakup": {"cgst": cgst, "sgst": sgst},
    }


@router.get("/{invoice_id}/pdf")
async def get_invoice_pdf(
    invoice_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Generate and stream a PDF invoice. No auth needed (public shareable link)."""
    invoice_result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = invoice_result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Get shop info
    shop_result = await db.execute(select(Shop).where(Shop.id == invoice.shop_id))
    shop = shop_result.scalar_one_or_none()
    shop_name = shop.shop_name if shop else "BizVaani Store"

    # Generate PDF using ReportLab
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import mm
        from reportlab.pdfgen import canvas

        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        w, h = A4

        # Header
        c.setFont("Helvetica-Bold", 18)
        c.drawString(30, h - 40, shop_name)
        c.setFont("Helvetica", 10)
        c.drawString(30, h - 58, "GST Invoice")
        c.drawRightString(w - 30, h - 40, f"Invoice: {invoice.invoice_number}")
        c.drawRightString(w - 30, h - 55, f"Date: {invoice.created_at.strftime('%Y-%m-%d')}")

        c.line(30, h - 65, w - 30, h - 65)

        # Customer
        y = h - 85
        c.setFont("Helvetica", 10)
        c.drawString(30, y, f"Bill To: {invoice.customer_name}")
        if invoice.customer_gstin:
            y -= 15
            c.drawString(30, y, f"GSTIN: {invoice.customer_gstin}")

        # Table header
        y -= 30
        c.setFont("Helvetica-Bold", 10)
        c.drawString(30, y, "Item")
        c.drawString(200, y, "Qty")
        c.drawString(270, y, "Rate")
        c.drawString(340, y, "GST%")
        c.drawString(410, y, "Amount")
        c.line(30, y - 5, w - 30, y - 5)

        # Table rows
        c.setFont("Helvetica", 10)
        items = invoice.items if isinstance(invoice.items, list) else []
        for item in items:
            y -= 18
            c.drawString(30, y, str(item.get("product", "")))
            c.drawString(200, y, str(item.get("qty", "")))
            c.drawString(270, y, f"₹{item.get('unit_price', 0)}")
            c.drawString(340, y, f"{item.get('gst_rate', 5)}%")
            c.drawString(410, y, f"₹{item.get('amount', 0)}")

        # Totals
        y -= 25
        c.line(30, y + 10, w - 30, y + 10)
        c.drawRightString(400, y, "Subtotal:")
        c.drawRightString(w - 30, y, f"₹{invoice.subtotal}")
        y -= 15
        c.drawRightString(400, y, "CGST:")
        c.drawRightString(w - 30, y, f"₹{invoice.cgst}")
        y -= 15
        c.drawRightString(400, y, "SGST:")
        c.drawRightString(w - 30, y, f"₹{invoice.sgst}")
        y -= 20
        c.setFont("Helvetica-Bold", 12)
        c.drawRightString(400, y, "Total:")
        c.drawRightString(w - 30, y, f"₹{invoice.total}")

        c.save()
        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{invoice.invoice_number}.pdf"'},
        )

    except ImportError:
        # ReportLab not installed — return JSON fallback
        return {
            "invoice_number": invoice.invoice_number,
            "message": "PDF generation requires reportlab. Install with: pip install reportlab",
            "data": {
                "shop_name": shop_name,
                "customer_name": invoice.customer_name,
                "items": invoice.items,
                "subtotal": invoice.subtotal,
                "cgst": invoice.cgst,
                "sgst": invoice.sgst,
                "total": invoice.total,
            },
        }
