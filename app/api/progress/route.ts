import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Progress lives in the browser (localStorage) so it works on serverless hosting.
// This endpoint exists so the client's optional sync calls succeed; it stores
// nothing server-side. Wire it to a KV/DB here if you want cross-device sync.
export async function GET() {
  return NextResponse.json({});
}

export async function POST(req: Request) {
  try {
    await req.json();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400 });
  }
}
