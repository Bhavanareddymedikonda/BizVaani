"""Forecast route — production implementation.

GET /api/forecast/{product_id} → 7-day + anomaly detection
Ref: BACKEND_STRUCTURE.md Section 4 (GET /api/forecast/:product_id)
"""
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db.models import Product, MLForecast
from core.auth_utils import get_current_user, TokenData

router = APIRouter()


@router.get("/forecast/{product_id_or_name}")
async def get_forecast(
    product_id_or_name: str,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    shop_id = current_user.shop_id
    today = date.today()

    # Verify product belongs to this shop (by ID or name)
    if product_id_or_name.isdigit():
        product_result = await db.execute(
            select(Product).where(and_(Product.id == int(product_id_or_name), Product.shop_id == shop_id))
        )
    else:
        product_result = await db.execute(
            select(Product).where(and_(Product.name.ilike(f"%{product_id_or_name}%"), Product.shop_id == shop_id))
        )
    product = product_result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Fetch 7-day forecasts
    forecast_result = await db.execute(
        select(MLForecast)
        .where(and_(
            MLForecast.shop_id == shop_id,
            MLForecast.product_id == product.id,
            MLForecast.forecast_date >= today,
        ))
        .order_by(MLForecast.forecast_date)
        .limit(7)
    )
    forecasts = forecast_result.scalars().all()

    forecast_7d = [
        {
            "date": f.forecast_date.isoformat(),
            "predicted_qty": round(f.predicted_qty, 1),
            "lower_bound": round(f.lower_bound, 1) if f.lower_bound else None,
            "upper_bound": round(f.upper_bound, 1) if f.upper_bound else None,
        }
        for f in forecasts
    ]

    # Anomaly: check if any forecast has is_anomaly = True
    any_anomaly = any(f.is_anomaly for f in forecasts)
    anomaly_pct = forecasts[0].anomaly_pct if forecasts and forecasts[0].anomaly_pct else 0

    return {
        "product_name": product.name,
        "forecast_7d": forecast_7d,
        "forecast_30d": [],  # Simplified for hackathon: only 7-day
        "is_anomaly": any_anomaly,
        "anomaly_pct": round(anomaly_pct, 1),
    }
