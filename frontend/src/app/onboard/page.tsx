"use client";

// ============================================================
// Onboarding Page — Task: Member B
// See: APP_FLOW.md (Flow 1), BizVaani_Developer_Reference.md (Section 5)
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/api";

const CATEGORIES = ["Grains", "Dairy", "FMCG", "Vegetables", "General"];

// ============================================================
// ParticleCanvas Component — Animated particles matching landing page
// ============================================================
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    setTheme(
      (localStorage.getItem("theme") as "light" | "dark") || "dark"
    );
    const handleThemeChange = () => {
      setTheme(
        (localStorage.getItem("theme") as "light" | "dark") || "dark"
      );
    };
    window.addEventListener("storage", handleThemeChange);
    return () => window.removeEventListener("storage", handleThemeChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
    }> = [];

    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.25,
      });
    }

    let animating = true;
    const animate = () => {
      if (!animating) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bgColor = theme === "dark" ? "rgba(10, 14, 39, 0)" : "rgba(245, 247, 252, 0)";
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const color = theme === "dark" ? `rgba(0, 212, 255, ${p.opacity})` : `rgba(0, 102, 255, ${p.opacity})`;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => {
      animating = false;
      window.removeEventListener("resize", handleResize);
    };
  }, [theme]);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
}

export default function OnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);
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

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || "dark";
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

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
    <>
      <ParticleCanvas />
      
      {/* Glow Sphere Decorations */}
      <div className="glow-sphere glow-sphere-1" />
      <div className="glow-sphere glow-sphere-2" />
      
      {/* Fixed Header with Theme Toggle */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-4 backdrop-blur-sm bg-white/5">
        <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          BizVaani
        </h1>
        {mounted && (
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label="Toggle theme"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          />
        )}
      </header>

      <main className="relative z-10 min-h-screen px-6 py-8 max-w-lg mx-auto flex items-center justify-center">
        <div className="w-full pt-16">
          <style>{`
            .clay-card {
              background: var(--card-bg);
              border-radius: 24px;
              padding: 48px;
              box-shadow: var(--clay-shadow);
              border: 1px solid rgba(255, 255, 255, 0.08);
              backdrop-filter: blur(10px);
            }

            [data-theme="dark"] .clay-card {
              background: rgba(74, 61, 127, 0.4);
              box-shadow: 
                12px 12px 24px rgba(0, 0, 0, 0.4),
                -12px -12px 24px rgba(0, 212, 255, 0.1),
                inset 0 0 0 1px rgba(0, 212, 255, 0.1);
            }

            [data-theme="light"] .clay-card {
              background: rgba(243, 245, 249, 0.8);
              box-shadow: 
                12px 12px 24px rgba(0, 102, 255, 0.1),
                -12px -12px 24px rgba(255, 100, 220, 0.05),
                inset 4px 4px 8px rgba(0, 0, 0, 0.05),
                inset -4px -4px 8px rgba(255, 255, 255, 0.8);
            }

            .clay-input {
              background: rgba(255, 255, 255, 0.05) !important;
              border: 1.5px solid rgba(0, 212, 255, 0.2) !important;
              border-radius: 16px !important;
              padding: 14px 18px !important;
              font-size: 16px !important;
              transition: all 0.3s ease !important;
              box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.1),
                          inset -2px -2px 4px rgba(255, 255, 255, 0.05) !important;
            }

            .clay-input::placeholder {
              color: rgba(160, 166, 181, 0.7) !important;
            }

            .clay-input:focus {
              border-color: #00d4ff !important;
              background: rgba(255, 255, 255, 0.08) !important;
              box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.1),
                          inset -2px -2px 4px rgba(255, 255, 255, 0.05),
                          0 0 20px rgba(0, 212, 255, 0.3) !important;
            }

            .clay-button {
              background: linear-gradient(135deg, #00d4ff 0%, #6d28d9 100%) !important;
              border-radius: 16px !important;
              padding: 14px 28px !important;
              font-size: 16px !important;
              font-weight: 600 !important;
              border: 1px solid rgba(0, 212, 255, 0.3) !important;
              box-shadow: 0 8px 32px rgba(0, 212, 255, 0.25),
                          inset 1px 1px 2px rgba(255, 255, 255, 0.2) !important;
              transition: all 0.3s ease !important;
            }

            .clay-button:hover {
              box-shadow: 0 12px 40px rgba(0, 212, 255, 0.35),
                          inset 1px 1px 2px rgba(255, 255, 255, 0.3) !important;
              transform: translateY(-2px) !important;
            }

            .clay-button:active {
              transform: translateY(0) !important;
            }

            .section-title {
              font-size: 32px !important;
              font-weight: 700 !important;
              color: var(--trae-text-primary) !important;
              margin-bottom: 24px !important;
            }

            .section-subtitle {
              font-size: 16px !important;
              color: var(--trae-text-secondary) !important;
              margin-bottom: 24px !important;
            }

            .clay-label {
              font-size: 15px !important;
              font-weight: 600 !important;
              color: var(--trae-text-primary) !important;
              margin-bottom: 8px !important;
              display: block !important;
            }

            .sign-in-link {
              text-align: center;
              margin-bottom: 16px;
              font-size: 14px;
              color: var(--trae-text-secondary);
            }

            .sign-in-link a {
              color: var(--accent, #f97316);
              font-weight: 600;
              text-decoration: none;
              transition: color 0.3s ease;
            }

            .sign-in-link a:hover {
              color: var(--accent-hover, #ea580c);
            }

            .step-indicator {
              display: flex;
              gap: 8px;
              margin-bottom: 32px;
            }

            .step-bar {
              height: 3px;
              flex: 1;
              border-radius: 2px;
              background: rgba(255, 255, 255, 0.1);
              transition: all 0.3s ease;
            }

            .step-bar.active {
              background: linear-gradient(90deg, #00d4ff 0%, #6d28d9 100%);
              box-shadow: 0 0 12px rgba(0, 212, 255, 0.5);
            }

            .category-button {
              padding: 10px 18px !important;
              border-radius: 20px !important;
              font-size: 14px !important;
              font-weight: 600 !important;
              border: 2px solid !important;
              transition: all 0.3s ease !important;
              cursor: pointer !important;
              background: rgba(255, 255, 255, 0.05) !important;
              color: var(--trae-text-primary) !important;
              border-color: rgba(0, 212, 255, 0.2) !important;
            }

            .category-button:hover {
              border-color: #00d4ff !important;
              background: rgba(0, 212, 255, 0.1) !important;
            }

            .category-button.selected {
              background: linear-gradient(135deg, #00d4ff 0%, #6d28d9 100%) !important;
              border-color: transparent !important;
              color: white !important;
              box-shadow: 0 0 16px rgba(0, 212, 255, 0.4) !important;
            }
          `}</style>

          <div className="sign-in-link">
            Already have an account?{" "}
            <Link href="/login">Sign In</Link>
          </div>

          <div className="clay-card">
            {/* Step Indicator */}
            <div className="step-indicator">
              <div className={`step-bar ${step >= 1 ? "active" : ""}`} />
              <div className={`step-bar ${step >= 2 ? "active" : ""}`} />
            </div>

            <div className="space-y-5">
              {step === 1 && (
                <>
                  <h2 className="section-title">Set Up Your Shop</h2>

                  <div className="space-y-5">
                    <input placeholder="Your Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full clay-input" />
                    <input placeholder="Phone (10 digits)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full clay-input" />
                    <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full clay-input" />
                    <input placeholder="Shop Name" value={form.shop_name} onChange={(e) => setForm({ ...form, shop_name: e.target.value })} className="w-full clay-input" />
                    <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full clay-input" />
                    <input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full clay-input" />

                    {/* Language */}
                    <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className="w-full clay-input">
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="te">Telugu</option>
                    </select>

                    {/* Categories */}
                    <div>
                      <label className="clay-label">Categories</label>
                      <div className="flex flex-wrap gap-3">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => toggleCategory(cat.toLowerCase())}
                            className={`category-button ${
                              form.categories.includes(cat.toLowerCase()) ? "selected" : ""
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button onClick={handleNext} className="w-full py-4 clay-button text-white mt-6">
                      Next
                    </button>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className="section-title">How should we start?</h2>
                  <p className="section-subtitle">Choose how to seed your shop data.</p>

                  <div className="space-y-4">
                    {[
                      { icon: "📷", title: "Upload Bill Photo (OCR)", desc: "Photograph old paper bills", key: "ocr" },
                      { icon: "📊", title: "Start with Industry Averages", desc: "Recommended — see insights instantly", key: "benchmark", recommended: true },
                      { icon: "🎙️", title: "I'll Tell Daily by Voice", desc: "Speak your sales every evening", key: "voice" },
                    ].map((option) => (
                      <button
                        key={option.key}
                        onClick={() => handleFinish(option.key)}
                        className={`w-full text-left p-5 rounded-xl border-2 transition-all hover:shadow-lg active:scale-[0.98] ${
                          option.recommended 
                            ? "border-cyan-500/50 bg-cyan-500/10" 
                            : "border-cyan-500/20 bg-transparent hover:bg-cyan-500/5"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <span className="text-3xl">{option.icon}</span>
                          <div>
                            <p className="font-semibold text-lg text-cyan-400">{option.title}</p>
                            <p className="text-sm text-gray-400 mt-1">{option.desc}</p>
                            {option.recommended && (
                              <span className="inline-block mt-2 text-xs font-bold text-cyan-300 bg-cyan-500/20 px-3 py-1 rounded-full">
                                Recommended
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
