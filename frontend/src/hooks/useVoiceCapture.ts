"use client";

import { useRef, useCallback, useEffect } from "react";
import { useVoiceStore } from "@/store/useVoiceStore";

const WS_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/^http/, "ws") ?? "ws://localhost:8000";

/**
 * useVoiceCapture — Session-aware hook
 *
 * Single WebSocket stays open for the entire chat session.
 * Handles:
 *   - Binary audio streaming (MediaRecorder → server)
 *   - end_of_speech signal
 *   - text_query for typed input
 *   - chat_token streaming → updates assistant bubble in real-time
 *   - chat_done → finalizes bubble with why/what/₹
 *   - Binary TTS audio chunks → Web Audio API immediate playback
 */
export function useVoiceCapture(shopId: number) {
  const {
    setListening, setProcessing, setError, setSessionId,
    addUserMessage, addAssistantMessage, updateAssistantMessage,
    setTranscript,
  } = useVoiceStore();

  const wsRef          = useRef<WebSocket | null>(null);
  const recorderRef    = useRef<MediaRecorder | null>(null);
  const streamRef      = useRef<MediaStream | null>(null);
  const audioCtxRef    = useRef<AudioContext | null>(null);
  // Tracks the current assistant bubble being streamed
  const currentMsgId   = useRef<string | null>(null);
  const streamedText   = useRef<string>("");

  /* ── Initialize WebSocket once (keep-alive for session) ─────── */
  const ensureSocket = useCallback((): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        resolve(wsRef.current);
        return;
      }

      const token = localStorage.getItem("bv_token");
      const wsUrl = new URL(`${WS_BASE}/ws/voice/${shopId}`);
      if (token) wsUrl.searchParams.set("token", token);
      
      const ws = new WebSocket(wsUrl.toString());
      ws.binaryType = "arraybuffer";   // receive TTS as ArrayBuffer
      wsRef.current = ws;

      ws.onopen = () => resolve(ws);
      ws.onerror = () => reject(new Error("WebSocket connection failed"));

      ws.onmessage = async (event) => {
        /* Binary frame → TTS audio chunk */
        if (event.data instanceof ArrayBuffer) {
          await _playAudio(event.data);
          return;
        }

        /* Text frame → control/data message */
        try {
          const msg = JSON.parse(event.data as string) as {
            type: string;
            session_id?: string;
            text?: string;
            token?: string;
            msg_id?: string;
            why?: string;
            what?: string;
            rupees_impact?: number;
          };

          switch (msg.type) {
            case "session_start":
              if (msg.session_id) setSessionId(msg.session_id);
              break;

            case "transcript":
              // Server echoed the user query — add user bubble
              if (msg.text) {
                addUserMessage(msg.text);
                setTranscript(msg.text);
              }
              break;

            case "thinking":
              setProcessing(true);
              // Pre-create assistant bubble with empty text (will be streamed into)
              currentMsgId.current = _genId();
              streamedText.current = "";
              addAssistantMessage({ text: "", id: currentMsgId.current } as never);
              break;

            case "chat_token":
              // Stream text into existing assistant bubble
              if (currentMsgId.current && msg.token) {
                streamedText.current += msg.token;
                updateAssistantMessage(currentMsgId.current, {
                  text: streamedText.current,
                });
              }
              break;

            case "chat_done":
              // Finalize the bubble with structured data
              if (currentMsgId.current) {
                updateAssistantMessage(currentMsgId.current, {
                  text:         msg.text ?? streamedText.current,
                  why:          msg.why,
                  what:         msg.what,
                  rupeesImpact: msg.rupees_impact,
                });
                currentMsgId.current = null;
                streamedText.current = "";
              }
              setProcessing(false);
              break;

            case "error":
              setError(msg.text ?? "An error occurred");
              setProcessing(false);
              break;

            default:
              break;
          }
        } catch {
          // Non-JSON frame — ignore
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
      };
    });
  }, [shopId, setSessionId, setProcessing, setError, setTranscript,
      addUserMessage, addAssistantMessage, updateAssistantMessage]);

  /* ── Play raw audio buffer via Web Audio API ─────────────────── */
  async function _playAudio(buffer: ArrayBuffer) {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const audioBuf = await ctx.decodeAudioData(buffer.slice(0));
      const src = ctx.createBufferSource();
      src.buffer = audioBuf;
      src.connect(ctx.destination);
      src.start();
    } catch (err) {
      console.warn("[Voice] Audio decode error:", err);
    }
  }

  /* ── Start mic recording ─────────────────────────────────────── */
  const startVoice = useCallback(async () => {
    setError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Mic permission denied. Please allow microphone access.");
      return;
    }
    streamRef.current = stream;

    let ws: WebSocket;
    try {
      ws = await ensureSocket();
    } catch {
      setError("Could not connect to BizVaani. Check your internet.");
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    const recorder = new MediaRecorder(stream, { mimeType });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
        ws.send(e.data);   // binary audio chunk
      }
    };

    recorder.start(250);  // 250ms chunks
    setListening(true);
  }, [ensureSocket, setListening, setError]);

  /* ── Stop recording → signal server ─────────────────────────── */
  const stopVoice = useCallback((language = "hi") => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setListening(false);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "end_of_speech", language }));
    }
    setProcessing(true);
  }, [setListening, setProcessing]);

  /* ── Send a typed text query (no audio) ─────────────────────── */
  const sendTextQuery = useCallback(async (text: string, language = "hi") => {
    setError(null);
    let ws: WebSocket;
    try {
      ws = await ensureSocket();
    } catch {
      setError("Could not connect to BizVaani.");
      return;
    }
    ws.send(JSON.stringify({ type: "text_query", text, language }));
    setProcessing(true);
  }, [ensureSocket, setProcessing, setError]);

  /* ── Clear session ───────────────────────────────────────────── */
  const clearSession = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "clear_session" }));
    }
  }, []);

  /* ── Disconnect & cleanup ────────────────────────────────────── */
  const disconnect = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setListening(false);
    setProcessing(false);
  }, [setListening, setProcessing]);

  /* Cleanup on unmount */
  useEffect(() => () => { disconnect(); }, [disconnect]);

  return { startVoice, stopVoice, sendTextQuery, clearSession, disconnect };
}

function _genId() {
  return Math.random().toString(36).slice(2, 8);
}
