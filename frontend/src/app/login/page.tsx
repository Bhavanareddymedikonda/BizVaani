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
      localStorage.setItem("bv_shop", JSON.stringify(data.shop));

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

            .sign-up-link {
              text-align: center;
              margin-bottom: 32px;
              font-size: 15px;
              color: var(--trae-text-secondary);
            }

            .sign-up-link a {
              color: #00d4ff;
              font-weight: 800;
              text-decoration: none;
              transition: all 0.3s ease;
              padding: 6px 16px;
              border-radius: 16px;
              background: rgba(0, 212, 255, 0.1);
            }

            .sign-up-link a:hover {
              background: rgba(0, 212, 255, 0.2);
              box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
              transform: translateY(-2px);
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

          <div className="sign-up-link">
            Don't have an account?{" "}
            <Link href="/onboard">Sign Up</Link>
          </div>

          <div className="auth-container">
            <div className="auth-card">
              <div className="text-center">
                <h2 className="section-title">Welcome Back</h2>
                <p className="text-gray-400 text-sm font-medium">Sign in to your shop dashboard</p>
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="space-y-5">
                <input placeholder="Phone Number" value={form.phone} onChange={(e) => { setError(""); setForm({ ...form, phone: e.target.value }); }} className="w-full clay-input" />
                <input placeholder="Password" type="password" value={form.password} onChange={(e) => { setError(""); setForm({ ...form, password: e.target.value }); }} className="w-full clay-input" />
                <button onClick={handleLogin} disabled={loading} className="w-full py-4 clay-button">
                  {loading ? "Signing In..." : "Sign In"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}


