import { NextResponse } from "next/server";

// Runs server-side only. The Suno key never reaches the browser.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUNO_BASE = process.env.SUNO_API_BASE || "https://api.sunoapi.org";

export async function POST(req: Request) {
  const apiKey = process.env.SUNO_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing SUNO_API_KEY. Add it to your environment variables." },
      { status: 500 },
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const prompt = (body?.prompt ?? "").toString().trim();
  const instrumental = Boolean(body?.instrumental);
  const model = (body?.model ?? "V4_5").toString();

  if (!prompt) {
    return NextResponse.json({ error: "Please describe the music you want." }, { status: 400 });
  }
  if (prompt.length > 400) {
    return NextResponse.json({ error: "Description is too long (max 400 characters)." }, { status: 400 });
  }

  // Non-custom mode: Suno writes lyrics/title/style from the description.
  const payload = {
    customMode: false,
    instrumental,
    model,
    prompt,
    // Required by the API. We poll for results instead of relying on this,
    // but it must be a valid URL. Points at our no-op callback route.
    callBackUrl: process.env.SUNO_CALLBACK_URL || "https://example.com/suno-callback",
  };

  let res: Response;
  try {
    res = await fetch(`${SUNO_BASE}/api/v1/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
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

  return NextResponse.json({ taskId: data.data.taskId });
}
