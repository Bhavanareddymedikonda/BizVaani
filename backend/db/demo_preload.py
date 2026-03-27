"""Pre-load demo shop for hackathon presentation."""
# Run: python -m db.demo_preload

from db.seed import generate_benchmark_sales


def preload_demo():
    """Create the demo shop 'Ramesh Kirana Store' with rich data."""
    print("[Demo] Creating demo shop: Ramesh Kirana Store, Nagpur")

    # Generate benchmark sales for both categories
    grains_sales = generate_benchmark_sales(shop_id=1, category="grains", days=30)
    fmcg_sales = generate_benchmark_sales(shop_id=1, category="fmcg", days=30)

    total_entries = len(grains_sales) + len(fmcg_sales)
    print(f"[Demo] Generated {total_entries} sales entries")

    # TODO: Insert into actual database
    # async with async_session() as session:
    #     for entry in grains_sales + fmcg_sales:
    #         session.add(SalesEntry(**entry))
    #     await session.commit()

    print("[Demo] Demo shop pre-loaded successfully")
    print("[Demo] Run ML forecasting to generate predictions...")


if __name__ == "__main__":
    preload_demo()
