"""WebSocket handler for dashboard live updates."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()


@router.websocket("/ws/dashboard/{shop_id}")
async def dashboard_websocket(websocket: WebSocket, shop_id: int):
    """Push live alerts and data updates to the dashboard.

    Server→Client message types:
      { type: "alert", payload: { product_name, severity, message } }
      { type: "forecast_update", payload: { product_id, predicted_qty } }
    """
    await websocket.accept()
    try:
        while True:
            # Keep connection alive, push events when they occur
            await websocket.receive_text()
    except WebSocketDisconnect:
        print(f"[DashboardWS] Client {shop_id} disconnected")
