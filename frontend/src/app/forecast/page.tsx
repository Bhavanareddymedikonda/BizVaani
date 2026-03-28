"use client";

// ============================================================
// Demand Forecast Page
// Data flow: API → if unavailable → deterministic seed data
// NO random data is ever generated.
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { getForecast } from "@/lib/api";
import {
  SEED_FORECASTS,
  type ProductForecast,
  type ForecastPoint,
} from "@/lib/forecastSeedData";
import ForecastChart from "@/components/ForecastChart";
import ImpactCard from "@/components/ImpactCard";
import BottomNav from "@/components/BottomNav";
import MicFAB from "@/components/MicFAB";

const PRODUCTS = ["Rice", "Dal", "Sugar", "Cooking Oil", "Atta"];

export default function ForecastPage() {
  const [selected, setSelected] = useState("Rice");
  const [forecast, setForecast] = useState<ProductForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingSeeded, setUsingSeeded] = useState(false);

  const loadForecast = useCallback(async (product: string) => {
    setLoading(true);
    setUsingSeeded(false);

    try {
      const apiData = await getForecast(product);
      // Validate that the API returned usable forecast data
      const d = apiData as Record<string, unknown>;
      if (
        d &&
        typeof d === "object" &&
        Array.isArray(d.forecast_7d) &&
        d.forecast_7d.length > 0
      ) {
        setForecast({
          product_name: (d.product_name as string) || product,
          expected_demand: (d.expected_demand as number) || 0,
          trend_7d_pct: (d.trend_7d_pct as number) || 0,
          confidence_pct: (d.confidence_pct as number) || 0,
          market_label: (d.market_label as string) || "N/A",
          is_anomaly: (d.is_anomaly as boolean) || false,
          anomaly_pct: (d.anomaly_pct as number) || 0,
          forecast_7d: d.forecast_7d as ForecastPoint[],
        });
      } else {
        // API returned data without forecast_7d — fall back to seed
        throw new Error("Incomplete API response");
      }
    } catch {
      // Fall back to deterministic seed data — never random
      const seed = SEED_FORECASTS[product] ?? SEED_FORECASTS["Rice"];
      setForecast(seed);
      setUsingSeeded(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadForecast(selected);
  }, [selected, loadForecast]);

  // Computed values from the forecast
  const trendIsPositive = (forecast?.trend_7d_pct ?? 0) >= 0;
  const trendAbs = Math.abs(forecast?.trend_7d_pct ?? 0);
  const confidencePct = forecast?.confidence_pct ?? 0;

  return (
    <div className="min-h-screen pb-24 pt-20 font-sans selection:bg-[#c084fc] selection:text-white md:pb-0 md:pt-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="mb-6 flex flex-col justify-between px-4 py-6 md:ml-20 md:flex-row md:items-center md:px-12">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-wide text-white">
            Demand{" "}
            <span className="text-[#c084fc]">Forecast</span>
          </h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[#c084fc]/60">
            AI-powered demand prediction for your top products
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 md:ml-20 md:px-12">
        {/* ── Product Selector Pills ──────────────────────── */}
        <div className="mb-8 flex flex-wrap gap-3">
          {PRODUCTS.map((p) => (
            <button
              key={p}
              onClick={() => setSelected(p)}
              className={`rounded-2xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 sm:text-sm ${
                selected === p
                  ? "border border-[#c084fc]/30 bg-gradient-to-r from-[#9333ea] to-[#4c1d95] text-white shadow-[0_4px_16px_rgba(147,51,234,0.3)]"
                  : "border border-white/10 bg-white/5 text-[#c084fc]/60 hover:bg-white/10 hover:text-[#c084fc]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid animate-pulse gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="advanced-card h-28 opacity-40"
                  />
                ))}
              </div>
              <div className="advanced-card h-[400px] opacity-40" />
            </div>
            <div className="advanced-card h-[400px] opacity-40" />
          </div>
        ) : forecast ? (
          <>
            {/* ── Seeded data banner ──────────────────────── */}
            {usingSeeded && (
              <div className="mb-6 rounded-2xl border border-[#c084fc]/20 bg-[#c084fc]/5 px-4 py-3 text-xs font-medium text-[#c084fc]/80 backdrop-blur-sm">
                📊 Showing seeded demo data — connect your backend at{" "}
                <span className="font-bold text-[#c084fc]">
                  /api/forecast
                </span>{" "}
                for live predictions
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              {/* ── Left Column ────────────────────────────── */}
              <div className="space-y-6">
                {/* ── Stat Cards Row ──────────────────────── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {/* Expected Demand */}
                  <div className="advanced-card group flex flex-col justify-center p-5 transition-all hover:-translate-y-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c084fc]/50">
                      Expected Demand
                    </p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-4xl font-black tracking-tight text-white">
                        {forecast.expected_demand}
                      </span>
                      <span className="text-sm font-bold text-white/40">
                        kg
                        <span className="text-white/25"> /day</span>
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5">
                      <span className="text-lg">🛡️</span>
                      <span className="text-xs font-semibold text-[#4ade80]">
                        {forecast.market_label}
                      </span>
                    </div>
                  </div>

                  {/* Trend (7D) */}
                  <div className="advanced-card group flex flex-col justify-center p-5 transition-all hover:-translate-y-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c084fc]/50">
                      Trend (7D)
                    </p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span
                        className={`text-4xl font-black tracking-tight ${
                          trendIsPositive ? "text-[#4ade80]" : "text-[#f87171]"
                        }`}
                      >
                        {trendIsPositive ? "+" : "-"}
                        {trendAbs.toFixed(1)}%
                      </span>
                      <span
                        className={`text-lg ${
                          trendIsPositive ? "text-[#4ade80]" : "text-[#f87171]"
                        }`}
                      >
                        {trendIsPositive ? "↗" : "↘"}
                      </span>
                    </div>
                    {/* Mini trend bar */}
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(100, Math.max(10, 50 + (forecast.trend_7d_pct ?? 0) * 3))}%`,
                          background: trendIsPositive
                            ? "linear-gradient(90deg, #4ade80, #22c55e)"
                            : "linear-gradient(90deg, #f87171, #ef4444)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Confidence */}
                  <div className="advanced-card group flex flex-col justify-center p-5 transition-all hover:-translate-y-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c084fc]/50">
                      Confidence
                    </p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-4xl font-black tracking-tight text-white">
                        {confidencePct}%
                      </span>
                      <span className="text-lg">
                        {confidencePct >= 90
                          ? "🟢"
                          : confidencePct >= 75
                            ? "🟡"
                            : "🔴"}
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-medium text-white/30">
                      {confidencePct >= 90
                        ? "High accuracy for staples"
                        : confidencePct >= 75
                          ? "Moderate — more data helps"
                          : "Low — volatile category"}
                    </p>
                  </div>
                </div>

                {/* ── Demand Trajectory Chart ─────────────── */}
                <ForecastChart
                  data={forecast.forecast_7d}
                  productName={forecast.product_name}
                />

                {/* ── Anomaly Alert ───────────────────────── */}
                {forecast.is_anomaly && (
                  <div className="advanced-card flex items-center gap-3 border border-red-500/20 !bg-red-500/5 p-4 backdrop-blur-xl">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/20">
                      <span className="text-sm">⚠️</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-red-400">
                        Anomaly Detected
                      </p>
                      <p className="text-xs text-red-300/70">
                        {forecast.anomaly_pct.toFixed(1)}% deviation from
                        expected pattern — review pricing or stock levels
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Right Column: Profit Simulator ─────────── */}
              <div className="space-y-6">
                <ImpactCard />

                {/* Impact Analysis Summary */}
                <div className="advanced-card p-6 text-center">
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#c084fc]/20 bg-[#c084fc]/5 px-3 py-1">
                    <span className="text-xs">📈</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#c084fc]">
                      Impact Analysis
                    </span>
                  </div>
                  <p className="mt-3 text-4xl font-black text-[#4ade80] drop-shadow-[0_0_12px_rgba(74,222,128,0.3)]">
                    +₹{(forecast.expected_demand * 6.8).toFixed(0)}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                    Next 7 Days Projected Change
                  </p>

                  {/* Mini bar comparison */}
                  <div className="mx-auto mt-5 flex max-w-[200px] items-end justify-center gap-6">
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className="w-14 rounded-lg bg-white/10"
                        style={{ height: "50px" }}
                      />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">
                        Current
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className="w-14 rounded-lg bg-gradient-to-t from-[#4ade80] to-[#22c55e]"
                        style={{ height: "68px" }}
                      />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#4ade80]">
                        Projected
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="advanced-card flex h-64 items-center justify-center">
            <p className="text-sm text-white/40">
              No forecast data available
            </p>
          </div>
        )}
      </main>

      <MicFAB />
      <BottomNav />
    </div>
  );
}
