"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { voiceQuery } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_URL = API_URL.replace(/^http/, "ws");

interface VoiceResponse {
  why_text?: string;
  what_text?: string;
  rupees_impact?: number;
  response_text?: string;
}

// Mic animation rings
function PulseRing({ active }: { active: boolean }) {
  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      {active && (
        <>
          <span className="absolute inset-0 rounded-full bg-[#FF5500]/20 animate-ping" />
          <span className="absolute inset-2 rounded-full bg-[#FF5500]/15 animate-ping" style={{ animationDelay: "0.15s" }} />
        </>
      )}
      <div
        className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-200 ${
          active ? "bg-[#FF5500]" : "bg-[#0A0A0A]"
        }`}
      >
        <span className="text-2xl">{active ? "🔴" : "🎙️"}</span>
      </div>
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
}

type Phase = "idle" | "listening" | "processing" | "result" | "error";

export default function VoiceModal({ open, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<VoiceResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Cleanup on unmount or close
  useEffect(() => {
    if (!open) {
      stopRecording();
      wsRef.current?.close();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const stopRecording = useCallback(() => {
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      mediaRef.current.stop();
    }
  }, []);

  const handleClose = () => {
    stopRecording();
    wsRef.current?.close();
    setPhase("idle");
    setTranscript("");
    setResult(null);
    setErrorMsg("");
    onClose();
  };

  const handleTap = async () => {
    if (phase === "listening") {
      stopRecording();
      return;
    }

    setPhase("listening");
    setTranscript("");
    setResult(null);
    setErrorMsg("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setPhase("processing");
        await sendAudio();
      };

      recorder.start();

      // Auto-stop after 8 seconds
      setTimeout(() => {
        if (recorder.state !== "inactive") recorder.stop();
      }, 8000);
    } catch {
      setPhase("error");
      setErrorMsg("Microphone access denied. Please allow microphone permission.");
    }
  };

  const sendAudio = async () => {
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const token = typeof window !== "undefined" ? localStorage.getItem("bv_token") : null;

    // Try WebSocket flow first
    const wsUrl = `${WS_URL}/ws/voice/1`;
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(blob);
      };

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data) as {
            type: string;
            transcript?: string;
            why_text?: string;
            what_text?: string;
            rupees_impact?: number;
            response_text?: string;
          };
          if (data.type === "transcript") {
            setTranscript(data.transcript ?? "");
          }
          if (data.type === "result") {
            setResult(data);
            setPhase("result");
          }
          if (data.type === "error") {
            throw new Error(data.response_text ?? "WebSocket error");
          }
        } catch {
          // Non-JSON (binary TTS audio) — ignore here
        }
      };

      ws.onerror = () => fallbackToRest(token);
      ws.onclose = (e) => {
        if (e.code !== 1000 && phase !== "result") fallbackToRest(token);
      };

      // Timeout safety
      setTimeout(() => {
        if (phase === "processing") fallbackToRest(token);
      }, 12000);
    } catch {
      await fallbackToRest(token);
    }
  };

  const fallbackToRest = async (token: string | null) => {
    // If we have a transcript, use it; otherwise use a placeholder
    const text = transcript || "Check my sales status";
    const shopId = token ? 1 : 1; // TODO: read from store/localStorage

    try {
      const res = await voiceQuery(shopId, text);
      setResult(res as VoiceResponse);
      setPhase("result");
    } catch {
      setPhase("error");
      setErrorMsg("Could not reach BizVaani. Check your connection.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />

      {/* Sheet */}
      <div className="relative w-full bg-white max-h-[85vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-black/10" />
        </div>

        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-5 text-black/30 hover:text-black/60 text-xs font-black uppercase tracking-widest transition-colors"
        >
          Close ×
        </button>

        <div className="px-6 pb-10 pt-2">
          {/* Label */}
          <p className="text-[10px] font-bold tracking-[0.3em] text-black/30 uppercase mb-8">
            {phase === "idle" && "Tap to speak"}
            {phase === "listening" && "Listening..."}
            {phase === "processing" && "Processing..."}
            {phase === "result" && "BizVaani says"}
            {phase === "error" && "Error"}
          </p>

          {/* Mic */}
          {(phase === "idle" || phase === "listening") && (
            <div className="flex flex-col items-center gap-6">
              <button onClick={handleTap}>
                <PulseRing active={phase === "listening"} />
              </button>

              <p className="text-sm text-black/40 text-center max-w-[200px] leading-relaxed">
                {phase === "listening"
                  ? "Tap to stop · auto-stops in 8s"
                  : "Ask why sales dropped, what to stock, or any business question"}
              </p>

              {/* Example queries */}
              {phase === "idle" && (
                <div className="w-full space-y-2 mt-2">
                  {["Why did rice sales drop?", "What should I stock this week?", "Generate invoice for Suresh"].map((ex) => (
                    <button
                      key={ex}
                      onClick={() => {
                        setTranscript(ex);
                        setPhase("processing");
                        voiceQuery(1, ex).then((r) => {
                          setResult(r as VoiceResponse);
                          setPhase("result");
                        }).catch(() => {
                          setPhase("error");
                          setErrorMsg("Failed to reach BizVaani.");
                        });
                      }}
                      className="w-full text-left px-4 py-3 border border-black/8 text-sm text-black/50 hover:border-[#FF5500] hover:text-[#0A0A0A] transition-all"
                    >
                      &ldquo;{ex}&rdquo;
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Processing */}
          {phase === "processing" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-8 h-8 border-2 border-[#FF5500] border-t-transparent rounded-full animate-spin" />
              {transcript && (
                <p className="text-sm text-black/40 italic text-center">
                  &ldquo;{transcript}&rdquo;
                </p>
              )}
              <p className="text-xs text-black/20">Asking BizVaani...</p>
            </div>
          )}

          {/* Result */}
          {phase === "result" && result && (
            <div className="space-y-4">
              {transcript && (
                <p className="text-xs text-black/30 italic border-l-2 border-[#FF5500]/30 pl-3">
                  &ldquo;{transcript}&rdquo;
                </p>
              )}

              {[
                { label: "WHY", content: result.why_text },
                { label: "WHAT TO DO", content: result.what_text },
              ].map(
                (block) =>
                  block.content && (
                    <div key={block.label} className="border-l-2 border-[#FF5500] pl-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF5500] mb-1">
                        {block.label}
                      </p>
                      <p className="text-sm text-[#0A0A0A] leading-relaxed">{block.content}</p>
                    </div>
                  )
              )}

              {result.rupees_impact !== undefined && result.rupees_impact !== 0 && (
                <div className="bg-[#FF5500] px-4 py-3 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-white">₹ Impact</span>
                  <span className="text-xl font-black text-white">
                    {result.rupees_impact > 0 ? "+" : ""}₹{Math.abs(result.rupees_impact).toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              <button
                onClick={() => { setPhase("idle"); setTranscript(""); setResult(null); }}
                className="w-full py-3 border-2 border-black/10 text-black/40 font-black text-xs tracking-widest uppercase hover:border-[#FF5500] hover:text-[#FF5500] transition-all"
              >
                Ask Again
              </button>
            </div>
          )}

          {/* Error */}
          {phase === "error" && (
            <div className="space-y-4 text-center py-6">
              <p className="text-2xl">⚠️</p>
              <p className="text-sm text-red-600 font-bold">{errorMsg}</p>
              <button
                onClick={() => { setPhase("idle"); setErrorMsg(""); }}
                className="px-6 py-3 bg-[#FF5500] text-white font-black text-xs tracking-widest uppercase"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
