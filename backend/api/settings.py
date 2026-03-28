"""Settings routes — CSV upload and profile.

POST /api/settings/csv         → upload CSV, return preview
POST /api/settings/csv/confirm → confirm import, trigger ML retrain

Ref: BACKEND_STRUCTURE.md Section 4 (POST /api/onboard/csv*)
"""
import io
import csv
from datetime import date
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db.models import Product, SalesEntry, Shop
from core.auth_utils import get_current_user, TokenData

router = APIRouter()

# In-memory temp storage for CSV data (hackathon shortcut; use Redis/tmp in prod)
_csv_temp_store: dict[str, list[dict]] = {}


@router.post("/csv")
async def upload_csv(
    file: UploadFile = File(...),
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Parse CSV and return preview + detected columns."""
    content = await file.read()

    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    rows = list(reader)

    if not rows:
        raise HTTPException(status_code=400, detail="CSV file is empty")

    # Auto-detect column mapping
    columns = list(rows[0].keys())
    detected = {}
    for col in columns:
        col_lower = col.lower().strip()
        if "date" in col_lower:
            detected["date"] = col
        elif "product" in col_lower or "item" in col_lower or "name" in col_lower:
            detected["product"] = col
        elif "qty" in col_lower or "quantity" in col_lower:
            detected["qty"] = col
        elif "price" in col_lower or "revenue" in col_lower or "amount" in col_lower:
            detected["price"] = col

    # Store temporarily with a file_id
    import hashlib
    file_id = hashlib.md5(content[:1000]).hexdigest()[:12]
    _csv_temp_store[file_id] = rows

    return {
        "file_id": file_id,
        "preview_rows": rows[:5],
        "detected_columns": detected,
        "row_count": len(rows),
    }


class ConfirmCSVRequest(BaseModel):
    file_id: str
    column_mapping: dict


@router.post("/csv/confirm")
async def confirm_csv_import(
    req: ConfirmCSVRequest,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Import CSV data into sales_entries, create products if needed."""
    rows = _csv_temp_store.pop(req.file_id, None)
    if not rows:
        raise HTTPException(status_code=404, detail="File not found — please re-upload")

    shop_id = current_user.shop_id
    mapping = req.column_mapping  # { "date": "Date", "product": "Item", ... }

    date_col = mapping.get("date", "date")
    product_col = mapping.get("product", "product")
    qty_col = mapping.get("qty", "qty")
    price_col = mapping.get("price", "price")

    # Get existing products
    result = await db.execute(select(Product).where(Product.shop_id == shop_id))
    existing_products = {p.name: p.id for p in result.scalars().all()}

    imported = 0
    for row in rows:
        product_name = str(row.get(product_col, "")).strip()
        if not product_name:
            continue

        # Auto-create product if it doesn't exist
        if product_name not in existing_products:
            new_product = Product(
                shop_id=shop_id,
                name=product_name,
                category="general",
                unit="kg",
                selling_price=float(row.get(price_col, 0)) or 0,
            )
            db.add(new_product)
            await db.flush()
            existing_products[product_name] = new_product.id

        product_id = existing_products[product_name]

        try:
            entry_date = date.fromisoformat(str(row.get(date_col, "")).strip())
        except (ValueError, TypeError):
            continue

        qty = float(row.get(qty_col, 0) or 0)
        price = float(row.get(price_col, 0) or 0)
        revenue = qty * price

        db.add(SalesEntry(
            shop_id=shop_id,
            product_id=product_id,
            entry_date=entry_date,
            quantity_sold=qty,
            revenue=revenue,
            entry_source="csv",
        ))
        imported += 1

    # Update data maturity
    shop_result = await db.execute(select(Shop).where(Shop.id == shop_id))
    shop = shop_result.scalar_one_or_none()
    if shop:
        shop.data_maturity_days = max(shop.data_maturity_days or 0, imported // 5)

    await db.commit()

    # Cleanup temp store
    return {
        "imported_count": imported,
        "ml_retrain_triggered": imported >= 5,
    }
