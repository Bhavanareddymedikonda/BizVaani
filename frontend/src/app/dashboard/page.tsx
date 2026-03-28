"use client";

import { useEffect, useState } from "react";
import { getDashboard } from "../../lib/api";
import ProductCard from "../../components/ProductCard";
import AlertCard from "../../components/AlertCard";
import BottomNav from "../../components/BottomNav";
import MicFAB from "../../components/MicFAB";

type DashboardData = {
  user?: { name?: string };
  shop?: { shop_name?: string; city?: string };
  alerts?: Array<{
    id: number;
    product_name: string;
    severity: "HIGH" | "MEDIUM" | "LOW";
    message: string;
  }>;
  top_products?: Array<{
    id: number;
    name: string;
    today_qty: number;
    today_revenue: number;
    stock_qty: number;
    stock_status: "CRITICAL" | "LOW_STOCK" | "IN_STOCK";
    unit: string;
    trend_pct: number;
    mandi_price: number;
    risk_level: "HIGH" | "MEDIUM" | "LOW";
  }>;
  total_today?: { revenue?: number; items_sold?: number; profit_estimate?: number };
  stock_summary?: { low_stock_count?: number; inventory_value?: number };
};

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await getDashboard();
        setDashboard(data);
      } catch (err) {
        console.error("Failed to fetch dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();

    const refresh = () => {
      void loadDashboard();
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === "bv_dashboard_refresh") {
        void loadDashboard();
      }
    };

    window.addEventListener("focus", refresh);
    window.addEventListener("storage", onStorage);
    const interval = window.setInterval(refresh, 15000);

    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", onStorage);
      window.clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pb-24 pt-20 font-sans selection:bg-[#c084fc] selection:text-white md:pb-0 md:pt-6">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#c084fc]/30 border-t-[#c084fc]" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center pb-24 pt-20 font-sans selection:bg-[#c084fc] selection:text-white md:pb-0 md:pt-6">
        <p className="mb-4 text-[#f87171]">Error loading dashboard data.</p>
        <button onClick={() => window.location.reload()} className="advanced-btn px-6 py-2">Retry</button>
      </div>
    );
  }

  const highOrMediumAlerts =
    dashboard.alerts?.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a: any) => a.severity === "HIGH" || a.severity === "MEDIUM",
    ) || [];

  return (
    <div className="min-h-screen pb-24 pt-20 font-sans selection:bg-[#c084fc] selection:text-white md:pb-0 md:pt-6">
      <header className="mb-4 flex flex-col justify-between px-4 py-6 md:ml-20 md:flex-row md:items-center md:px-12">
        <div>
          <h1 className="text-3xl font-black tracking-wide text-white">
            Good morning, <span className="text-[#c084fc]">{dashboard.user?.name || "Ramesh"}</span>
          </h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[#c084fc]/60">
            {dashboard.shop?.shop_name || "Ramesh Kirana Store"} | {dashboard.shop?.city || "Nagpur"}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 md:ml-20 md:px-12">
        <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 md:gap-6">
          <div className="advanced-card col-span-1 min-w-0 overflow-hidden !border-none !bg-gradient-to-br !from-[#9333ea] !to-[#4c1d95] p-5 text-white shadow-[0_8px_32px_rgba(147,51,234,0.4)] sm:col-span-2 lg:col-span-1 md:p-6">
            <h2 className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#e9d5ff] opacity-90">Total Revenue Today</h2>
            <div className="mt-2 max-w-full overflow-hidden whitespace-nowrap text-[clamp(2rem,3vw,3.8rem)] font-black leading-none tracking-[-0.08em] drop-shadow-md">
              Rs.{dashboard.total_today?.revenue?.toLocaleString() || 0}
            </div>
          </div>

          <div className="advanced-card min-w-0 overflow-hidden p-5 md:p-6">
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#c084fc]/70">Items Sold</h2>
            <div className="overflow-hidden text-[clamp(2.2rem,3.2vw,3.8rem)] font-black leading-none text-[#f3e8ff] drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]">
              {dashboard.total_today?.items_sold || 0}
            </div>
          </div>

          <div className="advanced-card min-w-0 overflow-hidden p-5 md:p-6">
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#c084fc]/70">Est. Profit</h2>
            <div className="overflow-hidden text-[clamp(2.2rem,3vw,3.4rem)] font-black leading-none text-[#4ade80] drop-shadow-[0_0_12px_rgba(74,222,128,0.4)]">
              Rs.{dashboard.total_today?.profit_estimate?.toLocaleString() || 0}
            </div>
          </div>

          <div className="advanced-card min-w-0 overflow-hidden p-5 md:p-6">
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#c084fc]/70">Low Stock SKU</h2>
            <div className="overflow-hidden text-[clamp(2.2rem,3vw,3.4rem)] font-black leading-none text-[#fbbf24]">
              {dashboard.stock_summary?.low_stock_count || 0}
            </div>
          </div>

          <div className="advanced-card min-w-0 overflow-hidden p-5 md:p-6">
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#c084fc]/70">Inventory Value</h2>
            <div className="overflow-hidden text-[clamp(2.2rem,3vw,3.4rem)] font-black leading-none text-[#60a5fa]">
              Rs.{dashboard.stock_summary?.inventory_value?.toLocaleString() || 0}
            </div>
          </div>
        </section>

        {highOrMediumAlerts.length > 0 && (
          <section className="mb-10">
            <div className="mb-6 flex w-max items-center gap-3 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-red-500 backdrop-blur-md">
              <div className="h-3 w-3 animate-pulse rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
              <h2 className="text-xs font-black uppercase tracking-widest">Action Required</h2>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
              {highOrMediumAlerts.map((alert) => (
                <AlertCard key={alert.id} productName={alert.product_name} severity={alert.severity} message={alert.message} />
              ))}
            </div>
          </section>
        )}

        <section className="mb-10">
          <div className="mb-6 flex justify-between items-end">
            <h2 className="rounded-xl border border-[#c084fc]/20 bg-[#c084fc]/10 px-4 py-2 text-sm font-black uppercase tracking-widest text-[#c084fc]/80 backdrop-blur-sm">
              Top Products
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
            {dashboard.top_products?.map((product) => (
              <ProductCard
                key={product.id}
                name={product.name}
                todayQty={product.today_qty}
                todayRevenue={product.today_revenue}
                stockQty={product.stock_qty}
                stockStatus={product.stock_status}
                unit={product.unit}
                trendPct={product.trend_pct}
                mandiPrice={product.mandi_price}
                riskLevel={product.risk_level}
              />
            ))}
          </div>
        </section>
      </main>

      <MicFAB />
      <BottomNav />
    </div>
  );
}
