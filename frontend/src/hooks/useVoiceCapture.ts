"use client";

import { useRef, useCallback, useEffect } from "react";
import { useVoiceStore } from "@/store/useVoiceStore";

const WS_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/^http/, "ws") ?? "ws://localhost:8000";

export function useVoiceCapture(shopId: number | null) {
  const {
    setListening, setProcessing, setError, setSessionId,
    addUserMessage, addAssistantMessage, updateAssistantMessage,
    setTranscript,
  } = useVoiceStore();

  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const currentMsgId = useRef<string | null>(null);
  const streamedText = useRef<string>("");
  const pendingStopRef = useRef<{ language: string } | null>(null);

  const playAudio = useCallback(async (buffer: ArrayBuffer) => {
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
  }, []);

  const ensureSocket = useCallback((): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      if (!shopId) {
        reject(new Error("Missing shop session"));
        return;
      }

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        resolve(wsRef.current);
        return;
      }

      const token = localStorage.getItem("bv_token");
      const wsUrl = new URL(`${WS_BASE}/ws/voice/${shopId}`);
      if (token) wsUrl.searchParams.set("token", token);

      const ws = new WebSocket(wsUrl.toString());
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => resolve(ws);
      ws.onerror = () => reject(new Error("WebSocket connection failed"));

      ws.onmessage = async (event) => {
        if (event.data instanceof ArrayBuffer) {
          await playAudio(event.data);
          return;
        }

        try {
          const msg = JSON.parse(event.data as string) as {
            type: string;
            session_id?: string;
            text?: string;
            token?: string;
            why?: string;
            what?: string;
            rupees_impact?: number;
          };

          switch (msg.type) {
            case "session_start":
              if (msg.session_id) setSessionId(msg.session_id);
              break;

            case "transcript":
              if (msg.text) {
                addUserMessage(msg.text);
                setTranscript(msg.text);
              }
              break;

            case "thinking":
              setProcessing(true);
              currentMsgId.current = _genId();
              streamedText.current = "";
              addAssistantMessage({ text: "", id: currentMsgId.current } as never);
              break;

            case "chat_token":
              if (currentMsgId.current && msg.token) {
                streamedText.current += msg.token;
                updateAssistantMessage(currentMsgId.current, {
                  text: streamedText.current,
                });
              }
              break;

            case "chat_done":
              if (currentMsgId.current) {
                updateAssistantMessage(currentMsgId.current, {
                  text: msg.text ?? streamedText.current,
                  why: msg.why,
                  what: msg.what,
                  rupeesImpact: msg.rupees_impact,
                });
                currentMsgId.current = null;
                streamedText.current = "";
              }
              setProcessing(false);
              break;

            case "error":
              if ((msg.text ?? "").toLowerCase().includes("invalid token")) {
                localStorage.removeItem("bv_token");
                localStorage.removeItem("bv_user");
                localStorage.removeItem("bv_shop");
                setError("Session expired. Please sign in again.");
                ws.close();
                break;
              }
              setError(msg.text ?? "An error occurred");
              setProcessing(false);
              break;

            default:
              break;
          }
        } catch {
          // Ignore non-JSON frames.
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
      };
    });
  }, [
    shopId,
    setSessionId,
    setProcessing,
    setError,
    setTranscript,
    addUserMessage,
    addAssistantMessage,
    updateAssistantMessage,
    playAudio,
  ]);

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
      setError(shopId ? "Could not connect to BizVaani. Check your internet." : "Shop session not ready yet. Please wait a moment.");
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    const recorder = new MediaRecorder(stream, { mimeType });
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
        ws.send(event.data);
      }
    };

    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "end_of_speech",
          language: pendingStopRef.current?.language ?? "en",
          mime_type: recorder.mimeType || mimeType,
        }));
      }

      pendingStopRef.current = null;
    };

    recorder.start(250);
    setListening(true);
  }, [ensureSocket, setListening, setError, shopId]);

  const stopVoice = useCallback((language = "en") => {
    pendingStopRef.current = { language };
    recorderRef.current?.stop();
    recorderRef.current = null;
    setListening(false);
    setProcessing(true);
  }, [setListening, setProcessing]);

  const sendTextQuery = useCallback(async (text: string, language = "en") => {
    setError(null);
    let ws: WebSocket;
    try {
      ws = await ensureSocket();
    } catch {
      setError(shopId ? "Could not connect to BizVaani." : "Shop session not ready yet. Please wait a moment.");
      return;
    }
    ws.send(JSON.stringify({ type: "text_query", text, language }));
    setProcessing(true);
  }, [ensureSocket, setProcessing, setError, shopId]);

  const clearSession = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "clear_session" }));
    }
  }, []);

  const disconnect = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    pendingStopRef.current = null;
    setListening(false);
    setProcessing(false);
  }, [setListening, setProcessing]);

  useEffect(() => () => { disconnect(); }, [disconnect]);

  return { startVoice, stopVoice, sendTextQuery, clearSession, disconnect };
}

function _genId() {
  return Math.random().toString(36).slice(2, 8);
}
