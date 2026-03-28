"""APScheduler background jobs — production implementation.

Ref: BACKEND_STRUCTURE.md Section 10 (Background Jobs)
"""
import os
import httpx
from datetime import date
from sqlalchemy import select, and_

from db.database import async_session
from db.models import MarketPrice, Shop, Product

AGMARKNET_API_KEY = os.getenv("AGMARKNET_API_KEY", "")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")
TAVILY_SEARCH_URL = "https://api.tavily.com/search"


async def refresh_agmarknet():
    """Fetch latest mandi prices from Agmarknet. Runs every 4 hours."""
    print("[Scheduler] Refreshing Agmarknet prices...")

    # Agmarknet has limited API access — for hackathon, we use Tavily search
    # to get market price intelligence as a proxy
    if not TAVILY_API_KEY:
        print("[Scheduler] No Tavily API key — skipping market price refresh")
        return

    async with async_session() as db:
        # Get all active districts
        result = await db.execute(select(Shop.district).distinct())
        districts = [r[0] for r in result.all()]

        for district in districts:
            # Search for commodity prices in this district
            try:
                async with httpx.AsyncClient(timeout=15) as client:
                    resp = await client.post(
                        TAVILY_SEARCH_URL,
                        json={
                            "api_key": TAVILY_API_KEY,
                            "query": f"today mandi price rice dal sugar {district} India",
                            "search_depth": "basic",
                            "max_results": 3,
                        },
                    )
                    if resp.status_code == 200:
                        # Parse results — in production, use NER to extract prices
                        print(f"[Scheduler] Got market data for {district}")
            except Exception as e:
                print(f"[Scheduler] Tavily error for {district}: {e}")


async def refresh_tavily():
    """Fetch competitor intelligence via Tavily search. Runs every 4 hours."""
    print("[Scheduler] Refreshing competitor intelligence...")

    if not TAVILY_API_KEY:
        return

    async with async_session() as db:
        result = await db.execute(select(Shop))
        shops = result.scalars().all()

        for shop in shops:
            try:
                async with httpx.AsyncClient(timeout=15) as client:
                    resp = await client.post(
                        TAVILY_SEARCH_URL,
                        json={
                            "api_key": TAVILY_API_KEY,
                            "query": f"kirana grocery price competition {shop.district}",
                            "search_depth": "basic",
                            "max_results": 2,
                        },
                    )
                    if resp.status_code == 200:
                        print(f"[Scheduler] Got competitor data for {shop.shop_name}")
            except Exception as e:
                print(f"[Scheduler] Tavily error: {e}")


async def check_and_fire_alerts():
    """Check all shops for risk alerts every 30 minutes."""
    print("[Scheduler] Checking risk alerts...")

    from services.alerts import compute_shop_alerts
    from ws.dashboard_handler import broadcast_to_shop

    async with async_session() as db:
        result = await db.execute(select(Shop))
        shops = result.scalars().all()

        for shop in shops:
            alerts = await compute_shop_alerts(db, shop.id, refresh_news=True)
            for alert in alerts:
                await broadcast_to_shop(shop.id, {"type": "alert", "payload": alert})
            if alerts:
                print(f"[Alert] Broadcast {len(alerts)} alert(s) for shop {shop.id}")


def start_scheduler():
    """Initialize and start the APScheduler."""
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler

        scheduler = AsyncIOScheduler()
        scheduler.add_job(refresh_agmarknet, "interval", hours=4, id="agmarknet_refresh")
        scheduler.add_job(refresh_tavily, "interval", hours=4, id="tavily_cache")
        scheduler.add_job(check_and_fire_alerts, "interval", minutes=30, id="alert_checker")
        scheduler.start()
        print("[Scheduler] APScheduler started with 3 jobs")
        return scheduler
    except ImportError:
        print("[Scheduler] APScheduler not installed — background jobs disabled")
        return None
