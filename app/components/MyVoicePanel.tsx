"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  decodeAudio,
  encodeWav,
  mapLimit,
  mixToWav,
  sliceVocals,
  toMono,
} from "@/lib/audio/browser-audio";

// "Sing it in my voice": the user records ~30-60s of their voice, we clone it,
// split the finished song into vocals + music, re-sing the vocals slice by
// slice in the cloned voice, and mix everything back together in the browser.
// The cloned voice is deleted as soon as we're done.

type Step = "closed" | "record" | "working" | "done" | "error";

const MIN_SECONDS = 20;
const MAX_SECONDS = 90;
const SAMPLE_RATE = 22050; // voice sample upload
const VOCAL_RATE = 44100; // slices sent for conversion
const STEM_TIMEOUT_MS = 4 * 60 * 1000;

const READ_ALOUD =
  "Once upon a time, in a house full of laughter, there lived a kid who could make the whole world smile. " +
  "Every morning started with pancakes, a silly dance, and a song that nobody else knew the words to. " +
  "Rainy days were for building blanket forts, and sunny days were for racing to the park. " +
  "And at night, when the stars came out, we whispered: you are brave, you are kind, and you are loved.";

const PROGRESS_LABELS = ["Learning your voice", "Separating the vocals from the music", "Singing it in your voice", "Mixing your version"];

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Something went wrong.");
  return data;
}

function deleteVoice(voiceId: string) {
  // keepalive lets this finish even if the page is closing.
  fetch("/api/voice/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ voiceId }),
    keepalive: true,
  }).catch(() => {});
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Props = {
  taskId: string;
  audioId: string;
  title: string;
};

export default function MyVoicePanel({ taskId, audioId, title }: Props) {
  const [step, setStep] = useState<Step>("closed");
  const [consent, setConsent] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [sample, setSample] = useState<Blob | null>(null);
  const [sampleUrl, setSampleUrl] = useState("");
  const [sampleSec, setSampleSec] = useState(0);
  const [progress, setProgress] = useState(0);
  const [detail, setDetail] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [error, setError] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const voiceIdRef = useRef<string | null>(null);
  const stemsRef = useRef<{ vocalUrl: string; instrumentalUrl: string } | null>(null);
  const urlsRef = useRef<string[]>([]);

  const trackUrl = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    urlsRef.current.push(url);
    return url;
  };

  useEffect(
    () => () => {
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      if (voiceIdRef.current) deleteVoice(voiceIdRef.current);
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    },
    [],
  );

  const loadSample = useCallback(async (blob: Blob) => {
    setError("");
    try {
      const decoded = await decodeAudio(blob);
      if (decoded.duration < MIN_SECONDS) {
        setError(`That's ${Math.round(decoded.duration)}s — we need at least ${MIN_SECONDS}s of your voice.`);
        return;
      }
      const secs = Math.min(decoded.duration, MAX_SECONDS);
      const mono = (await toMono(decoded, SAMPLE_RATE)).slice(0, Math.round(secs * SAMPLE_RATE));
      const wav = encodeWav([mono], SAMPLE_RATE);
      setSample(wav);
      setSampleSec(Math.round(secs));
      setSampleUrl(trackUrl(wav));
    } catch {
      setError("We couldn't read that audio. Try recording again, or upload an MP3/M4A/WAV file.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
  }, []);

  const startRecording = useCallback(async () => {
    setError("");
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Recording isn't supported in this browser — upload an audio file instead.");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      setError("Microphone access is blocked. Allow it in your browser settings, or upload a file instead.");
      return;
    }

    const chunks: Blob[] = [];
    const rec = new MediaRecorder(stream);
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      recorderRef.current = null;
      setRecording(false);
      loadSample(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
    };

    recorderRef.current = rec;
    rec.start();
    setRecording(true);
    setSample(null);
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }, [loadSample]);

  useEffect(() => {
    if (recording && seconds >= MAX_SECONDS) stopRecording();
  }, [recording, seconds, stopRecording]);

  const getStems = useCallback(async () => {
    if (stemsRef.current) return stemsRef.current;
    const { stemTaskId } = await postJson("/api/stems", { taskId, audioId });
    const deadline = Date.now() + STEM_TIMEOUT_MS;
    while (Date.now() < deadline) {
      await sleep(5000);
      const res = await fetch(`/api/stems?taskId=${encodeURIComponent(stemTaskId)}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Couldn't separate the vocals.");
      if (data.status === "FAILED") throw new Error("The music service couldn't separate the vocals. Please try again.");
      if (data.status === "SUCCESS") {
        stemsRef.current = { vocalUrl: data.vocalUrl, instrumentalUrl: data.instrumentalUrl };
        return stemsRef.current;
      }
    }
    throw new Error("Separating the vocals is taking too long. Please try again.");
  }, [taskId, audioId]);

  const makeMyVersion = useCallback(async () => {
    if (!sample || !consent) return;
    setStep("working");
    setError("");
    setProgress(0);
    setDetail("");

    try {
      const form = new FormData();
      form.append("sample", sample, "voice.wav");
      form.append("consent", "true");
      const clonePromise = fetch("/api/voice/clone", { method: "POST", body: form }).then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.voiceId) throw new Error(data?.error || "Couldn't learn your voice.");
        voiceIdRef.current = data.voiceId as string;
        return data.voiceId as string;
      });
      const stemsPromise = getStems();

      const voiceId = await clonePromise;
      setProgress(1);
      const stems = await stemsPromise;

      const [vocalBuf, musicBuf] = await Promise.all(
        [stems.vocalUrl, stems.instrumentalUrl].map(async (u) => {
          const res = await fetch(u);
          if (!res.ok) throw new Error("Couldn't download the song's parts. Please try again.");
          return decodeAudio(await res.arrayBuffer());
        }),
      );
      setProgress(2);

      const vocals = await toMono(vocalBuf, VOCAL_RATE);
      const slices = sliceVocals(vocals, VOCAL_RATE);
      const sung = slices.filter((s) => !s.silent);
      let done = 0;
      setDetail(`0 of ${sung.length} parts`);

      const converted = await mapLimit(sung, 3, async (s) => {
        const body = new FormData();
        body.append("voiceId", voiceId);
        body.append("audio", encodeWav([vocals.subarray(s.start, s.end)], VOCAL_RATE), "slice.wav");
        const res = await fetch("/api/voice/convert", { method: "POST", body });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || "Couldn't sing part of the song in your voice.");
        }
        const buffer = await decodeAudio(await res.arrayBuffer());
        done++;
        setDetail(`${done} of ${sung.length} parts`);
        return { buffer, at: s.start / VOCAL_RATE, duration: (s.end - s.start) / VOCAL_RATE };
      });

      setProgress(3);
      setDetail("");
      const wav = await mixToWav(musicBuf, converted);
      setResultUrl(trackUrl(wav));
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStep("error");
    } finally {
      if (voiceIdRef.current) {
        deleteVoice(voiceIdRef.current);
        voiceIdRef.current = null;
      }
    }
  }, [sample, consent, getStems]);

  if (step === "closed") {
    return (
      <button
        type="button"
        onClick={() => setStep("record")}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-fuchsia-300 bg-fuchsia-50/60 px-3 py-2 text-sm font-semibold text-fuchsia-700 transition hover:-translate-y-0.5 hover:bg-fuchsia-50 active:scale-[0.98] motion-reduce:transform-none dark:border-fuchsia-300/30 dark:bg-fuchsia-500/5 dark:text-fuchsia-200 dark:hover:bg-fuchsia-500/10"
      >
        🎤 Sing it in my voice
      </button>
    );
  }

  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const fileName = `${title.replace(/[^\w\- ]+/g, "").trim() || "song"} (my voice).wav`;

  return (
    <div className="mt-3 animate-fade-in rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-white/10 dark:bg-black/20">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-semibold text-slate-900 dark:text-white">🎤 Sing it in my voice</h4>
        {step !== "working" && (
          <button
            type="button"
            onClick={() => setStep("closed")}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-700 dark:text-violet-200/50 dark:hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {step === "record" && (
        <>
          <p className="text-slate-600 dark:text-violet-100/70">
            Record {MIN_SECONDS}–{MAX_SECONDS} seconds of your voice. Read this out loud (or sing it!) in a quiet room:
          </p>
          <blockquote className="my-3 rounded-xl border-l-4 border-fuchsia-400 bg-white p-3 text-[13px] italic leading-relaxed text-slate-700 dark:bg-white/5 dark:text-violet-100/80">
            {READ_ALOUD}
          </blockquote>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              aria-pressed={recording}
              className={`flex items-center gap-2 rounded-full px-4 py-2 font-semibold text-white transition active:scale-95 ${
                recording ? "bg-red-500 hover:bg-red-600" : "bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90"
              }`}
            >
              {recording ? (
                <>
                  <span className="h-2.5 w-2.5 rounded-sm bg-white" /> Stop · {mmss(seconds)}
                </>
              ) : (
                <>● {sample ? "Record again" : "Start recording"}</>
              )}
            </button>
            {!recording && (
              <label className="cursor-pointer rounded-full border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-100 dark:border-white/15 dark:bg-white/5 dark:text-violet-100 dark:hover:bg-white/10">
                Upload a file
                <input
                  type="file"
                  accept="audio/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) loadSample(f);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
            {recording && seconds < MIN_SECONDS && (
              <span className="text-xs text-slate-500 dark:text-violet-200/60">Keep going — at least {MIN_SECONDS}s</span>
            )}
          </div>

          {sample && !recording && (
            <div className="mt-3">
              <p className="mb-1 text-xs text-slate-500 dark:text-violet-200/60">Your recording ({sampleSec}s)</p>
              <audio controls src={sampleUrl} />
            </div>
          )}

          <label className="mt-4 flex cursor-pointer items-start gap-2 text-[13px] text-slate-700 dark:text-violet-100/80">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-fuchsia-500"
            />
            <span>
              This is <strong>my own voice</strong>, I&apos;m 18 or older, and I agree to EZE using it to make this
              song. The voice copy is deleted as soon as the song is made.
            </span>
          </label>

          <button
            type="button"
            onClick={makeMyVersion}
            disabled={!sample || !consent || recording}
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 px-4 py-2.5 font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 motion-reduce:transform-none"
          >
            ✨ Make my version
          </button>
          <p className="mt-2 text-center text-[11px] text-slate-400 dark:text-violet-200/50">
            Experimental · takes a few minutes · works best with a clear, steady voice
          </p>
        </>
      )}

      {step === "working" && (
        <ol className="space-y-2" aria-live="polite">
          {PROGRESS_LABELS.map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                  i < progress
                    ? "bg-emerald-500 text-white"
                    : i === progress
                      ? "bg-fuchsia-500 text-white animate-pulse motion-reduce:animate-none"
                      : "bg-slate-200 text-slate-400 dark:bg-white/10"
                }`}
              >
                {i < progress ? "✓" : i + 1}
              </span>
              <span className={i <= progress ? "text-slate-800 dark:text-white" : "text-slate-400 dark:text-violet-200/40"}>
                {label}
                {i === progress && detail && <span className="ml-1 text-xs opacity-70">· {detail}</span>}
              </span>
            </li>
          ))}
        </ol>
      )}

      {step === "done" && (
        <div className="animate-pop-in">
          <p className="mb-2 font-medium text-slate-800 dark:text-white">Here it is — sung in your voice 🎉</p>
          <audio controls src={resultUrl} />
          <div className="mt-2 flex flex-wrap gap-3">
            <a
              href={resultUrl}
              download={fileName}
              className="font-medium text-fuchsia-600 hover:text-fuchsia-500 dark:text-fuchsia-300 dark:hover:text-fuchsia-200"
            >
              Download my version ↓
            </a>
            <button
              type="button"
              onClick={() => setStep("record")}
              className="text-slate-500 underline-offset-2 hover:underline dark:text-violet-200/60"
            >
              Try a different recording
            </button>
          </div>
        </div>
      )}

      {step === "error" && (
        <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
          {error}{" "}
          <button type="button" onClick={() => setStep("record")} className="font-semibold underline underline-offset-2">
            Try again
          </button>
        </p>
      )}

      {step === "record" && error && (
        <p className="mt-3 text-[13px] text-red-600 dark:text-red-300">{error}</p>
      )}
    </div>
  );
}
