"""Sales entry route."""
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class SalesEntryRequest(BaseModel):
    shop_id: int
    product_id: int
    quantity: float
    unit_price: float
    entry_date: datetime | None = None
    entry_source: str = "voice"


@router.post("/entry")
async def log_sales_entry(req: SalesEntryRequest):
    # TODO: Insert into sales_entries table, trigger ML retrain if count % 5 == 0
    return {
        "id": 1,
        "total_amount": req.quantity * req.unit_price,
        "status": "saved",
    }
