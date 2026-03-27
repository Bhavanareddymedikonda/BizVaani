"""Profit simulation route."""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

PRICE_ELASTICITY = 1.3


class SimulateRequest(BaseModel):
    shop_id: int
    product_id: int
    action: str = "price_cut"
    current_price: float
    suggested_price: float
    avg_daily_qty: float


@router.post("/simulate")
async def simulate(req: SimulateRequest):
    price_change_pct = (req.suggested_price - req.current_price) / req.current_price
    qty_change_pct = -price_change_pct * PRICE_ELASTICITY
    new_qty = req.avg_daily_qty * (1 + qty_change_pct)

    current_profit = req.avg_daily_qty * req.current_price * 7
    projected_profit = new_qty * req.suggested_price * 7
    delta = projected_profit - current_profit

    return {
        "current_profit": round(current_profit),
        "projected_profit": round(projected_profit),
        "delta": round(delta),
        "pct_change": round((delta / current_profit) * 100, 1) if current_profit else 0,
        "payback_days": 3,
        "summary": f"Adjust price by ₹{abs(req.current_price - req.suggested_price):.0f}. Expected ₹{abs(delta):.0f} {'extra' if delta > 0 else 'less'} profit in 7 days.",
    }
