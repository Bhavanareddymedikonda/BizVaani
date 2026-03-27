"use client";

// ============================================================
// Landing Page — Task: Member B
// See: APP_FLOW.md (Flow 1), FRONTEND_GUIDELINES.md (Section 4)
// ============================================================

import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-orange-500 to-white px-6">
      {/* Logo / Brand */}
      <h1 className="text-5xl font-bold text-white mb-3">BizVaani</h1>
      <p className="text-xl text-white/90 mb-12 text-center">
        Your AI Business Coach
      </p>

      {/* Primary CTA */}
      <Link
        href="/onboard"
        className="px-8 py-4 bg-white text-orange-600 font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
      >
        Get Started
      </Link>

      {/* Tagline */}
      <p className="mt-8 text-sm text-white/70 text-center max-w-sm">
        Voice-first intelligence for kirana stores. Ask questions, get answers —
        no typing needed.
      </p>
    </main>
  );
}
