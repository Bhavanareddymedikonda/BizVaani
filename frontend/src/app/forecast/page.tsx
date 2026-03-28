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
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

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
    <div className="min-h-screen selection:bg-[#c084fc] selection:text-white font-sans pb-24 md:pb-0 pt-20 md:pt-6">
      <header className="px-4 md:px-12 py-6 mb-4 flex flex-col md:flex-row md:items-center justify-between md:ml-20">
        <h1 className="text-3xl font-black tracking-wide text-white uppercase">
          Demand <span className="text-[#c084fc]">Forecast</span>
        </h1>
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          className="w-12 h-7 rounded-full bg-white/5 border border-white/10 relative flex items-center p-1 cursor-pointer transition-colors hover:bg-[#c084fc]/20 mt-4 md:mt-0"
        >
          <span
            className="w-5 h-5 rounded-full bg-gradient-to-br from-[#9333ea] to-[#c084fc] shadow-[0_0_8px_rgba(192,132,252,0.6)] block transition-transform"
            style={{ transform: theme === 'dark' ? 'translateX(0)' : 'translateX(20px)' }}
          />
        </button>
      </header>

      <main className="px-4 md:px-12 max-w-7xl mx-auto md:ml-20 py-2 space-y-6">
        {/* Product Selector */}
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full max-w-md px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-lg focus:outline-none focus:ring-2 focus:ring-[#c084fc]/40 appearance-none backdrop-blur-md"
        >
          {PRODUCTS.map((p) => (
            <option key={p} value={p} className="bg-[#0D0914] text-white">{p}</option>
          ))}
        </select>

        {/* Chart */}
        {loading ? (
          <div className="h-64 advanced-card animate-pulse opacity-40" />
        ) : forecast ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <ForecastChart data={forecast.forecast_7d} productName={forecast.product_name} />
              {forecast.is_anomaly && (
                <div className="advanced-card bg-red-500/10 border border-red-500/30 p-4 text-sm font-bold text-red-400 backdrop-blur-xl">
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
