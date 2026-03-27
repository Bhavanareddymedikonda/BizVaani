"""Market prices route."""
from fastapi import APIRouter

router = APIRouter()


@router.get("/prices")
async def get_market_prices():
    # TODO: Query market_prices table filtered by shop's city
    return {
        "city": "Nagpur",
        "prices": [
            {"commodity": "Rice", "price": 39.5, "unit": "kg", "source": "agmarknet", "updated_at": "2026-03-27T04:00:00"},
            {"commodity": "Dal", "price": 72.0, "unit": "kg", "source": "agmarknet", "updated_at": "2026-03-27T04:00:00"},
            {"commodity": "Sugar", "price": 42.0, "unit": "kg", "source": "agmarknet", "updated_at": "2026-03-27T04:00:00"},
            {"commodity": "Cooking Oil", "price": 145.0, "unit": "litre", "source": "agmarknet", "updated_at": "2026-03-27T04:00:00"},
            {"commodity": "Atta", "price": 35.0, "unit": "kg", "source": "agmarknet", "updated_at": "2026-03-27T04:00:00"},
        ],
    }
