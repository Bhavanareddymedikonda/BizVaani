"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [accent, setAccent] = useState<Accent>("orange");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only run on client
    const storedTheme = localStorage.getItem("bv_theme") as Theme;
    const storedAccent = localStorage.getItem("bv_accent") as Accent;

    if (storedTheme) setTheme(storedTheme);
    else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }

    if (storedAccent) setAccent(storedAccent);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-accent", accent);
    localStorage.setItem("bv_theme", theme);
    localStorage.setItem("bv_accent", accent);
  }, [theme, accent, mounted]);

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
