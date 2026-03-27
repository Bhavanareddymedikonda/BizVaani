"""Seed benchmark data for new shops."""
# See: BizVaani_Developer_Reference.md (Section 11 — Cold Start Strategy)

import random
from datetime import datetime, timedelta


def generate_benchmark_sales(shop_id: int, category: str = "grains", days: int = 30) -> list[dict]:
    """Generate synthetic 30-day sales history based on industry averages.

    Returns a list of sales_entries rows ready for bulk insert.
    """
    BENCHMARKS = {
        "grains": [
            {"name": "Rice", "avg_qty": 30, "price": 45, "unit": "kg"},
            {"name": "Dal", "avg_qty": 15, "price": 80, "unit": "kg"},
            {"name": "Atta", "avg_qty": 25, "price": 37, "unit": "kg"},
        ],
        "fmcg": [
            {"name": "Sugar", "avg_qty": 20, "price": 43, "unit": "kg"},
            {"name": "Cooking Oil", "avg_qty": 10, "price": 150, "unit": "bottle"},
        ],
    }

    products = BENCHMARKS.get(category, BENCHMARKS["grains"])
    entries = []

    for product in products:
        for day_offset in range(days):
            date = datetime.utcnow() - timedelta(days=days - day_offset)
            qty = max(1, product["avg_qty"] + random.randint(-5, 5))
            entries.append({
                "shop_id": shop_id,
                "product_name": product["name"],
                "quantity": qty,
                "unit_price": product["price"],
                "total_amount": qty * product["price"],
                "entry_date": date,
                "entry_source": "benchmark",
            })

    return entries
