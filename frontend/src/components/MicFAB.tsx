"use client";

// ============================================================
// MicFAB — Task: Member E
// See: FRONTEND_GUIDELINES.md (Section 4 — Mic FAB)
// ============================================================

import { useState } from "react";
import VoiceModal from "./VoiceModal";

export default function MicFAB() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-orange-500 hover:bg-orange-600 shadow-lg flex items-center justify-center z-50 transition-all duration-200 active:scale-95"
        aria-label="Voice assistant"
      >
        <span className="text-2xl">🎙️</span>
      </button>

      {isOpen && <VoiceModal onClose={() => setIsOpen(false)} />}
    </>
  );
}
