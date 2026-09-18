# PRD — Linux Mastery: 4 Acts + Drill Bank, by Doing

> Rebuild of https://linuxlearning-sage.vercel.app/ (Next.js) — same beloved 3-pane format,
> restructured so every sitting ends with a win: 4 completable Acts plus an optional
> Drill Bank. Lifetime `Total Commands` metric, top progress bar, full keyboard-only
> operation, footer credit “Built in California by Subodh”.
> Supersedes the unbuilt 211-task / M31–M38 “linux advanced” plan.

## 1. Product Summary

**Linux Mastery** is a zero-setup, browser-based Ubuntu lab that teaches Linux by doing.
Center = simulated terminal. Left = Acts + Drill Bank. Right =
lesson instructions + clickable examples + graded task. Top = Level / XP / Done /
Study time / **Total Commands** + curriculum progress bar. Bottom status bar carries the
builder credit.

Learner types real commands (`grep`, `awk`, `ss`, `ip`, `systemctl`, `docker`…),
the simulator grades state deterministically, awards XP, and persists progress in the browser.

**Scale:** 30 modules · **118 graded tasks** (~80h) · **16 Drill Bank fights** · 141 pro tips.
V1 was 30 modules / 137 tasks; v2 **trims** to the most-used 118 (19 duplicates-or-niche
tasks cut — full list in `summary.md`) and moves all reviews out of the flow into
4 boss fights. All kept lesson IDs (`m01-l1…`, gaps where trimmed) are frozen.

## 2. Problem Statement

Video/reading learners recognize commands but freeze at a real prompt. Real servers are risky
to practice on; cloud sandboxes need setup, cost money, or reset. V1 solved this with a
deterministic simulator. This restructure solves the motivation gaps observed in V1:

1. 30 modules in one flat list felt endless — no finish line, no dopamine.
2. Reviews interleaved in the flow punished momentum (“homework before progress”).
3. Chapters with 6–12 tasks encouraged skimming; 3–4 killers invite mastery + reps.
4. Learners wanted credit for *every* keystroke, right or wrong (the odometer).

## 3. Goals

- [x] Preserve exact V1 layout users love: terminal center, chapters left, instructions right,
      examples click-to-insert, task must-complete to advance.
- [x] Ship **118 graded Learn tasks + 16 Drill fights** (IDs frozen; gaps where trimmed).
- [x] **`totalCommands`** metric: increments on every Enter in terminal, correct or not.
- [x] Top **curriculum progress bar** (`done/118`) + per-Act headers + per-module rings +
      Drill Bank counter (`done/16`) + header stats + footer builder credit.
- [x] Precise resets: `Reset progress` preserves totalCommands; `Reset machine` zeroes all.
- [x] Fully mouseless (`Esc · Ctrl+K · Ctrl+T · Alt+↑/↓ · Ctrl+H · Ctrl+G`), search bar,
      Tip of the Day, milestone ranks every 100 commands.
- [x] 4 Acts (~3 sittings each at 10 tasks/sitting) + 4 bosses, one per Act.

## 4. Non-Goals

- Not a real VM/kernel — still a deterministic simulator (Ubuntu 22.04 conventions).
- Not multi-user, not a cert body, no backend DB (localStorage source of truth, optional `/api/progress` sync).
- No real network egress, no real Docker daemon, no real secrets — all simulated.
- No mobile-first redesign; desktop keyboard-first, responsive fallback only.

## 5. Target Personas

| Persona | Goal | Cadence |
|---|---|---|
| Sam (junior dev, V1 persona) | Operate/deploy Ubuntu, pass ops interview | 1–2 h/day, 5 d/wk |
| Priya (data / SRE-adjacent) | Wrangle logs/CSV/JSON fast with pipes | 30-min drills + tips |
| Alex (senior → DevOps) | Harden, tune, debug prod, own incident playbook | Weekend deep-dives in Act 4 + Boss 4 |

All use a modern laptop browser. No Linux install required.

## 6. Learner Outcomes

| Act | Outcome (“you can now…”) |
|---|---|
| Act 1 Survive the Box (M01–M08) | live on any Linux server: find, pipes, perms, users, procs, systemd, storage |
| Act 2 Operate & Connect (M17,M18,M09–M13) | take a fresh VPS to working: patch, admin, firewall, packages, net, logs, SSH, cron, debug |
| Act 3 Ship It (M14–M16,M19–M20) | deploy a real app: containers, nginx proxy, systemd, postgres, Caddy |
| Act 4 Survive Production (M21–M30) | keep it up at 2am: observe, load-test, automate, back up, diagnose, respond, release, harden, alert, plan |
| Drill Bank (B1–B4) | prove it under fire: one 4-fight boss per Act, using only that Act's skills |

## 7. Core Experience (must-keep format)

```
┌──────────────────────────────────────────────────────────────┐
│ Topbar: logo · Level XP Done Study-time TotalCmds · XP bar   │
│         Pro-tips · theme · Reset machine · Reset progress    │
│         Curriculum progress: ████████░░ 87/118 tasks         │
├──────────┬────────────────────────────┬──────────────────────┤
│ LEFT     │ CENTER                     │ RIGHT                │
│ Acts 1-4 │ terminal simulation        │ instruction          │
│ DrillBank│ sam@ubuntu-lab:~$ █        │ theory               │
│ search   │ output scrollback          │ examples (clickable) │
│ rings    │ statusbar: TERMINAL/NAV    │ task + hint/solution │
│ tip-day  │ Built in California…      │ XP value, check btn  │
└──────────┴────────────────────────────┴──────────────────────┘
```

- **Left:** 4 Act sections (title + payoff + live counter + ✔) + **🥋 Drill Bank**
  (4 bosses, own counter) + search + per-module rings + tip-day footer.
- **Center:** simulated prompt `sam@ubuntu-lab:~$`, scrollback, input. Supports pipes,
  redirects (`> >> < 2> &>`), chaining (`&& || ;`), `$(…)` substitution, globs, vars, `~`,
  history (`↑/↓`, `history`, `!!`), Tab-complete, `Ctrl+L/C`. Ownership behaves like
  real Ubuntu (user `mkdir` → user-owned).
- **Right:** objective → theory → 2–4 clickable examples (click or `1–9` in NAV mode inserts
  into terminal) → **Task** box (prompt, hidden check, Hint / Solution buttons).
- Grading is immediate: correct state transition → toast + XP + Done+1 + auto-suggest next.
  Wrong → concise reason, no penalty except `totalCommands+1` still counts.

## 8. Keyboard-First Contract (mouseless)

Everything achievable without a mouse:

| Keys | Action |
|---|---|
| Type | Terminal input (auto-focus; stray keys refocus) |
| `Esc` | Enter **navigation mode** (accent outline; vim `h j k l`, arrows, `g/G`) |
| `Esc` / `i` / `q` | Back to TERMINAL |
| `j`/`↓`, `k`/`↑` | NAV: next / prev lesson (preview in right panel) |
| `h`/`←`, `l`/`→` | NAV: prev / next module |
| `g` / `G` | NAV: first / last lesson |
| `Enter` | NAV: open highlighted lesson |
| `1`–`9` | NAV: load example N into terminal |
| `Ctrl+K` | Command palette — fuzzy jump to module/lesson/action (default: Next lesson) |
| `Ctrl+T` | Pro tips browser (search, `Tab` category, `Enter` inserts) |
| `Alt+↓` / `Alt+↑` | Next / prev lesson from anywhere |
| `Ctrl+H` | Hint for current task (−3 XP stake) |
| `Ctrl+G` | Solution for current task (−5 XP, marks peeked) |
| `Ctrl+Enter` | Next lesson |
| `Ctrl+Shift+D` | Light / dark theme |
| `Ctrl+L` / `Ctrl+C` | Clear / cancel input |
| `↑`/`↓` (TERM) | History |
| `Tab` (TERM) | Complete command + path |
| `?` (empty input) | Shortcut help |

Palette (`Ctrl+K`): type to filter, `↑/↓` move, `Enter` open, `Esc` close.
Tips (`Ctrl+T`): type to search, `↑/↓` move, `Tab` category, `Enter` insert/copy, `Esc` close.
Status bar always shows `TERMINAL` vs `NAV` + active hints. Mouse remains optional.

## 9. Metrics & Gamification

| Metric | Definition | Persisted | Reset-progress | Reset-machine |
|---|---|---|---|---|
| **Level** | `floor(sqrt(xp/50))+1` | derived | →1 | →1 |
| **XP** | 10/task −4 hint −6 solution (min 2) | yes | →0 | →0 |
| **Done** | Learn lessons with `done:true` (valid IDs only) | yes | →0 | →0 |
| **Study time** | active seconds (tick while visible+focused, 1 s granularity, save every 10 s) | yes | →0 | →0 |
| **Total Commands** | count of Enters in terminal, **valid or not, pass or fail** | yes (`totalCommands`) | **kept** | →0 |
| Progress bar | `done/118` overall + Drill `done/16` + per-module `done/total` + XP-to-next-level fill | derived | →0% | →0% |

- Per-Act headers show `done/total · %` + ✔ at 100%; each boss fight reuses lesson XP.
- Milestone ranks + quotes fire every 100 lifetime commands.
- `totalCommands` is a lifetime odometer — the only number `Reset progress` never clears.
  Rationale: effort survived even when learner restarts curriculum. `Reset machine` is the
  single escape hatch that zeroes it (double-confirm, typed `RESET`).
- Time format `HH:MM:SS`; study timer pauses on `hidden` tab / blur >60 s.

## 10. Curriculum (30 modules · 118 tasks · ~80h + Drill Bank 16)

Kept IDs are frozen (gaps where trimmed — never renamed, so saved progress survives).

| Act | Modules | Tasks |
|---|---|---|
| Act 1 Survive the Box | M01 Foundations (4) · M02 Data Wrangling (4) · M03 Text (4) · M04 Perms (4) · M05 Users (4) · M06 Processes (4) · M07 systemd (4) · M08 Storage (4) | 32 |
| Act 2 Operate & Connect | M17 Bootstrap (4) · M18 Packages (4) · M09 Networking (4) · M10 Logs (4) · M11 SSH (4) · M12 Scripting (4) · M13 Debugging (4) | 28 |
| Act 3 Ship It | M14 Docker (4) · M15 Web Stack (4) · M16 Capstone (2) · M19 Postgres (4) · M20 Caddy (4) | 18 |
| Act 4 Survive Production | M21 Observability (4) · M22 Perf (4) · M23 Automation (4) · M24 Backups (4) · M25 Net Diag + LB (4) · M26 Incidents (4) · M27 CI/CD (4) · M28 Secrets (4) · M29 Alerting (4) · M30 Capacity (4) | 40 |
| 🥋 Drill Bank | B1 Log Ambush · B2 Dark Server · B3 Ship It Live · B4 2AM Meltdown (4 fights each) | 16 |

Trimmed (duplicates-or-niche, recoverable from git): M17-l2 (hostname), M17-l6 (swap),
M18-l4 (apt remove), M14-l1 (docker images list), M15-l4 (certbot — Caddy owns TLS),
M19-l5 (ss:5432 dup), M21-l2 (mpstat intro — reps in M22/M30), M21-l4 (SMART),
M22-l1 (ab — reps in M30), M23-l3 (cron dup), M23-l5 (at), M23-l7 (make),
M24-l2 (pg_dump dup), M24-l6 (cron automate), M25-l1+l2 (ip/ss viewing dups),
M28-l5 (trivy), M29-l4 (journal persist), M30-l2 (perf profiler).

Full task catalog lives in `summary.md` (normative for build).

## 11. Search, Tips, Progress UI

- **Search bar** (left head): filters Learn + drill fights + tips in one list;
  `Ctrl+K` palette reuses same index; `Enter` jumps; bosses show with 🥋 prefix.
- **Tip of the Day** (sidebar teaser): deterministic by date (`dayOfYear % tips.length`),
  click/`Ctrl+T` opens.
- **Pro tips library:** 141 entries, each `{cmd, why, category}`; `Enter` inserts runnable
  commands or copies shortcut-style tips.
- **Progress:** overall `done/118` fill + Drill `done/16` + per-Act headers + per-module
  rings; XP-to-next-level thin fill; milestone rank + quote every 100 commands.

## 12. Engagement (shipped, deliberately small)

1. **4 Acts** — completable arcs with payoff lines, ✔ headers, and a Boss per Act.
2. **Drill Bank** — 16 combination fights reusing only taught skills; optional, never blocking.
3. **Milestones** — rank + quote every 100 lifetime commands.
4. **Boss-boundary toasts** — “Boss cleared 🥋” / “Curriculum complete 🎓”.
5. **Footer credit** — “Built in California by Subodh” in the lab status bar.
6. **Deep links** — `#palette`, `#help`, `#tips`, `#tips-random`, `?theme=light|dark`.
Dropped from the old roadmap (never built, not promised): exam mode, streaks/quests,
achievements, analytics page, progress export.

## 13. Reset Semantics (normative)

- **Reset progress** (header, palette): confirm dialog → clears `xp`, `lessons{}`, `badges`,
  `activeSeconds`, `streak`, `examHistory`. **Keeps `totalCommands`.** Toast:
  “Progress reset — lifetime commands kept (N)”. Machine FS untouched.
- **Reset machine** (header, palette): double-confirm (checkbox + type `RESET`) → restores
  pristine FS/machine state **and** zeroes **all** progress **including `totalCommands`**.
  Toast: “Machine factory-reset — everything cleared”. This is the only path that zeroes
  the odometer; document it in UI tooltip + `instructions.md`.

## 14. Success Metrics

- Boss 4 clearable unaided after Act 4.
- Median session ≥30 min; Act completion celebrated (✔ header + toast).
- `totalCommands` median ≥300 at curriculum midpoint (effort visible).
- Zero P1: no lesson unfailable/unpassable in simulator; `npm test` auto-solves all 118 + 16.

## 15. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Simulator diverges from real Linux | Mirror Ubuntu output (e.g. mkdir ownership fix); per-command `--help`; drills dogfood the sim |
| 134 items overwhelm | Acts + bosses + search + “Next lesson” default in palette; 10-task sittings |
| Odometer confusion | Tooltip + instructions + distinct confirm copy for the two resets |
| Content regressions | Walkthrough test solves 118+16; UI smoke covers counts/resets/keyboard |

## 16. Shipped vs Later

- **Shipped:** all §7–§13, 118 tasks + 16 fights, 141 tips, resets as defined, tests green.
- **Later:** real container backend toggle, accounts/scoreboard, AI tutor hints, cert export,
  exam mode, streaks, analytics, progress export, i18n, mobile terminal.

## Appendix A — Task-count contract

Build ships exactly the 118 Learn IDs in `summary.md` (kept IDs frozen — gaps where
trimmed, never renamed) + 16 drill IDs (`b1-l1…b4-l4`, namespaced, Learn-external).
`test/run.js` walkthrough must solve all 134. Renames of shipped IDs forbidden.

## Appendix B — Source of truth

Live reference: https://linuxlearning-sage.vercel.app/ + local `../linux_learning/` (V1 code).
This PRD overrides V1 only where it explicitly says so (metrics, resets, counts, new folder).
