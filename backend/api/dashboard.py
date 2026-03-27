"""Dashboard route."""
from fastapi import APIRouter

router = APIRouter()


@router.get("/dashboard")
async def get_dashboard():
    # TODO: Query real DB, aggregate per-shop
    return {
        "shop": {"id": 1, "shop_name": "Ramesh Kirana Store", "city": "Nagpur", "categories": ["grains", "fmcg"]},
        "top_products": [
            {"id": 1, "name": "Rice", "today_qty": 30, "today_revenue": 1350, "trend_pct": -12, "mandi_price": 39.5, "risk_level": "HIGH"},
            {"id": 2, "name": "Dal", "today_qty": 15, "today_revenue": 1200, "trend_pct": 5, "mandi_price": 72, "risk_level": "LOW"},
            {"id": 3, "name": "Sugar", "today_qty": 20, "today_revenue": 860, "trend_pct": -3, "mandi_price": 42, "risk_level": "MEDIUM"},
            {"id": 4, "name": "Cooking Oil", "today_qty": 10, "today_revenue": 1500, "trend_pct": 8, "mandi_price": 145, "risk_level": "LOW"},
            {"id": 5, "name": "Atta", "today_qty": 25, "today_revenue": 925, "trend_pct": -18, "mandi_price": 35, "risk_level": "HIGH"},
        ],
        "alerts": [
            {"id": 1, "product_name": "Rice", "severity": "HIGH", "message": "Sales dropped 22% — competitor undercut by ₹2", "created_at": "2026-03-27T06:00:00"},
            {"id": 2, "product_name": "Atta", "severity": "MEDIUM", "message": "Restock needed in 4 days based on forecast", "created_at": "2026-03-27T06:00:00"},
        ],
        "total_today": {"revenue": 5835, "items_sold": 100, "profit_estimate": 1420},
    }
