"use client";

// ============================================================
// Landing Page — Redesigned inspired by Trae IDE
// Design: Modern, Dark-themed (default), Full-screen Hero, Grid-animation
// ============================================================

import Link from "next/link";
import { useEffect, useState, useRef } from "react";

function PixelCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    const mouse = { x: -1000, y: -1000 };

    const particles: { 
      x: number; 
      y: number; 
      vx: number; 
      vy: number; 
      size: number; 
      color: string 
    }[] = [];
    
    const particleCount = Math.min(Math.floor((width * height) / 12000), 100);
    const connectionDistance = 160;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 4 + 2.5,
        color: Math.random() > 0.5 ? "#00ff9d" : "#6366f1",
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      const theme = document.documentElement.getAttribute("data-theme") || "light";
      const baseColor = theme === "dark" ? "255, 255, 255" : "15, 23, 42";
      const accentColor = theme === "dark" ? "#00ff9d" : "#6366f1";

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Bounce
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Mouse interaction
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Soft Repulsion from mouse (replaces clumping attraction)
        const repulsionRadius = 180;
        if (dist < repulsionRadius) {
          const force = (repulsionRadius - dist) / repulsionRadius;
          const moveX = (dx / dist) * force * 1.5;
          const moveY = (dy / dist) * force * 1.5;
          p.x -= moveX;
          p.y -= moveY;
        }

        // Draw particle with glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        if (theme === "dark") {
          ctx.shadowBlur = dist < 200 ? 15 : 5;
          ctx.shadowColor = p.color;
          ctx.fillStyle = dist < 200 ? "#ffffff" : p.color;
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = `rgba(${baseColor}, ${dist < 200 ? 0.6 : 0.3})`;
        }
        
        ctx.fill();
        ctx.shadowBlur = 0; // Reset for lines

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const ldx = p.x - p2.x;
          const ldy = p.y - p2.y;
          const distance = Math.sqrt(ldx * ldx + ldy * ldy);

          if (distance < connectionDistance) {
            const opacity = (1 - distance / connectionDistance) * 0.2;
            
            // Mouse proximity makes lines brighter
            const mouseDist1 = Math.sqrt((mouse.x - p.x)**2 + (mouse.y - p.y)**2);
            const mouseDist2 = Math.sqrt((mouse.x - p2.x)**2 + (mouse.y - p2.y)**2);
            const lineHighlight = Math.max(0, 1 - Math.min(mouseDist1, mouseDist2) / 220);
            
            ctx.beginPath();
            if (theme === "dark") {
              const gradient = ctx.createLinearGradient(p.x, p.y, p2.x, p2.y);
              gradient.addColorStop(0, p.color);
              gradient.addColorStop(1, p2.color);
              ctx.strokeStyle = gradient;
              ctx.globalAlpha = opacity + lineHighlight * 0.35;
            } else {
              ctx.strokeStyle = `rgba(${baseColor}, ${opacity + lineHighlight * 0.25})`;
              ctx.globalAlpha = 1;
            }
            
            ctx.lineWidth = 0.6 + lineHighlight;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
        pointerEvents: "none",
        opacity: 0.6
      }}
    />
  );
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <div className="lp-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;900&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --trae-bg: #f5f7fc;
          --bg-rgb: 245, 247, 252;
          --trae-accent: #0066ff;
          --accent-rgb: 0, 102, 255;
          --trae-accent-hover: #0052cc;
          --trae-text-primary: #1a202c;
          --trae-text-secondary: #4a5568;
          --trae-border: rgba(0, 102, 255, 0.1);
          --trae-grid: rgba(0, 102, 255, 0.03);
          --trae-glow: rgba(0, 102, 255, 0.08);
          --trae-card-bg: #ffffff;
          --primary-gradient-1: #0066ff;
          --primary-gradient-2: #5b21b6;
          --primary-gradient-3: #ec4899;
          
          /* Claymorphism Vars - Light */
          --clay-shadow: 12px 12px 24px rgba(0, 102, 255, 0.1), -12px -12px 24px rgba(255, 100, 220, 0.05);
          --clay-inset-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.05), inset -4px -4px 8px rgba(255, 255, 255, 0.8);
          --clay-inset-high: inset 2px 2px 4px rgba(0, 0, 0, 0.03), inset -2px -2px 4px rgba(255, 255, 255, 0.8);
        }

        [data-theme="dark"] {
          --trae-bg: #0a0e27;
          --bg-rgb: 10, 14, 39;
          --trae-accent: #00d4ff;
          --accent-rgb: 0, 212, 255;
          --trae-accent-hover: #00b8d4;
          --trae-text-primary: #f0f4ff;
          --trae-text-secondary: #a4b5d4;
          --trae-border: rgba(0, 212, 255, 0.1);
          --trae-grid: rgba(0, 212, 255, 0.03);
          --trae-glow: rgba(0, 212, 255, 0.15);
          --trae-card-bg: #141829;
          --primary-gradient-1: #00d4ff;
          --primary-gradient-2: #6d28d9;
          --primary-gradient-3: #ec4899;
          
          /* Claymorphism Vars - Dark */
          --clay-shadow: 12px 12px 24px rgba(0, 0, 0, 0.4), -12px -12px 24px rgba(0, 212, 255, 0.1);
          --clay-inset-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.3), inset -4px -4px 8px rgba(0, 212, 255, 0.1);
          --clay-inset-high: inset 2px 2px 4px rgba(0, 212, 255, 0.15), inset -2px -2px 4px rgba(255, 100, 220, 0.1);
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .lp-root {
          min-height: 100svh;
          font-family: 'Space Grotesk', sans-serif;
          background: linear-gradient(135deg, var(--trae-bg) 0%, var(--trae-bg) 100%);
          color: var(--trae-text-primary);
          overflow-x: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
          transition: background 0.5s ease, color 0.4s ease;
        }

        [data-theme="dark"] .lp-root {
          background: linear-gradient(135deg, #0a0e27 0%, #1a0f3a 25%, #0f1b4d 50%, #0a0e27 75%, #0a0e27 100%);
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
        }

        [data-theme="light"] .lp-root {
          background: linear-gradient(135deg, #f5f7fc 0%, #e8ebf7 25%, #e0e9f5 50%, #f5f7fc 75%, #f5f7fc 100%);
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
        }

        /* Background Decor */
        .pixel-bg {
          position: fixed;
          top: 0; left: 0;
          width: 100%; height: 100%;
          z-index: 0;
          pointer-events: none;
          transition: background 0.5s ease;
        }

        [data-theme="dark"] .pixel-bg {
          background: linear-gradient(135deg, #0a0e27 0%, #1a0f3a 25%, #0f1b4d 50%, #0a0e27 75%, #0a0e27 100%);
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
        }

        [data-theme="light"] .pixel-bg {
          background: linear-gradient(135deg, #f5f7fc 0%, #e8ebf7 25%, #e0e9f5 50%, #f5f7fc 75%, #f5f7fc 100%);
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
        }

        .glow-sphere {
          position: fixed;
          width: 600px; height: 600px;
          border-radius: 50%;
          filter: blur(100px);
          z-index: 1;
          pointer-events: none;
          animation: pulse-glow 10s ease-in-out infinite alternate;
          transition: background 0.5s ease;
        }

        [data-theme="dark"] .glow-sphere {
          background: radial-gradient(circle, rgba(0, 212, 255, 0.3) 0%, rgba(255, 100, 220, 0.1) 40%, transparent 70%);
        }

        [data-theme="light"] .glow-sphere {
          background: radial-gradient(circle, rgba(0, 102, 255, 0.15) 0%, rgba(150, 100, 220, 0.05) 40%, transparent 70%);
        }

        .sphere-1 { top: -10%; right: -5%; }
        .sphere-2 { bottom: -10%; left: -5%; }

        /* Navbar */
        .navbar {
          position: fixed;
          top: 0; left: 0;
          width: 100%;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          background: rgba(var(--bg-rgb), 0.7);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--trae-border);
          z-index: 100;
          transition: background-color 0.4s ease, border-color 0.4s ease;
          box-shadow: 0 0 30px rgba(var(--accent-rgb), 0.05);
        }

        .nav-logo {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.5px;
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: var(--trae-text-primary);
          transition: color 0.4s ease;
          padding: 8px 16px;
          background: var(--trae-card-bg);
          border: 1px solid var(--trae-border);
          border-radius: 16px;
          box-shadow: var(--clay-shadow), var(--clay-inset-high);
        }
        .nav-logo span { color: var(--trae-accent); }
        .nav-logo:hover {
          box-shadow: 0 0 20px rgba(var(--accent-rgb), 0.2), var(--clay-shadow);
        }
        .nav-links { display: flex; gap: 32px; align-items: center; }
        .nav-link {
          color: var(--trae-text-secondary);
          text-decoration: none;
          font-weight: 500;
          font-size: 15px;
          transition: color 0.4s ease;
        }
        .nav-link:hover { color: var(--trae-text-primary); }
        .nav-cta {
          background: linear-gradient(135deg, var(--primary-gradient-1) 0%, var(--primary-gradient-2) 50%, var(--primary-gradient-3) 100%);
          background-size: 200% 200%;
          animation: gradientFlow 3s ease infinite;
          color: white;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 15px;
          text-decoration: none;
          box-shadow: 0 0 20px rgba(var(--accent-rgb), 0.3), inset 1px 1px 2px rgba(255,255,255,0.2);
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s, background 0.3s ease;
          border: 1px solid rgba(var(--accent-rgb), 0.3);
        }
        .nav-cta:hover { 
          transform: translateY(-2px) scale(1.08);
          box-shadow: 0 0 30px rgba(var(--accent-rgb), 0.5), inset 1px 1px 2px rgba(255,255,255,0.3);
        }

        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .navbar-actions a {
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .nav-login {
          color: var(--trae-text-primary);
          padding: 10px 20px;
          border: 1px solid var(--trae-border);
          border-radius: 10px;
          background: transparent;
          font-weight: 600;
          font-size: 14px;
        }

        .nav-login:hover {
          background: var(--trae-card-bg);
          box-shadow: 0 0 15px rgba(var(--accent-rgb), 0.2);
        }

        .theme-toggle {
          background: var(--trae-card-bg);
          border: 1px solid var(--trae-border);
          width: 50px;
          height: 28px;
          border-radius: 14px;
          cursor: pointer;
          position: relative;
          transition: background 0.3s ease, border-color 0.3s ease;
          padding: 2px;
          display: flex;
          align-items: center;
          box-shadow: var(--clay-inset-high);
        }

        .theme-toggle::after {
          content: '';
          position: absolute;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-gradient-1) 0%, var(--primary-gradient-2) 100%);
          transition: left 0.3s ease;
          left: 2px;
          box-shadow: 0 2px 8px rgba(var(--accent-rgb), 0.3);
        }

        [data-theme="light"] .theme-toggle::after {
          left: 24px;
        }

        .theme-toggle:hover {
          border-color: var(--trae-accent);
          box-shadow: 0 0 15px rgba(var(--accent-rgb), 0.2), var(--clay-inset-high);
        }

        /* Hero Section */
        .hero-section {
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 40px 80px 40px;
          max-width: 1400px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }

        .hero-left { flex: 1.2; }
        .hero-right { flex: 0.8; padding-left: 60px; }

        .hero-title {
          font-size: clamp(54px, 7vw, 84px);
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 24px;
          letter-spacing: -2px;
          transition: color 0.4s ease;
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          background: linear-gradient(135deg, #00d4ff 0%, #6d28d9 35%, #ec4899 70%, #00d4ff 100%);
          background-size: 200% 200%;
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards, gradientShift 6s ease-in-out infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        @keyframes slideUp {
          from { transform: translateY(60px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .hero-title span {
          display: block;
          color: var(--trae-text-secondary);
        }
        .hero-title .highlight {
          color: var(--trae-text-primary);
          background: linear-gradient(90deg, #00d4ff 0%, #6d28d9 50%, #ec4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-desc {
          font-size: 18px;
          color: var(--trae-text-secondary);
          line-height: 1.5;
          margin-bottom: 24px;
          max-width: 450px;
          opacity: 0;
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
        }

        .hero-ctas { 
          display: flex; 
          gap: 20px; 
          align-items: center; 
          margin-top: 12px;
          opacity: 0;
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards;
        }
        .cta-primary {
          background: linear-gradient(135deg, var(--primary-gradient-1) 0%, var(--primary-gradient-2) 50%, var(--primary-gradient-3) 100%);
          background-size: 200% 200%;
          animation: gradientFlow 3s ease infinite;
          color: white;
          padding: 16px 36px;
          border-radius: 16px;
          font-size: 18px;
          font-weight: 800;
          text-decoration: none;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.4s ease, box-shadow 0.3s ease;
          box-shadow: 0 0 30px rgba(var(--accent-rgb), 0.4), 0 0 60px rgba(var(--accent-rgb), 0.2), inset 2px 2px 4px rgba(255,255,255,0.2);
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(var(--accent-rgb), 0.3);
        }
        @keyframes gradientFlow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .cta-primary::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s ease;
        }
        .cta-primary:hover {
          transform: translateY(-4px) scale(1.08);
          box-shadow: 0 0 40px rgba(var(--accent-rgb), 0.6), 0 0 80px rgba(var(--accent-rgb), 0.4), inset 2px 2px 4px rgba(255,255,255,0.3);
        }
        .cta-primary:hover::before {
          left: 100%;
        }
        .cta-secondary {
          background: linear-gradient(135deg, var(--primary-gradient-1) 0%, var(--primary-gradient-2) 50%, var(--primary-gradient-3) 100%);
          background-size: 200% 200%;
          animation: gradientFlow 3s ease infinite;
          color: white;
          padding: 16px 36px;
          border-radius: 16px;
          font-size: 18px;
          font-weight: 800;
          text-decoration: none;
          border: 1px solid rgba(var(--accent-rgb), 0.3);
          box-shadow: 0 0 30px rgba(var(--accent-rgb), 0.4), 0 0 60px rgba(var(--accent-rgb), 0.2), inset 2px 2px 4px rgba(255,255,255,0.2);
          transition: background 0.4s ease, border-color 0.4s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .cta-secondary::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s ease;
        }
        .cta-secondary:hover { 
          transform: translateY(-4px) scale(1.08);
          box-shadow: 0 0 40px rgba(var(--accent-rgb), 0.6), 0 0 80px rgba(var(--accent-rgb), 0.4), inset 2px 2px 4px rgba(255,255,255,0.3);
        }
        .cta-secondary:hover::before {
          left: 100%;
        }

        /* Pixel Decoration */
        .pixel-decoration {
          position: absolute;
          z-index: 1;
          opacity: 0.4;
          pointer-events: none;
        }
        .pixels-1 { top: 20%; right: 10%; width: 200px; }

        /* Features Section */
        .section {
          padding: 80px 80px;
          max-width: 1400px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }
        .section-header { margin-bottom: 40px; }
        .section-label {
          color: var(--trae-accent);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-size: 13px;
          margin-bottom: 12px;
          display: block;
          transition: color 0.4s ease;
          text-shadow: 0 0 10px rgba(var(--accent-rgb), 0.2);
        }
        .section-title {
          font-size: 42px;
          font-weight: 800;
          max-width: 600px;
          transition: color 0.4s ease;
        }

        .grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .feature-card {
          background: var(--trae-card-bg);
          border: 1px solid var(--trae-border);
          padding: 32px;
          border-radius: 24px;
          box-shadow: var(--clay-shadow), var(--clay-inset-high);
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease, background 0.4s ease, border-color 0.4s ease;
          opacity: 0;
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          position: relative;
          overflow: hidden;
          z-index: 2;
          backdrop-filter: blur(10px);
        }
        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(var(--accent-rgb), 0.15), transparent);
          transition: left 0.6s ease;
          z-index: 0;
          pointer-events: none;
        }
        .feature-card::after {
          content: '';
          position: absolute;
          inset: -1px;
          background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.2), transparent);
          border-radius: 24px;
          opacity: 0;
          transition: opacity 0.4s ease;
          z-index: -1;
          pointer-events: none;
        }
        .feature-card:nth-child(1) { animation-delay: 0.1s; }
        .feature-card:nth-child(2) { animation-delay: 0.2s; }
        .feature-card:nth-child(3) { animation-delay: 0.3s; }
        .feature-card:hover {
          transform: translateY(-16px) scale(1.03);
          box-shadow: 0 0 40px rgba(var(--accent-rgb), 0.2), inset 0 0 20px rgba(var(--accent-rgb), 0.08);
          background: linear-gradient(135deg, var(--trae-card-bg) 0%, rgba(var(--accent-rgb), 0.05) 100%);
          border-color: rgba(var(--accent-rgb), 0.3);
        }
        .feature-card:hover::before {
          left: 100%;
        }
        .feature-card:hover::after {
          opacity: 1;
        }
        .feature-card > * {
          position: relative;
          z-index: 1;
        }
        .feature-icon { 
          font-size: 32px; 
          margin-bottom: 24px; 
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.15), rgba(var(--accent-rgb), 0.08));
          border: 1px solid rgba(var(--accent-rgb), 0.2);
          border-radius: 16px;
          box-shadow: var(--clay-inset-shadow), var(--clay-inset-high);
          animation: float 3s ease-in-out infinite;
          position: relative;
          z-index: 2;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .feature-card:hover .feature-icon {
          transform: scale(1.15) rotate(-5deg);
          box-shadow: 0 0 25px rgba(var(--accent-rgb), 0.3), var(--clay-inset-high);
        }
        .feature-title { font-size: 24px; font-weight: 700; margin-bottom: 16px; transition: color 0.4s ease; }
        .feature-desc { color: var(--trae-text-secondary); line-height: 1.6; transition: color 0.4s ease; }

        /* Animations */
        .fade-in {
          opacity: 0;
          transform: translateY(30px);
          animation: fadeIn 0.8s forwards;
        }
        @keyframes fadeIn {
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-glow {
          0% { transform: scale(1) translate(0, 0); opacity: 0.5; }
          50% { transform: scale(1.1) translate(30px, -20px); opacity: 0.8; }
          100% { transform: scale(1.2) translate(60px, 40px); opacity: 0.5; }
        }
        .delay-1 { animation-delay: 0.2s; }
        .delay-2 { animation-delay: 0.4s; }
        .delay-3 { animation-delay: 0.6s; }

        @media (max-width: 1024px) {
          .hero-section { flex-direction: column; text-align: center; padding: 140px 40px 80px; }
          .hero-right { padding-left: 0; margin-top: 60px; }
          .hero-ctas { justify-content: center; }
          .grid-3 { grid-template-columns: 1fr; }
        }

        /* Stats Section */
        .stats-section {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          padding: 40px;
          background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.05) 0%, rgba(var(--accent-rgb), 0.02) 100%);
          border: 1px solid var(--trae-border);
          border-radius: 24px;
          margin: 20px 0;
          box-shadow: var(--clay-shadow), var(--clay-inset-high);
          backdrop-filter: blur(10px);
          transition: background 0.4s ease, border-color 0.4s ease;
        }
        .stat-item {
          text-align: center;
          padding: 20px;
          transition: transform 0.3s ease;
        }
        .stat-item:hover {
          transform: translateY(-5px);
        }
        .stat-number {
          font-size: 32px;
          font-weight: 900;
          background: linear-gradient(135deg, var(--primary-gradient-1) 0%, var(--primary-gradient-2) 50%, var(--primary-gradient-3) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
        }
        .stat-label {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--trae-text-secondary);
          letter-spacing: 1px;
        }

        /* Testimonial Section */
        .testimonial-section {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }
        .testimonial-card {
          background: var(--trae-card-bg);
          border: 1px solid var(--trae-border);
          padding: 32px;
          border-radius: 24px;
          box-shadow: var(--clay-shadow), var(--clay-inset-high);
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease;
          opacity: 0;
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          position: relative;
          z-index: 2;
          backdrop-filter: blur(10px);
        }
        .testimonial-card:nth-child(1) { animation-delay: 0.2s; }
        .testimonial-card:nth-child(2) { animation-delay: 0.3s; }
        .testimonial-card:hover {
          transform: translateY(-12px);
          box-shadow: 0 0 40px rgba(var(--accent-rgb), 0.15), var(--clay-inset-high);
          border-color: rgba(var(--accent-rgb), 0.3);
        }
        .testimonial-quote {
          font-size: 16px;
          line-height: 1.6;
          color: var(--trae-text-secondary);
          margin-bottom: 20px;
          font-style: italic;
        }
        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .author-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-gradient-1) 0%, var(--primary-gradient-2) 50%, var(--primary-gradient-3) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
          box-shadow: 0 0 15px rgba(var(--accent-rgb), 0.3);
        }
        .author-info h4 {
          font-size: 14px;
          font-weight: 700;
          margin: 0;
        }
        .author-info p {
          font-size: 12px;
          color: var(--trae-text-secondary);
          margin: 4px 0 0 0;
        }

        /* CTA Section */
        .cta-section {
          background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.1) 0%, rgba(var(--accent-rgb), 0.05) 50%, rgba(var(--accent-rgb), 0.02) 100%);
          border: 1px solid rgba(var(--accent-rgb), 0.2);
          border-radius: 24px;
          padding: 60px;
          text-align: center;
          color: var(--trae-text-primary);
          position: relative;
          overflow: hidden;
          box-shadow: var(--clay-shadow), var(--clay-inset-high);
          backdrop-filter: blur(10px);
          transition: background 0.4s ease, border-color 0.4s ease;
        }
        .cta-section::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(var(--accent-rgb), 0.2), transparent);
          border-radius: 50%;
          animation: float 10s ease-in-out infinite;
          filter: blur(50px);
        }
        .cta-section::after {
          content: '';
          position: absolute;
          bottom: -50%;
          left: -50%;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(var(--accent-rgb), 0.15), transparent);
          border-radius: 50%;
          animation: float 12s ease-in-out infinite reverse;
          filter: blur(50px);
        }
        .cta-section h2 {
          font-size: 48px;
          margin-bottom: 20px;
          position: relative;
          z-index: 1;
          background: linear-gradient(135deg, var(--primary-gradient-1) 0%, var(--primary-gradient-2) 50%, var(--primary-gradient-3) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .cta-section p {
          font-size: 18px;
          margin-bottom: 32px;
          opacity: 0.8;
          position: relative;
          z-index: 1;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, var(--primary-gradient-1) 0%, var(--primary-gradient-2) 50%, var(--primary-gradient-3) 100%);
          background-size: 200% 200%;
          animation: gradientFlow 3s ease infinite;
          color: white;
          padding: 16px 40px;
          border-radius: 16px;
          font-weight: 800;
          text-decoration: none;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
          box-shadow: 0 0 30px rgba(var(--accent-rgb), 0.3), 0 0 60px rgba(var(--accent-rgb), 0.15);
          position: relative;
          z-index: 1;
          border: 1px solid rgba(var(--accent-rgb), 0.3);
        }
        .cta-button:hover {
          transform: translateY(-4px) scale(1.08);
          box-shadow: 0 0 40px rgba(var(--accent-rgb), 0.5), 0 0 80px rgba(var(--accent-rgb), 0.3);
        }

        @media (max-width: 1024px) {
          .hero-section { flex-direction: column; text-align: center; padding: 140px 40px 80px; }
          .hero-right { padding-left: 0; margin-top: 60px; }
          .hero-ctas { justify-content: center; }
          .grid-3 { grid-template-columns: 1fr; }
          .stats-section { grid-template-columns: repeat(2, 1fr); }
          .testimonial-section { grid-template-columns: 1fr; }
          .cta-section { padding: 40px; }
          .cta-section h2 { font-size: 32px; }
        }
      `}</style>

      {/* Navigation */}
      <nav className="navbar">
        <Link href="/" className="nav-logo">
          <div style={{ 
            background: 'var(--trae-accent)', 
            width: '36px', 
            height: '36px', 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '20px', 
            color: 'white',
            transition: 'background-color 0.4s ease',
            animation: 'pulse 2s ease-in-out infinite',
            boxShadow: 'inset 2px 2px 4px rgba(255,255,255,0.3)'
          }}>🏪</div>
          BizVaani
        </Link>
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
        `}</style>
        <div className="navbar-actions">
          <div className="nav-links">
            <Link href="#features" className="nav-link">Features</Link>
            <Link href="#market" className="nav-link">Market</Link>
            <Link href="#impact" className="nav-link">Impact</Link>
          </div>
          <button 
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label="Toggle theme"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          />
          <div className="navbar-actions">
            <Link href="/login" className="nav-login">Sign In</Link>
            <Link href="/onboard" className="nav-cta">Launch App</Link>
          </div>
        </div>
      </nav>

      {/* Background Decor */}
      <div className="pixel-bg" aria-hidden="true" />
      <PixelCanvas />
      <div className="glow-sphere sphere-1" aria-hidden="true" />
      <div className="glow-sphere sphere-2" aria-hidden="true" />

      <main className="lp-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-left">
            <h1 className="hero-title">
              <span className="highlight">The Real AI</span>
              Coach for <span>Your Business</span>
            </h1>
            <div className="hero-ctas">
              <Link href="/onboard" className="cta-primary">Launch BizVaani</Link>
              <Link href="#features" className="cta-secondary">Explore Features</Link>
            </div>
          </div>
          <div className="hero-right">
            <p className="hero-desc">
              Understand. Execute. Deliver. BizVaani is your AI-powered companion that helps kirana owners build independent, data-driven solutions for their shops.
            </p>
            <div style={{ display: 'flex', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--trae-accent)', transition: 'color 0.4s ease' }}>500+</div>
                <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', opacity: 0.6 }}>Stores Active</div>
              </div>
              <div style={{ borderLeft: '1px solid var(--trae-border)', paddingLeft: '24px', transition: 'border-color 0.4s ease' }}>
                <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--trae-accent)', transition: 'color 0.4s ease' }}>&lt;1.5s</div>
                <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', opacity: 0.6 }}>Voice Latency</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="section">
          <div className="section-header">
            <span className="section-label">Core Capabilities</span>
            <h2 className="section-title">Built for the future of Indian retail.</h2>
          </div>
          <div className="grid-3">
            <div className="feature-card">
              <div className="feature-icon">🎙️</div>
              <h3 className="feature-title">Voice Intelligence</h3>
              <p className="feature-desc">Speak in Hindi, Telugu, or English. BizVaani understands your business needs instantly.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3 className="feature-title">ML Forecasting</h3>
              <p className="feature-desc">Predict demand with 85%+ accuracy. Never run out of stock or waste capital on dead inventory.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌍</div>
              <h3 className="feature-title">Market Context</h3>
              <p className="feature-desc">Live Agmarknet mandi prices and competitor retail trends delivered to your ears.</p>
            </div>
          </div>
        </section>

        {/* Market Intelligence Section */}
        <section id="market" className="section" style={{ borderTop: '1px solid var(--trae-border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
            <div>
              <span className="section-label">Market Intel</span>
              <h2 className="section-title">Stay ahead of the Mandi.</h2>
              <p className="hero-desc" style={{ maxWidth: 'none', marginTop: '24px' }}>
                We bridge the gap between wholesale markets and your retail counter. Get real-time alerts on price fluctuations and supply chain shifts before they impact your margins.
              </p>
            </div>
            <div className="feature-card" style={{ background: 'linear-gradient(135deg, rgba(0, 255, 157, 0.05) 0%, rgba(249, 115, 22, 0.05) 100%)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'var(--trae-bg)', borderRadius: '16px', boxShadow: 'var(--clay-inset-shadow), var(--clay-inset-high)' }}>
                  <span>🌾 Rice (Premium)</span>
                  <span style={{ color: 'var(--trae-accent)', fontWeight: 'bold' }}>₹48.50 ↑</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'var(--trae-bg)', borderRadius: '16px', boxShadow: 'var(--clay-inset-shadow), var(--clay-inset-high)' }}>
                  <span>🥘 Tur Dal</span>
                  <span style={{ color: '#ff4d4d', fontWeight: 'bold' }}>₹142.00 ↓</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'var(--trae-bg)', borderRadius: '16px', boxShadow: 'var(--clay-inset-shadow), var(--clay-inset-high)' }}>
                  <span>🌻 Sunflower Oil</span>
                  <span style={{ color: 'var(--trae-accent)', fontWeight: 'bold' }}>₹118.00 ↑</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Impact Stats Section */}
        <section id="impact" className="section" style={{ borderTop: '1px solid var(--trae-border)' }}>
          <div className="section-header">
            <span className="section-label">On Impact</span>
            <h2 className="section-title">Proven results for kirana owners.</h2>
          </div>
          <div className="stats-section">
            <div className="stat-item">
              <div className="stat-number">85%</div>
              <div className="stat-label">Forecast Accuracy</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">2.3x</div>
              <div className="stat-label">Profit Uplift</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">40%</div>
              <div className="stat-label">Inventory Reduction</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Active Stores</div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="section" style={{ borderTop: '1px solid var(--trae-border)' }}>
          <div className="section-header">
            <span className="section-label">Stories</span>
            <h2 className="section-title">Trusted by retail leaders across India.</h2>
          </div>
          <div className="testimonial-section">
            <div className="testimonial-card">
              <div style={{ marginBottom: '12px', fontSize: '20px' }}>⭐⭐⭐⭐⭐</div>
              <p className="testimonial-quote">
                "BizVaani transformed how I manage my store. The AI insights help me stay competitive without hiring expensive consultants."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">RS</div>
                <div className="author-info">
                  <h4>Rajesh Singh</h4>
                  <p>Kirana owner, Delhi</p>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div style={{ marginBottom: '12px', fontSize: '20px' }}>⭐⭐⭐⭐⭐</div>
              <p className="testimonial-quote">
                "Voice commands in Hindi make it so easy to check prices and forecasts while managing customers. This is the future!"
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">PM</div>
                <div className="author-info">
                  <h4>Priya Mehta</h4>
                  <p>Shop owner, Mumbai</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section" style={{ borderTop: '1px solid var(--trae-border)' }}>
          <div className="cta-section">
            <h2>Ready to transform your retail business?</h2>
            <p>Join 500+ kirana owners who are already using BizVaani to grow smarter.</p>
            <Link href="/onboard" className="cta-button">Start Your Free Trial</Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="section" style={{ borderTop: '1px solid var(--trae-border)', padding: '60px 80px', textAlign: 'center' }}>
          <div style={{ marginBottom: '40px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px', textAlign: 'left', paddingBottom: '40px', borderBottom: '1px solid var(--trae-border)' }}>
            <div>
              <h4 style={{ fontWeight: '700', marginBottom: '16px' }}>Product</h4>
              <ul style={{ listStyle: 'none', padding: '0' }}>
                <li style={{ marginBottom: '8px' }}><Link href="/" style={{ color: 'var(--trae-text-secondary)', textDecoration: 'none' }}>Features</Link></li>
                <li style={{ marginBottom: '8px' }}><Link href="/" style={{ color: 'var(--trae-text-secondary)', textDecoration: 'none' }}>Pricing</Link></li>
                <li style={{ marginBottom: '8px' }}><Link href="/" style={{ color: 'var(--trae-text-secondary)', textDecoration: 'none' }}>Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontWeight: '700', marginBottom: '16px' }}>Company</h4>
              <ul style={{ listStyle: 'none', padding: '0' }}>
                <li style={{ marginBottom: '8px' }}><Link href="/" style={{ color: 'var(--trae-text-secondary)', textDecoration: 'none' }}>About</Link></li>
                <li style={{ marginBottom: '8px' }}><Link href="/" style={{ color: 'var(--trae-text-secondary)', textDecoration: 'none' }}>Blog</Link></li>
                <li style={{ marginBottom: '8px' }}><Link href="/" style={{ color: 'var(--trae-text-secondary)', textDecoration: 'none' }}>Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontWeight: '700', marginBottom: '16px' }}>Legal</h4>
              <ul style={{ listStyle: 'none', padding: '0' }}>
                <li style={{ marginBottom: '8px' }}><Link href="/" style={{ color: 'var(--trae-text-secondary)', textDecoration: 'none' }}>Privacy</Link></li>
                <li style={{ marginBottom: '8px' }}><Link href="/" style={{ color: 'var(--trae-text-secondary)', textDecoration: 'none' }}>Terms</Link></li>
                <li style={{ marginBottom: '8px' }}><Link href="/" style={{ color: 'var(--trae-text-secondary)', textDecoration: 'none' }}>Cookies</Link></li>
              </ul>
            </div>
          </div>
          <p style={{ color: 'var(--trae-text-secondary)', fontSize: '14px' }}>
            © 2026 BizVaani AI. Empowering the backbone of Indian commerce. 🇮🇳
          </p>
        </footer>
      </main>
    </div>
  );
}
