import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

export const dynamic = "force-dynamic";

const COOKIE = "linuxmastery_auth";

// Must match middleware.ts exactly:
// HMAC-SHA256(key = "lm:" + password, msg = "lm-auth:" + username), hex.
function expectedToken(username: string, password: string): string {
  return createHmac("sha256", "lm:" + password).update("lm-auth:" + username).digest("hex");
}

function sameHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export async function POST(req: Request) {
  const user = process.env.LAB_USERNAME || "";
  const pass = process.env.LAB_PASSWORD || "";
  if (!user || !pass) {
    return NextResponse.json(
      { ok: false, error: "Server auth is not configured. Set LAB_USERNAME and LAB_PASSWORD." },
      { status: 503 }
    );
  }
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const u = String(body.username || "");
  const p = String(body.password || "");
  // Compare against the expected token instead of the raw strings so the
  // check shape is identical for right and wrong usernames.
  const ok =
    u.length > 0 &&
    p.length > 0 &&
    sameHex(expectedToken(u, p), expectedToken(user, pass));
  if (!ok) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return NextResponse.json({ ok: false, error: "Wrong username or password." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, expectedToken(user, pass), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
