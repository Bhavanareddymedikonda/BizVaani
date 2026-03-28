"use client";

import { useCallback, useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import ForecastChart from "@/components/ForecastChart";
import ImpactCard from "@/components/ImpactCard";
import MicFAB from "@/components/MicFAB";
import { getForecast, getInventory, type InventoryItem } from "@/lib/api";
import { SEED_FORECASTS, type ProductForecast } from "@/lib/forecastSeedData";

function buildForecastFromApi(
  product: InventoryItem,
  apiData: Record<string, unknown>,
): ProductForecast | null {
  if (!Array.isArray(apiData.forecast_7d) || apiData.forecast_7d.length === 0) {
    return null;
  }

  const points = (apiData.forecast_7d as Array<Record<string, unknown>>).map((point) => ({
    date: String(point.date ?? ""),
    forecast: Number(point.predicted_qty ?? 0),
    lower_bound: Number(point.lower_bound ?? 0),
    upper_bound: Number(point.upper_bound ?? 0),
  }));

  const expectedDemand =
    points.reduce((sum, point) => sum + (point.forecast ?? 0), 0) / Math.max(points.length, 1);
  const firstQty = points[0]?.forecast ?? expectedDemand;
  const lastQty = points[points.length - 1]?.forecast ?? expectedDemand;
  const trend7dPct = firstQty ? ((lastQty - firstQty) / firstQty) * 100 : 0;
  const boundedPoints = points.filter((point) => (point.forecast ?? 0) > 0);
  const avgBandRatio =
    boundedPoints.length > 0
      ? boundedPoints.reduce((sum, point) => {
          const width = (point.upper_bound ?? 0) - (point.lower_bound ?? 0);
          return sum + width / Math.max(point.forecast ?? 1, 1);
        }, 0) / boundedPoints.length
      : 0.3;
  const confidencePct = Math.max(55, Math.min(96, Math.round(100 - avgBandRatio * 35)));
  const isAnomaly = Boolean(apiData.is_anomaly);
  const anomalyPct = Number(apiData.anomaly_pct ?? 0);

  return {
    product_name: String(apiData.product_name ?? product.name),
    expected_demand: Math.round(expectedDemand * 10) / 10,
    trend_7d_pct: Math.round(trend7dPct * 10) / 10,
    confidence_pct: confidencePct,
    market_label: isAnomaly
      ? "Demand risk detected"
      : trend7dPct >= 8
        ? "Rising demand"
        : trend7dPct <= -8
          ? "Soft demand"
          : "Stable market",
    is_anomaly: isAnomaly,
    anomaly_pct: anomalyPct,
    forecast_7d: points,
  };
}

export default function ForecastPage() {
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [forecast, setForecast] = useState<ProductForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [usingSeeded, setUsingSeeded] = useState(false);

  const selectedProduct = products.find((product) => product.id === selectedId) ?? null;

  const loadForecast = useCallback(async (product: InventoryItem) => {
    setLoading(true);
    setUsingSeeded(false);

    try {
      const apiData = (await getForecast(product.id)) as Record<string, unknown>;
      const normalized = buildForecastFromApi(product, apiData);
      if (!normalized) {
        throw new Error("Incomplete API response");
      }
      setForecast(normalized);
    } catch {
      const seed = SEED_FORECASTS[product.name];
      if (seed) {
        setForecast(seed);
        setUsingSeeded(true);
      } else {
        setForecast(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function loadProducts() {
      setInventoryLoading(true);
      try {
        const inventory = await getInventory();
        setProducts(inventory);
        setSelectedId((current) => current ?? inventory[0]?.id ?? null);
      } catch (error) {
        console.error("Failed to fetch inventory for forecast:", error);
        setProducts([]);
        setSelectedId(null);
      } finally {
        setInventoryLoading(false);
      }
    }

    void loadProducts();
  }, []);

  useEffect(() => {
    if (!selectedProduct) {
      setForecast(null);
      setLoading(false);
      return;
    }
    void loadForecast(selectedProduct);
  }, [selectedProduct, loadForecast]);

  const trendIsPositive = (forecast?.trend_7d_pct ?? 0) >= 0;
  const trendAbs = Math.abs(forecast?.trend_7d_pct ?? 0);
  const confidencePct = forecast?.confidence_pct ?? 0;

  return (
    <div className="min-h-screen pb-24 pt-20 font-sans selection:bg-[#c084fc] selection:text-white md:pb-0 md:pt-6">
      <header className="mb-6 flex flex-col justify-between px-4 py-6 md:flex-row md:items-center md:px-12">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-wide text-white">
            Demand <span className="text-[#c084fc]">Forecast</span>
          </h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[#c084fc]/60">
            AI-powered demand prediction for your inventory products
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 md:px-12">
        {inventoryLoading ? (
          <div className="advanced-card flex h-40 items-center justify-center">
            <p className="text-sm text-white/40">Loading inventory products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="advanced-card flex h-40 items-center justify-center">
            <p className="text-sm text-white/40">No inventory products available for forecasting.</p>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-wrap gap-3">
              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => setSelectedId(product.id)}
                  className={`rounded-2xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 sm:text-sm ${
                    selectedId === product.id
                      ? "border border-[#c084fc]/30 bg-gradient-to-r from-[#9333ea] to-[#4c1d95] text-white shadow-[0_4px_16px_rgba(147,51,234,0.3)]"
                      : "border border-white/10 bg-white/5 text-[#c084fc]/60 hover:bg-white/10 hover:text-[#c084fc]"
                  }`}
                >
                  {product.name}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="grid animate-pulse gap-6 lg:grid-cols-[1fr_360px]">
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="advanced-card h-28 opacity-40" />
                    ))}
                  </div>
                  <div className="advanced-card h-[400px] opacity-40" />
                </div>
                <div className="advanced-card h-[400px] opacity-40" />
              </div>
            ) : forecast ? (
              <>
                {usingSeeded && (
                  <div className="mb-6 rounded-2xl border border-[#c084fc]/20 bg-[#c084fc]/5 px-4 py-3 text-xs font-medium text-[#c084fc]/80 backdrop-blur-sm">
                    Showing seeded fallback data for this inventory product because live forecast rows are not ready yet.
                  </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="advanced-card group flex flex-col justify-center p-5 transition-all hover:-translate-y-0.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c084fc]/50">
                          Expected Demand
                        </p>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-4xl font-black tracking-tight text-white">
                            {forecast.expected_demand}
                          </span>
                          <span className="text-sm font-bold text-white/40">
                            {selectedProduct?.unit ?? "unit"}
                            <span className="text-white/25"> /day</span>
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-[#4ade80]">
                            {forecast.market_label}
                          </span>
                        </div>
                      </div>

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
                        </div>
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

                      <div className="advanced-card group flex flex-col justify-center p-5 transition-all hover:-translate-y-0.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c084fc]/50">
                          Confidence
                        </p>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-4xl font-black tracking-tight text-white">
                            {confidencePct}%
                          </span>
                        </div>
                        <p className="mt-3 text-xs font-medium text-white/30">
                          {confidencePct >= 90
                            ? "High accuracy for staples"
                            : confidencePct >= 75
                              ? "Moderate confidence"
                              : "Low confidence, more data helps"}
                        </p>
                      </div>
                    </div>

                    <ForecastChart data={forecast.forecast_7d} productName={forecast.product_name} />

                    {forecast.is_anomaly && (
                      <div className="advanced-card flex items-center gap-3 border border-red-500/20 !bg-red-500/5 p-4 backdrop-blur-xl">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/20">
                          <span className="text-sm">!</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-red-400">Anomaly Detected</p>
                          <p className="text-xs text-red-300/70">
                            {forecast.anomaly_pct.toFixed(1)}% deviation from expected pattern.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <ImpactCard />

                    <div className="advanced-card p-6 text-center">
                      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#c084fc]/20 bg-[#c084fc]/5 px-3 py-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#c084fc]">
                          Impact Analysis
                        </span>
                      </div>
                      <p className="mt-3 text-4xl font-black text-[#4ade80] drop-shadow-[0_0_12px_rgba(74,222,128,0.3)]">
                        +Rs.{(forecast.expected_demand * 6.8).toFixed(0)}
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                        Next 7 Days Projected Change
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="advanced-card flex h-64 items-center justify-center">
                <p className="text-sm text-white/40">
                  No forecast data available for this inventory product yet.
                </p>
              </div>
            )}
          </>
        )}
      </main>

      <MicFAB />
      <BottomNav />
    </div>
  );
}
