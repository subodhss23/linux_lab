import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

export const dynamic = "force-dynamic";

const COOKIE = "linuxmastery_auth";

async function isAuthed(): Promise<boolean> {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value || "";
    const user = process.env.LAB_USERNAME || "";
    const pass = process.env.LAB_PASSWORD || "";
    if (!user || !pass || !token) return false;
    const want = createHmac("sha256", "lm:" + pass).update("lm-auth:" + user).digest("hex");
    const a = Buffer.from(token, "utf8");
    const b = Buffer.from(want, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

const ART = [
  "      ______",
  "   .-\"      \"-.",
  "  /            \\",
  " |              |",
  " |,  .-.  .-.  ,|",
  " | )(__/  \\__)( |",
  " |/     /\\     \\|",
  " (_     ^^     _)",
  "  \\__|IIIIII|__/",
  "   | \\IIIIII/ |",
  "   \\          /",
  "    `--------`",
].join("\n");

export default async function Landing() {
  const authed = await isAuthed();
  return (
    <div className="void">
      <pre className="void-art" aria-hidden="true">{ART}</pre>
      <div className="void-line"><span className="dim">$</span> whoami</div>
      <div className="void-line dim">root</div>
      <div className="void-line"><span className="dim">$</span> <span className="caret">▊</span></div>
      <div className="void-credit">Built in California by Subodh</div>
      <a id="omen" href={authed ? "/lab" : "/login"} title="">enter</a>
    </div>
  );
}
