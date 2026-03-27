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
    <main className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white px-4 py-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Demand Forecast</h1>
      </header>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Product Selector */}
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base bg-white"
        >
          {PRODUCTS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {/* Chart */}
        {loading ? (
          <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
        ) : forecast ? (
          <>
            <ForecastChart data={forecast.forecast_7d} productName={forecast.product_name} />
            {forecast.is_anomaly && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                ⚠️ Anomaly detected: {forecast.anomaly_pct.toFixed(1)}% deviation from expected
              </div>
            )}

            {/* Profit Simulator */}
            <ImpactCard />
          </>
        ) : null}
      </div>

      <MicFAB />
      <BottomNav active="forecast" />
    </main>
  );
}
