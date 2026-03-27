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
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-3">Profit Simulator</h3>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs text-gray-500">Current Price (₹)</label>
          <input
            type="number"
            value={currentPrice}
            onChange={(e) => setCurrentPrice(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-200 rounded text-sm mt-1"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">New Price (₹)</label>
          <input
            type="number"
            value={suggestedPrice}
            onChange={(e) => setSuggestedPrice(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-200 rounded text-sm mt-1"
          />
        </div>
      </div>

      <button
        onClick={handleSimulate}
        disabled={loading}
        className="w-full py-2 bg-orange-500 text-white font-medium rounded-lg text-sm hover:bg-orange-600 transition-colors disabled:opacity-50"
      >
        {loading ? "Simulating..." : "Simulate Impact"}
      </button>

      {result && (
        <div className="mt-4 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-gray-600 text-sm mb-2">Expected extra profit this week</p>
          <p className="text-3xl font-bold text-green-700">₹{result.delta.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-2">{result.summary}</p>

          {/* Simple before/after */}
          <div className="flex justify-center gap-6 mt-3">
            <div>
              <p className="text-xs text-gray-500">Current</p>
              <p className="text-lg font-semibold text-gray-700">₹{result.current_profit.toLocaleString()}</p>
            </div>
            <div className="text-2xl text-green-500 self-center">→</div>
            <div>
              <p className="text-xs text-gray-500">Projected</p>
              <p className="text-lg font-semibold text-green-700">₹{result.projected_profit.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
