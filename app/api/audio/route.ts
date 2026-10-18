import { NextResponse } from "next/server";
import { verifyAudioUrl } from "@/lib/signed-url";

// Same-origin passthrough for song stems so the browser can decode and mix
// them. Only serves URLs this server signed (see lib/signed-url.ts).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const u = params.get("u") ?? "";
  const exp = params.get("exp") ?? "";
  const sig = params.get("sig") ?? "";

  if (!u.startsWith("https://") || !verifyAudioUrl(u, exp, sig)) {
    return NextResponse.json({ error: "This audio link is invalid or has expired." }, { status: 403 });
  }

  const upstream = await fetch(u, { cache: "no-store" }).catch(() => null);
  if (!upstream?.ok || !upstream.body) {
    return NextResponse.json({ error: "Could not load the audio." }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "audio/mpeg",
      "Cache-Control": "private, no-store",
    },
  });
}
