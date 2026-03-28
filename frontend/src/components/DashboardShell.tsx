"use client";

import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import MicFAB from "./MicFAB";

interface DashboardShellProps {
  children: React.ReactNode;
  /** Optional active key for BottomNav (auto-detected if omitted) */
  active?: string;
}

/**
 * Desktop-first shell:
 * - Desktop (lg+): persistent sidebar on left, main content offset right
 * - Mobile: bottom nav + MicFAB floating button
 */
export default function DashboardShell({ children, active }: DashboardShellProps) {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-surface-0)" }}>
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <main
        className="min-h-screen px-4 py-4 pb-24 lg:pb-8 lg:px-8 lg:py-8"
        style={{
          marginLeft: "0",
        }}
      >
        {/* On desktop, offset by sidebar width */}
        <style>{`@media (min-width: 1024px) { main { margin-left: var(--sidebar-w, 272px); } }`}</style>
        {children}
      </main>

      {/* Mobile nav + FAB */}
      <MicFAB />
      <BottomNav active={active} />
    </div>
  );
}
