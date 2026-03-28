"use client";

// ============================================================
// ImpactCard (Profit Simulator) — Task: Member D
// See: FRONTEND_GUIDELINES.md (Section 4 — ₹ Impact Simulation Card)
// ============================================================

import { useState } from "react";
import { simulate } from "@/lib/api";

export default function ImpactCard() {
  const [currentPrice, setCurrentPrice] = useState(45);
  const [suggestedPrice, setSuggestedPrice] = useState(42);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await simulate({
        shop_id: 1,
        product_id: 1,
        action: "price_cut",
        current_price: currentPrice,
        suggested_price: suggestedPrice,
        avg_daily_qty: 30,
      });
      setResult(res);
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="advanced-card p-6 flex flex-col">
      <h3 className="font-extrabold text-lg text-white mb-4 uppercase tracking-wide">Profit Simulator</h3>

      <div className="grid grid-cols-2 gap-4 mb-2">
        <div>
          <label className="text-xs font-bold text-[#c084fc]/70 uppercase tracking-wider">Current (₹)</label>
          <input
            type="number"
            value={currentPrice}
            onChange={(e) => setCurrentPrice(Number(e.target.value))}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-base font-bold text-white mt-1.5 focus:outline-none focus:ring-2 focus:ring-[#c084fc]/40 transition-all"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-[#c084fc]/70 uppercase tracking-wider">New (₹)</label>
          <input
            type="number"
            value={suggestedPrice}
            onChange={(e) => setSuggestedPrice(Number(e.target.value))}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-base font-bold text-white mt-1.5 focus:outline-none focus:ring-2 focus:ring-[#c084fc]/40 transition-all"
          />
        </div>
      </div>

      <button
        onClick={handleSimulate}
        disabled={loading}
        className="advanced-btn w-full py-3.5 mt-5 disabled:opacity-50 disabled:scale-100"
      >
        {loading ? "Simulating..." : "Simulate Impact"}
      </button>

      {result && (
        <div className="mt-6 p-5 rounded-3xl bg-white/5 border border-white/10 text-center transition-all animate-in fade-in slide-in-from-bottom-4 duration-500 backdrop-blur-md">
          <p className="text-[#c084fc]/80 text-xs font-bold uppercase tracking-wider mb-2">Expected Extra Profit</p>
          <p className="text-4xl font-black text-[#4ade80] drop-shadow-[0_0_12px_rgba(74,222,128,0.3)]">₹{result.delta.toLocaleString()}</p>
          <p className="text-xs font-medium text-white/60 mt-3">{result.summary}</p>

          {/* Simple before/after */}
          <div className="flex justify-center items-center gap-6 mt-4 pt-4 border-t border-white/10">
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold text-[#c084fc]/60">Current</p>
              <p className="text-lg font-extrabold text-white">₹{result.current_profit.toLocaleString()}</p>
            </div>
            <div className="text-xl text-[#4ade80] font-bold opacity-60">→</div>
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold text-[#c084fc]/60">Projected</p>
              <p className="text-lg font-extrabold text-[#4ade80]">₹{result.projected_profit.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
