import { NextResponse } from "next/server";
import { deleteVoice, VoiceError, VOICE_ID_RE } from "@/lib/voice/elevenlabs";

// Deletes the temporary cloned voice once the user's version is made (or
// abandoned). We never keep a copy of anyone's voice.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const voiceId = (body?.voiceId ?? "").toString();
  if (!VOICE_ID_RE.test(voiceId)) {
    return NextResponse.json({ error: "Missing or invalid voiceId." }, { status: 400 });
  }

  try {
    await deleteVoice(voiceId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e instanceof VoiceError ? e : new VoiceError("Could not delete the voice.");
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
}
