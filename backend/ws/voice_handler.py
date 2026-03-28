"""WebSocket handler for the voice pipeline — Session-aware.

WS /ws/voice/{shop_id}

Protocol (Client → Server):
  Binary frame                  → raw audio chunk (streamed from MediaRecorder)
  { "type": "end_of_speech" }  → stop recording, process accumulated audio
  { "type": "text_query",
    "text": "...",
    "language": "hi" }         → direct text query (no audio, same pipeline)
  { "type": "ping" }           → keepalive

Protocol (Server → Client):
  { "type": "session_start", "session_id": "..." }
  { "type": "transcript",    "text": "...", "msg_id": "..." }
  { "type": "thinking" }                                       ← processing signal
  { "type": "chat_token",    "token": "...", "msg_id": "..." } ← streamed text chunk
  { "type": "chat_done",     "why": "...", "what": "...",
    "rupees_impact": N,       "msg_id": "..." }               ← full structured result
  Binary frame                                                 ← TTS audio chunk(s)
  { "type": "error",         "text": "..." }
"""

import asyncio
import base64
import json
import os
import uuid

import httpx
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from core.auth_utils import decode_token

from db.database import async_session
from agent.graph import run_agent
from services.operations import handle_operational_query

router = APIRouter()

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "")
SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"
SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"

_LANG_CODE_MAP = {
    "hi": "hi-IN", "en": "en-IN", "te": "te-IN",
    "ta": "ta-IN", "mr": "mr-IN",
}


def _lang_to_code(lang: str) -> str:
    return _LANG_CODE_MAP.get(lang, "en-IN")


# ── Session store (in-memory, per WebSocket connection) ─────────────────
# Each entry: list of {"role": "user"|"assistant", "text": str}
# Kept alive for the duration of the WebSocket connection.
# For production: persist to Redis/DB keyed by session_id.


@router.websocket("/ws/voice/{shop_id}")
async def voice_websocket(
    websocket: WebSocket, 
    shop_id: int, 
    token: str | None = Query(None)
):
    """Session-aware voice pipeline: audio/text → STT → LangGraph → TTS + Text."""
    await websocket.accept()

    if not token:
        await websocket.send_json({"type": "error", "text": "Unauthorized"})
        await websocket.close(code=1008)
        return

    try:
        payload = decode_token(token)
        if int(payload.get("shop_id", 0)) != shop_id:
            await websocket.send_json({"type": "error", "text": "Forbidden"})
            await websocket.close(code=1008)
            return
    except Exception:
        await websocket.send_json({"type": "error", "text": "Invalid token"})
        await websocket.close(code=1008)
        return

    session_id = str(uuid.uuid4())[:8]
    conversation_history: list[dict] = []   # [{role, text}, ...]
    audio_buffer = bytearray()
    language = "en"
    audio_mime_type = "audio/webm"
    pending_action: dict | None = None

    # Announce session start
    await websocket.send_json({
        "type": "session_start",
        "session_id": session_id,
    })

    async def process_query(query: str, msg_id: str):
        """Run the full pipeline for one query turn."""
        nonlocal conversation_history, pending_action

        # Add to history
        conversation_history.append({"role": "user", "text": query})

        # Signal AI is thinking
        await websocket.send_json({"type": "thinking"})

        try:
            async with async_session() as db:
                result = await handle_operational_query(
                    query,
                    shop_id=shop_id,
                    db=db,
                    pending_action=pending_action,
                )
                if not result:
                    result = await run_agent(
                        shop_id=shop_id,
                        transcript=query,
                        language=language,
                        db=db,
                        conversation_history=conversation_history,
                    )

            why_text = result.get("why_text", "")
            what_text = result.get("what_text", "")
            rupees_impact = result.get("rupees_impact", 0)
            response_text = result.get("response_text", "") or f"{why_text} {what_text}".strip()
            action = result.get("action")
            pending_action = result.get("pending_action")

            # ── Stream response text token by token ──────────────────────
            # Simulate streaming by splitting into words
            # (Groq streaming is handled inside run_agent; we re-emit chunks here)
            full_text = response_text
            words = full_text.split()
            chunk_size = 4
            for i in range(0, len(words), chunk_size):
                chunk = " ".join(words[i:i + chunk_size]) + (" " if i + chunk_size < len(words) else "")
                await websocket.send_json({
                    "type": "chat_token",
                    "token": chunk,
                    "msg_id": msg_id,
                })
                await asyncio.sleep(0.03)   # pacing ~30ms per chunk

            # ── Send structured result card ───────────────────────────────
            await websocket.send_json({
                "type": "chat_done",
                "msg_id": msg_id,
                "text": response_text,
                "why": why_text,
                "what": what_text,
                "rupees_impact": rupees_impact,
                "action": action,
            })

            # Add assistant turn to history
            conversation_history.append({"role": "assistant", "text": response_text})

            # ── TTS: fire simultaneously as text was being sent ───────────
            if response_text and SARVAM_API_KEY:
                # Split on sentence boundaries for low-latency streaming TTS
                sentences = _split_sentences(response_text)
                for sentence in sentences:
                    if not sentence.strip():
                        continue
                    audio = await _run_tts(sentence.strip(), language)
                    if audio:
                        # Send raw binary — client plays immediately (Web Audio API)
                        await websocket.send_bytes(audio)

        except Exception as e:
            print(f"[VoiceWS] Pipeline error: {e}")
            await websocket.send_json({"type": "error", "text": str(e)})

    try:
        while True:
            # Accept both binary (audio) and text (control) frames
            try:
                data = await websocket.receive()
            except WebSocketDisconnect:
                break

            if "bytes" in data and data["bytes"]:
                # Raw audio chunk from MediaRecorder (binary frame)
                audio_buffer.extend(data["bytes"])

            elif "text" in data and data["text"]:
                try:
                    msg = json.loads(data["text"])
                except json.JSONDecodeError:
                    continue

                msg_type = msg.get("type", "")

                if msg_type == "end_of_speech":
                    # ── Process accumulated audio ──────────────────────────
                    lang_override = msg.get("language")
                    if lang_override:
                        language = lang_override

                    mime_override = msg.get("mime_type")
                    if mime_override:
                        audio_mime_type = mime_override

                    if not audio_buffer:
                        await websocket.send_json({"type": "error", "text": "No audio received"})
                        continue

                    transcript = await _run_stt(bytes(audio_buffer), language, audio_mime_type)
                    audio_buffer.clear()

                    if not transcript:
                        await websocket.send_json({"type": "error", "text": "Could not transcribe audio"})
                        continue

                    msg_id = str(uuid.uuid4())[:8]
                    await websocket.send_json({
                        "type": "transcript",
                        "text": transcript,
                        "msg_id": msg_id,
                    })
                    await process_query(transcript, msg_id)

                elif msg_type == "text_query":
                    # ── Direct text query ──────────────────────────────────
                    query = msg.get("text", "").strip()
                    lang_override = msg.get("language")
                    if lang_override:
                        language = lang_override

                    if not query:
                        continue

                    msg_id = str(uuid.uuid4())[:8]
                    # Echo transcript so client can show user bubble
                    await websocket.send_json({
                        "type": "transcript",
                        "text": query,
                        "msg_id": msg_id,
                    })
                    await process_query(query, msg_id)

                elif msg_type == "clear_session":
                    # User wants to start fresh
                    conversation_history = []
                    pending_action = None
                    session_id = str(uuid.uuid4())[:8]
                    await websocket.send_json({
                        "type": "session_start",
                        "session_id": session_id,
                    })

                elif msg_type == "ping":
                    await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        print(f"[VoiceWS] shop={shop_id} session={session_id} disconnected")
    except Exception as e:
        print(f"[VoiceWS] Fatal error: {e}")
        try:
            await websocket.send_json({"type": "error", "text": str(e)})
        except Exception:
            pass


# ── STT ─────────────────────────────────────────────────────────────────

def _mime_to_filename(mime_type: str) -> str:
    if "ogg" in mime_type:
        return "audio.ogg"
    if "wav" in mime_type:
        return "audio.wav"
    if "mp4" in mime_type or "mpeg" in mime_type:
        return "audio.m4a"
    return "audio.webm"


async def _run_stt(audio_bytes: bytes, language: str = "en", mime_type: str = "audio/webm") -> str | None:
    """Call Sarvam STT in translate mode so multilingual speech maps to English."""
    if not SARVAM_API_KEY:
        raise RuntimeError("SARVAM_API_KEY is not configured for real STT operation.")

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                SARVAM_STT_URL,
                headers={"api-subscription-key": SARVAM_API_KEY},
                files={"file": (_mime_to_filename(mime_type), audio_bytes, mime_type)},
                data={
                    "model": "saaras:v3",
                    "mode": "translate",
                    "with_timestamps": "false",
                },
            )
            if resp.status_code == 200:
                return resp.json().get("transcript", "")
            print(f"[STT] Non-200: {resp.status_code} {resp.text[:200]}")
    except Exception as e:
        print(f"[STT] Error: {e}")
    return None


# ── TTS ─────────────────────────────────────────────────────────────────

async def _run_tts(text: str, language: str = "en") -> bytes | None:
    """Call Sarvam TTS (bulbul:v3). Returns raw audio bytes or None."""
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
                    "text": text[:500],
                    "target_language_code": _lang_to_code(language),
                    "speaker": "shubh",
                    "model": "bulbul:v3",
                },
            )
            if resp.status_code == 200:
                audios = resp.json().get("audios", [])
                if audios:
                    return base64.b64decode(audios[0])
            print(f"[TTS] Non-200: {resp.status_code} {resp.text[:200]}")
    except Exception as e:
        print(f"[TTS] Error: {e}")
    return None


# ── Helpers ──────────────────────────────────────────────────────────────

def _split_sentences(text: str) -> list[str]:
    """Split text on sentence endings for streaming TTS."""
    import re
    # Split on Hindi danda (।), English punctuation, newlines
    parts = re.split(r'(?<=[।.!?])\s+|\n', text)
    return [p.strip() for p in parts if p.strip()]
