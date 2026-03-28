"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { register, type AuthResponse } from "@/lib/api";

const CATEGORIES = ["Grains", "Dairy", "FMCG", "Vegetables", "General"];

export default function OnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    shop_name: "",
    city: "",
    state: "",
    language: "en",
    categories: [] as string[],
  });

  const handleNext = () => {
    if (!form.name.trim()) return setError("Please enter your name");
    if (!form.phone.trim()) return setError("Please enter your phone number");
    if (!form.password.trim()) return setError("Please enter a password");
    if (!form.shop_name.trim()) return setError("Please enter your shop name");
    if (!form.city.trim()) return setError("Please enter your city");
    if (!form.state.trim()) return setError("Please enter your state");
    setError("");
    setStep(2);
  };

  const handleFinish = async (dataPath: string) => {
    try {
      const res: AuthResponse = await register({
        ...form,
        categories: form.categories.length > 0 ? form.categories : ["general"],
      });
      localStorage.setItem("bv_token", res.access_token);
      localStorage.setItem("bv_user", JSON.stringify(res.user));
      localStorage.setItem("bv_shop", JSON.stringify(res.shop));
      console.log("Data path selected:", dataPath);
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed. Please check your inputs.";
      console.error("Registration failed:", err);
      setError(message);
    }
  };

  const toggleCategory = (cat: string) => {
    setError("");
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat) ? prev.categories.filter((c) => c !== cat) : [...prev.categories, cat],
    }));
  };

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100svh-48px)] max-w-[1280px] items-center gap-8 lg:grid-cols-[0.9fr_1fr]">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="hero-poster px-8 py-10 md:px-10 md:py-12"
        >
          <p className="eyebrow">New workspace</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[var(--color-text)] md:text-5xl">Set up your shop in minutes.</h1>
          <div className="mt-8 grid gap-3">
            {[
              "Choose categories and language once, then operate from one shared workspace.",
              "Start from benchmarks today and improve forecasting as real sales data arrives.",
              "Keep registration flow and backend payloads exactly as they work now.",
            ].map((line) => (
              <div key={line} className="surface-muted flex items-start gap-3 px-4 py-4">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
                <p className="text-sm leading-7 text-[var(--color-text-soft)]">{line}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="surface-strong px-8 py-10 md:px-10 md:py-12"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="eyebrow">Onboarding</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--color-text)]">{step === 1 ? "Store details" : "Data strategy"}</h2>
            </div>
            <p className="text-sm text-[var(--color-text-soft)]">Step {step} of 2</p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className={step >= 1 ? "h-2 rounded-full bg-[var(--color-accent)]" : "h-2 rounded-full bg-[rgba(15,23,42,0.12)]"} />
            <div className={step >= 2 ? "h-2 rounded-full bg-[var(--color-accent)]" : "h-2 rounded-full bg-[rgba(15,23,42,0.12)]"} />
          </div>

          {error ? <div className="surface-muted border-[rgba(198,92,77,0.22)] px-4 py-3 text-sm text-[var(--color-danger)]">{error}</div> : null}

          {step === 1 ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <input placeholder="Your name" value={form.name} onChange={(e) => { setError(""); setForm({ ...form, name: e.target.value }); }} className="field" />
                <input placeholder="Phone" value={form.phone} onChange={(e) => { setError(""); setForm({ ...form, phone: e.target.value }); }} className="field" />
              </div>
              <input placeholder="Password" type="password" value={form.password} onChange={(e) => { setError(""); setForm({ ...form, password: e.target.value }); }} className="field" />
              <input placeholder="Shop name" value={form.shop_name} onChange={(e) => { setError(""); setForm({ ...form, shop_name: e.target.value }); }} className="field" />
              <div className="grid gap-4 md:grid-cols-2">
                <input placeholder="City" value={form.city} onChange={(e) => { setError(""); setForm({ ...form, city: e.target.value }); }} className="field" />
                <input placeholder="State" value={form.state} onChange={(e) => { setError(""); setForm({ ...form, state: e.target.value }); }} className="field" />
              </div>
              <select value={form.language} onChange={(e) => { setError(""); setForm({ ...form, language: e.target.value }); }} className="field">
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="te">Telugu</option>
              </select>
              <div className="flex flex-wrap gap-2 pt-1">
                {CATEGORIES.map((cat) => (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => toggleCategory(cat.toLowerCase())}
                    className={form.categories.includes(cat.toLowerCase()) ? "rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white" : "rounded-full bg-[rgba(15,23,42,0.05)] px-4 py-2 text-sm font-medium text-[var(--color-text-soft)] hover:bg-[rgba(15,23,42,0.08)] hover:text-[var(--color-text)]"}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <button type="button" onClick={handleNext} className="btn-primary w-full">Continue</button>
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { title: "Industry benchmarks", desc: "Start with practical default demand and catalog data.", key: "benchmark", recommended: true },
                { title: "Bill scan (OCR)", desc: "Keep the same backend flow while starting from your bill records.", key: "ocr" },
                { title: "Voice journal", desc: "Build data as you operate using daily voice updates.", key: "voice" },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => handleFinish(option.key)}
                  className="surface-muted block w-full px-5 py-5 text-left transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold tracking-[-0.03em] text-[var(--color-text)]">{option.title}</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">{option.desc}</p>
                    </div>
                    {option.recommended ? <span className="status-badge status-success">recommended</span> : null}
                  </div>
                </button>
              ))}
              <button type="button" onClick={() => setStep(1)} className="btn-ghost">Back</button>
            </div>
          )}

          <p className="mt-5 text-sm text-[var(--color-text-soft)]">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[var(--color-accent)]">Sign in</Link>
          </p>
        </motion.section>
      </div>
    </main>
  );
}

