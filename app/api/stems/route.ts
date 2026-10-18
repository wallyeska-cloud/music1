import { NextResponse } from "next/server";
import { proxiedAudioUrl } from "@/lib/signed-url";

// Splits a finished song into a vocal track and an instrumental track, so the
// vocals can be re-sung in the user's voice and laid back over the music.
//   POST /api/stems { taskId, audioId } → { stemTaskId }
//   GET  /api/stems?taskId=…           → { status, vocalUrl?, instrumentalUrl? }
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUNO_BASE = process.env.SUNO_API_BASE || "https://api.sunoapi.org";

const FAIL_FLAGS = new Set(["CREATE_TASK_FAILED", "GENERATE_AUDIO_FAILED", "CALLBACK_EXCEPTION"]);

export async function POST(req: Request) {
  const apiKey = process.env.SUNO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Server is missing SUNO_API_KEY." }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  const taskId = (body?.taskId ?? "").toString();
  const audioId = (body?.audioId ?? "").toString();
  if (!taskId || !audioId) {
    return NextResponse.json({ error: "Missing taskId or audioId." }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${SUNO_BASE}/api/v1/vocal-removal/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        taskId,
        audioId,
        callBackUrl: process.env.SUNO_CALLBACK_URL || "https://example.com/suno-callback",
      }),
    });
  } catch {
    return NextResponse.json({ error: "Could not reach the music service." }, { status: 502 });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.code !== 200 || !data?.data?.taskId) {
    return NextResponse.json(
      { error: data?.msg || `Music service error (${res.status}).` },
      { status: 502 },
    );
  }

  return NextResponse.json({ stemTaskId: data.data.taskId });
}

export async function GET(req: Request) {
  const apiKey = process.env.SUNO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Server is missing SUNO_API_KEY." }, { status: 500 });
  }

  const taskId = new URL(req.url).searchParams.get("taskId");
  if (!taskId) {
    return NextResponse.json({ error: "Missing taskId." }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(
      `${SUNO_BASE}/api/v1/vocal-removal/record-info?taskId=${encodeURIComponent(taskId)}`,
      { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" },
    );
  } catch {
    return NextResponse.json({ error: "Could not reach the music service." }, { status: 502 });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.code !== 200) {
    return NextResponse.json({ error: data?.msg || `Music service error (${res.status}).` }, { status: 502 });
  }

  const d = data.data ?? {};
  const r = d.response ?? {};
  const vocal: string = r.vocalUrl || r.vocal_url || "";
  const instrumental: string = r.instrumentalUrl || r.instrumental_url || "";
  const flag: string = d.successFlag || d.status || "PENDING";

  if (FAIL_FLAGS.has(flag)) {
    return NextResponse.json({ status: "FAILED" });
  }
  if (vocal && instrumental) {
    // Same-origin, signed links so the browser can decode the audio (no CORS issues).
    return NextResponse.json({
      status: "SUCCESS",
      vocalUrl: proxiedAudioUrl(vocal),
      instrumentalUrl: proxiedAudioUrl(instrumental),
    });
  }
  return NextResponse.json({ status: "PENDING" });
}
