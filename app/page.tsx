"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ThemeToggle from "./components/ThemeToggle";

type Clip = {
  id?: string;
  title: string;
  audioUrl: string;
  streamAudioUrl: string;
  imageUrl: string;
  duration: number;
  lyrics: string;
  tags: string;
};

type Phase = "idle" | "starting" | "generating" | "done" | "error";

const MODELS = [
  { value: "V4_5", label: "V4.5 — balanced (recommended)" },
  { value: "V4_5PLUS", label: "V4.5+ — richer sound" },
  { value: "V5", label: "V5 — newest" },
  { value: "V4", label: "V4 — classic" },
];

const IDEAS = [
  "An uplifting indie-pop anthem about chasing a dream at sunrise",
  "A dreamy lo-fi beat for late-night studying, soft piano and rain",
  "An epic cinematic orchestral piece for a hero's final battle",
  "A funky 80s synthwave track with a driving bassline",
];

const FAIL_STATUSES = new Set([
  "CREATE_TASK_FAILED",
  "GENERATE_AUDIO_FAILED",
  "CALLBACK_EXCEPTION",
  "SENSITIVE_WORD_ERROR",
]);

const STATUS_COPY: Record<string, string> = {
  PENDING: "Warming up the studio…",
  TEXT_SUCCESS: "Writing your lyrics and arrangement…",
  FIRST_SUCCESS: "Your first track is landing — almost there…",
  SUCCESS: "Done!",
};

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [instrumental, setInstrumental] = useState(false);
  const [model, setModel] = useState("V4_5");

  const [phase, setPhase] = useState<Phase>("idle");
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState("");
  const [clips, setClips] = useState<Clip[]>([]);

  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deadlineRef = useRef<number>(0);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const poll = useCallback(
    async (taskId: string) => {
      try {
        const res = await fetch(`/api/status?taskId=${encodeURIComponent(taskId)}`, {
          cache: "no-store",
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Could not check on your song.");
        }

        const status: string = data.status || "PENDING";
        const nextClips: Clip[] = data.clips || [];
        if (nextClips.length) setClips(nextClips);
        setStatusText(STATUS_COPY[status] || "Composing your track…");

        const hasPlayable = nextClips.some((c) => c.audioUrl || c.streamAudioUrl);

        if (status === "SUCCESS" && hasPlayable) {
          setPhase("done");
          stopPolling();
          return;
        }
        if (FAIL_STATUSES.has(status)) {
          throw new Error(
            status === "SENSITIVE_WORD_ERROR"
              ? "That description was flagged. Try rephrasing it."
              : "The music service couldn't finish this one. Please try again.",
          );
        }
        if (Date.now() > deadlineRef.current) {
          if (hasPlayable) {
            setPhase("done");
            stopPolling();
            return;
          }
          throw new Error("This is taking longer than expected. Please try again.");
        }

        pollRef.current = setTimeout(() => poll(taskId), 5000);
      } catch (e: any) {
        setError(e?.message || "Something went wrong.");
        setPhase("error");
        stopPolling();
      }
    },
    [stopPolling],
  );

  const generate = useCallback(async () => {
    if (!prompt.trim() || phase === "starting" || phase === "generating") return;
    setError("");
    setClips([]);
    setPhase("starting");
    setStatusText("Sending your idea to the studio…");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), instrumental, model }),
      });
      const data = await res.json();
      if (!res.ok || !data?.taskId) {
        throw new Error(data?.error || "Could not start your song.");
      }
      setPhase("generating");
      deadlineRef.current = Date.now() + 3 * 60 * 1000; // 3 min budget
      poll(data.taskId);
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
      setPhase("error");
    }
  }, [prompt, instrumental, model, phase, poll]);

  const reset = useCallback(() => {
    stopPolling();
    setPhase("idle");
    setError("");
    setClips([]);
    setStatusText("");
  }, [stopPolling]);

  const busy = phase === "starting" || phase === "generating";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-8 sm:py-12">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-end">
        <ThemeToggle />
      </div>

      {/* Header */}
      <header className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/70 px-3 py-1 text-xs font-medium text-violet-700 dark:border-white/15 dark:bg-white/5 dark:text-violet-200">
          <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-500 dark:bg-fuchsia-400" />
          EZE · AI Music Studio
        </div>
        <h1 className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-sky-500 bg-clip-text text-4xl font-black tracking-tight text-transparent dark:from-violet-200 dark:via-fuchsia-200 dark:to-sky-200 sm:text-5xl">
          Be your own favorite artist
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-balance text-sm text-slate-600 dark:text-violet-100/70 sm:text-base">
          Describe the song you hear in your head. We&apos;ll write, compose, and produce it — in a couple of minutes.
        </p>
      </header>

      {/* Composer card */}
      <section className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-2xl shadow-slate-300/40 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/40 sm:p-7">
        <label htmlFor="prompt" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-violet-100">
          What should your song be about?
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={busy}
          rows={4}
          maxLength={400}
          placeholder="e.g. A warm acoustic love song for a summer road trip, gentle guitar and soft vocals"
          className="w-full resize-none rounded-2xl border border-slate-300 bg-white p-4 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-500/20 disabled:opacity-60 dark:border-white/10 dark:bg-black/30 dark:text-white dark:placeholder:text-violet-200/40 dark:focus:border-fuchsia-400/60"
        />

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-slate-400 dark:text-violet-200/50">{prompt.length}/400</span>
          <div className="flex flex-wrap gap-1.5">
            {IDEAS.map((idea) => (
              <button
                key={idea}
                type="button"
                disabled={busy}
                onClick={() => setPrompt(idea)}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600 transition hover:border-fuchsia-300 hover:text-slate-900 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-violet-100/70 dark:hover:border-fuchsia-300/40 dark:hover:text-white"
              >
                {idea.length > 34 ? idea.slice(0, 32) + "…" : idea}
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-slate-700 dark:text-violet-100/80">
            <input
              type="checkbox"
              checked={instrumental}
              disabled={busy}
              onChange={(e) => setInstrumental(e.target.checked)}
              className="h-4 w-4 accent-fuchsia-500"
            />
            Instrumental (no vocals)
          </label>

          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-violet-100/80">
            <span>Model</span>
            <select
              value={model}
              disabled={busy}
              onChange={(e) => setModel(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 outline-none focus:border-fuchsia-400 dark:border-white/10 dark:bg-black/40 dark:text-white dark:focus:border-fuchsia-400/60"
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value} className="bg-white dark:bg-[#14141f]">
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={generate}
          disabled={busy || !prompt.trim()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-fuchsia-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Creating…" : "✨ Create my song"}
        </button>

        {error && (
          <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
            {error}{" "}
            <button onClick={reset} className="font-semibold underline underline-offset-2">
              Try again
            </button>
          </p>
        )}
      </section>

      {/* Generating state */}
      {busy && (
        <section className="mt-8 flex animate-fade-up flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white/70 p-10 text-center dark:border-white/10 dark:bg-white/[0.03]">
          <div className="relative mb-5 flex h-16 w-16 items-center justify-center">
            <span className="absolute h-16 w-16 rounded-full bg-fuchsia-500/30 animate-pulse-ring" />
            <span className="absolute h-16 w-16 rounded-full bg-violet-500/20 animate-pulse-ring [animation-delay:0.6s]" />
            <span className="relative text-2xl">🎧</span>
          </div>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">{statusText || "Composing your track…"}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-violet-200/60">
            Hang tight — great songs take a minute or two. Don&apos;t close this tab.
          </p>
        </section>
      )}

      {/* Results */}
      {phase === "done" && clips.length > 0 && (
        <section className="mt-8 animate-fade-up">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your tracks are ready 🎉</h2>
            <button
              onClick={reset}
              className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-violet-100 dark:hover:bg-white/10"
            >
              Create another
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {clips.map((clip, i) => {
              const src = clip.audioUrl || clip.streamAudioUrl;
              return (
                <article
                  key={clip.id || i}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-300/30 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/30"
                >
                  {clip.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={clip.imageUrl}
                      alt={clip.title}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center bg-gradient-to-br from-violet-500/40 to-fuchsia-500/40 text-4xl">
                      🎵
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="truncate font-semibold text-slate-900 dark:text-white">{clip.title}</h3>
                    <div className="mb-3 mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500 dark:text-violet-200/60">
                      {clip.duration > 0 && <span>{Math.round(clip.duration)}s</span>}
                      {clip.tags && (
                        <span className="truncate italic">· {clip.tags}</span>
                      )}
                    </div>

                    {src ? (
                      <audio controls preload="none" src={src} />
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-violet-200/60">Preparing audio…</p>
                    )}

                    {/* Lyrics */}
                    {clip.lyrics ? (
                      <details open className="group mt-3">
                        <summary className="flex cursor-pointer list-none items-center gap-1 text-sm font-medium text-violet-700 hover:text-violet-900 dark:text-fuchsia-300 dark:hover:text-fuchsia-200">
                          <span className="transition group-open:rotate-90">▸</span> Lyrics
                        </summary>
                        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3 font-sans text-[13px] leading-relaxed text-slate-700 dark:border-white/10 dark:bg-black/20 dark:text-violet-100/80">
{clip.lyrics}
                        </pre>
                      </details>
                    ) : (
                      <p className="mt-3 text-xs italic text-slate-400 dark:text-violet-200/50">
                        Instrumental — no lyrics
                      </p>
                    )}

                    {clip.audioUrl && (
                      <a
                        href={clip.audioUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-block text-sm font-medium text-fuchsia-600 hover:text-fuchsia-500 dark:text-fuchsia-300 dark:hover:text-fuchsia-200"
                      >
                        Download ↓
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <footer className="mt-auto pt-12 text-center text-xs text-slate-400 dark:text-violet-200/40">
        <p>Prototype · Music generated via Suno API · EZE</p>
        <p className="mt-1.5">
          Designed &amp; developed by{" "}
          <span className="font-semibold text-slate-500 dark:text-violet-200/70">Ana Zuliani</span>
        </p>
      </footer>
    </main>
  );
}
