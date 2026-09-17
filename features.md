# Features — Linux Mastery v2

Companion to `prd.md` (what/why) and `technical_design.md` (how). This file is the
feature-by-feature build checklist. V1 behavior preserved unless marked **[NEW]** or **[CHANGED]**.

## 1. Layout (beloved format, kept)

- **Topbar:** brand + stats (Level, XP, Done, Study time, **[NEW]** Total Commands) +
  XP-to-next thin bar + buttons (Pro tips, theme, Reset machine, Reset progress) +
  **[NEW]** overall curriculum progress bar `done/211 + %`.
- **Left (chapters):** search bar on top → module folders → per-module `x/y` ring →
  new collapsible folder **`linux advanced`** (M31–M38) → sidebar footer **Tip of the Day**.
- **Center (terminal simulation):** titlebar `sam@ubuntu-lab: ~ · simulated`, scrollback,
  prompt line, footer hint exactly:
  `Esc navigate · Ctrl+K jump · Ctrl+T tips · Alt+↑/↓ lesson · Ctrl+H hint · Ctrl+G solution`.
- **Right (instruction):** objective → theory → examples (click inserts; NAV `1–9`) →
  **Task** (prompt + `Check` implicit on Enter + Hint/Solution + XP stake + tried ticks).
- **Statusbar:** `TERMINAL|NAV` badge + contextual hint + `mouse-free · Ctrl+T tips`.

## 2. Metrics

| Metric | UI | Rule |
|---|---|---|
| Level | `stat-level` | `floor(sqrt(xp/50))+1` |
| XP | `stat-xp` + fill | 10 +5 first-try −3 hint −5 sol (min 2) |
| Done | `stat-done` | count `lessons[id].done` |
| Study time | `stat-time HH:MM:SS` | tick while visible; pause when hidden |
| **[NEW]** Total Commands | `stat-cmds` + tooltip “lifetime Enters, right or wrong” | +1 per non-empty Enter, even on error/fail |
| Progress bar | `overall-fill/text` | `done/211`, per-module rings, folder aggregates |

**[CHANGED]** `Reset progress` keeps Total Commands; **`Reset machine` zeroes everything.**
See `prd.md §13` for confirm copy. Analytics page (new) charts commands/day, top commands,
first-try % — all derived from `totalCommands` + history.

## 3. Terminal simulation

Pipes `|`, redirects `> >> < 2> 2>> &>`, chaining `&& || ;`, `$(…)` substitution, globs,
vars, `~`, history/`!!`, Tab-complete, `Ctrl+L/C`, `↑/↓`. 190+ commands.
**[NEW]** stubs: `ip/netns/bridge/netplan/networkctl/nft/ufw/wg/socat/haproxy -c`,
`column/paste/join/mlr/csvcut/yq/sqlite3`, `sysctl/lsmod/dmesg`, `pvs/lvs/md adm/cryptsetup/btrfs`,
`fail2ban/auditctl`, `perf/bpftrace`, `kubectl/helm`, `restic/rclone`.
Each new command has realistic output + `--help` + failure modes.

## 4. Chapters (left) + search bar

- Folders: `Core (M01–M30)` + **`linux advanced (M31–M38)`**. Collapse persists.
- Search input filters modules/lessons/task-prompts/tips live; clear `×`; `Esc` returns focus to terminal.
- Palette (`Ctrl+K`) shares index + actions (Next/Prev, Hint, Solution, Random tip, Exam,
  Export, Resets, Theme, Help). Default selection = Next lesson.
- Module rows show ring + `x/y`; completed = check; active = highlight; NAV `h/l` switches module.

## 5. Instructions (right) + examples + tasks

- Every lesson: `objective` (1 line) → `theory` (3–8 lines, flags + gotchas) →
  2–4 `examples[]` (`cmd` + `desc`, click/`1–9` inserts, copy icon, “tried” tick) →
  `task{prompt,hint,solution}` + XP stake + Peeked badge if hint/solution used.
- Task completion: any Enter that makes `check(env)` true → pass toast, XP, Done+1,
  ring/bar update, “Next →” suggestion. Fail → inline reason, no XP loss.
- **[NEW]** “Why this matters” one-liner per advanced task (interview/prod framing).

## 6. Expanded sections (user-requested depth)

### 6.1 Networking — 80% creating / 20% viewing (M09 4→10 + M32 8 + M25 +2 = 20 tasks)
- Viewing (20%): `ip addr/route`, `ss -tlnp`, `ping/dig`, `mtr` read-only.
- Creating (80%): write netplan YAML + `netplan apply`, write systemd-networkd `.network`,
  `ip link add veth… + bridge + netns`, `ip route add`, `ufw/nft` allow/deny + reload,
  `ss` after starting listener, `curl` through proxy/upstream, `/etc/hosts` entry,
  NAT masquerade, WireGuard `wg0.conf` + `wg-quick up`, HAProxy/nginx upstream + `nginx -t`,
  `socat` relay, `tcpdump -c` capture proof.
- Grading asserts state (`net.*` + files), never mere history substring.

### 6.2 Viewing & Text Processing (M03 4→10)
Kept: pipes/redirect, `grep -i`, `cut/sort/uniq`, `sed/awk`.
**[NEW]** `m03-l5 less navigation` (`less +/pattern`), `l6 head/tail -F`,
`l7 paste/join/column/tr`, `l8 sort -u/uniq -c pipelines`, `l9 sed -E regex groups`,
`l10 awk field programs + printf`. Fixtures: 10k-line access log + CSV.

### 6.3 Data Wrangling (M02 4→8)
Kept: `jq .field`, `awk status counts`, `sed -i`, `diff -u`.
**[NEW]** `l5 jq slurp/filter/reduce`, `l6 mlr/csvcut stats`, `l7 yq eval + sqlite3 import`,
`l8 xargs -P parallel + datamash`. All operate on `/srv/data/*`.

### 6.4 New folder: linux advanced (M31–M38, 56 tasks)
| Mod | Focus | Signature creates |
|---|---|---|
| M31 Adv. Text & Data (8) | csvkit, jq+, xml, sqlite, parallel | `report.csv` via pipeline, `query.sql` result |
| M32 Adv. Networking Build (8) | netns/veth/bridge/NAT/nft/tc/wg/socat | working topology + `topo.txt` proof |
| M33 Kernel/Boot (7) | dmesg, lsmod, sysctl, grub, cgroups, ns | `sysctl.d/99-lab.conf` + `cgroup` cap |
| M34 Storage adv (7) | LVM, RAID, LUKS, btrfs, NFS | `vg0/lvdata` + crypt mount + snapshot |
| M35 Security/Forensics (7) | fail2ban, AppArmor, auditd, sudoers, hunt | `jail.local` + `audit.rules` + Vault kv |
| M36 Perf/eBPF (7) | perf, bpftrace, flame, tuned, limits | `perf.data` + `limits.conf` + report |
| M37 GitOps/Containers (7) | multi-stage, compose, k3s, helm, CI | image + `deployment.yaml` + green deploy |
| M38 Capstone (5) | harden→break→fix→ship + writeup | live app + `POSTMORTEM.md` |

## 7. Gamification & new engagement

- **[KEPT]** XP/levels/badges/first-try/hint-sol penalties/time.
- **[NEW]** Total Commands odometer (see §2).
- **[NEW]** Daily Quest (`25 XP or 3 tasks`) + streak flame + goal ring.
- **[NEW]** Exam mode: 10 random tasks, no hints, timer, score report → `examHistory`.
- **[NEW]** Boss fight per folder: chained incident (502→disk→CPU) in one session.
- **[NEW]** Achievements: First Blood, Pipe Wizard, Net Builder (10 creates), Night Owl,
  100-Commands, Tip Hoarder (25 inserts), Clean Sheet (exam 10/10).
- **[NEW]** Command analytics drawer: top-10 commands, pass rate, sparkline.
- **[NEW]** Export/import progress JSON; deep links `#m09-l5 #tips #exam`; offline-ready.
- **[NEW]** 180+ tips (V1 141 + ~40: net-create, jq/yq, nft/wg, LUKS, eBPF one-liners).

## 8. Keyboard map (normative, mouseless-complete)

`Esc` NAV (`h j k l g G Enter 1–9 i/q`) · `Ctrl+K` palette · `Ctrl+T` tips (`Tab` cat) ·
`Alt+↑/↓` lesson · `Ctrl+H` hint · `Ctrl+G` solution · `Ctrl+Enter` next ·
`Ctrl+Shift+D` theme · `Ctrl+L` clear · `Ctrl+C` cancel · `↑/↓` history · `Tab` complete ·
`?` help. Palette covers every button action (resets/exam/export/theme) so mouse never required.
Statusbar + overlay document this; `?` opens help.

## 9. Resets, tips, progress bar (acceptance)

- Search finds any of 211 tasks by keyword in <100 ms; `Enter` jumps.
- Tip-of-day deterministic (`dayOfYear % 180`), no repeat in 30 d; click opens `Ctrl+T`.
- Progress bar `x/211` exact; per-module rings exact; XP fill ` (xp-cur)/(next-cur)`.
- `Reset progress`: keeps `totalCommands`, zeroes rest, toast shows kept count.
- `Reset machine`: type-`RESET` confirm, zeroes `totalCommands`, restores FS/net, toast confirms.
- Wrong commands still +1 Total; empty Enter +0; history `!!` re-exec +1 again.

## 10. Build checklist (code phase gate)

- [ ] `curriculum.js` 211 lessons, IDs per `summary.md`, checks state-based for creates.
- [ ] `commands.js` new stubs + helps; `machine.js` fixtures; `net` model + reset.
- [ ] `app.js` odometer, search index, palette actions, exam/boss/quest/streak, export, deep links.
- [ ] `tips.js` ≥180; sidebar teaser + `Ctrl+T` browser.
- [ ] Header `#stat-cmds`, tooltips, confirms, toasts, progress `x/211`.
- [ ] `test/run.js` solves 211; `test/ui-smoke.js` covers §9 + keyboard.
- [ ] Vercel build green; `?theme=` + `#` links work; offline reload keeps progress.
