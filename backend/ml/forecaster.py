"""XGBoost demand forecaster."""
# TODO: Implement real XGBoost training pipeline
# See: BizVaani_Developer_Reference.md (Section 7 — ML Engine)


async def train_model(shop_id: int, product_id: int):
    """Train XGBoost model for a specific product in a shop."""
    # TODO: Query sales_entries, feature engineering, train XGBRegressor
    pass


async def predict_7d(shop_id: int, product_id: int) -> list[dict]:
    """Generate 7-day forecast."""
    # TODO: Load model, generate predictions with confidence intervals
    return [
        {"date": "2026-03-28", "predicted_qty": 28, "lower_bound": 22, "upper_bound": 34},
    ]


async def run_ml_forecast(shop_id: int):
    """Run ML forecast for all products in a shop."""
    # TODO: Loop through products, train if needed, predict
    pass
