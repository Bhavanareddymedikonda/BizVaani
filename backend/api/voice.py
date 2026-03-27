"""Voice routes (REST fallback — primary path is WebSocket)."""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class VoiceQueryRequest(BaseModel):
    shop_id: int
    transcript: str


@router.post("/query")
async def voice_query(req: VoiceQueryRequest):
    # TODO: Wire to LangGraph agent (agent/graph.py)
    return {
        "transcript": req.transcript,
        "why_text": "Your competitor reduced rice price by ₹2/kg three days ago. Customers are price-sensitive for staples.",
        "what_text": "Offer a combo deal: 5kg Rice + 1kg Dal at ₹275. This undercuts competitor while protecting margin.",
        "rupees_impact": 1400,
    }


@router.post("/stt")
async def proxy_stt():
    # TODO: Proxy to Sarvam STT API
    return {"transcript": "Mock transcript from Sarvam STT"}


@router.post("/tts")
async def proxy_tts():
    # TODO: Proxy to Sarvam TTS API
    return {"audio_url": "mock-tts-audio-url"}
