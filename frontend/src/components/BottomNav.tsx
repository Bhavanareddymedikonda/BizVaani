"use client";

// ============================================================
// BottomNav — Task: Member C
// See: FRONTEND_GUIDELINES.md (Section 4 — Bottom Navigation Bar)
// ============================================================

import Link from "next/link";

const NAV_ITEMS = [
  { icon: "🏠", label: "Home", href: "/dashboard", key: "dashboard" },
  { icon: "🔔", label: "Alerts", href: "/alerts", key: "alerts" },
  { icon: "📦", label: "Stock", href: "/inventory", key: "inventory" },
  { icon: "📄", label: "Invoice", href: "/invoice", key: "invoice" },
];

export default function BottomNav({ active }: { active: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around px-4 py-2 z-40">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`flex flex-col items-center gap-1 py-1 ${
            active === item.key ? "text-orange-500" : "text-gray-400"
          }`}
        >
          <span className="text-lg">{item.icon}</span>
          <span className="text-xs">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
