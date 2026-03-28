"""Inventory routes backed by real product and stock transaction data."""
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth_utils import TokenData, get_current_user
from db.database import get_db
from services.inventory import apply_stock_change, list_inventory_snapshot, list_stock_transactions

router = APIRouter()


class InventoryAdjustmentRequest(BaseModel):
    product_id: int
    quantity_delta: float
    transaction_type: str = "manual_adjustment"
    unit_price: float | None = None
    notes: str | None = None

    @field_validator("transaction_type")
    @classmethod
    def validate_type(cls, value: str) -> str:
        allowed = {"restock", "manual_adjustment"}
        if value not in allowed:
            raise ValueError(f"transaction_type must be one of {sorted(allowed)}")
        return value

    @field_validator("quantity_delta")
    @classmethod
    def validate_delta(cls, value: float) -> float:
        if value == 0:
            raise ValueError("quantity_delta must not be zero")
        return value


@router.get("")
async def get_inventory(
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await list_inventory_snapshot(db, current_user.shop_id)


@router.get("/transactions")
async def get_inventory_transactions(
    product_id: int | None = Query(default=None),
    transaction_type: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await list_stock_transactions(
        db,
        shop_id=current_user.shop_id,
        product_id=product_id,
        transaction_type=transaction_type,
        limit=limit,
    )


@router.post("/adjust", status_code=201)
async def adjust_inventory(
    req: InventoryAdjustmentRequest,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    transaction = await apply_stock_change(
        db,
        shop_id=current_user.shop_id,
        product_id=req.product_id,
        quantity_delta=req.quantity_delta,
        transaction_type=req.transaction_type,  # type: ignore[arg-type]
        unit_price=req.unit_price,
        reference_type="inventory_adjustment",
        notes=req.notes,
    )
    await db.commit()

    return {
        "transaction_id": transaction.id,
        "product_id": transaction.product_id,
        "quantity_delta": float(transaction.quantity_delta),
        "balance_after": float(transaction.balance_after),
        "transaction_type": transaction.transaction_type,
    }
