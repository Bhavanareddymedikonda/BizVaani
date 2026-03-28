"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  FileText,
  History,
  Home,
  Mic,
  Package,
  Settings,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import MicFAB from "./MicFAB";

type NavItem = {
  href: string;
  label: string;
  short: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", short: "Home", icon: Home },
  { href: "/alerts", label: "Alerts", short: "Alerts", icon: Bell },
  { href: "/forecast", label: "Forecast", short: "Forecast", icon: TrendingUp },
  { href: "/inventory", label: "Inventory", short: "Stock", icon: Package },
  { href: "/transactions", label: "Transactions", short: "History", icon: History },
  { href: "/invoice", label: "Invoices", short: "Invoice", icon: FileText },
  { href: "/settings", label: "Settings", short: "Settings", icon: Settings },
];

export function AppShell({
  children,
  topbar,
}: {
  children: ReactNode;
  topbar?: ReactNode;
}) {
  return (
    <div suppressHydrationWarning className="page-shell">
      <Sidebar />
      <div suppressHydrationWarning className="lg:pl-[280px]">
        <Topbar>{topbar}</Topbar>
        <motion.main
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="page-wrap"
        >
          {children}
        </motion.main>
      </div>
      <BottomRail />
      <MicFAB />
    </div>
  );
}

function Sidebar() {
  const pathname = usePathname();

  return (
    <aside suppressHydrationWarning className="fixed inset-y-0 left-0 z-30 hidden w-[280px] border-r border-[var(--color-border)] bg-[rgba(250,247,242,0.82)] px-5 py-6 backdrop-blur-md lg:flex lg:flex-col">
      <Link href="/dashboard" className="surface-strong mb-6 flex items-center gap-4 px-4 py-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#0f766e,#0f4c81)] text-lg font-bold text-white shadow-[0_14px_28px_rgba(15,76,129,0.18)]">
          B
        </div>
        <div>
          <p className="text-lg font-semibold tracking-[-0.03em] text-[var(--color-text)]">BizVaani</p>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Retail OS</p>
        </div>
      </Link>

      <div className="px-2">
        <p className="eyebrow mb-3">Workspace</p>
      </div>

      <nav className="space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                active
                  ? "bg-[var(--color-accent-soft)] text-[var(--color-text)]"
                  : "text-[var(--color-text-soft)] hover:bg-[rgba(15,23,42,0.05)] hover:text-[var(--color-text)]",
              )}
            >
              <Icon size={18} className={cn(active ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)]")} />
              <span>{item.label}</span>
              {active ? (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-2xl border border-[rgba(15,118,110,0.18)]"
                />
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("bv-open-voice"))}
          className="btn-primary w-full"
        >
          <Mic size={16} />
          Ask BizVaani
        </button>
        <div className="surface p-4">
          <p className="text-sm font-medium text-[var(--color-text)]">Daily operator mode</p>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-soft)]">
            Track stock, spot risk, and handle invoices from one calm workspace.
          </p>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ children }: { children?: ReactNode }) {
  return (
    <div suppressHydrationWarning className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[rgba(243,240,234,0.82)] backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4 md:px-8 lg:px-10">
        <div>
          <p className="eyebrow">BizVaani</p>
          <p className="text-sm text-[var(--color-text-soft)]">Daily retail operating system</p>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key="topbar-slot"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function BottomRail() {
  const pathname = usePathname();

  return (
    <div suppressHydrationWarning className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border)] bg-[rgba(250,247,242,0.92)] px-3 py-2 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-1">
        {NAV_ITEMS.slice(0, 6).map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition-colors",
                active ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]",
              )}
            >
              <Icon size={18} />
              <span className="truncate">{item.short}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        <p className="page-copy">{description}</p>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "accent" | "success" | "warning";
}) {
  const toneClass =
    tone === "accent"
      ? "text-[var(--color-accent)]"
      : tone === "success"
        ? "text-[var(--color-success)]"
        : tone === "warning"
          ? "text-[var(--color-warning)]"
          : "text-[var(--color-text)]";

  return (
    <div className="metric-card">
      <p className="metric-label">{label}</p>
      <p className={cn("metric-value", toneClass)}>{value}</p>
      {hint ? <p className="metric-hint">{hint}</p> : null}
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-[var(--color-text)]">{title}</h2>
        {description ? <p className="mt-1 text-sm text-[var(--color-text-soft)]">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}


