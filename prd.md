# PRD — Linux Mastery v2: Intermediate & Advanced Linux, by Doing

> Rebuild of https://linuxlearning-sage.vercel.app/ (Next.js) — same beloved 3-pane format,
> expanded curriculum, new lifetime `Total Commands` metric, top progress bar, full keyboard-only
> operation, and a new top-level folder **“linux advanced”**.
> **No code in this phase — .md specs only.**

## 1. Product Summary

**Linux Mastery v2** is a zero-setup, browser-based Ubuntu lab that teaches intermediate →
advanced Linux by doing. Center = simulated terminal. Left = chapters/modules. Right =
lesson instructions + clickable examples + graded task. Top = Level / XP / Done /
Study time / **Total Commands** + curriculum progress bar.

Learner types real commands (`grep`, `awk`, `ss`, `ip`, `nft`, `systemctl`, `docker`…),
the simulator grades state deterministically, awards XP, and persists progress in the browser.

**Scale v2:** 38 modules · **211 graded tasks** · ~112 h · 180+ pro tips.
V1 was 30 modules / 137 tasks / ~89 h / 141 tips. All V1 content is preserved verbatim;
v2 only **adds** depth where users asked:

- **Networking → creating 80% / viewing 20%.** Viewing (`ip addr`, `ss`, `dig`) stays as
  prerequisite; the bulk is *creating*: netplan YAML, systemd-networkd units, veth pairs,
  bridges, static routes, NAT, nftables/ufw rules, WireGuard tunnels, HAProxy/nginx upstreams.
- **Viewing & Text Processing** expanded 4 → 10 lessons (pager mastery, head/tail/live,
  cut/sort/uniq, tr/column/paste, sed/awk transforms, regex).
- **Data Wrangling** expanded 4 → 8 lessons (jq, awk aggregation, sed -i surgery, diff discipline
  + csvkit/mlr, yq, sqlite ingestion, parallel xargs).
- **New folder “linux advanced”** (M31–M38, 56 tasks): kernel/boot, LVM/RAID/LUKS, hardening/
  forensics, eBPF/perf, GitOps/containers/prod delivery, final capstone.

## 2. Problem Statement

Video/reading learners recognize commands but freeze at a real prompt. Real servers are risky
to practice on; cloud sandboxes need setup, cost money, or reset. V1 solved this with a
deterministic simulator. V2 solves the remaining gaps observed in V1:

1. Networking was view-heavy; employers test *building* networks.
2. Text/data skills were too thin for real log/config/CSV work.
3. No advanced track (kernel, eBPF, LUKS, hardening, capacity) for senior/DevOps roles.
4. No lifetime effort odometer — learners wanted credit for *every* keystroke, right or wrong.

## 3. Goals (v2)

- [ ] Preserve exact V1 layout users love: terminal center, chapters left, instructions right,
      examples click-to-insert, task must-complete to advance.
- [ ] Reach **≥200 graded tasks** (ship 211) without breaking any V1 lesson ID (`m01-l1…m30-l5` stable).
- [ ] Add **`totalCommands`** metric: increments on every Enter in terminal, correct or not.
- [ ] Ship top **curriculum progress bar** (`done/total`, per-module rings) + header stats:
      Level, XP, Done, Study time, Total Commands.
- [ ] Define reset semantics precisely:
      `Reset progress` = clears XP/tasks/badges/study-time but **preserves totalCommands**.
      `Reset machine` = factory reset, clears **everything including totalCommands**.
- [ ] Fully mouseless: `Esc` navigate · `Ctrl+K` jump · `Ctrl+T` tips · `Alt+↑/↓` lesson ·
      `Ctrl+H` hint · `Ctrl+G` solution (+ full map in §8).
- [ ] Search bar (modules + tasks + tips) + Tip of the Day + 5+ new robustness/engagement features.
- [ ] Spec-first: `prd.md`, `technical_design.md`, `features.md`, `instructions.md`, `summary.md`
      land before any code.

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
| Alex (senior → DevOps) | Harden, tune, debug prod, own incident playbook | Weekend deep-dives in “linux advanced” |

All use a modern laptop browser. No Linux install required.

## 6. Learner Outcomes

V1 outcomes (navigation → capacity) all retained. V2 adds:

| Domain | New outcome |
|---|---|
| Networking (create) | Author netplan/networkd units, build veth/bridge/namespace topologies, add routes, SNAT/DNAT, nftables/ufw policy, WireGuard peer, LB upstream |
| Text / viewing | Drive `less`, `head/tail -F`, `cut/sort/uniq -c`, `tr/column/paste/join`, `sed -E`, `awk` field programs, `grep -P` regex |
| Data wrangling | `jq` filters/slurp, `yq`, `csvkit`/`mlr`, `sqlite3` import + SQL, `diff -u`, `xargs -P` parallelism |
| Kernel/boot | Read `dmesg`, manage `sysctl`, `lsmod/modprobe`, GRUB defaults, initramfs, cgroups v2, namespaces |
| Storage adv. | Build LVM (pv/vg/lv), resize, mdadm RAID1, LUKS encrypt/open, btrfs snapshot, NFS export |
| Security | `fail2ban`, AppArmor, `auditd`, AIDE, sudoers.d least-privilege, secret hunt + Vault |
| Perf/eBPF | `perf stat/top`, `bpftrace` one-liners, flame-graph workflow, `tuned`, cgroup caps |
| Prod delivery | Multi-stage Dockerfile, compose rollout, k3s manifest apply, health-gated blue-green |

## 7. Core Experience (must-keep format)

```
┌──────────────────────────────────────────────────────────────┐
│ Topbar: logo · Level XP Done Study-time TotalCmds · XP bar   │
│         Pro-tips · theme · Reset machine · Reset progress    │
│         Curriculum progress: ████████░░ 142/211 tasks (67%)  │
├──────────┬────────────────────────────┬──────────────────────┤
│ LEFT     │ CENTER                     │ RIGHT                │
│ chapters │ terminal simulation        │ instruction          │
│ search   │ sam@ubuntu-lab:~$ █        │ theory               │
│ modules  │ output scrollback          │ examples (clickable) │
│ rings    │ statusbar: TERMINAL/NAV    │ task + hint/solution │
│ tip-day  │ hint: Esc nav · Ctrl+K…    │ XP value, check btn  │
└──────────┴────────────────────────────┴──────────────────────┘
```

- **Left:** collapsible module folders incl. new folder `linux advanced`; search filters
  modules+lessons+tips; per-module ring + `x/y`; click or keyboard opens lesson.
- **Center:** simulated prompt `sam@ubuntu-lab:~$`, scrollback, input. Supports pipes,
  redirects (`> >> < 2> &>`), chaining (`&& || ;`), `$(…)` substitution, globs, vars, `~`,
  history (`↑/↓`, `history`, `!!`), Tab-complete, `Ctrl+L/C`.
- **Right:** objective → theory → 2–4 clickable examples (click or `1–9` in NAV mode inserts
  into terminal) → **Task** box (prompt, hidden check, Hint / Solution buttons, XP stake).
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
| **XP** | 10/task +5 first-try −3 hint −5 solution (min 2) | yes | →0 | →0 |
| **Done** | lessons with `done:true` | yes | →0 | →0 |
| **Study time** | active seconds (tick while visible+focused, 1 s granularity, save every 10 s) | yes | →0 | →0 |
| **Total Commands** ⭐ NEW | count of Enters in terminal, **valid or not, pass or fail** | yes (`totalCommands`) | **kept** | →0 |
| Progress bar | `done/211` overall + per-module `done/total` + XP-to-next-level fill | derived | →0% | →0% |

- Badges: one per module at 100%; “linux advanced” folder badge at 56/56.
- Streak / daily goal (new): 1+ task/day extends streak; 25 XP/day default goal ring.
- First-try bonus only if no hint/solution and first graded Enter passes.
- `totalCommands` is a lifetime odometer — the only number `Reset progress` never clears.
  Rationale: effort survived even when learner restarts curriculum. `Reset machine` is the
  single escape hatch that zeroes it (double-confirm, typed `RESET` in v2).
- Time format `HH:MM:SS`; study timer pauses on `hidden` tab / blur >60 s.

## 10. Curriculum (38 modules · 211 tasks · ~112 h)

V1 M01–M30 kept (137 tasks). Expansions + new folder:

| ID | Module (folder) | Tasks | Δ | Hours |
|---|---|---|---|---|
| M01 | Foundations: Fluency Drill | 4 | — | 2 |
| M02 | Data Wrangling & System Introspection | 8 | +4 | 4.5 |
| M03 | Viewing & Text Processing | 10 | +6 | 5 |
| M04 | Permissions & Ownership | 4 | — | 3 |
| M05 | Users & Groups | 4 | — | 2.5 |
| M06 | Processes & Jobs | 4 | — | 3 |
| M07 | Services & systemd | 4 | — | 2.5 |
| M08 | Filesystems & Storage | 4 | — | 3 |
| M09 | Networking (80% create / 20% view) | 10 | +6 | 5 |
| M10 | Logs & Monitoring | 4 | — | 2.5 |
| M11 | SSH & Remote Access | 4 | — | 3 |
| M12 | Shell Scripting & Cron | 4 | — | 3 |
| M13 | Debugging & Troubleshooting | 4 | — | 2.5 |
| M14 | Docker & Containers | 5 | — | 3.5 |
| M15 | Web Stack: Build & Deploy | 5 | — | 4 |
| M16 | Capstone: Deploy a Full App | 2 | — | 1.5 |
| M17 | Server Bootstrap: Day-0 Checklist | 6 | — | 3 |
| M18 | Ubuntu Server Essentials & Packages | 5 | — | 2.5 |
| M19 | PostgreSQL in Production | 5 | — | 3 |
| M20 | Caddy & Modern Web Serving | 4 | — | 2.5 |
| M21 | Monitoring & Observability | 6 | — | 3 |
| M22 | Performance & Load Testing | 5 | — | 3 |
| M23 | Automation & IaC | 7 | — | 3.5 |
| M24 | Backups, Restore & DR | 6 | — | 3 |
| M25 | Robust Networking, Diagnostics & LB | 8 | +2 | 4 |
| M26 | Production Incident Response | 4 | — | 4 |
| M27 | Zero-Downtime Deploys & CI/CD | 4 | — | 3.5 |
| M28 | Secrets Mgmt & Security Hardening | 5 | — | 3.5 |
| M29 | Observability & Alerting | 5 | — | 3 |
| M30 | Capacity Planning & Perf Tuning | 5 | — | 3.5 |
| **M31** | **linux advanced / Adv. Text & Data Wrangling** | 8 | NEW | 4 |
| **M32** | **linux advanced / Adv. Networking: Build & Create** | 8 | NEW | 4 |
| **M33** | **linux advanced / Kernel, Boot & Internals** | 7 | NEW | 3.5 |
| **M34** | **linux advanced / Storage: LVM, RAID & Encryption** | 7 | NEW | 3.5 |
| **M35** | **linux advanced / Security, Hardening & Forensics** | 7 | NEW | 3.5 |
| **M36** | **linux advanced / Performance Engineering & eBPF** | 7 | NEW | 3.5 |
| **M37** | **linux advanced / GitOps, Containers & Prod Delivery** | 7 | NEW | 3.5 |
| **M38** | **linux advanced / Final Capstone** | 5 | NEW | 2.5 |
| | **Total** | **211** | **+74** | **~112** |

Networking 80/20 rule (M09+M32): of 18 networking tasks, ≥14 must mutate/create state
(netplan write + apply, veth/bridge/namespace, route add, NAT, nft/ufw, WireGuard, LB upstream,
socat relay, `/etc/hosts` entry) and ≤4 are pure viewing (`ip`, `ss`, `dig`, `ping`).
Checks must assert FS/config/process state, not just history substring.

Full 211-task table (ID, module, title, prompt, solution, XP) lives in `summary.md`
(normative for build) and is summarized by feature in `features.md`.

## 11. Search, Tips, Progress UI

- **Search bar** (left head): filters modules + lesson titles + task prompts + tip commands
  in one list; `Ctrl+K` palette reuses same index; `Enter` jumps; empty state suggests Next lesson.
- **Tip of the Day** (sidebar teaser): deterministic by date (`dayOfYear % tips.length`),
  click/`Ctrl+T` opens; rotates without repeating within 30 d window.
- **Pro tips library:** 180+ entries (141 carried + ~40 new on networking-create, jq/yq,
  eBPF, LUKS, nftables, WireGuard); each `{cmd, why, category}`; `Enter` inserts runnable
  commands or copies shortcut-style tips.
- **Progress bar (top):** overall `done/211` fill + % + per-module rings; XP-to-next-level
  thin fill under stats; 100% triggers confetti + folder badge.

## 12. New Robustness / Delight Features (v2)

1. **Daily Quest + streak** — “Complete 3 tasks / earn 25 XP today”; streak flame in header.
2. **Exam mode** — hides hints/solutions, shuffles 10 tasks, timed, grades pass/fail + report.
3. **Boss fight per folder** — multi-step incident (502 + disk + OOM) requiring 3–5 commands.
4. **Command analytics** — most-used commands, success rate, first-try % (feeds off `totalCommands`).
5. **Copy-example + runnable check** — every example has copy button + “tried” tick.
6. **Undo-hint / retry-streak** — retry without re-peek keeps first-try window (forgiving).
7. **Offline + export** — progress export/import JSON; works offline after first load.
8. **Deep links** — `#m09-l5`, `#tips`, `#exam`, `?theme=light|dark`.

## 13. Reset Semantics (normative)

- **Reset progress** (header, palette): confirm dialog → clears `xp`, `lessons{}`, `badges`,
  `activeSeconds`, `streak`, `examHistory`. **Keeps `totalCommands`.** Toast:
  “Progress reset — lifetime commands kept (N)”. Machine FS untouched.
- **Reset machine** (header, palette): double-confirm (checkbox + type `RESET`) → restores
  pristine FS/machine state **and** zeroes **all** progress **including `totalCommands`**.
  Toast: “Machine factory-reset — everything cleared”. This is the only path that zeroes
  the odometer; document it in UI tooltip + `instructions.md`.

## 14. Success Metrics

- Capstone (M38) completable unaided after curriculum.
- Median session ≥30 min; Day-7 return ≥35% (local estimate via streak).
- ≥75% tasks pass before hint (first-try proxy).
- `totalCommands` median ≥400 at curriculum midpoint (effort visible).
- Zero P1: no lesson unpassable in simulator; `npm test` auto-solves all 211.

## 15. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Simulator diverges from real Linux | Mirror Ubuntu output; per-command “differs” note; exam uses only covered flags |
| Create-heavy networking ungradable | Grade FS/config/net-state, not string match; seed fixtures; idempotent checks |
| 211 tasks overwhelm | Folders + search + daily quests + exam; “Next lesson” default in palette |
| Odometer confusion | Tooltip + instructions + distinct confirm copy for the two resets |
| Content regressions | Walkthrough test solves all 211; UI smoke covers resets/keyboard |

## 16. MVP vs Later

- **V2 MVP (this spec):** all §7–§13, 211 tasks, 180+ tips, resets as defined, tests green, Vercel deploy.
- **Later:** real container backend toggle, accounts/scoreboard, AI tutor hints, cert export,
  i18n, mobile terminal.

## Appendix A — Task-count contract

Build MUST ship exactly the 211 IDs in `summary.md` (`m01-l1…m30-l5` unchanged +
`m02-l5…l8`, `m03-l5…l10`, `m09-l5…l10`, `m25-l7…l8`, `m31-l1…m38-l5`). Renames of V1 IDs forbidden.
New IDs must validate in `test/run.js` walkthrough.

## Appendix B — Source of truth

Live reference: https://linuxlearning-sage.vercel.app/ + local `../linux_learning/` (V1 code).
This PRD overrides V1 only where it explicitly says so (metrics, resets, counts, new folder).
