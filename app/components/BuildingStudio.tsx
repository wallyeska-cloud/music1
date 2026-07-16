"use client";

import { useEffect, useRef, useState } from "react";

const STAGES = [
  { label: "Warming up the studio", icon: "🎛️" },
  { label: "Writing lyrics & melody", icon: "✍️" },
  { label: "Recording the first take", icon: "🎤" },
  { label: "Mixing & mastering", icon: "🎚️" },
];

const TIPS = [
  "Great songs are worth the wait…",
  "The AI band is tuning up 🎸",
  "Layering vocals and harmonies…",
  "Sprinkling in a little studio magic ✨",
  "Almost showtime — keep this tab open.",
];

function stageIndex(status: string): number {
  switch (status) {
    case "TEXT_SUCCESS":
      return 1;
    case "FIRST_SUCCESS":
      return 2;
    case "SUCCESS":
      return 3;
    case "PENDING":
    default:
      return 0;
  }
}

export default function BuildingStudio({ status }: { status: string }) {
  const [elapsed, setElapsed] = useState(0);
  const [tip, setTip] = useState(0);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTip((i) => (i + 1) % TIPS.length), 3500);
    return () => clearInterval(t);
  }, []);

  const current = stageIndex(status);
  // Blend stage progress with elapsed time so the bar always feels alive.
  const pct = Math.min(96, 6 + current * 26 + Math.min(elapsed, 45) * 0.4);
  const mm = Math.floor(elapsed / 60);
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <section className="mt-8 animate-fade-up overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-2xl shadow-slate-300/40 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.03] dark:shadow-black/40 sm:p-8">
      {/* Animated equalizer */}
      <div className="mx-auto flex h-14 items-end justify-center gap-1.5" aria-hidden>
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className="w-1.5 origin-bottom rounded-full bg-gradient-to-t from-violet-500 to-fuchsia-400 animate-eq motion-reduce:animate-none"
            style={{ height: "100%", animationDelay: `${(i % 5) * 0.14}s`, animationDuration: `${0.9 + (i % 3) * 0.2}s` }}
          />
        ))}
      </div>

      <h2 className="mt-5 text-center text-xl font-bold text-slate-900 dark:text-white">
        Composing your song
      </h2>
      <p
        key={tip}
        className="mt-1 animate-fade-in text-center text-sm text-slate-500 dark:text-violet-200/60"
      >
        {TIPS[tip]}
      </p>

      {/* Progress bar */}
      <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 transition-[width] duration-1000 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] font-medium text-slate-400 dark:text-violet-200/40">
        <span>{Math.round(pct)}%</span>
        <span className="tabular-nums">
          {mm}:{ss} elapsed
        </span>
      </div>

      {/* Stage checklist */}
      <ol className="mt-6 space-y-2.5">
        {STAGES.map((stage, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li
              key={stage.label}
              className={
                "flex items-center gap-3 rounded-xl border px-3 py-2 transition-all duration-300 " +
                (active
                  ? "border-fuchsia-300 bg-fuchsia-50 dark:border-fuchsia-400/30 dark:bg-fuchsia-500/10"
                  : done
                    ? "border-transparent bg-slate-50 dark:bg-white/5"
                    : "border-transparent bg-transparent opacity-50")
              }
            >
              <span
                className={
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm transition " +
                  (done
                    ? "bg-emerald-500 text-white"
                    : active
                      ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"
                      : "bg-slate-200 text-slate-400 dark:bg-white/10 dark:text-violet-200/50")
                }
              >
                {done ? "✓" : active ? <span className="animate-float motion-reduce:animate-none">{stage.icon}</span> : stage.icon}
              </span>
              <span
                className={
                  "text-sm " +
                  (active
                    ? "font-semibold text-slate-900 dark:text-white"
                    : "text-slate-600 dark:text-violet-100/70")
                }
              >
                {stage.label}
              </span>
              {active && (
                <span className="ml-auto flex gap-1" aria-hidden>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-fuchsia-400 [animation-delay:-0.3s] motion-reduce:animate-none" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-fuchsia-400 [animation-delay:-0.15s] motion-reduce:animate-none" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-fuchsia-400 motion-reduce:animate-none" />
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <p className="mt-5 text-center text-xs text-slate-400 dark:text-violet-200/40">
        Hang tight — great songs take a minute or two. Don&apos;t close this tab.
      </p>
    </section>
  );
}
