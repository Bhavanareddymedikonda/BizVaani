"""WebSocket handler for the voice pipeline.

WS /ws/voice/{shop_id}
Protocol:
  Client→Server: { "type": "audio_chunk", "data": "<base64>" }
  Client→Server: { "type": "end_audio" }
  Server→Client: { "type": "transcript", "text": "..." }
  Server→Client: { "type": "response_card", "why_text", "what_text", "rupees_impact" }
  Server→Client: { "type": "tts_audio", "data": "<base64>" }
"""
import os
import json
import base64
import httpx
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from db.database import async_session
from agent.graph import run_agent

router = APIRouter()

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "")
SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"  # saaras:v3
SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"

_LANG_CODE_MAP = {
    "hi": "hi-IN", "en": "en-IN", "te": "te-IN",
    "ta": "ta-IN", "mr": "mr-IN",
}


def _lang_to_code(lang: str) -> str:
    return _LANG_CODE_MAP.get(lang, "hi-IN")


@router.websocket("/ws/voice/{shop_id}")
async def voice_websocket(websocket: WebSocket, shop_id: int):
    """Full voice pipeline: audio → STT → LangGraph → TTS → audio."""
    await websocket.accept()

    audio_buffer = bytearray()
    language = "en"

    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)
            msg_type = msg.get("type", "")

            if msg_type == "audio_chunk":
                # Accumulate audio chunks
                chunk_data = base64.b64decode(msg.get("data", ""))
                audio_buffer.extend(chunk_data)

            elif msg_type == "end_audio":
                # Process the accumulated audio
                language = msg.get("language", "en")

                if not audio_buffer:
                    await websocket.send_json({
                        "type": "error",
                        "message": "No audio data received",
                    })
                    continue

                # Step 1: STT
                transcript = await _run_stt(bytes(audio_buffer))
                audio_buffer.clear()

                if not transcript:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Could not transcribe audio",
                    })
                    continue

                # Send transcript back to client
                await websocket.send_json({
                    "type": "transcript",
                    "text": transcript,
                })

                # Step 2: Run LangGraph agent
                async with async_session() as db:
                    result = await run_agent(
                        shop_id=shop_id,
                        transcript=transcript,
                        language=language,
                        db=db,
                    )

                # Send response card
                await websocket.send_json({
                    "type": "response_card",
                    "why_text": result.get("why_text", ""),
                    "what_text": result.get("what_text", ""),
                    "rupees_impact": result.get("rupees_impact", 0),
                })

                # Step 3: TTS for the response
                response_text = result.get("response_text", "")
                if response_text and SARVAM_API_KEY:
                    tts_audio = await _run_tts(response_text, language)
                    if tts_audio:
                        await websocket.send_json({
                            "type": "tts_audio",
                            "data": base64.b64encode(tts_audio).decode("utf-8"),
                        })

                await websocket.send_json({"type": "done"})

            elif msg_type == "text_query":
                # Direct text query (no audio)
                query = msg.get("text", "")
                language = msg.get("language", "en")

                await websocket.send_json({
                    "type": "transcript",
                    "text": query,
                })

                async with async_session() as db:
                    result = await run_agent(
                        shop_id=shop_id,
                        transcript=query,
                        language=language,
                        db=db,
                    )

                await websocket.send_json({
                    "type": "response_card",
                    "why_text": result.get("why_text", ""),
                    "what_text": result.get("what_text", ""),
                    "rupees_impact": result.get("rupees_impact", 0),
                })

                await websocket.send_json({"type": "done"})

    except WebSocketDisconnect:
        print(f"[VoiceWS] Client for shop {shop_id} disconnected")
    except Exception as e:
        print(f"[VoiceWS] Error: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass


async def _run_stt(audio_bytes: bytes) -> str | None:
    """Call Sarvam STT API, return transcript."""
    if not SARVAM_API_KEY:
        return "Mock transcript — Sarvam API key not configured"

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                SARVAM_STT_URL,
                headers={"api-subscription-key": SARVAM_API_KEY},
                files={"file": ("audio.wav", audio_bytes, "audio/wav")},
                data={"model": "saaras:v3", "mode": "transcribe", "with_timestamps": "false"},
            )
            if resp.status_code == 200:
                return resp.json().get("transcript", "")
    except Exception as e:
        print(f"[STT] Error: {e}")
    return None


async def _run_tts(text: str, language: str = "hi") -> bytes | None:
    """Call Sarvam TTS API, return audio bytes."""
    if not SARVAM_API_KEY:
        return None

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                SARVAM_TTS_URL,
                headers={
                    "api-subscription-key": SARVAM_API_KEY,
                    "Content-Type": "application/json",
                },
                json={
                    "text": text[:500],                   # field is 'text' per bulbul:v3 docs
                    "target_language_code": _lang_to_code(language),
                    "speaker": "shubh",                   # bulbul:v3 lowercase speaker
                    "model": "bulbul:v3",
                },
            )
            if resp.status_code == 200:
                audios = resp.json().get("audios", [])
                if audios:
                    return base64.b64decode(audios[0])
    except Exception as e:
        print(f"[TTS] Error: {e}")
    return None
