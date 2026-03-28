"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { icon: "⊞", label: "Home",     href: "/dashboard", key: "dashboard" },
  { icon: "⚡", label: "Alerts",  href: "/alerts",    key: "alerts" },
  { icon: "📈", label: "Forecast", href: "/forecast",  key: "forecast" },
  { icon: "📄", label: "Invoice", href: "/invoice",   key: "invoice" },
  { icon: "⚙",  label: "Settings", href: "/settings", key: "settings" },
];

export default function BottomNav({ active }: { active?: string }) {
  const pathname = usePathname();
  const resolvedActive = active ?? NAV_ITEMS.find((i) => pathname.startsWith(i.href))?.key;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 flex items-stretch justify-around z-40"
      style={{
        background: "var(--color-surface-0)",
        borderTop: "1px solid var(--color-surface-2)",
        boxShadow: "0 -4px 20px rgba(146,121,96,0.10)",
        fontFamily: "var(--font-sans)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = resolvedActive === item.key;
        return (
          <Link
            key={item.key}
            href={item.href}
            className="relative flex flex-col items-center justify-center gap-1 py-3 px-2 flex-1 transition-colors duration-150"
            style={{ color: isActive ? "var(--color-primary-500)" : "var(--color-text-soft)" }}
          >
            {isActive && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5"
                style={{ background: "var(--color-primary-500)", borderRadius: "2px" }}
              />
            )}
            <span className="text-base leading-none">{item.icon}</span>
            <span
              className="text-[9px] font-bold uppercase tracking-widest"
              style={{ color: isActive ? "var(--color-primary-500)" : "var(--color-text-soft)" }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
