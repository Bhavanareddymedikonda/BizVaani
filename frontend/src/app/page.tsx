"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const TICKER_ITEMS = [
  "7-DAY DEMAND FORECAST",
  "VOICE IN HINDI",
  "GST INVOICE GENERATOR",
  "RISK ALERTS DAILY",
  "MARKET PRICE TRACKER",
  "ML-POWERED INSIGHTS",
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <main
      className="min-h-screen bg-[#0A0A0A] text-white overflow-hidden"
      style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
    >
      {/* —— TICKER TAPE —— */}
      <div className="border-b border-[#FF5500]/40 bg-[#FF5500]/8 overflow-hidden py-2">
        <div
          ref={tickerRef}
          className="flex gap-8 whitespace-nowrap"
          style={{
            animation: "ticker 18s linear infinite",
            willChange: "transform",
          }}
        >
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="text-xs font-bold text-[#FF5500] tracking-[0.2em] uppercase">
              ◆ {item}
            </span>
          ))}
        </div>
      </div>

      {/* —— HERO —— */}
      <section className="relative px-5 pt-10 pb-0 max-w-[420px] mx-auto">
        {/* Overline label */}
        <p
          className="text-[10px] font-bold tracking-[0.3em] text-[#FF5500] mb-6 uppercase"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "none" : "translateY(8px)",
            transition: "opacity 0.4s ease 0.1s, transform 0.4s ease 0.1s",
          }}
        >
          AI Business Coach · Kirana Edition
        </p>

        {/* Giant broken headline — topological betrayal */}
        <div className="relative">
          <h1
            className="text-[72px] font-black leading-[0.9] tracking-[-3px] text-white uppercase"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "none" : "translateY(24px)",
              transition: "opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s",
            }}
          >
            BIZ
            <br />
            <span className="text-[#FF5500]">VAA</span>
            <br />
            NI.
          </h1>

          {/* Accent block — overlapping the type */}
          <div
            className="absolute top-4 right-0 w-1 h-24 bg-[#FF5500]"
            style={{
              opacity: mounted ? 1 : 0,
              transition: "opacity 0.6s ease 0.4s",
            }}
          />
        </div>

        {/* Sub copy — staccato, not fluffy */}
        <p
          className="mt-8 text-sm leading-relaxed text-white/60 max-w-[260px]"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "none" : "translateY(12px)",
            transition: "opacity 0.5s ease 0.35s, transform 0.5s ease 0.35s",
          }}
        >
          Ask why sales dropped.<br />
          Get the answer in Hindi.<br />
          Know what to do next.
        </p>

        {/* CTA — sharp, no radius */}
        <div
          className="mt-8 flex flex-col gap-3"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "none" : "translateY(12px)",
            transition: "opacity 0.5s ease 0.45s, transform 0.5s ease 0.45s",
          }}
        >
          <Link
            href="/onboard"
            className="group w-full py-4 px-6 bg-[#FF5500] text-black font-black text-sm tracking-[0.15em] uppercase text-center transition-all duration-150 hover:bg-white hover:text-black active:scale-[0.97]"
            style={{ letterSpacing: "0.15em" }}
          >
            Start Free
            <span className="inline-block ml-2 transition-transform duration-150 group-hover:translate-x-1">→</span>
          </Link>
          <Link
            href="/dashboard"
            className="w-full py-4 px-6 border border-white/20 text-white/70 font-bold text-sm tracking-widest uppercase text-center transition-all duration-150 hover:border-[#FF5500] hover:text-[#FF5500] active:scale-[0.97]"
          >
            View Demo
          </Link>
        </div>

        {/* Proof line */}
        <p className="mt-5 text-[10px] text-white/30 tracking-widest uppercase">
          No credit card · Works on any phone
        </p>
      </section>

      {/* —— RULE LINE —— */}
      <div className="max-w-[420px] mx-auto px-5 mt-12">
        <div className="h-px bg-white/10" />
      </div>

      {/* —— STATS — stark numbers, no cards —— */}
      <section className="max-w-[420px] mx-auto px-5 py-10">
        <p className="text-[10px] font-bold tracking-[0.3em] text-white/30 uppercase mb-6">By the numbers</p>
        <div className="space-y-0">
          {[
            { n: "7", label: "days demand forecast" },
            { n: "94%", label: "prediction accuracy" },
            { n: "11", label: "Indian languages" },
            { n: "<2s", label: "voice response time" },
          ].map((s, i) => (
            <div
              key={s.label}
              className="flex items-baseline justify-between py-4 border-b border-white/8"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "none" : "translateX(-8px)",
                transition: `opacity 0.5s ease ${0.5 + i * 0.1}s, transform 0.5s ease ${0.5 + i * 0.1}s`,
              }}
            >
              <span className="text-5xl font-black text-[#FF5500] tabular-nums">{s.n}</span>
              <span className="text-xs text-white/40 uppercase tracking-[0.15em] text-right max-w-[120px]">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* —— FEATURE LIST — no grid, stacked rows —— */}
      <section className="bg-white text-[#0A0A0A] px-5 py-10 max-w-[420px] mx-auto">
        <p className="text-[10px] font-bold tracking-[0.3em] text-black/30 uppercase mb-6">What it does</p>
        {[
          { icon: "🎙️", a: "Ask by voice", b: "Hindi · English · Regional" },
          { icon: "📈", a: "7-day forecast", b: "XGBoost ML on your data" },
          { icon: "⚠️", a: "Risk alerts", b: "Before sales actually drop" },
          { icon: "📄", a: "GST invoices", b: "PDF in one tap, auto-filled" },
          { icon: "🏪", a: "Market prices", b: "Mandi rates · Agmarknet live" },
        ].map((f, i) => (
          <div
            key={f.a}
            className="flex items-center gap-4 py-4 border-b border-black/8 last:border-0"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "none" : "translateY(8px)",
              transition: `opacity 0.5s ease ${0.6 + i * 0.08}s, transform 0.5s ease ${0.6 + i * 0.08}s`,
            }}
          >
            <span className="text-2xl w-8 shrink-0">{f.icon}</span>
            <div>
              <p className="font-black text-sm uppercase tracking-wide">{f.a}</p>
              <p className="text-xs text-black/40 mt-0.5">{f.b}</p>
            </div>
            <span className="ml-auto text-black/20 text-sm">→</span>
          </div>
        ))}
      </section>

      {/* —— BOTTOM CTA BLOCK —— */}
      <section className="bg-[#FF5500] px-5 py-10 max-w-[420px] mx-auto">
        <p className="text-[10px] font-bold tracking-[0.3em] text-black/50 uppercase mb-3">Ready?</p>
        <p className="text-3xl font-black text-black leading-tight mb-6 uppercase">
          Your shop.<br />Smarter.
        </p>
        <Link
          href="/onboard"
          className="block w-full py-4 bg-black text-white font-black text-sm tracking-[0.2em] uppercase text-center transition-all duration-150 hover:bg-[#0A0A0A] active:scale-[0.97]"
        >
          Get Started →
        </Link>
      </section>

      <style jsx global>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </main>
  );
}
