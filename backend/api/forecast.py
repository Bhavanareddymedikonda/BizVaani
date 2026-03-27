"""Forecast route."""
from fastapi import APIRouter

router = APIRouter()


@router.get("/forecast/{product_id}")
async def get_forecast(product_id: int):
    # TODO: Query ml_forecasts table for this product
    return {
        "product_name": "Rice",
        "forecast_7d": [
            {"date": "2026-03-28", "predicted_qty": 28, "lower_bound": 22, "upper_bound": 34},
            {"date": "2026-03-29", "predicted_qty": 31, "lower_bound": 25, "upper_bound": 37},
            {"date": "2026-03-30", "predicted_qty": 26, "lower_bound": 20, "upper_bound": 32},
            {"date": "2026-03-31", "predicted_qty": 33, "lower_bound": 27, "upper_bound": 39},
            {"date": "2026-04-01", "predicted_qty": 29, "lower_bound": 23, "upper_bound": 35},
            {"date": "2026-04-02", "predicted_qty": 35, "lower_bound": 29, "upper_bound": 41},
            {"date": "2026-04-03", "predicted_qty": 30, "lower_bound": 24, "upper_bound": 36},
        ],
        "forecast_30d": [],
        "is_anomaly": False,
        "anomaly_pct": -5.2,
    }
