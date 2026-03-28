"use client";

// ============================================================
// Dashboard Page — Task: Member C
// See: APP_FLOW.md (Flow 2, 3), FRONTEND_GUIDELINES.md (Section 4)
// ============================================================

import { useEffect, useState } from "react";
import { getDashboard } from "@/lib/api";
import { useShopStore } from "@/store/useShopStore";
import ProductCard from "@/components/ProductCard";
import AlertCard from "@/components/AlertCard";
import BottomNav from "@/components/BottomNav";
import MicFAB from "@/components/MicFAB";

export default function DashboardPage() {
  const { shop, products, alerts, totalToday, isLoading, setDashboardData, setLoading } = useShopStore();
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
        const data = await getDashboard();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setDashboardData(data as any);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      }
    }
    load();
  }, [setDashboardData, setLoading]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse space-y-3 w-64">
          <div className="h-5 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </main>
    );
  }

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
      {/* Header */}
      <header className="bg-white px-4 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">Good morning</p>
          <h1 className="text-xl font-bold text-gray-900">{shop?.shop_name || "My Shop"}</h1>
        </div>
        <button 
          onClick={toggleTheme}
          className="theme-toggle"
          aria-label="Toggle theme"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        />
      </header>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-6">
        {/* Stats Row */}
        {totalToday && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
              <p className="text-2xl font-bold text-gray-900">₹{totalToday.revenue.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Revenue</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
              <p className="text-2xl font-bold text-gray-900">{totalToday.items_sold}</p>
              <p className="text-xs text-gray-500 mt-1">Items Sold</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
              <p className="text-2xl font-bold text-green-600">₹{totalToday.profit_estimate.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Est. Profit</p>
            </div>
          </div>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Alerts</h2>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </section>
        )}

        {/* Products */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Top Products</h2>
          <div className="space-y-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </div>

      <MicFAB />
      <BottomNav active="dashboard" />
    </main>
  );
}
