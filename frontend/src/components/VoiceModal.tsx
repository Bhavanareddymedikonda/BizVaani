"use client";

// ============================================================
// VoiceModal — Task: Member E
// See: FRONTEND_GUIDELINES.md (Section 4 — Voice Response Card)
// ============================================================

import { useEffect } from "react";
import { useVoiceStore } from "@/store/useVoiceStore";
import { voiceQuery } from "@/lib/api";

export default function VoiceModal({ onClose }: { onClose: () => void }) {
  const {
    isListening,
    isProcessing,
    transcript,
    response,
    startListening,
    stopListening,
    setTranscript,
    setProcessing,
    setResponse,
    reset,
  } = useVoiceStore();

  // Simulate a voice interaction with mock data
  const simulateVoice = async () => {
    startListening();

    // Simulate STT — typed text appearing
    const words = "Why is my rice sales dropping?".split(" ");
    for (let i = 0; i < words.length; i++) {
      await new Promise((r) => setTimeout(r, 200));
      setTranscript(words.slice(0, i + 1).join(" "));
    }

    stopListening();
    setProcessing(true);

    // Simulate LLM processing
    try {
      const res = await voiceQuery(1, "Why is my rice sales dropping?");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = res as any;
      setResponse({
        why_text: r.why_text,
        what_text: r.what_text,
        rupees_impact: r.rupees_impact,
      });
    } catch (err) {
      console.error("Voice query failed:", err);
      setProcessing(false);
    }
  };

  useEffect(() => {
    simulateVoice();
    return () => reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end z-[60]">
      <div className="bg-white w-full rounded-t-2xl p-5 max-h-[80vh] overflow-y-auto animate-slide-up">
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">
          ✕
        </button>

        {/* Waveform Placeholder */}
        {isListening && (
          <div className="flex gap-1 items-center justify-center py-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-1 bg-orange-500 rounded-full animate-bounce"
                style={{
                  height: `${20 + Math.random() * 20}px`,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && !response && (
          <div className="flex gap-1 items-center justify-center py-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}

        {/* Transcript */}
        {transcript && (
          <p className="text-sm text-gray-400 mb-4 italic">&quot;{transcript}&quot;</p>
        )}

        {/* Response Card */}
        {response && (
          <div className="space-y-4">
            {/* WHY */}
            <div>
              <span className="text-xs font-bold text-red-500 uppercase tracking-wide">
                Why
              </span>
              <p className="text-base text-gray-800 mt-1">{response.why_text}</p>
            </div>

            {/* WHAT */}
            <div>
              <span className="text-xs font-bold text-blue-500 uppercase tracking-wide">
                What To Do
              </span>
              <p className="text-base text-gray-800 mt-1">{response.what_text}</p>
            </div>

            {/* ₹ Impact */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-5 text-center">
              <p className="text-gray-600 text-sm mb-2">Expected extra earnings this week</p>
              <p className="text-4xl font-bold text-green-700">
                ₹{response.rupees_impact.toLocaleString()}
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
            >
              Got it
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
