"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export type Theme = "light" | "dark";
export type Accent = "orange" | "teal" | "blue";

interface ThemeContextProps {
  theme: Theme;
  accent: Accent;
  setTheme: (t: Theme) => void;
  setAccent: (a: Accent) => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  if (window.location.pathname !== "/") return "dark";
  const storedTheme = (localStorage.getItem("theme") as Theme | null) || (localStorage.getItem("bv_theme") as Theme | null);
  if (storedTheme === "light" || storedTheme === "dark") return storedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialAccent(): Accent {
  if (typeof window === "undefined") return "orange";
  const storedAccent = localStorage.getItem("bv_accent");
  return storedAccent === "teal" || storedAccent === "blue" || storedAccent === "orange" ? storedAccent : "orange";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [accent, setAccent] = useState<Accent>(getInitialAccent);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const enforcedTheme: Theme = isLandingPage ? theme : "dark";
    document.documentElement.setAttribute("data-theme", enforcedTheme);
    document.documentElement.setAttribute("data-accent", accent);
    localStorage.setItem("bv_theme", enforcedTheme);
    localStorage.setItem("bv_accent", accent);
    if (isLandingPage) {
      localStorage.setItem("theme", theme);
    }
  }, [accent, isLandingPage, mounted, theme]);

  return (
    <ThemeContext.Provider value={{ theme, accent, setTheme, setAccent, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
