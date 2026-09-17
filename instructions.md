# Instructions — Run, Learn & Master Linux Mastery v2

> Keyboard-first. You never need the mouse. New in v2: `Total Commands` odometer,
> top progress bar, expanded networking/text/data content, `linux advanced` folder.

## 1. Requirements

- Modern browser (Chrome / Firefox / Safari / Edge).
- Node.js 20+ for local dev (`node --version`). No Docker, no cloud account.
- Install once: `npm install` (Next.js + React only). App works offline after first load.

## 2. Run locally / deploy

```bash
cd <build-root>          # code phase folder (specs live in linux_advanced/*.md)
npm install
cp .env.example .env    # then put YOUR username/password in .env (never commit it)
npm run dev              # http://localhost:3000
npm run build && npm start   # production
npm test                 # simulator + all 300 lessons auto-solved
LAB_USERNAME=u LAB_PASSWORD=p npm run test:ui  # headless-Chrome smoke (same creds for server + test)
```

## 2b. Access control (private lab)

- The whole app sits behind a login page. One fixed username + password,
  set by **you** in env vars — no signup, no database, noOAuth.
- Local: values come from `.env` (`LAB_USERNAME`, `LAB_PASSWORD`).
- Open `/` for the landing page → **Sign in** → `/login` → the lab lives at `/lab`.
  Signed-in visits to `/` skip straight to `/lab`.
- Vercel: Project → Settings → Environment Variables → add the same two →
  Redeploy. Anyone without them stops at `/login`.
- Sessions are a signed httpOnly cookie (HMAC of your credentials, 30 days).
  Header **Logout** button (or `Ctrl+K` → Log out) ends it.
- Honest scope: this keeps casual visitors out of the UI. The simulator itself
  runs from static JS, so treat it like a locked classroom, not a vault —
  do not reuse an important password here.

Deploy (Vercel): push to GitHub → Import → add `LAB_USERNAME` /
`LAB_PASSWORD` env vars → Deploy. Progress lives in `localStorage`;
`/api/progress` is an optional no-op sync.

## 3. The 60-second loop

1. `Ctrl+K` → type module/lesson → `Enter` (or `Esc` NAV + `j/k` + `Enter`).
2. Read right panel: objective → theory → click an example (or NAV `1–9`) to load it.
3. Type in center terminal, `Enter`. **Every Enter counts as +1 Total Commands**, pass or fail.
4. Pass → XP + Done+1 + bar moves + “Next →” hint. Fail → read reason, retry (no penalty).
5. `Ctrl+H` hint (−3 XP), `Ctrl+G` solution (−5 XP). First-try (no peek, first Enter passes) +5.
6. `Alt+↓` next lesson. `Ctrl+T` daily tip. Repeat.

## 4. Keyboard map (print this)

| Keys | Do |
|---|---|
| type | terminal (auto-focus) |
| `Esc` | NAV mode (`h j k l`, arrows, `g/G`, `Enter` open, `1–9` example, `i/q/Esc` back) |
| `Ctrl+K` | palette: jump + actions (default Next lesson) |
| `Ctrl+T` | tips: search, `Tab` category, `Enter` insert, `Esc` close |
| `Alt+↓/↑` | next / prev lesson |
| `Ctrl+H` / `Ctrl+G` | hint / solution |
| `Ctrl+Enter` | next lesson |
| `Ctrl+Shift+D` | theme |
| `Ctrl+L` / `Ctrl+C` | clear / cancel |
| `↑/↓`, `Tab`, `?` | history, complete, help (empty input) |

Palette also runs: Random tip, Exam, Boss fight, Export, Reset machine/progress, Theme, Help.

## 5. Metrics (what the numbers mean)

- **Level** `floor(sqrt(xp/50))+1` · **XP** 10/task (+5 first-try, −3 hint, −5 sol, min 2).
- **Done** tasks completed (`x/211`). **Study time** `HH:MM:SS` active (pauses when tab hidden).
- **Total Commands** — lifetime Enters, right or wrong. The only metric `Reset progress` keeps.
- **Progress bar** top: overall fill + %; per-module rings in sidebar; thin XP-to-next bar.

## 6. The two resets (different!)

| Button | Asks | Clears | Keeps | Use when |
|---|---|---|---|---|
| **Reset progress** | 1 confirm | XP, Done, badges, study time, streak, exam | **Total Commands**, machine FS | “Restart curriculum, keep my effort count” |
| **Reset machine** | double confirm (type `RESET`) | **Everything incl. Total Commands** + pristine FS/net | nothing | “Factory reset, I want zero” |

Tooltip + toast state this explicitly. There is no undo — export first if unsure
(palette → Export progress JSON).

## 7. Search, Tip of the Day, examples

- **Search** (left): filters 38 modules + 211 tasks + 180 tips as you type.
- **Tip of the Day** (sidebar): deterministic daily pick; click opens library.
- **Examples**: click inserts into terminal; `Enter` runs; tick marks “tried”. Copy icon for shortcuts.

## 8. Study plans

| Track | Modules | Pace |
|---|---|---|
| Core operator (job-ready) | M01–M16 | 2 h/d × 4 wks |
| Full intermediate | M01–M30 | 1.5 h/d × 8 wks |
| Advanced / DevOps | M31–M38 after M09+M25 | weekends × 4 wks |
| Interview sprint | M09, M03, M13, M26 + Exam mode daily | 1 wk |

Suggested: 10 min/day in `Ctrl+T` tips; redo any task you can’t do from memory;
run Exam weekly; attempt Boss fight per folder before advancing.

## 9. Simulated facts

- User `sam`, host `ubuntu-lab`, passwordless `sudo`. Nothing touches your real machine.
- Ubuntu 22.04 conventions (`systemctl`, `journalctl`, `ss`, `apt`, `docker` simulated).
- New stub families behave realistically but are deterministic; `--help` always works.

## 10. Troubleshooting

| Problem | Fix |
|---|---|
| `next: command not found` | `npm install` in build root |
| Port busy | `npm run dev -- -p 3001` |
| Blank page | console check; ensure `public/js/*.js` loaded |
| Want fresh curriculum, keep odometer | Reset progress |
| Want absolute zero | Reset machine (type RESET) |
| Lost progress | Import last export; check same browser/origin |
| Lesson seems unpassable | `Ctrl+G` solution, `Reset machine`, retry; file bug with lesson ID |

Deep links: `#m09-l5` lesson · `#tips` library · `#exam` exam · `?theme=light|dark`.
