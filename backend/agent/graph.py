"""LangGraph Agent — State machine graph definition."""
# TODO: Wire with langgraph.graph.StateGraph
# from langgraph.graph import StateGraph, END
# from agent.state import ShopState
# from agent.nodes import classify_intent, fetch_sales_data, fetch_market_data, generate_response


async def run_agent(shop_id: int, transcript: str) -> dict:
    """Run the LangGraph agent and return the response.

    TODO: Replace with actual LangGraph StateGraph:
    graph = StateGraph(ShopState)
    graph.add_node("classify", classify_intent)
    graph.add_node("fetch_sales", fetch_sales_data)
    graph.add_node("fetch_market", fetch_market_data)
    graph.add_node("generate", generate_response)
    graph.set_entry_point("classify")
    graph.add_edge("classify", "fetch_sales")
    graph.add_edge("classify", "fetch_market")  # parallel fan-out
    graph.add_edge("fetch_sales", "generate")
    graph.add_edge("fetch_market", "generate")
    graph.add_edge("generate", END)
    """
    return {
        "transcript": transcript,
        "why_text": "Your competitor reduced rice price by ₹2/kg three days ago.",
        "what_text": "Offer a combo deal: 5kg Rice + 1kg Dal at ₹275.",
        "rupees_impact": 1400,
    }
