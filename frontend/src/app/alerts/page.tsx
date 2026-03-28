"use client";

// ============================================================
// Alerts Page — Task: Member E
// See: APP_FLOW.md (Flow 3), FRONTEND_GUIDELINES.md (Section 4)
// ============================================================

import { useState, useEffect } from "react";
import { useShopStore } from "@/store/useShopStore";
import AlertCard from "@/components/AlertCard";
import BottomNav from "@/components/BottomNav";
import MicFAB from "@/components/MicFAB";

type Severity = "ALL" | "HIGH" | "MEDIUM" | "LOW";

// Sample alerts shown when store is not yet hydrated
const SAMPLE_ALERTS = [
  { id: 1, product_name: "Rice", severity: "HIGH" as const, message: "Sales dropped 22% — competitor undercut by ₹2", created_at: "2026-03-27T06:00:00" },
  { id: 2, product_name: "Atta", severity: "MEDIUM" as const, message: "Restock needed in 4 days based on AI forecast", created_at: "2026-03-27T06:00:00" },
  { id: 3, product_name: "Sugar", severity: "HIGH" as const, message: "Mandi price spiked 18% — consider buying in bulk now", created_at: "2026-03-27T08:00:00" },
  { id: 4, product_name: "Cooking Oil", severity: "LOW" as const, message: "Price stable. Stock levels healthy for next 12 days.", created_at: "2026-03-27T08:00:00" },
];

export default function AlertsPage() {
  const { alerts: storeAlerts } = useShopStore();
  const [filter, setFilter] = useState<Severity>("ALL");
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

  // Use store alerts if hydrated, otherwise show sample data
  const alerts = storeAlerts && storeAlerts.length > 0 ? storeAlerts : SAMPLE_ALERTS;
  const filtered = filter === "ALL" ? alerts : alerts.filter((a) => a.severity === filter);

  const severityCount = (sev: Severity) =>
    sev === "ALL" ? alerts.length : alerts.filter((a) => a.severity === sev).length;

  return (
    <div className="min-h-screen selection:bg-[#c084fc] selection:text-white font-sans pb-24 md:pb-0 pt-20 md:pt-6">
      <header className="px-4 md:px-12 py-6 mb-4 flex flex-col md:flex-row md:items-center justify-between md:ml-20">
        <div>
          <h1 className="text-3xl font-black tracking-wide text-white uppercase">
            Risk <span className="text-[#c084fc]">Alerts</span>
          </h1>
          <p className="font-bold text-xs uppercase tracking-widest text-[#c084fc]/60 mt-1">
            {alerts.length} active alerts
          </p>
        </div>
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
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-3">
          {(["ALL", "HIGH", "MEDIUM", "LOW"] as Severity[]).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilter(sev)}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all ${
                filter === sev
                  ? "bg-gradient-to-r from-[#9333ea] to-[#4c1d95] text-white shadow-[0_4px_16px_rgba(147,51,234,0.3)] border border-[#c084fc]/30"
                  : "bg-white/5 text-[#c084fc]/60 hover:bg-white/10 border border-white/10 hover:text-[#c084fc]"
              }`}
            >
              {sev}
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${filter === sev ? 'bg-white/20' : 'bg-white/5'}`}>
                {severityCount(sev)}
              </span>
            </button>
          ))}
        </div>

        {/* Alert List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 advanced-card">
            <p className="text-[#c084fc]/60 font-bold text-lg">No alerts found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {filtered.map((alert) => (
              <AlertCard 
                key={alert.id} 
                productName={alert.product_name}
                severity={alert.severity}
                message={alert.message}
              />
            ))}
          </div>
        )}
      </main>

      <MicFAB />
      <BottomNav />
    </div>
  );
}
