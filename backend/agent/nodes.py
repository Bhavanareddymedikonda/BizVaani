"""LangGraph Agent — Individual nodes.

Implements the 4-node graph from BACKEND_STRUCTURE.md Section 3:
1. intent_classifier → classify user query type
2. sales_fetcher → pull SQLite sales data
3. market_fetcher → read market prices
4. response_generator → call Groq LLM with structured prompt
"""
import os
import re
from datetime import date, timedelta
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from agent.state import ShopState

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")


async def classify_intent(state: ShopState, db: AsyncSession) -> ShopState:
    """Classify user query intent using keyword matching (fast path).
    Falls back to 'general' if no strong match.
    """
    query = state["query"].lower()

    if any(w in query for w in ["kyun", "why", "kyu", "reason", "gir", "drop", "kam"]):
        state["intent"] = "sales_query"
    elif any(w in query for w in ["forecast", "predict", "kal", "agle", "next"]):
        state["intent"] = "forecast"
    elif any(w in query for w in ["invoice", "bill", "banaao", "generate"]):
        state["intent"] = "invoice"
    elif any(w in query for w in ["price", "daam", "mandi", "rate", "competitor"]):
        state["intent"] = "competitor"
    elif any(w in query for w in ["alert", "warning", "risk", "khabar"]):
        state["intent"] = "alert"
    else:
        state["intent"] = "general"

    return state


async def fetch_sales_data(state: ShopState, db: AsyncSession) -> ShopState:
    """Fetch last 7 and 30 days sales for the shop."""
    from db.models import SalesEntry, Product

    shop_id = state["shop_id"]
    today = date.today()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    # 7-day sales aggregated by product
    result = await db.execute(
        select(
            Product.name,
            func.sum(SalesEntry.quantity_sold).label("total_qty"),
            func.sum(SalesEntry.revenue).label("total_rev"),
        )
        .join(Product, Product.id == SalesEntry.product_id)
        .where(and_(
            SalesEntry.shop_id == shop_id,
            SalesEntry.entry_date >= week_ago,
        ))
        .group_by(Product.name)
    )
    rows_7d = result.all()

    # 30-day totals
    result_30d = await db.execute(
        select(
            func.sum(SalesEntry.revenue).label("total_rev"),
            func.sum(SalesEntry.quantity_sold).label("total_qty"),
        )
        .where(and_(
            SalesEntry.shop_id == shop_id,
            SalesEntry.entry_date >= month_ago,
        ))
    )
    totals_30d = result_30d.one_or_none()

    sales_data = {
        "products_7d": [
            {"name": r.name, "qty": float(r.total_qty), "revenue": float(r.total_rev)}
            for r in rows_7d
        ],
        "total_30d_revenue": float(totals_30d.total_rev) if totals_30d and totals_30d.total_rev else 0,
        "total_30d_qty": float(totals_30d.total_qty) if totals_30d and totals_30d.total_qty else 0,
    }

    state["sales_data"] = sales_data
    return state


async def fetch_market_data(state: ShopState, db: AsyncSession) -> ShopState:
    """Fetch market prices for the shop's district."""
    from db.models import MarketPrice, Shop

    shop_id = state["shop_id"]

    shop_result = await db.execute(select(Shop).where(Shop.id == shop_id))
    shop = shop_result.scalar_one_or_none()
    district = shop.district if shop else "Nagpur"

    result = await db.execute(
        select(MarketPrice)
        .where(MarketPrice.district == district)
        .order_by(MarketPrice.price_date.desc())
        .limit(20)
    )
    prices = result.scalars().all()

    seen = set()
    market_data = {}
    for mp in prices:
        if mp.commodity not in seen:
            seen.add(mp.commodity)
            market_data[mp.commodity] = {
                "price": float(mp.modal_price),
                "source": mp.source,
                "date": mp.price_date.isoformat() if mp.price_date else None,
            }

    state["market_data"] = market_data
    return state


async def generate_response(state: ShopState, db: AsyncSession) -> ShopState:
    """Call Groq LLM to generate the WHY/WHAT/₹ response."""
    from agent.prompts import SYSTEM_PROMPT, build_prompt

    user_prompt = build_prompt(state)

    if GROQ_API_KEY:
        try:
            import httpx
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {GROQ_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": [
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": user_prompt},
                        ],
                        "temperature": 0.7,
                        "max_tokens": 500,
                    },
                )

                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"]
                    return _parse_response(state, content)

        except Exception as e:
            print(f"[Agent] Groq error: {e}")

    # Fallback: generate rule-based response
    return _generate_fallback(state)


def _parse_response(state: ShopState, content: str) -> ShopState:
    """Parse LLM response into WHY/WHAT/₹ sections."""
    # Try to extract sections
    why_match = re.search(r'\*?\*?WHY\*?\*?[:\s]*(.+?)(?=\*?\*?WHAT|\*?\*?₹|$)', content, re.DOTALL | re.IGNORECASE)
    what_match = re.search(r'\*?\*?WHAT\*?\*?[:\s]*(.+?)(?=\*?\*?₹|$)', content, re.DOTALL | re.IGNORECASE)
    impact_match = re.search(r'₹\s*(?:IMPACT)?[:\s]*(.+?)$', content, re.DOTALL | re.IGNORECASE)

    state["why_text"] = why_match.group(1).strip() if why_match else content[:150]
    state["what_text"] = what_match.group(1).strip() if what_match else ""
    state["response_text"] = content

    # Extract rupee amount from impact section
    if impact_match:
        rupee_numbers = re.findall(r'₹\s*([\d,]+)', impact_match.group(1))
        if rupee_numbers:
            state["rupees_impact"] = float(rupee_numbers[0].replace(",", ""))
        else:
            state["rupees_impact"] = 0
    else:
        state["rupees_impact"] = 0

    state["alert_triggered"] = False
    return state


def _generate_fallback(state: ShopState) -> ShopState:
    """Rule-based fallback when Groq is unavailable."""
    sales = state.get("sales_data", {})
    market = state.get("market_data", {})

    products_7d = sales.get("products_7d", []) if sales else []
    top_product = products_7d[0] if products_7d else {"name": "Rice", "qty": 30, "revenue": 1350}

    state["why_text"] = f"Based on your sales data, {top_product['name']} is your top product with ₹{top_product.get('revenue', 0):.0f} revenue this week."
    state["what_text"] = f"Consider promoting {top_product['name']} with a combo offer to increase basket size."
    state["rupees_impact"] = round(top_product.get("revenue", 0) * 0.15, 0)
    state["response_text"] = f"{state['why_text']} {state['what_text']}"
    state["alert_triggered"] = False
    return state
