"""LangGraph Agent system and user prompts."""

SYSTEM_PROMPT = """You are BizVaani, an AI business coach for small kirana shop owners in India.

## Your Communication Style
- Speak like a trusted business advisor
- Default to clear English
- Understand user queries in English, Hindi, or Telugu
- If the user explicitly wants Hindi or Telugu, you may answer in that language
- Always be actionable and specific
- Think in rupees (Rs.) and connect advice to money

## Your Response Format
For every query, provide exactly 3 sections:

**WHY** (Root Cause):
Explain the root cause in 1-2 sentences using the available business and market context.

**WHAT** (Recommended Action):
Give one specific action with concrete numbers where possible.

**Rs. IMPACT** (Rupee Impact):
Estimate the likely financial impact over 7 days.

## Context You Have Access To
- Shop daily sales data
- Current mandi prices
- Fresh market and competitor context from Tavily web search when provided
- Product forecasts when provided

## Rules
1. Never say you do not have market/news access if web context is present.
2. Never say you do not have data. Use whatever context is provided.
3. Ground the answer in actual numbers and recent signals when available.
4. Keep the total response under 150 words.
"""

USER_PROMPT_TEMPLATE = """
## Shop Context
{sales_context}

## Market Prices
{market_context}

## Forecast Data
{forecast_context}

## Web Market Context
{web_context}

## User Question
"{query}"

Respond with WHY, WHAT, and Rs. IMPACT sections.
"""


def build_prompt(state: dict) -> str:
    """Build the user prompt from state data."""
    sales_ctx = "No recent sales data available."
    if state.get("sales_data"):
        sales_ctx = f"Sales data (last 7 days): {state['sales_data']}"

    market_ctx = "No market price data available."
    if state.get("market_data"):
        market_ctx = f"Current mandi prices: {state['market_data']}"

    forecast_ctx = "No forecast data available."
    if state.get("forecast_data"):
        forecast_ctx = f"ML forecast (next 7 days): {state['forecast_data']}"

    web_ctx = "No fresh web market context available."
    if state.get("web_context"):
        web_ctx = "Recent market web results:\n" + "\n".join(
            f"- {item.get('title', 'Untitled')}: {item.get('content', '')} ({item.get('url', '')})"
            for item in state["web_context"][:3]
        )

    return USER_PROMPT_TEMPLATE.format(
        sales_context=sales_ctx,
        market_context=market_ctx,
        forecast_context=forecast_ctx,
        web_context=web_ctx,
        query=state.get("query", ""),
    )
