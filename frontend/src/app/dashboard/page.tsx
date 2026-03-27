"use client";

// ============================================================
// Dashboard Page — Task: Member C
// See: APP_FLOW.md (Flow 2, 3), FRONTEND_GUIDELINES.md (Section 4)
// ============================================================

import { useEffect } from "react";
import { getDashboard } from "@/lib/api";
import { useShopStore } from "@/store/useShopStore";
import ProductCard from "@/components/ProductCard";
import AlertCard from "@/components/AlertCard";
import BottomNav from "@/components/BottomNav";
import MicFAB from "@/components/MicFAB";

export default function DashboardPage() {
  const { shop, products, alerts, totalToday, isLoading, setDashboardData, setLoading } = useShopStore();

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
      {/* Header */}
      <header className="bg-white px-4 py-4 border-b border-gray-200">
        <p className="text-sm text-gray-500">Good morning</p>
        <h1 className="text-xl font-bold text-gray-900">{shop?.shop_name || "My Shop"}</h1>
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
