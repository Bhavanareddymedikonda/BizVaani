"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Mic, Receipt, TrendingUp } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[rgba(250,247,242,0.88)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-4 md:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,#0f766e,#0f4c81)] text-base font-semibold text-white shadow-[0_14px_28px_rgba(15,76,129,0.18)]">
              B
            </div>
            <div>
              <p className="text-lg font-semibold tracking-[-0.03em] text-[var(--color-text)]">BizVaani</p>
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Retail operating system</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost">
              Sign in
            </Link>
            <Link href="/onboard" className="btn-primary">
              Launch app
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-6 md:px-8 lg:px-10">
        <section className="relative overflow-hidden rounded-[40px] border border-[var(--color-border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(239,245,247,0.92))] px-6 py-8 shadow-[0_36px_72px_rgba(15,23,42,0.1)] md:px-10 md:py-10 lg:grid lg:min-h-[72svh] lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(15,118,110,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(29,78,216,0.08),transparent_24%)]" />

          <motion.div {...fadeUp} className="relative z-10 max-w-2xl self-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">
              Voice-first retail operations
            </p>
            <h1 className="mt-4 max-w-4xl text-[clamp(3.2rem,7vw,6.4rem)] font-semibold leading-[0.92] tracking-[-0.075em] text-[#0b1220]">
              Retail intelligence for stores that still run at counter speed.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#334155] md:text-lg">
              Ask in Hindi, English, or Telugu. Review stock, pricing, demand, invoices, and risk in one calm workspace built for real kirana operations.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/onboard" className="btn-primary">
                Start setup
                <ArrowRight size={16} />
              </Link>
              <Link href="/login" className="btn-secondary">
                Open existing workspace
              </Link>
            </div>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.08 }}
            className="relative z-10 mt-10 lg:mt-0 lg:pl-10"
          >
            <div className="overflow-hidden rounded-[32px] border border-[rgba(15,23,42,0.08)] bg-[#0f172a] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.24)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[rgba(226,232,240,0.72)]">
                Live operator view
              </p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-[28px] bg-[rgba(255,255,255,0.9)] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#0f172a]">Rice demand softening</p>
                      <p className="mt-1 text-sm text-[#475569]">Sales dropped 18% vs recent average</p>
                    </div>
                    <span className="status-badge status-warning">watch</span>
                  </div>
                </div>
                <div className="rounded-[28px] bg-[rgba(255,255,255,0.9)] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#0f172a]">Invoice draft ready</p>
                      <p className="mt-1 text-sm text-[#475569]">Sharma Traders · 4 line items</p>
                    </div>
                    <Receipt size={18} className="text-[var(--color-accent)]" />
                  </div>
                </div>
                <div className="rounded-[28px] bg-[rgba(255,255,255,0.9)] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#0f172a]">Ask BizVaani</p>
                      <p className="mt-1 text-sm text-[#475569]">Why is sugar margin tightening?</p>
                    </div>
                    <Mic size={18} className="text-[var(--color-accent)]" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <motion.section {...fadeUp} className="mt-16 grid gap-5 lg:grid-cols-3">
          {[
            {
              icon: <Mic size={18} className="text-[var(--color-accent)]" />,
              title: "Voice-led workflows",
              copy: "Capture queries and actions without leaving the sales floor or opening a spreadsheet.",
            },
            {
              icon: <TrendingUp size={18} className="text-[var(--color-info)]" />,
              title: "Demand and risk context",
              copy: "Blend inventory, forecast, and current market context into practical store decisions.",
            },
            {
              icon: <Receipt size={18} className="text-[var(--color-success)]" />,
              title: "Fast invoicing",
              copy: "Generate GST-ready invoices and preserve the stock ledger in the same flow.",
            },
          ].map((item) => (
            <article key={item.title} className="surface p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[16px] bg-[var(--color-panel-muted)]">
                {item.icon}
              </div>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--color-text)]">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--color-text-soft)]">{item.copy}</p>
            </article>
          ))}
        </motion.section>

        <motion.section {...fadeUp} className="mt-16 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="surface p-6 md:p-8">
            <p className="eyebrow">Why it feels different</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--color-text)] md:text-4xl">
              Less dashboard theater. More operator clarity.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-[var(--color-text-soft)]">
              BizVaani is built to reduce friction at the counter: fewer clicks, more context, and actions that match the way local stores actually work.
            </p>
          </div>
          <div className="grid gap-4">
            {[
              "See today's revenue, stock pressure, and active risk in one glance.",
              "Move from voice query to inventory action or invoice generation without changing tools.",
              "Use forecast and market context to make price and buying decisions faster.",
            ].map((line) => (
              <div key={line} className="surface-muted flex items-start gap-3 px-4 py-4">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
                <p className="text-sm leading-7 text-[var(--color-text-soft)]">{line}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section {...fadeUp} className="mt-16 surface-strong px-6 py-8 text-center md:px-10 md:py-12">
          <p className="eyebrow">Get started</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--color-text)] md:text-4xl">
            Bring your store into one focused workspace.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-soft)]">
            Set up your shop, seed your catalog, and start operating with voice, demand, inventory, and invoice workflows in one system.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/onboard" className="btn-primary">
              Start setup
            </Link>
            <Link href="/login" className="btn-secondary">
              Sign in
            </Link>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
