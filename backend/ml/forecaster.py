"""XGBoost demand forecaster — production implementation.

Ref: BACKEND_STRUCTURE.md Section 9 (ML Model Details)

Current features: day_of_week, month, week_of_year, lag_1, lag_7, lag_30,
                  rolling_mean_7, rolling_mean_30
"""
import os
import pickle
from datetime import date, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import SalesEntry, Product, MLForecast

MODELS_DIR = Path(os.path.dirname(__file__)) / "models"
MODELS_DIR.mkdir(exist_ok=True)

XGBOOST_PARAMS = {
    "n_estimators": 100,
    "max_depth": 4,
    "learning_rate": 0.1,
    "objective": "reg:squarederror",
    "tree_method": "hist",
}


def _build_features(df: pd.DataFrame) -> pd.DataFrame:
    """Engineer features from raw sales data."""
    df = df.sort_values("entry_date").copy()
    df["day_of_week"] = df["entry_date"].dt.dayofweek
    df["month"] = df["entry_date"].dt.month
    df["week_of_year"] = df["entry_date"].dt.isocalendar().week.astype(int)

    # Lag features
    df["lag_1"] = df["quantity_sold"].shift(1)
    df["lag_7"] = df["quantity_sold"].shift(7)
    df["lag_30"] = df["quantity_sold"].shift(30)

    # Rolling averages
    df["rolling_mean_7"] = df["quantity_sold"].rolling(7, min_periods=1).mean()
    df["rolling_mean_30"] = df["quantity_sold"].rolling(30, min_periods=1).mean()

    # Fill NaN with 0
    df = df.fillna(0)
    return df


FEATURE_COLS = [
    "day_of_week", "month", "week_of_year",
    "lag_1", "lag_7", "lag_30",
    "rolling_mean_7", "rolling_mean_30",
]


async def train_model(shop_id: int, product_id: int, db: AsyncSession) -> bool:
    """Train XGBoost model for a specific product."""
    try:
        from xgboost import XGBRegressor
    except ImportError:
        print("[ML] xgboost not installed — skipping training")
        return False

    # Fetch sales data
    result = await db.execute(
        select(SalesEntry)
        .where(and_(
            SalesEntry.shop_id == shop_id,
            SalesEntry.product_id == product_id,
        ))
        .order_by(SalesEntry.entry_date)
    )
    rows = result.scalars().all()

    if len(rows) < 7:
        print(f"[ML] Not enough data for product {product_id} ({len(rows)} rows)")
        return False

    df = pd.DataFrame([{
        "entry_date": pd.Timestamp(r.entry_date),
        "quantity_sold": float(r.quantity_sold),
        "revenue": float(r.revenue),
    } for r in rows])

    df = _build_features(df)

    X = df[FEATURE_COLS].values
    y = df["quantity_sold"].values

    model = XGBRegressor(**XGBOOST_PARAMS)
    model.fit(X, y)

    # Save model
    model_path = MODELS_DIR / f"shop_{shop_id}_product_{product_id}.pkl"
    with open(model_path, "wb") as f:
        pickle.dump(model, f)

    print(f"[ML] Model trained for shop={shop_id}, product={product_id}")
    return True


async def predict_7d(
    shop_id: int,
    product_id: int,
    db: AsyncSession,
) -> list[dict]:
    """Generate 7-day forecast using trained model."""

    model_path = MODELS_DIR / f"shop_{shop_id}_product_{product_id}.pkl"

    # Try to load trained model
    model = None
    if model_path.exists():
        try:
            with open(model_path, "rb") as f:
                model = pickle.load(f)
        except Exception:
            pass

    # Get recent sales for lag features
    today = date.today()
    result = await db.execute(
        select(SalesEntry)
        .where(and_(
            SalesEntry.shop_id == shop_id,
            SalesEntry.product_id == product_id,
        ))
        .order_by(SalesEntry.entry_date.desc())
        .limit(30)
    )
    recent = list(reversed(result.scalars().all()))

    if not recent:
        # No data — return benchmark estimate
        return _benchmark_forecast(today)

    # Build feature vectors for next 7 days
    qty_series = [float(r.quantity_sold) for r in recent]
    forecasts = []

    for i in range(1, 8):
        forecast_date = today + timedelta(days=i)
        features = {
            "day_of_week": forecast_date.weekday(),
            "month": forecast_date.month,
            "week_of_year": forecast_date.isocalendar()[1],
            "lag_1": qty_series[-1] if qty_series else 0,
            "lag_7": qty_series[-7] if len(qty_series) >= 7 else qty_series[0],
            "lag_30": qty_series[-30] if len(qty_series) >= 30 else qty_series[0],
            "rolling_mean_7": np.mean(qty_series[-7:]) if qty_series else 0,
            "rolling_mean_30": np.mean(qty_series[-30:]) if qty_series else 0,
        }

        X = np.array([[features[col] for col in FEATURE_COLS]])

        if model:
            predicted = float(model.predict(X)[0])
        else:
            # Fallback: use rolling average
            predicted = float(np.mean(qty_series[-7:])) if qty_series else 15

        predicted = max(0, round(predicted, 1))
        lower = round(predicted * 0.8, 1)
        upper = round(predicted * 1.2, 1)

        forecasts.append({
            "date": forecast_date.isoformat(),
            "predicted_qty": predicted,
            "lower_bound": lower,
            "upper_bound": upper,
        })

        # Add prediction to series for next iteration
        qty_series.append(predicted)

    return forecasts


def _benchmark_forecast(today: date) -> list[dict]:
    """Fallback forecast when no data exists."""
    import random
    base = 15
    return [
        {
            "date": (today + timedelta(days=i)).isoformat(),
            "predicted_qty": round(base * random.uniform(0.85, 1.15), 1),
            "lower_bound": round(base * 0.7, 1),
            "upper_bound": round(base * 1.3, 1),
        }
        for i in range(1, 8)
    ]


async def retrain_for_shop(shop_id: int, db: AsyncSession):
    """Retrain models only for active inventory products in a shop."""
    sales_activity = (
        select(
            SalesEntry.product_id.label("product_id"),
            func.count(SalesEntry.id).label("sales_count"),
        )
        .where(SalesEntry.shop_id == shop_id)
        .group_by(SalesEntry.product_id)
        .subquery()
    )

    result = await db.execute(
        select(Product)
        .outerjoin(sales_activity, sales_activity.c.product_id == Product.id)
        .where(
            and_(
                Product.shop_id == shop_id,
                (Product.stock_qty > 0) | (func.coalesce(sales_activity.c.sales_count, 0) > 0),
            )
        )
    )
    products = result.scalars().all()

    for product in products:
        success = await train_model(shop_id, product.id, db)
        if success:
            forecasts = await predict_7d(shop_id, product.id, db)
            # Store forecasts in DB
            for f in forecasts:
                forecast_obj = MLForecast(
                    shop_id=shop_id,
                    product_id=product.id,
                    forecast_date=date.fromisoformat(f["date"]),
                    predicted_qty=f["predicted_qty"],
                    lower_bound=f["lower_bound"],
                    upper_bound=f["upper_bound"],
                    model_version="xgb-v1",
                )
                db.add(forecast_obj)
            await db.commit()
    print(f"[ML] Retrained all models for shop {shop_id}")
