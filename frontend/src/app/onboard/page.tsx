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
    // Validate Step 1 fields
    if (!form.name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!form.phone.trim()) {
      setError("Please enter your phone number");
      return;
    }
    if (!form.password.trim()) {
      setError("Please enter a password");
      return;
    }
    if (!form.shop_name.trim()) {
      setError("Please enter your shop name");
      return;
    }
    if (!form.city.trim()) {
      setError("Please enter your city");
      return;
    }
    if (!form.state.trim()) {
      setError("Please enter your state");
      return;
    }
    if (form.categories.length === 0) {
      setError("Please select at least one business category");
      return;
    }
    setError("");
    setStep(2);
  };

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
    // Final validation before registration
    if (!form.name.trim() || !form.phone.trim() || !form.password.trim() || 
        !form.shop_name.trim() || !form.city.trim() || !form.state.trim() || 
        form.categories.length === 0) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      const res = await register({
        ...form,
        categories: form.categories,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      localStorage.setItem("bv_token", (res as any).access_token);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      localStorage.setItem("bv_user", JSON.stringify((res as any).user));
      localStorage.setItem("bv_shop", JSON.stringify((res as any).shop));

      console.log("Data path selected:", dataPath);
      setError("");
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Registration failed:", err);
      alert(err.message || "Registration failed. Please check your inputs.");
      setError("Registration failed. Please try again.");
    }
  };

  const toggleCategory = (cat: string) => {
    setError("");
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

      <main className="relative z-10 min-h-screen px-6 py-16 max-w-lg mx-auto flex items-center justify-center w-full overflow-hidden">
        <div className="w-full">
          <style>{`
            .auth-container {
              background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
              padding: 12px;
              border-radius: 54px;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
              transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
              width: 100%;
            }

            .auth-container:hover {
              transform: translateY(-12px) scale(1.01);
              box-shadow: 0 35px 60px -15px rgba(0, 0, 0, 0.6);
            }

            .auth-card {
              background: rgba(30, 27, 75, 0.85);
              border-radius: 48px;
              padding: 56px 48px;
              box-shadow: 
                inset 2px 2px 6px rgba(255, 255, 255, 0.1),
                inset -2px -2px 6px rgba(0, 0, 0, 0.4),
                0 10px 30px rgba(0, 0, 0, 0.3);
              backdrop-filter: blur(24px);
              border: 1px solid rgba(255, 255, 255, 0.08);
              width: 100%;
              position: relative;
              overflow: hidden;
            }

            [data-theme="light"] .auth-card {
              background: #f8fafc;
              box-shadow: 
                12px 12px 24px #d1d9e6, 
                -12px -12px 24px #ffffff,
                inset 2px 2px 4px rgba(255,255,255,0.8);
              border: none;
            }

            [data-theme="light"] .auth-container {
              background: transparent;
              box-shadow: none;
              padding: 0;
            }

            .clay-input {
              background: rgba(255, 255, 255, 0.05) !important;
              border: 2px solid rgba(255, 255, 255, 0.1) !important;
              border-radius: 20px !important;
              padding: 16px 24px !important;
              font-size: 16px !important;
              color: white !important;
              transition: all 0.3s ease !important;
              box-shadow: inset 2px 2px 4px rgba(0,0,0,0.2) !important;
            }

            [data-theme="light"] .clay-input {
              background: #f1f5f9 !important;
              border: none !important;
              color: #1e293b !important;
              box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff !important;
            }

            [data-theme="light"] .clay-input option {
              color: #1e293b !important;
              background: #f1f5f9 !important;
            }

            .clay-input:focus {
              border-color: #00d4ff !important;
              background: rgba(255, 255, 255, 0.08) !important;
              transform: scale(1.01);
              box-shadow: 0 0 20px rgba(0, 212, 255, 0.15), inset 2px 2px 4px rgba(0,0,0,0.2) !important;
            }

            [data-theme="light"] .clay-input:focus {
              border-color: #6366f1 !important;
              background: #e0e7ff !important;
              box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff, 0 0 15px rgba(99, 102, 241, 0.2) !important;
            }

            .clay-button {
              background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%) !important;
              border-radius: 20px !important;
              padding: 18px 32px !important;
              font-size: 18px !important;
              font-weight: 800 !important;
              border: none !important;
              box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4), inset 2px 2px 4px rgba(255,255,255,0.3) !important;
              transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
              color: white !important;
            }

            .clay-button:hover {
              transform: translateY(-4px) scale(1.02) !important;
              box-shadow: 0 15px 35px rgba(99, 102, 241, 0.5), inset 2px 2px 4px rgba(255,255,255,0.4) !important;
              filter: brightness(1.1);
            }

            [data-theme="light"] .clay-button {
              background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%) !important;
              box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3), inset 2px 2px 4px rgba(255,255,255,0.3) !important;
              color: white !important;
            }

            [data-theme="light"] .clay-button:hover {
              transform: translateY(-4px) scale(1.02) !important;
              box-shadow: 0 15px 35px rgba(99, 102, 241, 0.4), inset 2px 2px 4px rgba(255,255,255,0.4) !important;
              filter: brightness(1.05);
            }

            .clay-label {
              display: block;
              font-size: 14px !important;
              font-weight: 600 !important;
              color: #cbd5e1 !important;
              margin-bottom: 8px;
            }

            [data-theme="light"] .clay-label {
              color: #475569 !important;
            }

            .section-title {
              font-size: 36px !important;
              font-weight: 900 !important;
              background: linear-gradient(to bottom right, #fff, #94a3b8);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              margin-bottom: 12px !important;
            }

            [data-theme="light"] .section-title {
              background: linear-gradient(to bottom right, #1e293b, #64748b);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }

            .sign-in-link {
              text-align: center;
              margin-bottom: 32px;
              font-size: 15px;
              color: var(--trae-text-secondary);
            }

            .sign-in-link a {
              color: #00d4ff;
              font-weight: 800;
              text-decoration: none;
              transition: all 0.3s ease;
              padding: 6px 16px;
              border-radius: 16px;
              background: rgba(0, 212, 255, 0.1);
            }

            .sign-in-link a:hover {
              background: rgba(0, 212, 255, 0.2);
              box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
              transform: translateY(-2px);
            }

            .step-indicator {
              display: flex;
              gap: 12px;
              margin-bottom: 48px;
            }

            .step-bar {
              height: 8px;
              flex: 1;
              border-radius: 10px;
              background: rgba(255, 255, 255, 0.05);
              transition: all 0.4s ease;
            }

            .step-bar.active {
              background: linear-gradient(90deg, #6366f1 0%, #a855f7 100%);
              box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
            }

            .category-button {
              padding: 14px 22px !important;
              border-radius: 18px !important;
              font-size: 14px !important;
              font-weight: 700 !important;
              border: 2px solid rgba(255, 255, 255, 0.1) !important;
              transition: all 0.3s ease !important;
              cursor: pointer !important;
              background: rgba(255, 255, 255, 0.03) !important;
              color: white !important;
            }

            [data-theme="light"] .category-button {
              border: 2px solid #cbd5e1 !important;
              background: #f1f5f9 !important;
              color: #1e293b !important;
            }

            [data-theme="light"] .category-button:hover {
              border-color: #6366f1 !important;
              background: #e0e7ff !important;
              color: #1e293b !important;
            }

            [data-theme="light"] .category-button.selected {
              background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%) !important;
              border-color: transparent !important;
              color: white !important;
              box-shadow: 0 10px 20px rgba(99, 102, 241, 0.4) !important;
            }

            .category-button:hover {
              border-color: #6366f1 !important;
              background: rgba(99, 102, 241, 0.1) !important;
              transform: translateY(-3px);
            }

            .category-button.selected {
              background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%) !important;
              border-color: transparent !important;
              box-shadow: 0 10px 20px rgba(99, 102, 241, 0.4) !important;
            }

            .error-message {
              background: rgba(239, 68, 68, 0.1);
              border: 1px solid rgba(239, 68, 68, 0.5);
              border-radius: 12px;
              padding: 12px 16px;
              margin-bottom: 20px;
              color: #ff6b6b;
              font-size: 14px;
              font-weight: 600;
              animation: slideDown 0.3s ease-out;
            }

            @keyframes slideDown {
              from {
                opacity: 0;
                transform: translateY(-10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            [data-theme="light"] .error-message {
              background: rgba(239, 68, 68, 0.05);
              border: 1px solid rgba(239, 68, 68, 0.3);
              color: #dc2626;
            }
          `}</style>

          <div className="sign-in-link">
            Already have an account?{" "}
            <Link href="/login">Sign In</Link>
          </div>

          <div className="auth-container">
            <div className="auth-card">
              {/* Step Indicator */}
              <div className="step-indicator">
                <div className={`step-bar ${step >= 1 ? "active" : ""}`} />
                <div className={`step-bar ${step >= 2 ? "active" : ""}`} />
              </div>

              {/* Error Message Display */}
              {error && <div className="error-message">{error}</div>}

              <div className="space-y-6">
              {step === 1 && (
                <>
                  <div className="text-center">
                    <h2 className="section-title">Set Up Your Shop</h2>
                    <p className="text-gray-400 text-sm font-medium">Create your AI-powered retail profile</p>
                  </div>

                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <input placeholder="Your Name" value={form.name} onChange={(e) => { setError(""); setForm({ ...form, name: e.target.value }); }} className="w-full clay-input" />
                      <input placeholder="Phone" value={form.phone} onChange={(e) => { setError(""); setForm({ ...form, phone: e.target.value }); }} className="w-full clay-input" />
                    </div>
                    <input placeholder="Password" type="password" value={form.password} onChange={(e) => { setError(""); setForm({ ...form, password: e.target.value }); }} className="w-full clay-input" />
                    <input placeholder="Shop Name" value={form.shop_name} onChange={(e) => { setError(""); setForm({ ...form, shop_name: e.target.value }); }} className="w-full clay-input" />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <input placeholder="City" value={form.city} onChange={(e) => { setError(""); setForm({ ...form, city: e.target.value }); }} className="w-full clay-input" />
                      <input placeholder="State" value={form.state} onChange={(e) => { setError(""); setForm({ ...form, state: e.target.value }); }} className="w-full clay-input" />
                    </div>

                    {/* Language */}
                    <div className="space-y-2">
                      <label className="clay-label">Preferred Language</label>
                      <select value={form.language} onChange={(e) => { setError(""); setForm({ ...form, language: e.target.value }); }} className="w-full clay-input appearance-none">
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="te">Telugu</option>
                      </select>
                    </div>

                    {/* Categories */}
                    <div className="space-y-3">
                      <label className="clay-label">Business Categories</label>
                      <div className="flex flex-wrap gap-2">
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

                    <button onClick={handleNext} className="w-full py-4 clay-button mt-6">
                      Continue →
                    </button>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="text-center">
                    <h2 className="section-title">Data Strategy</h2>
                    <p className="text-gray-400 text-sm font-medium">How should we seed your shop data?</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { icon: "📊", title: "Industry Benchmarks", desc: "Start with smart averages", key: "benchmark", recommended: true },
                      { icon: "📷", title: "Bill Scan (OCR)", desc: "Upload your paper bills", key: "ocr" },
                      { icon: "🎙️", title: "Voice Journal", desc: "Tell us your sales daily", key: "voice" },
                    ].map((option) => (
                      <button
                        key={option.key}
                        onClick={() => handleFinish(option.key)}
                        className={`w-full text-left p-6 rounded-3xl border-2 transition-all hover:shadow-2xl active:scale-[0.98] relative overflow-hidden group ${
                          option.recommended 
                            ? "border-cyan-500/50 bg-cyan-500/5" 
                            : "border-white/5 bg-white/2 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-5">
                          <span className="text-4xl group-hover:scale-110 transition-transform">{option.icon}</span>
                          <div>
                            <p className="font-bold text-lg text-white">{option.title}</p>
                            <p className="text-sm text-gray-400">{option.desc}</p>
                          </div>
                        </div>
                        {option.recommended && (
                          <div className="absolute top-0 right-0 bg-cyan-500 text-black text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-tighter">
                            Best Choice
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  <div className="text-center pt-4">
                    <button onClick={() => setStep(1)} className="text-gray-500 hover:text-white transition-colors text-sm font-bold">
                      ← Go Back
                    </button>
                  </div>
                </>
              )}
            </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}


