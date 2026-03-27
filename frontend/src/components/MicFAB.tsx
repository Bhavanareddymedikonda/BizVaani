"use client";

import { useState } from "react";
import VoiceModal from "./VoiceModal";

export default function MicFAB() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        data-mic-fab
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-14 h-14 bg-[#FF5500] text-white flex items-center justify-center shadow-xl transition-all duration-150 hover:bg-[#e04a00] active:scale-95"
        aria-label="Ask BizVaani"
        style={{ borderRadius: 0 }}
      >
        <span className="text-xl">🎙️</span>
      </button>

      <VoiceModal open={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
