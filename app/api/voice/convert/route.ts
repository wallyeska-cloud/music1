import { NextResponse } from "next/server";
import { convertVoice, VoiceError, VOICE_ID_RE } from "@/lib/voice/elevenlabs";

// Re-sings one short slice of the song's vocals in the cloned voice. The
// client splits the vocals into ~12s slices so each call fits comfortably
// inside the sync function time limit.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 15s of 44.1 kHz mono 16-bit WAV is ~1.3 MB; anything much bigger isn't a slice.
const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const voiceId = (form.get("voiceId") ?? "").toString();
  const audio = form.get("audio");
  if (!VOICE_ID_RE.test(voiceId)) {
    return NextResponse.json({ error: "Missing or invalid voiceId." }, { status: 400 });
  }
  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ error: "Missing audio." }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) {
    return NextResponse.json({ error: "Audio slice is too large." }, { status: 413 });
  }

  try {
    const mp3 = await convertVoice(voiceId, audio);
    return new NextResponse(mp3, {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (e) {
    const err = e instanceof VoiceError ? e : new VoiceError("Could not convert this part of the song.");
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
}
