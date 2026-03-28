"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api";

// ============================================================
// ParticleCanvas Component — Animated particles matching onboard page
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
      const bgColor = theme === "dark" ? "rgba(74, 61, 127, 0)" : "rgba(245, 247, 252, 0)";
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

export default function LoginPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || "dark";
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);

    // Check if user is already logged in
    const token = localStorage.getItem("bv_token");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login({
        phone: form.phone,
        password: form.password,
      });
      localStorage.setItem("bv_token", data.access_token);
      localStorage.setItem("bv_user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
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

            .clay-button:disabled {
              opacity: 0.5 !important;
              cursor: not-allowed !important;
            }

            .clay-label {
              font-size: 15px !important;
              font-weight: 600 !important;
              color: var(--trae-text-primary) !important;
              margin-bottom: 8px !important;
              display: block !important;
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
          `}</style>

          <div className="clay-card">
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="section-title">Welcome Back</h2>
                <p className="section-subtitle">Sign in to your BizVaani account</p>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/40 text-red-200 px-5 py-4 rounded-2xl text-sm font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="clay-label">Phone</label>
                  <input
                    type="tel"
                    placeholder="10-digit phone number"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full clay-input"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="clay-label">Password</label>
                  <input
                    type="password"
                    placeholder="Your password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full clay-input"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 clay-button text-white mt-6"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-400/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-inherit text-gray-500 text-sm font-medium">Don't have an account?</span>
                </div>
              </div>

              <Link
                href="/onboard"
                className="w-full block text-center py-4 border-2 border-orange-500 text-orange-500 font-bold rounded-2xl hover:bg-orange-500/10 transition-all text-base"
              >
                Create Account
              </Link>

              <div className="text-center pt-2">
                <Link href="/" className="text-orange-500 hover:text-orange-400 font-medium text-sm">
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
