"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/lib/api";

const CATEGORIES = ["Grains", "Dairy", "FMCG", "Vegetables", "General"] as const;
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिंदी (Hindi)" },
  { value: "te", label: "తెలుగు (Telugu)" },
  { value: "mr", label: "मराठी (Marathi)" },
];

function Field({
  placeholder,
  value,
  onChange,
  type = "text",
  error,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
}) {
  return (
    <div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-3 border-b-2 bg-transparent text-[#0A0A0A] text-base outline-none transition-colors placeholder-black/30 ${
          error ? "border-red-500" : "border-black/20 focus:border-[#FF5500]"
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}
    </div>
  );
}

export default function OnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleCategory = (cat: string) => {
    const lc = cat.toLowerCase();
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(lc)
        ? prev.categories.filter((c) => c !== lc)
        : [...prev.categories, lc],
    }));
  };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!/^\d{10}$/.test(form.phone)) errs.phone = "Enter a valid 10-digit phone number";
    if (form.password.length < 4) errs.password = "Password must be at least 4 characters";
    if (!form.shop_name.trim()) errs.shop_name = "Shop name is required";
    if (!form.city.trim()) errs.city = "City is required";
    if (!form.state.trim()) errs.state = "State is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleFinish = async (dataPath: string) => {
    setSubmitting(true);
    try {
      const res = await register({
        name: form.name,
        phone: form.phone,
        password: form.password,
        shop_name: form.shop_name,
        city: form.city,
        state: form.state,
        language: form.language,
        categories: form.categories,
      });
      const r = res as { access_token: string; user: unknown };
      localStorage.setItem("bv_token", r.access_token);
      localStorage.setItem("bv_user", JSON.stringify(r.user));
      localStorage.setItem("bv_data_path", dataPath);
      router.push("/dashboard");
    } catch (err) {
      console.error("Registration failed:", err);
      setErrors({ global: "Registration failed. Try again." });
      setStep(1);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      className="min-h-screen bg-white text-[#0A0A0A] px-5 py-8 max-w-md mx-auto"
      style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
    >
      {/* Progress bar */}
      <div className="flex gap-1.5 mb-10">
        <div className="h-0.5 flex-1 bg-[#FF5500]" />
        <div className={`h-0.5 flex-1 ${step === 2 ? "bg-[#FF5500]" : "bg-black/10"}`} />
      </div>

      {/* Global error */}
      {errors.global && (
        <div className="mb-6 px-4 py-3 border border-red-200 bg-red-50 text-sm text-red-700">
          {errors.global}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <div className="mb-8">
            <p className="text-[10px] tracking-[0.3em] text-black/30 uppercase font-bold mb-2">Step 1 of 2</p>
            <h1 className="text-3xl font-black uppercase tracking-tight">Set Up Your Shop</h1>
          </div>

          <div className="space-y-5">
            <Field placeholder="Your Name" value={form.name} onChange={(v) => set("name", v)} error={errors.name} />
            <Field placeholder="Phone (10 digits)" value={form.phone} onChange={(v) => set("phone", v)} type="tel" error={errors.phone} />
            <Field placeholder="Password" value={form.password} onChange={(v) => set("password", v)} type="password" error={errors.password} />
            <Field placeholder="Shop Name" value={form.shop_name} onChange={(v) => set("shop_name", v)} error={errors.shop_name} />
            <div className="grid grid-cols-2 gap-4">
              <Field placeholder="City" value={form.city} onChange={(v) => set("city", v)} error={errors.city} />
              <Field placeholder="State" value={form.state} onChange={(v) => set("state", v)} error={errors.state} />
            </div>
          </div>

          {/* Language */}
          <div>
            <p className="text-xs font-bold tracking-widest text-black/40 uppercase mb-3">Language</p>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => set("language", lang.value)}
                  className={`px-3 py-1.5 text-xs font-bold border transition-all duration-150 ${
                    form.language === lang.value
                      ? "bg-[#FF5500] text-white border-[#FF5500]"
                      : "bg-white text-black/50 border-black/15 hover:border-[#FF5500]"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <p className="text-xs font-bold tracking-widest text-black/40 uppercase mb-3">
              What do you sell? <span className="text-black/20">(optional)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-bold border transition-all duration-150 ${
                    form.categories.includes(cat.toLowerCase())
                      ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                      : "bg-white text-black/50 border-black/15 hover:border-[#0A0A0A]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleNext}
            className="w-full py-4 bg-[#FF5500] text-white font-black text-sm tracking-[0.15em] uppercase transition-all duration-150 hover:bg-[#e04a00] active:scale-[0.97]"
          >
            Next →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="mb-8">
            <p className="text-[10px] tracking-[0.3em] text-black/30 uppercase font-bold mb-2">Step 2 of 2</p>
            <h1 className="text-3xl font-black uppercase tracking-tight">How to Start?</h1>
            <p className="text-sm text-black/40 mt-2">Choose how BizVaani gets your first data.</p>
          </div>

          {[
            {
              icon: "📊",
              title: "Industry Averages",
              desc: "Start seeing insights immediately — benchmark data loaded for you",
              key: "benchmark",
              recommended: true,
            },
            {
              icon: "🎙️",
              title: "Tell by Voice Daily",
              desc: "Speak your sales each evening — BizVaani learns over time",
              key: "voice",
            },
            {
              icon: "📷",
              title: "Upload Bill Photo",
              desc: "Photograph old paper bills — OCR extracts the data",
              key: "ocr",
            },
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => handleFinish(option.key)}
              disabled={submitting}
              className={`w-full text-left p-4 border-2 transition-all duration-150 hover:border-[#FF5500] active:scale-[0.98] disabled:opacity-50 ${
                option.recommended
                  ? "border-[#FF5500] bg-[#FF5500]/5"
                  : "border-black/10 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{option.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-black text-sm uppercase tracking-wide">{option.title}</p>
                    {option.recommended && (
                      <span className="text-[10px] font-bold tracking-widest text-[#FF5500] uppercase border border-[#FF5500] px-1.5 py-0.5">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-black/40 leading-relaxed">{option.desc}</p>
                </div>
              </div>
            </button>
          ))}

          {submitting && (
            <div className="text-center py-4">
              <div className="inline-block w-5 h-5 border-2 border-[#FF5500] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-black/40 mt-2">Setting up your shop...</p>
            </div>
          )}

          <button
            onClick={() => setStep(1)}
            className="text-sm text-black/30 hover:text-black/60 transition-colors"
          >
            ← Back
          </button>
        </div>
      )}
    </main>
  );
}
