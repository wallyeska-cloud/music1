"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Minimal Web Speech API typings — not in TypeScript's DOM lib, and
// Safari/older Chrome only expose the `webkit`-prefixed constructor.
type SpeechAlternative = { transcript: string };
type SpeechResult = { isFinal: boolean; 0: SpeechAlternative; length: number };
type SpeechResultEvent = { resultIndex: number; results: ArrayLike<SpeechResult> };
type SpeechErrorEvent = { error: string };

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onerror: ((e: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const MAX_SECONDS = 90;

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Microphone access is blocked. Allow it in your browser settings, or just type instead.",
  "service-not-allowed": "Voice input isn't available in this browser. You can type instead.",
  "no-speech": "We didn't hear anything — tap the mic and try again.",
  "audio-capture": "No microphone found. You can type instead.",
  network: "Voice input needs an internet connection. Try again, or type instead.",
};

type Props = {
  /** Current text in the field; speech is appended after it. */
  value: string;
  onChange: (next: string) => void;
  maxLength: number;
  disabled?: boolean;
};

export default function VoiceMemoButton({ value, onChange, maxLength, disabled }: Props) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const baseRef = useRef("");
  const finalRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Detect after mount so server and client markup match.
  useEffect(() => setSupported(getRecognitionCtor() !== null), []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  useEffect(
    () => () => {
      recRef.current?.abort();
      clearTimer();
    },
    [clearTimer],
  );

  // Auto-stop when the memo runs long or the field is full.
  useEffect(() => {
    if (listening && seconds >= MAX_SECONDS) stop();
  }, [listening, seconds, stop]);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor || disabled) return;

    setError("");
    baseRef.current = value.trimEnd();
    finalRef.current = "";

    const rec = new Ctor();
    rec.lang = navigator.language || "en-US";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current += r[0].transcript;
        else interim += r[0].transcript;
      }
      const spoken = (finalRef.current + interim).trim();
      const joined = [baseRef.current, spoken].filter(Boolean).join(" ");
      onChange(joined.slice(0, maxLength));
      if (joined.length >= maxLength) rec.stop();
    };

    rec.onerror = (e) => {
      if (e.error === "aborted") return;
      setError(ERROR_MESSAGES[e.error] ?? "Voice input stopped unexpectedly. Try again, or type instead.");
    };

    rec.onend = () => {
      setListening(false);
      clearTimer();
      recRef.current = null;
    };

    try {
      rec.start();
    } catch {
      setError("Couldn't start the microphone. Try again, or type instead.");
      return;
    }

    recRef.current = rec;
    setListening(true);
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }, [value, onChange, maxLength, disabled, clearTimer]);

  if (!supported) return null;

  const mmss = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={listening ? stop : start}
        disabled={disabled && !listening}
        aria-pressed={listening}
        aria-label={listening ? "Stop voice memo" : "Record a voice memo"}
        className={`group flex w-full items-center justify-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${
          listening
            ? "border-red-300 bg-red-50 text-red-700 dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-200"
            : "border-dashed border-fuchsia-300 bg-fuchsia-50/60 text-fuchsia-700 hover:-translate-y-0.5 hover:border-fuchsia-400 hover:bg-fuchsia-50 dark:border-fuchsia-300/30 dark:bg-fuchsia-500/5 dark:text-fuchsia-200 dark:hover:bg-fuchsia-500/10"
        }`}
      >
        <span className="relative flex h-8 w-8 items-center justify-center">
          {listening && (
            <span className="absolute inset-0 rounded-full bg-red-400/60 animate-pulse-ring motion-reduce:hidden" />
          )}
          <span
            className={`relative flex h-8 w-8 items-center justify-center rounded-full text-white ${
              listening ? "bg-red-500" : "bg-gradient-to-br from-violet-500 to-fuchsia-500"
            }`}
          >
            {listening ? (
              <span className="h-2.5 w-2.5 rounded-sm bg-white" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z" />
              </svg>
            )}
          </span>
        </span>

        {listening ? (
          <span className="flex items-center gap-3">
            <span>Listening… tap to stop</span>
            <span className="flex h-4 items-end gap-0.5" aria-hidden="true">
              {[0, 0.15, 0.3, 0.45].map((d) => (
                <span
                  key={d}
                  style={{ animationDelay: `${d}s` }}
                  className="h-full w-0.5 origin-bottom rounded-full bg-red-500 animate-eq motion-reduce:animate-none"
                />
              ))}
            </span>
            <span className="tabular-nums font-normal opacity-80">{mmss}</span>
          </span>
        ) : (
          <span>Or just tell us — record a voice memo</span>
        )}
      </button>

      <p className="mt-1.5 text-center text-[11px] text-slate-400 dark:text-violet-200/50" aria-live="polite">
        {error ? (
          <span className="text-red-600 dark:text-red-300">{error}</span>
        ) : listening ? (
          "Your words appear above as you talk — you can edit them before creating."
        ) : (
          "Your browser turns your voice into text. We never save the recording."
        )}
      </p>
    </div>
  );
}
