"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Clip = {
  id?: string;
  title: string;
  audioUrl: string;
  streamAudioUrl: string;
  imageUrl: string;
  duration: number;
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
          // Streaming clip may already be playable even if not fully SUCCESS.
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
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-10 sm:py-16">
      {/* Header */}
      <header className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-violet-200">
          <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
          EZE · AI Music Studio
        </div>
        <h1 className="bg-gradient-to-r from-violet-200 via-fuchsia-200 to-sky-200 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl">
          Be your own favorite artist
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-balance text-sm text-violet-100/70 sm:text-base">
          Describe the song you hear in your head. We&apos;ll write, compose, and produce it — in a couple of minutes.
        </p>
      </header>

      {/* Composer card */}
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-7">
        <label htmlFor="prompt" className="mb-2 block text-sm font-semibold text-violet-100">
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
          className="w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-4 text-[15px] text-white placeholder:text-violet-200/40 outline-none transition focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-500/20 disabled:opacity-60"
        />

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-violet-200/50">{prompt.length}/400</span>
          <div className="flex flex-wrap gap-1.5">
            {IDEAS.map((idea) => (
              <button
                key={idea}
                type="button"
                disabled={busy}
                onClick={() => setPrompt(idea)}
                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-violet-100/70 transition hover:border-fuchsia-300/40 hover:text-white disabled:opacity-50"
              >
                {idea.length > 34 ? idea.slice(0, 32) + "…" : idea}
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-violet-100/80">
            <input
              type="checkbox"
              checked={instrumental}
              disabled={busy}
              onChange={(e) => setInstrumental(e.target.checked)}
              className="h-4 w-4 accent-fuchsia-500"
            />
            Instrumental (no vocals)
          </label>

          <div className="flex items-center gap-2 text-sm text-violet-100/80">
            <span>Model</span>
            <select
              value={model}
              disabled={busy}
              onChange={(e) => setModel(e.target.value)}
              className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-sm text-white outline-none focus:border-fuchsia-400/60"
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value} className="bg-[#14141f]">
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
          <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}{" "}
            <button onClick={reset} className="font-semibold underline underline-offset-2">
              Try again
            </button>
          </p>
        )}
      </section>

      {/* Generating state */}
      {busy && (
        <section className="mt-8 flex animate-fade-up flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
          <div className="relative mb-5 flex h-16 w-16 items-center justify-center">
            <span className="absolute h-16 w-16 rounded-full bg-fuchsia-500/30 animate-pulse-ring" />
            <span className="absolute h-16 w-16 rounded-full bg-violet-500/20 animate-pulse-ring [animation-delay:0.6s]" />
            <span className="relative text-2xl">🎧</span>
          </div>
          <p className="text-lg font-semibold text-white">{statusText || "Composing your track…"}</p>
          <p className="mt-1 text-sm text-violet-200/60">
            Hang tight — great songs take a minute or two. Don&apos;t close this tab.
          </p>
        </section>
      )}

      {/* Results */}
      {phase === "done" && clips.length > 0 && (
        <section className="mt-8 animate-fade-up">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Your tracks are ready 🎉</h2>
            <button
              onClick={reset}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-violet-100 transition hover:bg-white/10"
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
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-xl"
                >
                  {clip.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={clip.imageUrl}
                      alt={clip.title}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center bg-gradient-to-br from-violet-600/40 to-fuchsia-600/40 text-4xl">
                      🎵
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="truncate font-semibold text-white">{clip.title}</h3>
                    {clip.duration > 0 && (
                      <p className="mb-3 text-xs text-violet-200/60">
                        {Math.round(clip.duration)}s
                      </p>
                    )}
                    {src ? (
                      <audio controls preload="none" src={src} className="mt-1" />
                    ) : (
                      <p className="text-sm text-violet-200/60">Preparing audio…</p>
                    )}
                    {clip.audioUrl && (
                      <a
                        href={clip.audioUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-block text-sm font-medium text-fuchsia-300 hover:text-fuchsia-200"
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

      <footer className="mt-auto pt-12 text-center text-xs text-violet-200/40">
        <p>Prototype · Music generated via Suno API · EZE</p>
        <p className="mt-1.5">
          Designed &amp; developed by{" "}
          <span className="font-semibold text-violet-200/70">Ana Zuliani</span>
        </p>
      </footer>
    </main>
  );
}
