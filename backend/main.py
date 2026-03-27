"""
BizVaani Backend — FastAPI Application Entry Point
"""
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.database import init_db
from api import auth, dashboard, sales, forecast, market, invoice, simulate, voice, settings

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    # Startup: initialize database tables
    await init_db()
    print("[BizVaani] Database initialized")

    # TODO: Start APScheduler here (scheduler/jobs.py)
    # from scheduler.jobs import start_scheduler
    # start_scheduler()

    yield

    # Shutdown: cleanup
    print("[BizVaani] Shutting down")


app = FastAPI(
    title="BizVaani API",
    description="Voice-First AI Business Coach for Kirana Owners",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST Routes
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(dashboard.router, prefix="/api", tags=["Dashboard"])
app.include_router(sales.router, prefix="/api/sales", tags=["Sales"])
app.include_router(forecast.router, prefix="/api", tags=["Forecast"])
app.include_router(market.router, prefix="/api/market", tags=["Market"])
app.include_router(invoice.router, prefix="/api/invoice", tags=["Invoice"])
app.include_router(simulate.router, prefix="/api", tags=["Simulate"])
app.include_router(voice.router, prefix="/api/voice", tags=["Voice"])
app.include_router(settings.router, prefix="/api/settings", tags=["Settings"])

# WebSocket Routes
from ws.voice_handler import router as voice_ws_router
from ws.dashboard_handler import router as dashboard_ws_router

app.include_router(voice_ws_router)
app.include_router(dashboard_ws_router)


@app.get("/")
async def root():
    return {"status": "ok", "service": "BizVaani API", "version": "0.1.0"}
