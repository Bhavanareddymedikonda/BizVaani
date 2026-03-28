"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("bv_token");
    if (token) router.push("/dashboard");
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login({ phone: form.phone, password: form.password });
      localStorage.setItem("bv_token", data.access_token);
      localStorage.setItem("bv_user", JSON.stringify(data.user));
      localStorage.setItem("bv_shop", JSON.stringify(data.shop));
      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100svh-48px)] max-w-[1280px] items-center gap-8 lg:grid-cols-[0.95fr_0.85fr]">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="surface-strong px-8 py-10 md:px-10 md:py-12"
        >
          <p className="eyebrow">Sign in</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[var(--color-text)] md:text-5xl">Welcome back</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[var(--color-text-soft)]">Access your store workspace, active alerts, inventory ledger, and invoice tools.</p>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            {error ? <div className="surface-muted border-[rgba(198,92,77,0.22)] px-4 py-3 text-sm text-[var(--color-danger)]">{error}</div> : null}
            <input placeholder="Phone number" value={form.phone} onChange={(e) => { setError(""); setForm({ ...form, phone: e.target.value }); }} className="field" />
            <input placeholder="Password" type="password" value={form.password} onChange={(e) => { setError(""); setForm({ ...form, password: e.target.value }); }} className="field" />
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-5 text-sm text-[var(--color-text-soft)]">
            Don&apos;t have an account?{" "}
            <Link href="/onboard" className="font-medium text-[var(--color-accent)]">
              Set up your shop
            </Link>
          </p>
        </motion.section>

        <motion.aside
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="hero-poster px-8 py-10 md:px-10 md:py-12"
        >
          <p className="eyebrow">BizVaani workspace</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--color-text)] md:text-4xl">
            One place for voice, stock, risk, and invoices.
          </h2>
          <div className="mt-8 grid gap-3">
            {[
              "See which products need attention before stock-outs affect sales.",
              "Ask natural-language questions and move directly into action.",
              "Handle billing and ledger updates in the same flow.",
            ].map((line) => (
              <div key={line} className="surface-muted flex items-start gap-3 px-4 py-4">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
                <p className="text-sm leading-7 text-[var(--color-text-soft)]">{line}</p>
              </div>
            ))}
          </div>
        </motion.aside>
      </div>
    </main>
  );
}
