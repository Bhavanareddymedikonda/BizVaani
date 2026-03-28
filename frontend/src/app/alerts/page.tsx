"use client";

import { useEffect, useMemo, useState } from "react";
import AlertCard from "@/components/AlertCard";
import BottomNav from "@/components/BottomNav";
import MicFAB from "@/components/MicFAB";
import { getAlerts, runAlertsJob, type RiskAlert } from "@/lib/api";

type Severity = "ALL" | "HIGH" | "MEDIUM" | "LOW";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [filter, setFilter] = useState<Severity>("ALL");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || "dark";
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
  }, []);

  useEffect(() => {
    async function loadCurrentAlerts() {
      try {
        const data = await getAlerts();
        setAlerts(data);
        setError("");
      } catch (err) {
        console.error("Failed to load alerts:", err);
        setError("Could not load current risk alerts.");
      } finally {
        setLoading(false);
      }
    }

    void loadCurrentAlerts();
    const interval = window.setInterval(() => {
      void loadCurrentAlerts();
    }, 60000);

    return () => window.clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const filteredAlerts = useMemo(
    () => (filter === "ALL" ? alerts : alerts.filter((alert) => alert.severity === filter)),
    [alerts, filter],
  );

  const severityCount = (severity: Severity) =>
    severity === "ALL" ? alerts.length : alerts.filter((alert) => alert.severity === severity).length;

  const handleManualRun = async () => {
    setRunning(true);
    try {
      const result = await runAlertsJob();
      setAlerts(result.alerts);
      setError("");
    } catch (err) {
      console.error("Failed to run alert job:", err);
      setError("Could not run the alert scan right now.");
    } finally {
      setRunning(false);
    }
  };

  const handleAskBizVaani = (alert: RiskAlert) => {
    window.dispatchEvent(
      new CustomEvent("bv-open-voice", {
        detail: {
          prompt: `Explain this business risk and what I should do now. Product: ${alert.product_name}. Severity: ${alert.severity}. Alert: ${alert.message}. Reason: ${alert.reason ?? "No extra reason available."}`,
        },
      }),
    );
  };

  return (
    <div className="min-h-screen pb-24 pt-20 font-sans selection:bg-[#c084fc] selection:text-white md:pb-0 md:pt-6">
      <header className="mb-4 flex flex-col justify-between px-4 py-6 md:flex-row md:items-center md:px-12">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-wide text-white">
            Risk <span className="text-[#c084fc]">Alerts</span>
          </h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[#c084fc]/60">
            {alerts.length} active alerts from live inventory risk evaluation
          </p>
        </div>

        <div className="mt-4 flex items-center gap-3 md:mt-0">
          <button
            type="button"
            onClick={handleManualRun}
            disabled={running}
            className="rounded-full border border-[#c084fc]/25 bg-[#c084fc]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#e9d5ff] transition-colors hover:bg-[#c084fc]/20 disabled:opacity-50"
          >
            {running ? "Running..." : "Run Job Now"}
          </button>

          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            className="relative flex h-7 w-12 items-center rounded-full border border-white/10 bg-white/5 p-1 transition-colors hover:bg-[#c084fc]/20"
          >
            <span
              className="block h-5 w-5 rounded-full bg-gradient-to-br from-[#9333ea] to-[#c084fc] shadow-[0_0_8px_rgba(192,132,252,0.6)] transition-transform"
              style={{ transform: theme === "dark" ? "translateX(0)" : "translateX(20px)" }}
            />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-2 md:px-12">
        <div className="advanced-card flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="flex flex-wrap gap-3">
            {(["ALL", "HIGH", "MEDIUM", "LOW"] as Severity[]).map((severity) => (
              <button
                key={severity}
                type="button"
                onClick={() => setFilter(severity)}
                className={`rounded-xl border px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all sm:text-sm ${
                  filter === severity
                    ? "border-[#c084fc]/30 bg-gradient-to-r from-[#9333ea] to-[#4c1d95] text-white shadow-[0_4px_16px_rgba(147,51,234,0.3)]"
                    : "border-white/10 bg-white/5 text-[#c084fc]/60 hover:bg-white/10 hover:text-[#c084fc]"
                }`}
              >
                {severity}
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${filter === severity ? "bg-white/20" : "bg-white/5"}`}>
                  {severityCount(severity)}
                </span>
              </button>
            ))}
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
            Background risk scan runs every 30 minutes
          </p>
        </div>

        {error && (
          <div className="advanced-card border border-red-500/20 !bg-red-500/5 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {running && (
          <div className="advanced-card flex items-center justify-between gap-4 border border-[#c084fc]/20 !bg-[#c084fc]/5 p-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#7ae7ff]">
                BizVaani Thinking
              </p>
              <p className="mt-1 text-sm text-white/75">
                Scanning inventory, forecasts, mandi signals, and fresh market news for current business risk.
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="block h-2.5 w-2.5 rounded-full"
                  style={{
                    background: dot === 1 ? "#c084fc" : "#00d4ff",
                    animation: `alerts-thinking 1.15s ease-in-out ${dot * 0.12}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
            {[1, 2, 3, 4].map((card) => (
              <div key={card} className="advanced-card h-48 animate-pulse opacity-40" />
            ))}
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="advanced-card py-16 text-center">
            <p className="text-lg font-bold text-[#c084fc]/60">No active risk alerts right now</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
            {filteredAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                productName={alert.product_name}
                severity={alert.severity}
                message={alert.message}
                reason={alert.reason}
                onAskBizVaani={() => handleAskBizVaani(alert)}
              />
            ))}
          </div>
        )}
      </main>

      <MicFAB />
      <BottomNav />

      <style>{`
        @keyframes alerts-thinking {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 0.35;
          }
          40% {
            transform: translateY(-5px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
