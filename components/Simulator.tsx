"use client";

import { useEffect } from "react";
import { MARKUP } from "@/lib/markup";

const SCRIPTS = [
  "/js/filesystem.js",
  "/js/machine.js",
  "/js/commands.js",
  "/js/shell.js",
  "/js/curriculum.js",
  "/js/curriculum-extra.js",
  "/js/tips.js",
  "/js/app.js"
];

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-lm="${src}"]`);
    if (existing) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = false;
    s.dataset.lm = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load " + src));
    document.body.appendChild(s);
  });
}

export default function Simulator() {
  useEffect(() => {
    const w = window as unknown as { __LM_BOOTED__?: boolean };
    if (w.__LM_BOOTED__) return;
    let cancelled = false;

    (async () => {
      try {
        for (const src of SCRIPTS) {
          if (cancelled) return;
          await loadScript(src);
        }
      } catch (err) {
        console.error("[linux-mastery] script load error:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: MARKUP }} />;
}
