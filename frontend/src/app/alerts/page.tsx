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

export default function AlertsPage() {
  const { alerts } = useShopStore();
  const [filter, setFilter] = useState<Severity>("ALL");
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

  const filtered = filter === "ALL" ? alerts : alerts.filter((a) => a.severity === filter);

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
        <h1 className="text-xl font-bold text-gray-900">Risk Alerts</h1>
        <button 
          onClick={toggleTheme}
          className="theme-toggle"
          aria-label="Toggle theme"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        />
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
