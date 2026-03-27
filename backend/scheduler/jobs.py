"""APScheduler background jobs."""
# See: BizVaani_Developer_Reference.md (Section 7 — Retraining Schedule)

# TODO: Wire with APScheduler AsyncIOScheduler
# from apscheduler.schedulers.asyncio import AsyncIOScheduler


async def refresh_agmarknet():
    """Fetch latest mandi prices from Agmarknet API (every 4 hours)."""
    # TODO: Call Agmarknet API, update market_prices table
    print("[Scheduler] Refreshing Agmarknet prices...")


async def refresh_tavily():
    """Fetch competitor intelligence via Tavily search (every 4 hours)."""
    # TODO: Call Tavily API, update market_prices table
    print("[Scheduler] Refreshing Tavily data...")


async def check_alerts():
    """Check all shops for risk alerts (6 AM and 6 PM daily)."""
    # TODO: Run risk_detector for all products, create alerts
    print("[Scheduler] Checking risk alerts...")


def start_scheduler():
    """Initialize and start the APScheduler."""
    # scheduler = AsyncIOScheduler()
    # scheduler.add_job(refresh_agmarknet, "interval", hours=4)
    # scheduler.add_job(refresh_tavily, "interval", hours=4)
    # scheduler.add_job(check_alerts, "cron", hour="6,18")
    # scheduler.start()
    print("[Scheduler] APScheduler started (stub)")
