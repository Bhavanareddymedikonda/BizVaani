"use client";

// ============================================================
// Forecast Page — Task: Member D
// See: APP_FLOW.md (Flow 2), BizVaani_Developer_Reference.md (Section 7)
// ============================================================

import { useState, useEffect } from "react";
import { getForecast } from "@/lib/api";
import ForecastChart from "@/components/ForecastChart";
import ImpactCard from "@/components/ImpactCard";
import BottomNav from "@/components/BottomNav";
import MicFAB from "@/components/MicFAB";

const PRODUCTS = ["Rice", "Dal", "Sugar", "Cooking Oil", "Atta"];

export default function ForecastPage() {
  const [selected, setSelected] = useState("Rice");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getForecast(selected);
        setForecast(data);
      } catch (err) {
        console.error("Failed to load forecast:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selected]);

  return (
    <div className="min-h-screen selection:bg-[#f97316] selection:text-white font-sans md:pl-64 pb-24 md:pb-0">
      <header className="px-4 md:px-8 py-6 sticky top-0 z-30 bg-[#fff8eb]/80 backdrop-blur-md border-b-2 border-dashed border-[#e5dacc]">
        <h1 className="text-2xl font-black tracking-wide text-[#4a2d12] uppercase">
          Demand <span className="text-[#f97316]">Forecast</span>
        </h1>
      </header>

      <main className="px-4 md:px-8 max-w-7xl mx-auto py-6 space-y-6">
        {/* Product Selector */}
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full max-w-md px-5 py-3 rounded-2xl bg-white/70 border-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] text-[#4a2d12] font-bold text-lg focus:outline-none focus:ring-2 focus:ring-[#f97316]/40 appearance-none"
        >
          {PRODUCTS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {/* Chart */}
        {loading ? (
          <div className="h-64 clay-card animate-pulse" />
        ) : forecast ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <ForecastChart data={forecast.forecast_7d} productName={forecast.product_name} />
              {forecast.is_anomaly && (
                <div className="bg-red-50/80 border border-red-200 rounded-2xl p-4 text-sm font-bold text-red-700 shadow-[inset_1px_1px_3px_rgba(255,255,255,0.8),1px_1px_3px_rgba(0,0,0,0.05)]">
                  ⚠️ Anomaly detected: {forecast.anomaly_pct.toFixed(1)}% deviation from expected
                </div>
              )}
            </div>

            {/* Profit Simulator */}
            <div>
              <ImpactCard />
            </div>
          </div>
        ) : null}
      </main>

      <MicFAB />
      <BottomNav />
    </div>
  );
}
