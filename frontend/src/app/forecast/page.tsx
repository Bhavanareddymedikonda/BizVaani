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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
    <main className="min-h-screen bg-gray-50 pb-24">
      <style>{`
        .theme-toggle {
          background: var(--card-bg, #f3f5f9);
          border: 1px solid var(--card-bg, #f3f5f9);
          width: 50px;
          height: 28px;
          border-radius: 14px;
          cursor: pointer;
          position: relative;
          transition: background 0.3s ease, border-color 0.3s ease;
          padding: 2px;
          display: flex;
          align-items: center;
          box-shadow: inset 2px 2px 4px var(--clay-inset-shadow), inset -2px -2px 4px var(--clay-inset-high);
        }

        .theme-toggle::after {
          content: '';
          position: absolute;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0066ff 0%, #5b21b6 100%);
          transition: left 0.3s ease;
          left: 2px;
          box-shadow: 0 2px 8px rgba(0, 102, 255, 0.3);
        }

        [data-theme="dark"] .theme-toggle::after {
          background: linear-gradient(135deg, #00d4ff 0%, #6d28d9 100%);
          box-shadow: 0 2px 8px rgba(0, 212, 255, 0.3);
        }

        .theme-toggle:hover {
          border-color: var(--accent);
          box-shadow: 0 0 15px rgba(0, 102, 255, 0.2), inset 2px 2px 4px var(--clay-inset-shadow);
        }

        [data-theme="dark"] .theme-toggle:hover {
          box-shadow: 0 0 15px rgba(0, 212, 255, 0.2), inset 2px 2px 4px var(--clay-inset-shadow);
        }
      `}</style>
      <header className="bg-white px-4 py-4 border-b border-gray-200 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Demand Forecast</h1>
        <button 
          onClick={toggleTheme}
          className="theme-toggle"
          aria-label="Toggle theme"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        />
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
