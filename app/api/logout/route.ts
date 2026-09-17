import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const COOKIE = "linuxmastery_auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}
