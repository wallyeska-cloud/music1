// HMAC-signed links for /api/audio, so the audio proxy only fetches URLs this
// server handed out (no open proxy / SSRF). Server-only.
import { createHmac, timingSafeEqual } from "crypto";

const TTL_SECONDS = 60 * 60;

function secret(): string {
  const key = process.env.SUNO_API_KEY;
  if (!key) throw new Error("Server is missing SUNO_API_KEY.");
  return `eze-audio-proxy:${key}`;
}

function sign(url: string, exp: number): string {
  return createHmac("sha256", secret()).update(`${exp}:${url}`).digest("base64url");
}

/** Turn a remote audio URL into a same-origin, expiring /api/audio link. */
export function proxiedAudioUrl(url: string): string {
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const qs = new URLSearchParams({ u: url, exp: String(exp), sig: sign(url, exp) });
  return `/api/audio?${qs}`;
}

export function verifyAudioUrl(url: string, exp: string, sig: string): boolean {
  const expNum = Number(exp);
  if (!Number.isFinite(expNum) || expNum < Date.now() / 1000) return false;
  const expected = Buffer.from(sign(url, expNum));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
