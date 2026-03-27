"use client";

import { useEffect, useState } from "react";
import { getAlerts } from "@/lib/api";
import BottomNav from "@/components/BottomNav";
import MicFAB from "@/components/MicFAB";

type Severity = "HIGH" | "MEDIUM" | "LOW";
type AlertFilter = "ALL" | Severity;

interface Alert {
  id: number;
  product_name: string;
  alert_type: string;
  severity: Severity;
  message: string;
  created_at: string;
}

const SEVERITY_STYLE: Record<Severity, string> = {
  HIGH: "border-red-200 bg-red-50 text-red-700",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-700",
  LOW: "border-green-100 bg-green-50 text-green-700",
};

const SEVERITY_ICON: Record<Severity, string> = {
  HIGH: "🚨", MEDIUM: "⚠️", LOW: "✅",
};

const FILTERS: AlertFilter[] = ["ALL", "HIGH", "MEDIUM", "LOW"];

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor(diff / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d ago`;
  if (h >= 1) return `${h}h ago`;
  return `${m}m ago`;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AlertFilter>("ALL");

  useEffect(() => {
    getAlerts()
      .then((data) => setAlerts(data as Alert[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "ALL" ? alerts : alerts.filter((a) => a.severity === filter);
  const counts: Record<AlertFilter, number> = {
    ALL: alerts.length,
    HIGH: alerts.filter((a) => a.severity === "HIGH").length,
    MEDIUM: alerts.filter((a) => a.severity === "MEDIUM").length,
    LOW: alerts.filter((a) => a.severity === "LOW").length,
  };

  return (
    <main className="min-h-screen bg-[#F7F5F0] pb-24" style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <header className="bg-white px-5 py-5 border-b border-black/5">
        <p className="text-[10px] font-bold tracking-[0.3em] text-black/30 uppercase">BizVaani</p>
        <h1 className="text-xl font-black text-[#0A0A0A] mt-1 uppercase tracking-tight">
          Alerts {alerts.length > 0 && <span className="text-[#FF5500]">·{alerts.length}</span>}
        </h1>
      </header>

      <div className="bg-white border-b border-black/5 px-5 py-3 flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`shrink-0 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border transition-all ${
              filter === f ? "bg-[#0A0A0A] text-white border-[#0A0A0A]" : "bg-white text-black/40 border-black/10 hover:border-black/20"
            }`}>
            {f}{counts[f] > 0 ? ` (${counts[f]})` : ""}
          </button>
        ))}
      </div>

      <div className="px-5 py-5 max-w-lg mx-auto space-y-3">
        {loading && [1, 2, 3].map((i) => <div key={i} className="h-20 bg-black/5 animate-pulse" />)}

        {!loading && filtered.length === 0 && (
          <div className="border-2 border-dashed border-black/10 py-16 text-center">
            <p className="text-2xl mb-3">✅</p>
            <p className="text-sm font-black text-black/30 uppercase tracking-wide">
              {filter === "ALL" ? "No alerts" : `No ${filter} alerts`}
            </p>
            <p className="text-xs text-black/20 mt-1">BizVaani monitors your shop 24/7</p>
          </div>
        )}

        {!loading && filtered.map((alert) => (
          <div key={alert.id} className={`border-2 p-4 ${SEVERITY_STYLE[alert.severity] ?? "border-black/10 bg-white"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span>{SEVERITY_ICON[alert.severity]}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                    {alert.severity} · {alert.alert_type?.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="font-black text-sm uppercase tracking-wide mb-1">{alert.product_name}</p>
                <p className="text-xs leading-relaxed opacity-80">{alert.message}</p>
              </div>
              <div className="text-[10px] opacity-50 shrink-0">
                {alert.created_at ? timeAgo(alert.created_at) : ""}
              </div>
            </div>
            {alert.severity === "HIGH" && (
              <div className="mt-3 pt-3 border-t border-red-200/60">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600">
                  🎙️ Tap mic to ask BizVaani why →
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <MicFAB />
      <BottomNav active="alerts" />
    </main>
  );
}
