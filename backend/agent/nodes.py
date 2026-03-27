"""LangGraph Agent — Individual nodes (intent, fetch, generate)."""
from agent.state import ShopState


async def classify_intent(state: ShopState) -> ShopState:
    """Classify user query intent using Groq."""
    # TODO: Use Groq LLM to classify intent
    state["intent"] = "sales_query"
    return state


async def fetch_sales_data(state: ShopState) -> ShopState:
    """Fetch sales data from SQLite for the shop."""
    # TODO: Query sales_entries table
    state["sales_data"] = {"total_7d": 2100, "avg_daily": 300}
    return state


async def fetch_market_data(state: ShopState) -> ShopState:
    """Fetch cached market prices."""
    # TODO: Query market_prices table
    state["market_data"] = {"rice": 39.5, "dal": 72.0}
    return state


async def generate_response(state: ShopState) -> ShopState:
    """Generate AI response using Groq LLM."""
    # TODO: Use Groq LLaMA 3.3 70B to generate WHY/WHAT/₹
    state["why_text"] = "Your competitor reduced rice price by ₹2/kg three days ago."
    state["what_text"] = "Offer a combo deal: 5kg Rice + 1kg Dal at ₹275."
    state["rupees_impact"] = 1400
    return state
