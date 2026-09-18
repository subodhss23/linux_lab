# Features — Linux Mastery (4 Acts + Drill Bank)

Companion to `prd.md` (what/why) and `technical_design.md` (how). This file is the
feature-by-feature build checklist. It describes what SHIPPED (30 modules / 118 tasks /
141 tips + Drill Bank); the old 211-task / M31–M38 plan was never built and is dropped.

## 1. Layout (beloved format, kept)

- **Topbar:** brand + stats (Level, XP, Done, Study time, Total Commands) +
  XP-to-next thin bar + buttons (Pro tips, theme, Reset machine, Reset progress, Logout) +
  overall curriculum progress bar `done/118`.
- **Left (chapters):** search bar on top → 4 Act sections (each with title, payoff,
  live `done/total · %`, ✔ at 100%) → per-module `x/y` ring → **🥋 Drill Bank**
  (4 boss fights, own `done/16` counter) → sidebar footer **Tip of the Day**.
- **Center (terminal simulation):** titlebar `sam@ubuntu-lab: ~ · simulated`, scrollback,
  prompt line, footer hint exactly:
  `Esc navigate · Ctrl+K jump · Ctrl+T tips · Alt+↑/↓ lesson · Ctrl+H hint · Ctrl+G solution`.
- **Right (instruction):** objective → theory → examples (click inserts; NAV `1–9`) →
  **Task** (prompt + `Check` implicit on Enter + Hint/Solution + tried ticks).
- **Statusbar:** `TERMINAL|NAV` badge + contextual hint + `mouse-free · tips` +
  `Built in California by Subodh`.

## 2. Metrics

| Metric | UI | Rule |
|---|---|---|
| Level | `stat-level` | `floor(sqrt(xp/50))+1` |
| XP | `stat-xp` + fill | 10 per task, −4 hint, −6 solution (min 2) |
| Done | `stat-done` | count of done lessons among current Learn IDs (`x/118`) |
| Study time | `stat-time HH:MM:SS` | tick while visible; pause when hidden |
| Total Commands | `stat-cmds` + tooltip “lifetime Enters, right or wrong” | +1 per non-empty Enter, even on error/fail |
| Progress bar | `overall-fill/text` | `done/118`, per-module rings, per-Act headers, Drill Bank `done/16` |
| Milestones | toast + terminal banner | every 100 lifetime commands: rank + quote |

`Reset progress` keeps Total Commands; **`Reset machine` zeroes everything.**
Stale progress keys (removed lessons) are ignored by the Done counter.

## 3. Terminal simulation

Pipes `|`, redirects `> >> < 2> 2>> &>`, chaining `&& || ;`, `$(…)` substitution, globs,
vars, `~`, history/`!!`, Tab-complete, `Ctrl+L/C`, `↑/↓`. ~190 commands incl. `docker
(+compose)`, `nginx`, `psql/pg_dump/pg_isready`, `caddy`, `restic`, `rclone`, `vault`,
`auditctl`, `trivy`, `promtool`, `amtool`, `gh`, `ab`, `hey`, `wrk`, `sysctl`, `perf`,
`fio`, `sysbench`, `ansible-playbook`, `tcpdump`, `nmap`, `mtr`, `fail2ban-client`.
Ownership is enforced like real Ubuntu: user `mkdir` creates user-owned dirs
(fixed Part 4 — nested `mkdir -p ~/a/b` used to fail), `sudo mkdir` stays root-owned.

## 4. Chapters (left) + search bar

- Acts: `Act 1 Survive (M01–M08)` + `Act 2 Operate (M17,M18,M09–M13)` +
  `Act 3 Ship (M14–M16,M19–M20)` + `Act 4 Production (M21–M30)` + **`Drill Bank (B1–B4)`**.
  UI order follows Acts (bootstrap before networking), not file order; glyphs are stable
  (`01`–`30`, `B1`–`B4`).
- Search input filters Learn + drill fights live; clear `×`; `Esc` returns focus to terminal.
- Palette (`Ctrl+K`) shares index (Next/Prev, Hint, Solution, tips, resets, theme, logout,
  every lesson + every fight). Default selection = Next lesson.
- Module rows show ring + `x/y`; completed = check; active = highlight; NAV `h/l` switches module (boss-aware).

## 5. Instructions (right) + examples + tasks

- Every lesson: `objective` (1 line) → `theory` (3–8 lines, flags + gotchas) →
  2–4 `examples[]` (`cmd` + `desc`, click/`1–9` inserts, copy icon, “tried” tick) →
  `task{prompt,hint,solution}` + XP stake + Peeked badge if hint/solution used.
- Task completion: any Enter that makes `check(env)` true → pass toast, XP, Done+1,
  ring/bar update, “Next →” suggestion. Fail → inline reason, no XP loss.
- Boss fights reuse the same panel/grading/XP; finishing a fight's last task toasts
  instead of leaking into Learn; finishing M30-l5 toasts “Curriculum complete 🎓”.

## 6. Curriculum shape (3–4 tasks per chapter)

Every Learn chapter holds 2–4 graded tasks (M16 capstone: 2) covering the most-used,
most-impactful commands; variations live in clickable examples. 19 tasks were trimmed
as duplicates-or-niche (see `summary.md`); cuts survive in git + archived `curriculum-extra.js`.

### 6.1 Networking (M09 4 + M25 4 — view once, diagnose deeply)
- M09: `ip addr/route`, `ping/dig`, `ss -tlnp`, `ufw allow + enable` + `curl`.
- M25: pure diagnostics + create: `tcpdump -c` capture, `nmap` + `nc`, `mtr` report,
  nginx `upstream` + `proxy_pass`. Viewing dups (`ip r`, `ss` lists) were cut.
- Grading asserts state/files, never mere history substring.

### 6.2 Viewing & Text Processing (M03, 4)
Pipes/redirect, `grep -i`, `cut/sort/uniq`, `sed/awk`. The daily text toolkit, nothing exotic.

### 6.3 Data Wrangling (M02, 4)
`jq .field`, `awk` status counts, `sed -i` surgery, `diff -u` discipline. No csvkit/yq/sqlite
(they were planned, never built, and cut from scope).

### 6.4 Drill Bank (B1–B4, 16 fights — reviews live here, never in the flow)
| Boss | After | Fights |
|---|---|---|
| B1 Log Ambush (4) | Act 1 | rank 404s, scrub+diff, 700 locker, kill runaway |
| B2 Dark Server (4) | Act 2 | fw-vs-listeners, 3-way ssh proof, ship+gate, port-80 witnesses |
| B3 Ship It Live (4) | Act 3 | throwaway 8081 + clean dock, proxy targets, db parade, caddy valid |
| B4 2AM Meltdown (4) | Act 4 | incident bundle, 502 + restore, backup proofs, secrets + signals |

## 7. Gamification & engagement (shipped)

- XP/levels/rings/Act headers/Drill counter/milestone ranks + quotes every 100 commands.
- Total Commands odometer (see §2).
- Pro-tip library (141) + Tip of the Day + `Ctrl+T` browser.
- Boss fights per Act (see §6.4) — the reps live here.
- Deep links `#palette`, `#help`, `#tips`, `#tips-random`, `?theme=light|dark`.
- NOT built (old roadmap, dropped): daily quest/streak, exam mode, achievements,
  analytics page, progress export/import, accounts.

## 8. Keyboard map (normative, mouseless-complete)

`Esc` NAV (`h j k l g G Enter 1–9 i/q`) · `Ctrl+K` palette · `Ctrl+T` tips (`Tab` cat) ·
`Alt+↑/↓` lesson · `Ctrl+H` hint · `Ctrl+G` solution · `Ctrl+Enter` next ·
`Ctrl+Shift+D` theme · `Ctrl+L` clear · `Ctrl+C` cancel · `↑/↓` history · `Tab` complete ·
`?` help. Palette covers lessons, fights, tips, resets, theme, logout — mouseless-complete.
Statusbar + overlay document this; `?` opens help.

## 9. Resets, tips, progress bar (acceptance)

- Search finds any of 118 tasks + 16 fights by keyword; `Enter` jumps.
- Tip-of-day deterministic (`dayOfYear % len`); click opens `Ctrl+T`.
- Progress bar `x/118` exact; Drill Bank `x/16` exact; per-module rings exact; XP fill exact.
- `Reset progress`: keeps `totalCommands`, zeroes rest, toast shows kept count.
- `Reset machine`: type-`RESET` confirm, zeroes `totalCommands`, restores seed, toast confirms.
- Wrong commands still +1 Total; empty Enter +0; history `!!` re-exec +1 again.

## 10. Build checklist (all green)

- [x] `curriculum.js` 118 lessons, frozen IDs (gaps where trimmed), state-based checks.
- [x] `drillbank.js` 16 fights (`b1-l1…b4-l4`), Learn-external, walkthrough-covered.
- [x] `commands.js` real-behavior stubs + `--help`; `machine.js` seed fixtures; mkdir ownership fix.
- [x] `app.js` Acts order, Drill section, palette, toasts, `validIds`, footer credit.
- [x] `tips.js` 141 tips; sidebar teaser + `Ctrl+T` browser.
- [x] Header `#stat-cmds`, tooltips, confirms, toasts, progress `x/118` + drill `x/16`.
- [x] `test/run.js` 98 checks (118 + 16 auto-solved); `test/ui-smoke.js` (34 modules / 134 lessons).
