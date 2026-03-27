"use client";

import { useEffect, useState, useRef } from "react";
import { getDashboard } from "@/lib/api";
import { useShopStore } from "@/store/useShopStore";
import ProductCard from "@/components/ProductCard";
import AlertCard from "@/components/AlertCard";
import BottomNav from "@/components/BottomNav";
import MicFAB from "@/components/MicFAB";

/** Animated number counter */
function CountUp({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef(false);

  useEffect(() => {
    if (ref.current || target === 0) return;
    ref.current = true;
    const duration = 800;
    const steps = 40;
    const step = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      setVal(Math.round(current));
      if (current >= target) clearInterval(interval);
    }, duration / steps);
    return () => clearInterval(interval);
  }, [target]);

  return (
    <span>
      {prefix}
      {val.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

const GREETING = (() => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
})();

export default function DashboardPage() {
  const { shop, products, alerts, totalToday, isLoading, setDashboardData, setLoading } =
    useShopStore();
  const [dataMaturity, setDataMaturity] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getDashboard();
        const d = data as {
          shop?: unknown;
          products?: unknown[];
          alerts?: unknown[];
          total_today?: unknown;
          data_maturity_days?: number;
        };
        setDashboardData(d as Parameters<typeof setDashboardData>[0]);
        if (typeof d.data_maturity_days === "number") {
          setDataMaturity(d.data_maturity_days);
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      }
    }
    load();
  // setDashboardData and setLoading are stable Zustand setters
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <main
        className="min-h-screen bg-white flex flex-col"
        style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
      >
        <div className="px-5 pt-8 pb-4 border-b border-black/5">
          <div className="h-3 w-20 bg-black/8 mb-3 animate-pulse" />
          <div className="h-6 w-40 bg-black/10 animate-pulse" />
        </div>
        <div className="px-5 py-4 grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-black/5 animate-pulse" />
          ))}
        </div>
        <div className="px-5 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-black/5 animate-pulse" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-[#F7F5F0] pb-24"
      style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
    >
      {/* —— HEADER —— */}
      <header className="bg-white px-5 py-5 border-b border-black/5">
        <p className="text-[10px] font-bold tracking-[0.3em] text-black/30 uppercase">
          {GREETING}
        </p>
        <h1 className="text-xl font-black text-[#0A0A0A] mt-1 uppercase tracking-tight">
          {shop?.shop_name ?? "My Shop"}
        </h1>
      </header>

      {/* —— DATA MATURITY BANNER —— */}
      {dataMaturity !== null && dataMaturity < 14 && (
        <div className="bg-[#FF5500] px-5 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-white uppercase tracking-widest">
              Early Data Mode
            </p>
            <p className="text-[11px] text-white/80 mt-0.5">
              {dataMaturity} day{dataMaturity !== 1 ? "s" : ""} of data · Forecasts improve after 14 days
            </p>
          </div>
          <div className="text-white/60 text-lg">🌱</div>
        </div>
      )}

      <div className="px-5 py-5 max-w-lg mx-auto space-y-6">
        {/* —— STATS STRIP —— */}
        {totalToday && (
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                label: "Revenue",
                value: <CountUp target={totalToday.revenue} prefix="₹" />,
                accent: false,
              },
              {
                label: "Items",
                value: <CountUp target={totalToday.items_sold} />,
                accent: false,
              },
              {
                label: "Profit",
                value: <CountUp target={totalToday.profit_estimate} prefix="₹" />,
                accent: true,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`py-4 px-3 text-center border-2 ${
                  stat.accent
                    ? "border-[#FF5500] bg-[#FF5500]/5"
                    : "border-black/8 bg-white"
                }`}
              >
                <p
                  className={`text-lg font-black tabular-nums ${
                    stat.accent ? "text-[#FF5500]" : "text-[#0A0A0A]"
                  }`}
                >
                  {stat.value}
                </p>
                <p className="text-[10px] text-black/30 uppercase tracking-widest mt-1 font-bold">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* —— ALERTS —— */}
        {alerts.length > 0 && (
          <section>
            <p className="text-[10px] font-bold tracking-[0.3em] text-black/30 uppercase mb-3">
              ⚠ Alerts · {alerts.length}
            </p>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </section>
        )}

        {/* —— TOP PRODUCTS —— */}
        <section>
          <p className="text-[10px] font-bold tracking-[0.3em] text-black/30 uppercase mb-3">
            Top Products
          </p>
          {products.length === 0 ? (
            <div className="border-2 border-dashed border-black/10 py-12 text-center">
              <p className="text-sm text-black/30">No product data yet.</p>
              <p className="text-xs text-black/20 mt-1">Try speaking to BizVaani.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>

      <MicFAB />
      <BottomNav active="dashboard" />
    </main>
  );
}
