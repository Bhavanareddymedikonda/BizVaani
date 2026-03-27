"use client";

import { useState, useEffect } from "react";
import { getForecast } from "@/lib/api";
import { useShopStore } from "@/store/useShopStore";
import ForecastChart from "@/components/ForecastChart";
import ImpactCard from "@/components/ImpactCard";
import BottomNav from "@/components/BottomNav";
import MicFAB from "@/components/MicFAB";

interface ForecastData {
  product_name: string;
  forecast_7d: { date: string; predicted_qty: number; lower_bound: number; upper_bound: number }[];
  is_anomaly: boolean;
  anomaly_pct: number;
  risk_level: "HIGH" | "MEDIUM" | "LOW";
}

export default function ForecastPage() {
  const { products } = useShopStore();

  // Use products from store; fall back to a numeric id selector
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-select first product
  useEffect(() => {
    if (products.length > 0 && selectedId === null) {
      setSelectedId(products[0].id);
    }
  }, [products, selectedId]);

  useEffect(() => {
    if (selectedId === null) return;
    async function load() {
      setLoading(true);
      setForecast(null);
      try {
        const data = await getForecast(selectedId!);
        setForecast(data as ForecastData);
      } catch (err) {
        console.error("Failed to load forecast:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedId]);

  const RISK_COLORS: Record<string, string> = {
    HIGH: "border-red-500 text-red-600 bg-red-50",
    MEDIUM: "border-amber-400 text-amber-700 bg-amber-50",
    LOW: "border-green-500 text-green-700 bg-green-50",
  };

  return (
    <main
      className="min-h-screen bg-[#F7F5F0] pb-24"
      style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
    >
      <header className="bg-white px-5 py-5 border-b border-black/5">
        <p className="text-[10px] font-bold tracking-[0.3em] text-black/30 uppercase">Forecast</p>
        <h1 className="text-xl font-black text-[#0A0A0A] mt-1 uppercase tracking-tight">
          7-Day Demand
        </h1>
      </header>

      <div className="px-5 py-5 max-w-lg mx-auto space-y-5">
        {/* Product selector — uses product IDs from store */}
        {products.length > 0 ? (
          <div className="bg-white border-2 border-black/8">
            <select
              value={selectedId ?? ""}
              onChange={(e) => setSelectedId(Number(e.target.value))}
              className="w-full px-4 py-3 text-sm font-bold uppercase tracking-wide bg-transparent outline-none text-[#0A0A0A] appearance-none cursor-pointer"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.product_name ?? p.name ?? `Product ${p.id}`}
                </option>
              ))}
            </select>
          </div>
        ) : (
          /* Fallback numeric selector when store not yet loaded */
          <div className="bg-white border-2 border-black/8">
            <select
              value={selectedId ?? 1}
              onChange={(e) => setSelectedId(Number(e.target.value))}
              className="w-full px-4 py-3 text-sm font-bold bg-transparent outline-none text-[#0A0A0A]"
            >
              {[1, 2, 3, 4, 5].map((id) => (
                <option key={id} value={id}>
                  Product {id}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            <div className="h-48 bg-black/5 animate-pulse" />
            <div className="h-24 bg-black/5 animate-pulse" />
          </div>
        )}

        {/* Forecast content */}
        {!loading && forecast && (
          <>
            {/* Risk badge */}
            {forecast.risk_level && (
              <div
                className={`border-2 px-4 py-2 flex items-center justify-between ${RISK_COLORS[forecast.risk_level] ?? ""}`}
              >
                <span className="text-xs font-black uppercase tracking-widest">
                  {forecast.risk_level === "HIGH" ? "🚨" : forecast.risk_level === "MEDIUM" ? "⚠️" : "✅"}{" "}
                  Risk: {forecast.risk_level}
                </span>
                {forecast.is_anomaly && (
                  <span className="text-xs font-bold">
                    {Math.abs(forecast.anomaly_pct).toFixed(1)}% off forecast
                  </span>
                )}
              </div>
            )}

            {/* Chart */}
            <div className="bg-white border-2 border-black/8 p-4">
              <ForecastChart
                data={forecast.forecast_7d}
                productName={forecast.product_name}
              />
            </div>

            {/* Anomaly detail */}
            {forecast.is_anomaly && (
              <div className="border-2 border-red-200 bg-red-50 px-4 py-3">
                <p className="text-xs font-black text-red-700 uppercase tracking-widest mb-1">
                  Anomaly Detected
                </p>
                <p className="text-sm text-red-600">
                  Sales are {Math.abs(forecast.anomaly_pct).toFixed(1)}% below expected.
                  Ask BizVaani for the cause.
                </p>
              </div>
            )}

            {/* Profit Simulator */}
            <ImpactCard />
          </>
        )}

        {!loading && !forecast && selectedId !== null && (
          <div className="border-2 border-dashed border-black/10 py-16 text-center">
            <p className="text-sm text-black/30">No forecast data yet.</p>
            <p className="text-xs text-black/20 mt-1">Log at least 7 days of sales to unlock.</p>
          </div>
        )}
      </div>

      <MicFAB />
      <BottomNav active="forecast" />
    </main>
  );
}
