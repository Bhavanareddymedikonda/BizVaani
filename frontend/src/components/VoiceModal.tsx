"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useVoiceStore, type ChatMessage } from "@/store/useVoiceStore";
import { useShopStore } from "@/store/useShopStore";
import { useVoiceCapture } from "@/hooks/useVoiceCapture";

/* ─── Props ─────────────────────────────────────────────────── */
interface Props {
  open:    boolean;
  onClose: () => void;
}

/* ─── Mic button with pulse ──────────────────────────────────── */
function MicButton({ listening, onPointerDown, onPointerUp }: {
  listening: boolean;
  onPointerDown: () => void;
  onPointerUp:   () => void;
}) {
  return (
    <button
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      aria-label={listening ? "Release to send" : "Hold to speak"}
      className="relative flex items-center justify-center w-12 h-12 shrink-0 transition-all duration-150"
      style={{
        borderRadius: "50%",
        background: listening
          ? "linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))"
          : "var(--color-surface-2)",
        boxShadow: listening
          ? "var(--shadow-glow-orange), var(--shadow-clay-soft)"
          : "var(--shadow-clay)",
        animation: listening ? "mic-pulse 1.5s ease-in-out infinite" : "none",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={listening ? "white" : "var(--color-text-muted)"}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    </button>
  );
}

/* ─── Dot loader ─────────────────────────────────────────────── */
function DotLoader() {
  return (
    <div className="flex gap-1 items-center px-1 py-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: "var(--color-primary-400)",
            animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Single chat bubble ─────────────────────────────────────── */
function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {/* Avatar — assistant only */}
      {!isUser && (
        <div
          className="w-7 h-7 mr-2 shrink-0 flex items-center justify-center text-white text-xs font-black self-end mb-1"
          style={{
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))",
          }}
        >
          B
        </div>
      )}

      <div style={{ maxWidth: "80%" }}>
        {/* Bubble */}
        <div
          className="px-4 py-3"
          style={{
            borderRadius: isUser
              ? "var(--radius-md) var(--radius-md) 4px var(--radius-md)"
              : "var(--radius-md) var(--radius-md) var(--radius-md) 4px",
            background: isUser
              ? "linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))"
              : "var(--color-surface-0)",
            boxShadow: isUser ? "var(--shadow-clay-soft)" : "var(--shadow-clay)",
            border: isUser ? "none" : "1px solid rgba(255,255,255,0.5)",
          }}
        >
          {msg.text ? (
            <p
              className="text-sm leading-relaxed"
              style={{ color: isUser ? "white" : "var(--color-text-strong)" }}
            >
              {msg.text}
              {/* Streaming cursor */}
              {!isUser && !msg.why && msg.text && (
                <span
                  className="inline-block w-0.5 h-3.5 ml-0.5 align-middle"
                  style={{ background: "var(--color-primary-400)", animation: "blink 1s step-end infinite" }}
                />
              )}
            </p>
          ) : (
            <DotLoader />
          )}
        </div>

        {/* Structured WHY / WHAT / ₹ — only for final assistant messages */}
        {!isUser && (msg.why || msg.what) && (
          <div className="mt-2 space-y-1.5">
            {msg.why && (
              <div
                className="px-3 py-2"
                style={{
                  borderRadius: "var(--radius-sm)",
                  background: "var(--color-surface-1)",
                  borderLeft: "3px solid var(--color-error)",
                  boxShadow: "var(--shadow-clay-inset)",
                }}
              >
                <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: "var(--color-error)" }}>
                  Kyun
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-base)" }}>
                  {msg.why}
                </p>
              </div>
            )}
            {msg.what && (
              <div
                className="px-3 py-2"
                style={{
                  borderRadius: "var(--radius-sm)",
                  background: "var(--color-surface-1)",
                  borderLeft: "3px solid var(--color-info)",
                  boxShadow: "var(--shadow-clay-inset)",
                }}
              >
                <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: "var(--color-info)" }}>
                  Kya Karen
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-base)" }}>
                  {msg.what}
                </p>
              </div>
            )}
            {msg.rupeesImpact !== undefined && msg.rupeesImpact !== 0 && (
              <div
                className="px-3 py-2 flex items-center justify-between"
                style={{
                  borderRadius: "var(--radius-sm)",
                  background: "linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))",
                }}
              >
                <span className="text-[9px] font-black uppercase tracking-widest text-white/80">
                  Expected Impact
                </span>
                <span className="text-sm font-black text-white">
                  {msg.rupeesImpact > 0 ? "+" : ""}₹
                  {Math.abs(msg.rupeesImpact).toLocaleString("en-IN")}
                </span>
              </div>
            )}
          </div>
        )}

        <p
          className="text-[9px] mt-1 px-1"
          style={{ color: "var(--color-text-soft)", textAlign: isUser ? "right" : "left" }}
        >
          {new Date(msg.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

/* ─── Voice Chat Session Panel ───────────────────────────────── */
export default function VoiceModal({ open, onClose }: Props) {
  const { shopId } = useShopStore();
  const {
    isListening, isProcessing, messages, error, sessionId,
    reset, clearSession,
  } = useVoiceStore();

  const { startVoice, stopVoice, sendTextQuery, disconnect } = useVoiceCapture(shopId ?? 1);

  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const SUGGESTIONS = [
    "Mera rice sales kyun gir raha hai?",
    "Is hafte kya stock karoon?",
    "Mere profit ka andaza lagao",
  ];

  /* Auto-scroll to bottom on new messages */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  /* Cleanup on close — keep session in store */
  const handleClose = useCallback(() => {
    if (isListening) stopVoice();
    reset();   // resets turn state, keeps messages[]
    onClose();
  }, [isListening, stopVoice, reset, onClose]);

  /* On full disconnect */
  const handleEndSession = useCallback(() => {
    disconnect();
    clearSession();
    onClose();
  }, [disconnect, clearSession, onClose]);

  const handleSendText = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isProcessing) return;
    setInputText("");
    await sendTextQuery(text);
  }, [inputText, isProcessing, sendTextQuery]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  }, [handleSendText]);

  /* Hold-to-speak mic */
  const handleMicDown = useCallback(async () => {
    await startVoice();
  }, [startVoice]);

  const handleMicUp = useCallback(() => {
    if (isListening) stopVoice();
  }, [isListening, stopVoice]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-end lg:pr-6 lg:pb-6">
      {/* Backdrop — mobile only */}
      <div
        className="absolute inset-0 lg:hidden"
        style={{ background: "rgba(36,29,23,0.55)", backdropFilter: "blur(4px)" }}
        onClick={handleClose}
      />

      {/* Chat panel */}
      <div
        className="relative flex flex-col w-full lg:w-[420px]"
        style={{
          height: "clamp(480px, 70vh, 680px)",
          background: "var(--color-surface-0)",
          borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
          boxShadow: "0 -20px 60px rgba(88,66,46,0.20)",
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{
            borderBottom: "1px solid var(--color-surface-2)",
            borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 flex items-center justify-center text-white text-xs font-black"
              style={{
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))",
              }}
            >
              B
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--color-text-strong)" }}>
                BizVaani
              </p>
              {sessionId && (
                <p className="text-[9px] uppercase tracking-widest" style={{ color: "var(--color-text-soft)" }}>
                  Session #{sessionId}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={handleEndSession}
                className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
                style={{
                  background: "var(--color-surface-2)",
                  color: "var(--color-text-muted)",
                }}
              >
                New Session
              </button>
            )}
            <button
              onClick={handleClose}
              className="w-7 h-7 flex items-center justify-center"
              style={{ borderRadius: "50%", background: "var(--color-surface-2)", color: "var(--color-text-muted)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Messages area ── */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4"
          style={{ scrollBehavior: "smooth" }}
        >
          {/* Empty state */}
          {messages.length === 0 && !isProcessing && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="text-4xl">🎙️</div>
              <p className="text-sm font-semibold text-center" style={{ color: "var(--color-text-muted)" }}>
                BizVaani se poochho
              </p>
              <p className="text-xs text-center" style={{ color: "var(--color-text-soft)" }}>
                Hindi, Telugu ya English mein
              </p>
              <div className="w-full space-y-2 mt-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendTextQuery(s)}
                    className="w-full text-left px-4 py-2.5 text-sm transition-all duration-150"
                    style={{
                      borderRadius: "var(--radius-md)",
                      background: "var(--color-surface-1)",
                      color: "var(--color-text-base)",
                      boxShadow: "var(--shadow-clay)",
                      border: "1px solid rgba(255,255,255,0.45)",
                    }}
                  >
                    &ldquo;{s}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat bubbles */}
          {messages.map((msg) => (
            <ChatBubble key={msg.id} msg={msg} />
          ))}

          {/* Error banner */}
          {error && (
            <div
              className="mx-2 px-4 py-3 text-sm text-center"
              style={{
                borderRadius: "var(--radius-md)",
                background: "rgba(214,79,69,0.10)",
                color: "var(--color-error)",
                border: "1px solid rgba(214,79,69,0.20)",
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* ── Input bar ── */}
        <div
          className="shrink-0 px-4 py-3"
          style={{
            borderTop: "1px solid var(--color-surface-2)",
            background: "var(--color-surface-1)",
            borderRadius: "0 0 var(--radius-md) var(--radius-md)",
          }}
        >
          {/* Listening indicator */}
          {isListening && (
            <div
              className="flex items-center gap-2 px-3 py-2 mb-2 text-xs font-semibold"
              style={{
                borderRadius: "var(--radius-sm)",
                background: "rgba(234,122,34,0.10)",
                color: "var(--color-primary-500)",
                border: "1px solid rgba(234,122,34,0.20)",
              }}
            >
              <span style={{ animation: "mic-pulse 1s ease-in-out infinite", display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "var(--color-primary-500)" }} />
              Sun raha hai... chhodein to bhejega
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Mic — hold to speak */}
            <MicButton
              listening={isListening}
              onPointerDown={handleMicDown}
              onPointerUp={handleMicUp}
            />

            {/* Text input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Bol dijiye..." : "Ya type karein..."}
                disabled={isListening || isProcessing}
                className="w-full px-4 py-2.5 text-sm"
                style={{
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-surface-0)",
                  color: "var(--color-text-strong)",
                  border: "1px solid var(--color-surface-3)",
                  boxShadow: "var(--shadow-clay-inset)",
                  outline: "none",
                }}
              />
            </div>

            {/* Send button */}
            <button
              onClick={handleSendText}
              disabled={!inputText.trim() || isProcessing || isListening}
              className="w-10 h-10 flex items-center justify-center transition-all duration-150"
              style={{
                borderRadius: "50%",
                background: inputText.trim() && !isProcessing
                  ? "linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))"
                  : "var(--color-surface-2)",
                boxShadow: inputText.trim() ? "var(--shadow-clay-soft)" : "none",
                opacity: !inputText.trim() || isProcessing ? 0.5 : 1,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke={inputText.trim() ? "white" : "var(--color-text-muted)"}
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
