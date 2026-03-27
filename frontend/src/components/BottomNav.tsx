"use client";

import Link from "next/link";

const NAV_ITEMS = [
  { icon: "⊞", label: "Home", href: "/dashboard", key: "dashboard" },
  { icon: "⚡", label: "Alerts", href: "/alerts", key: "alerts" },
  { icon: "📈", label: "Forecast", href: "/forecast", key: "forecast" },
  { icon: "📄", label: "Invoice", href: "/invoice", key: "invoice" },
  { icon: "⚙", label: "Settings", href: "/settings", key: "settings" },
];

export default function BottomNav({ active }: { active: string }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-black/8 flex items-stretch justify-around z-40"
      style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.key;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`relative flex flex-col items-center justify-center gap-1 py-3 px-2 flex-1 transition-colors duration-150 ${
              isActive ? "text-[#FF5500]" : "text-black/25 hover:text-black/50"
            }`}
          >
            {/* Active indicator bar */}
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#FF5500]" />
            )}
            <span className="text-base leading-none">{item.icon}</span>
            <span
              className={`text-[9px] font-bold uppercase tracking-widest ${
                isActive ? "text-[#FF5500]" : "text-black/25"
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
