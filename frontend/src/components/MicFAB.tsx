"use client";

import { useEffect, useState } from "react";
import VoiceModal from "./VoiceModal";

export default function MicFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);

  useEffect(() => {
    const handleOpenVoice = (event: Event) => {
      const customEvent = event as CustomEvent<{ prompt?: string }>;
      setInitialPrompt(customEvent.detail?.prompt ?? null);
      setIsOpen(true);
    };

    window.addEventListener("bv-open-voice", handleOpenVoice as EventListener);
    return () => window.removeEventListener("bv-open-voice", handleOpenVoice as EventListener);
  }, []);

  return (
    <>
      <button
        data-mic-fab
        onClick={() => setIsOpen(true)}
        aria-label="BizVaani se Poochho"
        className="fixed z-50 flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
        style={{
          /* Mobile: centered above bottom nav */
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 72px)",
          left: "50%",
          transform: "translateX(-50%)",
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))",
          boxShadow: "var(--shadow-glow-orange), var(--shadow-clay-soft)",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </button>

      {/* Desktop: override position to bottom-right */}
      <style>{`
        @media (min-width: 1024px) {
          [data-mic-fab] {
            left: auto !important;
            right: 32px !important;
            bottom: 32px !important;
            transform: none !important;
          }
        }
      `}</style>

      <VoiceModal
        open={isOpen}
        initialPrompt={initialPrompt}
        onPromptConsumed={() => setInitialPrompt(null)}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
