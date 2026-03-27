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
    <main className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white px-4 py-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Risk Alerts</h1>
      </header>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(["ALL", "HIGH", "MEDIUM", "LOW"] as Severity[]).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilter(sev)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === sev
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Alert List */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No alerts found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </div>

      <MicFAB />
      <BottomNav active="alerts" />
    </main>
  );
}
