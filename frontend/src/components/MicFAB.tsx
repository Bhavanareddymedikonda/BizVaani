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
        className="fixed bottom-[88px] left-1/2 -translate-x-1/2 md:bottom-8 md:right-8 md:left-auto md:translate-x-0 w-[68px] h-[68px] !rounded-[24px] clay-btn flex items-center justify-center z-50 text-3xl pb-1"
        aria-label="Voice assistant"
      >
        🎙️
      </button>

      {isOpen && <VoiceModal onClose={() => setIsOpen(false)} />}
    </>
  );
}
