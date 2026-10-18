// Server-only wrapper around the ElevenLabs voice APIs used by "Sing it in my
// voice". Every ElevenLabs voice call goes through this file — routes never
// call the vendor directly — so the provider can be swapped in one place.

const BASE = `${process.env.ELEVENLABS_API_BASE || "https://api.elevenlabs.io"}/v1`;
const STS_MODEL = "eleven_multilingual_sts_v2";

export class VoiceError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}

function apiKey(): string {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new VoiceError("Server is missing ELEVENLABS_API_KEY.", 500);
  return key;
}

async function failure(res: Response, fallback: string): Promise<VoiceError> {
  const body = await res.json().catch(() => ({}));
  const detail = body?.detail;
  const msg = typeof detail === "string" ? detail : detail?.message;
  if (res.status === 401) return new VoiceError("The voice service rejected our API key.", 502);
  if (res.status === 402 || res.status === 403) {
    return new VoiceError(msg || "Our voice-service plan doesn't allow this right now.", 502);
  }
  if (res.status === 429) return new VoiceError("The voice service is busy. Try again in a minute.", 503);
  return new VoiceError(msg || fallback, res.status === 422 || res.status === 400 ? 400 : 502);
}

/** Instant-clone a voice from a sample recording. Returns the new voice id. */
export async function cloneVoice(sample: Blob, name: string): Promise<string> {
  const form = new FormData();
  form.append("name", name);
  form.append("files", sample, "sample.wav");
  form.append("remove_background_noise", "true");
  form.append("description", "Temporary EZE voice — deleted after the song is made.");

  const res = await fetch(`${BASE}/voices/add`, {
    method: "POST",
    headers: { "xi-api-key": apiKey() },
    body: form,
  }).catch(() => null);
  if (!res) throw new VoiceError("Could not reach the voice service.");
  if (!res.ok) throw await failure(res, "Could not learn your voice from that recording.");

  const data = await res.json().catch(() => ({}));
  if (!data?.voice_id) throw new VoiceError("The voice service didn't return a voice.");
  return data.voice_id as string;
}

/** Re-voice a short vocal clip with the cloned voice. Returns MP3 bytes. */
export async function convertVoice(voiceId: string, audio: Blob): Promise<ArrayBuffer> {
  const form = new FormData();
  form.append("audio", audio, "chunk.wav");
  form.append("model_id", STS_MODEL);
  form.append("remove_background_noise", "false");
  form.append(
    "voice_settings",
    JSON.stringify({ stability: 0.5, similarity_boost: 0.9, style: 0, use_speaker_boost: true }),
  );

  const res = await fetch(
    `${BASE}/speech-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
    { method: "POST", headers: { "xi-api-key": apiKey() }, body: form },
  ).catch(() => null);
  if (!res) throw new VoiceError("Could not reach the voice service.");
  if (!res.ok) throw await failure(res, "The voice service couldn't convert part of the song.");
  return res.arrayBuffer();
}

/** Delete a cloned voice. Best-effort; a missing voice counts as deleted. */
export async function deleteVoice(voiceId: string): Promise<void> {
  const res = await fetch(`${BASE}/voices/${encodeURIComponent(voiceId)}`, {
    method: "DELETE",
    headers: { "xi-api-key": apiKey() },
  }).catch(() => null);
  if (!res) throw new VoiceError("Could not reach the voice service.");
  if (!res.ok && res.status !== 404) throw await failure(res, "Could not delete the voice.");
}

export const VOICE_ID_RE = /^[A-Za-z0-9]{10,40}$/;
