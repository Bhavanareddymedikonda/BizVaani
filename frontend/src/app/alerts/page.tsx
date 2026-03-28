"use client";

// ============================================================
// Alerts Page — Task: Member E
// See: APP_FLOW.md (Flow 3), FRONTEND_GUIDELINES.md (Section 4)
// ============================================================

import { useState } from "react";
import { useShopStore } from "@/store/useShopStore";
import AlertCard from "@/components/AlertCard";
import BottomNav from "@/components/BottomNav";
import MicFAB from "@/components/MicFAB";

type Severity = "ALL" | "HIGH" | "MEDIUM" | "LOW";

export default function AlertsPage() {
  const { alerts } = useShopStore();
  const [filter, setFilter] = useState<Severity>("ALL");

  const filtered = filter === "ALL" ? alerts : alerts.filter((a) => a.severity === filter);

  return (
    <div className="min-h-screen selection:bg-[#f97316] selection:text-white font-sans md:pl-64 pb-24 md:pb-0">
      <header className="px-4 md:px-8 py-6 sticky top-0 z-30 bg-[#fff8eb]/80 backdrop-blur-md border-b-2 border-dashed border-[#e5dacc]">
        <h1 className="text-2xl font-black tracking-wide text-[#4a2d12] uppercase">
          Risk <span className="text-[#f97316]">Alerts</span>
        </h1>
      </header>

      <main className="px-4 md:px-8 max-w-7xl mx-auto py-6 space-y-6">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-3">
          {(["ALL", "HIGH", "MEDIUM", "LOW"] as Severity[]).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilter(sev)}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8),1px_1px_3px_rgba(0,0,0,0.05)] ${
                filter === sev
                  ? "bg-[#f97316] text-white shadow-[inset_1px_1px_3px_rgba(255,255,255,0.4),2px_2px_5px_rgba(249,115,22,0.4)]"
                  : "bg-white/60 text-[#8c6b4d] hover:bg-white border border-[#e5dacc]"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Alert List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 clay-card">
            <p className="text-[#8c6b4d] font-bold text-lg">No alerts found</p>
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
