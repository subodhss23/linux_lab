import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Linux Mastery — Intermediate & Advanced Linux, by Doing",
  description:
    "A keyboard-first, in-browser Ubuntu lab: 30 modules, hands-on tasks, pro tips.",
  applicationName: "Linux Mastery"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#08090c"
};

const THEME_SCRIPT = `(function(){try{
  var q=new URLSearchParams(location.search).get("theme");
  var t=(q==="light"||q==="dark")?q:localStorage.getItem("linuxmastery.theme");
  if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);if(q)localStorage.setItem("linuxmastery.theme",t);}
}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
