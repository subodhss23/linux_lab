import { NextResponse, type NextRequest } from "next/server";

const COOKIE = "linuxmastery_auth";

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Must match app/api/login/route.ts exactly:
// HMAC-SHA256(key = "lm:" + password, msg = "lm-auth:" + username), hex.
async function expectedToken(username: string, password: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode("lm:" + password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("lm-auth:" + username));
  return toHex(sig);
}

function same(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function isAuthed(req: NextRequest): Promise<boolean> {
  const user = process.env.LAB_USERNAME || "";
  const pass = process.env.LAB_PASSWORD || "";
  const token = req.cookies.get(COOKIE)?.value || "";
  return !!user && !!pass && !!token && same(token, await expectedToken(user, pass));
}

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Always public: landing, login, login/logout APIs, framework assets.
  // (globals.css must load for public pages, so /_next/static stays public.
  // The simulator JS under /js is bundled with the app shell — the gate keeps
  // casual visitors out of the UI; see instructions.md "Access control".)
  if (
    path === "/" ||
    path === "/login" ||
    path === "/api/login" ||
    path === "/api/logout" ||
    path.startsWith("/_next/") ||
    path === "/favicon.ico"
  ) {
    // Signed-in users skip straight to the lab.
    if ((path === "/" || path === "/login") && (await isAuthed(req))) {
      return NextResponse.redirect(new URL("/lab", req.url));
    }
    return NextResponse.next();
  }

  // Everything else (the lab, progress sync) needs the cookie.
  if (await isAuthed(req)) return NextResponse.next();
  return NextResponse.redirect(new URL("/", req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
