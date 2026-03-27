"""LangGraph Agent — ShopState TypedDict."""
from typing import TypedDict


class ShopState(TypedDict):
    """State flowing through the LangGraph agent."""
    user_id: int
    shop_id: int
    transcript: str
    intent: str  # "sales_query" | "forecast" | "competitor" | "invoice" | "general"
    sales_data: dict | None
    market_data: dict | None
    forecast_data: dict | None
    why_text: str
    what_text: str
    rupees_impact: float
    alert_triggered: bool
