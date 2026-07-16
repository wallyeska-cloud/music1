import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUNO_BASE = process.env.SUNO_API_BASE || "https://api.sunoapi.org";

type SunoClip = {
  id?: string;
  title?: string;
  audioUrl?: string;
  streamAudioUrl?: string;
  imageUrl?: string;
  duration?: number;
};

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
      `${SUNO_BASE}/api/v1/generate/record-info?taskId=${encodeURIComponent(taskId)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: "no-store",
      },
    );
  } catch {
    return NextResponse.json({ error: "Could not reach the music service." }, { status: 502 });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.code !== 200) {
    return NextResponse.json({ error: data?.msg || `Music service error (${res.status}).` }, { status: 502 });
  }

  const d = data.data ?? {};
  const rawClips: SunoClip[] = d?.response?.sunoData ?? [];
  const clips = rawClips.map((c) => ({
    id: c.id,
    title: c.title || "Untitled",
    audioUrl: c.audioUrl || "",
    streamAudioUrl: c.streamAudioUrl || "",
    imageUrl: c.imageUrl || "",
    duration: c.duration || 0,
  }));

  return NextResponse.json({ status: d.status ?? "PENDING", clips });
}
