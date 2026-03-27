"""LangGraph Agent — State machine graph execution.

Implements the fan-out/fan-in pattern from BACKEND_STRUCTURE.md Section 3:
  START → intent_classifier → [sales_fetcher, market_fetcher] → response_generator → END

For hackathon, we use a simple sequential execution (async concurrency for the
parallel fan-out). The full LangGraph StateGraph would be:
  graph = StateGraph(ShopState)
  graph.add_node("classify", classify_intent)
  graph.add_node("fetch_sales", fetch_sales_data)
  graph.add_node("fetch_market", fetch_market_data)
  graph.add_node("generate", generate_response)
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from agent.state import ShopState
from agent.nodes import (
    classify_intent,
    fetch_sales_data,
    fetch_market_data,
    generate_response,
)


async def run_agent(
    shop_id: int,
    transcript: str,
    language: str = "en",
    db: AsyncSession | None = None,
) -> dict:
    """Execute the full agent pipeline and return the response dict."""

    # Initialize state
    state: ShopState = {
        "user_id": 0,
        "shop_id": shop_id,
        "query": transcript,
        "language": language,
        "sales_data": None,
        "market_data": None,
        "forecast_data": None,
        "intent": None,
        "why_text": None,
        "what_text": None,
        "rupees_impact": None,
        "response_text": None,
        "alert_triggered": None,
    }

    if not db:
        # No DB session — return fallback
        from agent.nodes import _generate_fallback
        return _generate_fallback(state)

    # Node 1: Classify intent
    state = await classify_intent(state, db)

    # Nodes 2 & 3: Parallel fan-out (sales + market fetch)
    state_sales, state_market = await asyncio.gather(
        fetch_sales_data(dict(state), db),  # type: ignore
        fetch_market_data(dict(state), db),  # type: ignore
    )

    # Merge parallel results back into state
    state["sales_data"] = state_sales.get("sales_data")
    state["market_data"] = state_market.get("market_data")

    # Node 4: Generate response
    state = await generate_response(state, db)

    return {
        "why_text": state.get("why_text", ""),
        "what_text": state.get("what_text", ""),
        "rupees_impact": state.get("rupees_impact", 0),
        "response_text": state.get("response_text", ""),
        "alert_id": None,
        "intent": state.get("intent", "general"),
    }
