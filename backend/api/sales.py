"""Sales entry route — production implementation.

POST /api/sales/entry → log daily sales, trigger ML retrain.
Ref: BACKEND_STRUCTURE.md Section 4 (POST /api/sales/entry)
"""
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db.models import SalesEntry, Shop
from core.auth_utils import get_current_user, TokenData
from services.inventory import upsert_sales_entry_and_adjust_stock

router = APIRouter()


class SalesEntryItem(BaseModel):
    product_id: int
    entry_date: str  # ISO date string "YYYY-MM-DD"
    quantity_sold: float
    revenue: float

    @field_validator("quantity_sold")
    @classmethod
    def validate_qty(cls, v: float) -> float:
        if v <= 0 or v > 10000:
            raise ValueError("Quantity must be between 0 and 10,000")
        return v

    @field_validator("revenue")
    @classmethod
    def validate_revenue(cls, v: float) -> float:
        if v < 0 or v > 1_000_000:
            raise ValueError("Revenue must be between 0 and 1,000,000")
        return v


class SalesEntryRequest(BaseModel):
    entries: list[SalesEntryItem]
    source: str = "voice"

    @field_validator("source")
    @classmethod
    def validate_source(cls, v: str) -> str:
        if v not in {"voice", "csv", "ocr", "manual", "benchmark"}:
            raise ValueError("Source must be one of: voice, csv, ocr, manual, benchmark")
        return v


@router.post("/entry", status_code=status.HTTP_201_CREATED)
async def log_sales_entry(
    req: SalesEntryRequest,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    shop_id = current_user.shop_id
    saved = 0

    for item in req.entries:
        entry_date = date.fromisoformat(item.entry_date)
        await upsert_sales_entry_and_adjust_stock(
            db,
            shop_id=shop_id,
            product_id=item.product_id,
            entry_date=entry_date,
            quantity_sold=item.quantity_sold,
            revenue=item.revenue,
            source=req.source,
        )
        saved += 1

    # Increment data maturity
    shop_result = await db.execute(select(Shop).where(Shop.id == shop_id))
    shop = shop_result.scalar_one_or_none()
    if shop:
        shop.data_maturity_days = (shop.data_maturity_days or 0) + 1

    await db.commit()

    # Check if we should trigger ML retrain (every 5th entry)
    count_result = await db.execute(
        select(func.count(SalesEntry.id)).where(SalesEntry.shop_id == shop_id)
    )
    total_entries = count_result.scalar() or 0
    retrain_triggered = total_entries % 5 == 0

    # TODO: If retrain_triggered, schedule async ML retrain
    # from ml.forecaster import retrain_for_shop
    # asyncio.create_task(retrain_for_shop(shop_id))

    return {
        "saved": saved,
        "retrain_triggered": retrain_triggered,
    }
