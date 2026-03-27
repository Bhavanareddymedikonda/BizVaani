"use client";

// ============================================================
// Onboarding Page — Task: Member B
// See: APP_FLOW.md (Flow 1), BizVaani_Developer_Reference.md (Section 5)
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/lib/api";

const CATEGORIES = ["Grains", "Dairy", "FMCG", "Vegetables", "General"];

export default function OnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
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

  const handleNext = () => setStep(2);

  const handleFinish = async (dataPath: string) => {
    try {
      const res = await register({
        ...form,
        categories: form.categories,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      localStorage.setItem("bv_token", (res as any).access_token);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      localStorage.setItem("bv_user", JSON.stringify((res as any).user));
      console.log("Data path selected:", dataPath);
      router.push("/dashboard");
    } catch (err) {
      console.error("Registration failed:", err);
    }
  };

  const toggleCategory = (cat: string) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  return (
    <main className="min-h-screen bg-white px-6 py-8 max-w-md mx-auto">
      {/* Step Indicator */}
      <div className="flex gap-2 mb-8">
        <div className={`h-1 flex-1 rounded ${step >= 1 ? "bg-orange-500" : "bg-gray-200"}`} />
        <div className={`h-1 flex-1 rounded ${step >= 2 ? "bg-orange-500" : "bg-gray-200"}`} />
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Set Up Your Shop</h2>

          <input placeholder="Your Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none" />
          <input placeholder="Phone (10 digits)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none" />
          <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none" />
          <input placeholder="Shop Name" value={form.shop_name} onChange={(e) => setForm({ ...form, shop_name: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none" />
          <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none" />
          <input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none" />

          {/* Language */}
          <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base">
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="te">Telugu</option>
          </select>

          {/* Categories */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Categories</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat.toLowerCase())}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    form.categories.includes(cat.toLowerCase())
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-gray-600 border-gray-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleNext} className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors active:scale-95">
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">How should we start?</h2>
          <p className="text-gray-500">Choose how to seed your shop data.</p>

          {/* Data Path Cards */}
          {[
            { icon: "📷", title: "Upload Bill Photo (OCR)", desc: "Photograph old paper bills", key: "ocr" },
            { icon: "📊", title: "Start with Industry Averages", desc: "Recommended — see insights instantly", key: "benchmark", recommended: true },
            { icon: "🎙️", title: "I'll Tell Daily by Voice", desc: "Speak your sales every evening", key: "voice" },
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => handleFinish(option.key)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:shadow-md active:scale-[0.98] ${
                option.recommended ? "border-orange-500 bg-orange-50" : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{option.icon}</span>
                <div>
                  <p className="font-semibold text-gray-900">{option.title}</p>
                  <p className="text-sm text-gray-500">{option.desc}</p>
                  {option.recommended && (
                    <span className="inline-block mt-1 text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                      Recommended
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
