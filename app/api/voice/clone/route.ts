import { NextResponse } from "next/server";
import { cloneVoice, VoiceError } from "@/lib/voice/elevenlabs";

// Learns the user's voice from a short recording. Runs server-side only;
// the ElevenLabs key never reaches the browser.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The client sends 22.05 kHz mono WAV capped at 90s (~4 MB).
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (form.get("consent") !== "true") {
    return NextResponse.json(
      { error: "Please confirm this is your own voice before we use it." },
      { status: 400 },
    );
  }

  const sample = form.get("sample");
  if (!(sample instanceof Blob) || sample.size === 0) {
    return NextResponse.json({ error: "Please record or upload your voice first." }, { status: 400 });
  }
  if (sample.size > MAX_BYTES) {
    return NextResponse.json({ error: "That recording is too long. Keep it under 90 seconds." }, { status: 400 });
  }

  try {
    const voiceId = await cloneVoice(sample, `eze-temp-${Date.now()}`);
    return NextResponse.json({ voiceId });
  } catch (e) {
    const err = e instanceof VoiceError ? e : new VoiceError("Could not learn your voice.");
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
}
