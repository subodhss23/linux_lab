"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const userRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: userRef.current?.value || "",
          password: passRef.current?.value || "",
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.ok) {
        router.replace("/lab");
        router.refresh();
      } else {
        setError(data.error || "Wrong username or password.");
      }
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit} autoComplete="off">
        <span className="logo login-logo" aria-hidden="true">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#lm-grad-login)" />
            <path d="M12 14.5l5.5 5.5-5.5 5.5" stroke="#0a0c12" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 26h7" stroke="#0a0c12" strokeWidth="2.6" strokeLinecap="round" />
            <defs>
              <linearGradient id="lm-grad-login" x1="1" y1="1" x2="39" y2="39" gradientUnits="userSpaceOnUse">
                <stop stopColor="#7ee787" /><stop offset="1" stopColor="#238636" />
              </linearGradient>
            </defs>
          </svg>
        </span>
        <div className="brand-title">Linux Mastery</div>
        <div className="brand-sub">Private lab — sign in to continue</div>
        <label className="login-label" htmlFor="login-user">Username</label>
        <input
          id="login-user"
          ref={userRef}
          className="login-input"
          type="text"
          autoComplete="username"
          autoFocus
        />
        <label className="login-label" htmlFor="login-pass">Password</label>
        <input
          id="login-pass"
          ref={passRef}
          className="login-input"
          type="password"
          autoComplete="current-password"
        />
        {error ? <div className="login-error" role="alert">{error}</div> : null}
        <button className="btn primary login-btn" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
