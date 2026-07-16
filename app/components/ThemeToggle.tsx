"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

function applyTheme(theme: Theme) {
  const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "system" && sysDark);
  const el = document.documentElement;
  el.classList.toggle("dark", dark);
  el.style.colorScheme = dark ? "dark" : "light";
}

const OPTIONS: { key: Theme; label: string; icon: string }[] = [
  { key: "light", label: "Light", icon: "☀️" },
  { key: "dark", label: "Dark", icon: "🌙" },
  { key: "system", label: "System", icon: "🖥️" },
];

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = (localStorage.getItem("theme") as Theme | null) ?? "system";
    setTheme(stored);
    setMounted(true);
  }, []);

  // Follow OS changes while in "system" mode.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (((localStorage.getItem("theme") as Theme | null) ?? "system") === "system") {
        applyTheme("system");
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const choose = (t: Theme) => {
    setTheme(t);
    localStorage.setItem("theme", t);
    applyTheme(t);
  };

  return (
    <div
      role="group"
      aria-label="Color theme"
      className="inline-flex items-center gap-0.5 rounded-full border border-slate-300/70 bg-white/70 p-0.5 backdrop-blur dark:border-white/15 dark:bg-white/5"
    >
      {OPTIONS.map((o) => {
        const active = mounted && theme === o.key;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => choose(o.key)}
            aria-pressed={active}
            title={o.label}
            className={
              "flex h-7 w-7 items-center justify-center rounded-full text-sm transition " +
              (active
                ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow"
                : "text-slate-500 hover:bg-slate-200/60 dark:text-violet-200/70 dark:hover:bg-white/10")
            }
          >
            <span aria-hidden>{o.icon}</span>
            <span className="sr-only">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
