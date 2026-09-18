# Instructions — Run, Learn & Master Linux Mastery

> Keyboard-first. You never need the mouse. 30 modules in 4 Acts (118 tasks, ~80h)
> plus a Drill Bank of 4 boss fights (16 reps) — reviews never block your path.

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
npm test                 # simulator + all 118 lessons + 16 drill fights auto-solved
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

- **Level** `floor(sqrt(xp/50))+1` · **XP** 10/task (−4 hint, −6 sol, min 2).
- **Done** Learn tasks completed (`x/118`) + Drill Bank counter (`x/16`).
  **Study time** `HH:MM:SS` active (pauses when tab hidden).
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

- **Search** (left): filters 30 modules + 118 tasks + 16 fights + tips as you type.
- **Tip of the Day** (sidebar): deterministic daily pick; click opens library.
- **Examples**: click inserts into terminal; `Enter` runs. Copy icon for shortcuts.

## 7b. The 4 Acts + Drill Bank (how to pace yourself)

| Act | Modules | Tasks | You can now… |
|---|---|---|---|
| Act 1 Survive the Box | M01–M08 | 32 | live on any Linux server |
| Act 2 Operate & Connect | M17, M18, M09–M13 | 28 | take a fresh VPS to working |
| Act 3 Ship It | M14–M16, M19–M20 | 18 | deploy a real app (celebrate!) |
| Act 4 Survive Production | M21–M30 | 40 | keep it up at 2am |

Each Act is ~3 sittings at 10 tasks a sitting. Finish the Act, then fight its boss in the
🥋 Drill Bank (B1 after Act 1, B2 after Act 2…): 4 combination fights per boss that reuse
only what that Act taught. Bosses are optional, never block Next, and have their own counter.

## 8. Study plans

| Track | Path | Pace |
|---|---|---|
| First deploy (job-ready) | Act 1 → Act 2 → Act 3 + bosses 1–3 | 2 h/d × 3 wks |
| Full course | Acts 1–4 + all bosses | 1.5 h/d × 6 wks |
| Advanced / on-call | Act 4 + Boss 4 after Act 2 | weekends × 3 wks |
| Interview sprint | M09, M03, M13, M26 + Boss 2 + Boss 4 | 1 wk |

Suggested: 10 min/day in `Ctrl+T` tips; redo any task you can’t do from memory;
fight each boss right after its Act while the skills are warm.

## 9. Simulated facts

- User `sam`, host `ubuntu-lab`, passwordless `sudo`. Nothing touches your real machine.
- Ubuntu 22.04 conventions (`systemctl`, `journalctl`, `ss`, `apt`, `docker` simulated).
- Ownership behaves like real Ubuntu: your `mkdir` makes your dirs, `sudo mkdir` makes root's.
- Every command has `--help`; wrong commands still count +1 Total Commands (reps are reps).

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

Deep links: `#palette` · `#help` · `#tips` · `#tips-random` · `?theme=light|dark`.
