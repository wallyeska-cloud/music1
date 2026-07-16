import { NextResponse } from "next/server";

// No-op receiver so the required callBackUrl resolves to a real endpoint.
// This MVP polls /api/status for results instead of storing callbacks.
export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
