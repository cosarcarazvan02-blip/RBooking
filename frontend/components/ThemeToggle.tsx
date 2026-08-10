"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);

    const root = document.documentElement;
    if (nextTheme === "dark") {
      root.classList.add("dark");
      localStorage.setItem("rbooking_theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("rbooking_theme", "light");
    }
  };

  if (!mounted) {
    return (
      <div className="w-24 h-8 border border-neutral-300 dark:border-white/20 bg-neutral-100 dark:bg-white/10" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Comută între Light și Dark mode"
      className="flex items-center gap-2 px-3 py-2 text-xs font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer border bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border-neutral-300 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white dark:border-white/20 shadow-sm active:scale-95"
      title={theme === "dark" ? "Activează Light Mode" : "Activează Dark Mode"}
    >
      {theme === "dark" ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-300" />
          <span>Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-neutral-800" />
          <span>Dark Mode</span>
        </>
      )}
    </button>
  );
}
