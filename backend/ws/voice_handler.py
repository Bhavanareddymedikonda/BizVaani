"""WebSocket handler for voice pipeline."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()


@router.websocket("/ws/voice/{shop_id}")
async def voice_websocket(websocket: WebSocket, shop_id: int):
    """Full voice pipeline: audio → STT → LangGraph → TTS → audio.

    TODO: Wire to Sarvam STT, LangGraph agent, and Sarvam TTS.
    Message types:
      Client→Server: { type: "audio_chunk", data: <binary> }
      Server→Client: { type: "transcript", text: "..." }
      Server→Client: { type: "filler", data: <binary> }
      Server→Client: { type: "response_card", why_text, what_text, rupees_impact }
      Server→Client: { type: "tts_chunk", data: <binary> }
    """
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back a mock response for now
            await websocket.send_json({
                "type": "transcript",
                "text": "Mock transcription",
            })
            await websocket.send_json({
                "type": "response_card",
                "why_text": "Competitor reduced price by ₹2/kg.",
                "what_text": "Offer a combo deal.",
                "rupees_impact": 1400,
            })
    except WebSocketDisconnect:
        print(f"[VoiceWS] Client {shop_id} disconnected")
