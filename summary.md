# Summary — Linux Mastery (4 Acts + Drill Bank, shipped)

## 1. Executive summary

Browser-based Ubuntu lab (Next.js, 3-pane: Acts left · terminal center ·
instructions+examples+task right), restructured for completable sittings:

- 30 modules / **118 tasks** / ~80h in **4 Acts** (~3 sittings of 10 tasks each).
- **Drill Bank**: 4 boss fights x 4 (16 reps) reusing only taught skills; reviews never block.
- **[Total Commands** odometer in header (counts every Enter, right or wrong).
- Top **curriculum progress bar** (`done/118`) + Drill counter (`done/16`) + per-Act headers +
  per-module rings + XP-to-next bar + footer credit “Built in California by Subodh”.
- Precise resets: `Reset progress` keeps Total Commands; `Reset machine` zeroes everything.
- Fully mouseless (`Esc · Ctrl+K · Ctrl+T · Alt+↑/↓ · Ctrl+H · Ctrl+G`), search bar, Tip of the Day,
  milestone ranks every 100 commands.
- `curriculum-extra.js` archived (not loaded); the 211-task / M31–M38 plan was never built.

## 2. What changed vs V1 (filed against the original 30-module / 137-task lab)

| Area | V1 | Now |
|---|---|---|
| Modules/tasks | 30 / 137 | **30 / 118** (19 duplicates-or-niche cut; IDs frozen, gaps kept) |
| Hours | ~89 | **~80** |
| Structure | flat module list | **4 Acts + Drill Bank** (UI follows Act order) |
| Reviews | none | **4 bosses x 4** (Learn-external, own counter) |
| Header metrics | Level, XP, Done, Study time | + **Total Commands** (`#stat-cmds`) + footer credit |
| Progress | sidebar text | top bar `x/118` + drill `x/16` + Act headers + rings + XP fill |
| Tips | 141 | **141** |
| Reset progress | erase XP/tasks | erase XP/tasks/time **but keep Total Commands** (stale IDs ignored) |
| Reset machine | FS only, keep XP | **factory: seed + all metrics incl. Total Commands** |
| Simulator fix | — | **mkdir ownership** (user-owned, sudo root-owned) |
| Tests | — | **98 checks: 118 + 16 auto-solved** |

## 3. IA & layout (shipped)

Topbar (brand · Level XP Done Study TotalCmds · XP bar · Pro-tips/theme/2 resets/logout · overall bar) /
Left (search · 4 Acts with payoff+counter+✔ · rings · 🥋 Drill Bank with counter · tip-day) /
Center (simulated `sam@ubuntu-lab:~$`, scrollback, `Esc…Ctrl+G` hint) /
Right (objective/theory/clickable examples/task/hint/solution) /
Statusbar (TERMINAL|NAV + hints + Built in California by Subodh). Full keyboard map in `prd.md §8`.

## 4. Module map (30 modules · 118 tasks · ~80h + Drill Bank 16)

| Act | Modules | T |
|---|---|---|
| Act 1 Survive the Box | M01 Foundations · M02 Data Wrangling · M03 Text · M04 Perms · M05 Users · M06 Processes · M07 systemd · M08 Storage (4 each) | 32 |
| Act 2 Operate & Connect | M17 Bootstrap (4) · M18 Packages (4) · M09 Networking (4) · M10 Logs (4) · M11 SSH (4) · M12 Scripting (4) · M13 Debugging (4) | 28 |
| Act 3 Ship It | M14 Docker (4) · M15 Web Stack (4) · M16 Capstone (2) · M19 Postgres (4) · M20 Caddy (4) | 18 |
| Act 4 Survive Production | M21 Observability (4) · M22 Perf (4) · M23 Automation (4) · M24 Backups (4) · M25 Net Diag + LB (4) · M26 Incidents (4) · M27 CI/CD (4) · M28 Secrets (4) · M29 Alerting (4) · M30 Capacity (4) | 40 |
| 🥋 Drill Bank | B1 Log Ambush · B2 Dark Server · B3 Ship It Live · B4 2AM Meltdown (4 fights each) | 16 |

Count proof: 137 carried − 19 trimmed (M17-l2,l6 · M18-l4 · M14-l1 · M15-l4 · M19-l5 ·
M21-l2,l4 · M22-l1 · M23-l3,l5,l7 · M24-l2,l6 · M25-l1,l2 · M28-l5 · M29-l4 · M30-l2) = **118**.
UI order follows Acts (M17/M18 before M09); glyphs stable (`01`–`30`, `B1`–`B4`).

## 5. Normative task catalog (build ships exactly these IDs)

Format: `ID` Title. Kept IDs frozen (gaps where trimmed). Full `task{prompt,hint,solution}`
+ `check()` in `curriculum.js` / `drillbank.js` is authoritative; `test/run.js` auto-solves all.

### Act 1 · Survive the Box (32)
### M01 Foundations: Fluency Drill (4)
- `m01-l1` Inventory the filesystem with find
- `m01-l2` Log forensics: find the top talkers
- `m01-l3` Ownership and symlink hygiene
- `m01-l4` Triage a runaway process and its port
### M02 Data Wrangling & System Introspection (4)
- `m02-l1` Parse application config with jq
- `m02-l2` Aggregate logs with awk
- `m02-l3` Config surgery with sed -i
- `m02-l4` Diff discipline before you deploy
### M03 Viewing & Text Processing (4)
- `m03-l1` Pipes and redirection
- `m03-l2` Searching with grep
- `m03-l3` Cutting, sorting, counting
- `m03-l4` Transforming with sed and awk
### M04 Permissions & Ownership (4)
- `m04-l1` Reading permissions
- `m04-l2` chmod with octal
- `m04-l3` chmod with symbols, chown, chgrp
- `m04-l4` umask, setuid and sticky
### M05 Users & Groups (4)
- `m05-l1` Who am I? id, groups, who
- `m05-l2` Creating users: useradd / adduser
- `m05-l3` Groups and sudo access
- `m05-l4` Switching users: su and sudo
### M06 Processes & Jobs (4)
- `m06-l1` Seeing processes: ps and top
- `m06-l2` Signals and kill
- `m06-l3` Jobs, background and nohup
- `m06-l4` Priority: nice and renice
### M07 Services & systemd (4)
- `m07-l1` systemctl status/start/stop
- `m07-l2` Enable and disable at boot
- `m07-l3` Reading logs with journalctl
- `m07-l4` Starting your own unit
### M08 Filesystems & Storage (4)
- `m08-l1` Space: df and du
- `m08-l2` Devices and mounts
- `m08-l3` Persistent mounts with fstab
- `m08-l4` Archives and backups with tar

### Act 2 · Operate & Connect (28)
### M17 Server Bootstrap: Day-0 Checklist (4 — cut l2 hostname, l6 swap)
- `m17-l1` Update the system first
- `m17-l3` Create yourself an admin account
- `m17-l4` Harden SSH
- `m17-l5` Firewall on, default deny
### M18 Ubuntu Server Essentials & Packages (4 — cut l4 apt remove)
- `m18-l1` Install your essential toolbox
- `m18-l2` Query installed packages: dpkg
- `m18-l3` APT in depth
- `m18-l5` Install and enable a service
### M09 Networking (4)
- `m09-l1` Interfaces and routes
- `m09-l2` Testing connectivity and DNS
- `m09-l3` Ports and sockets: ss
- `m09-l4` HTTP with curl/wget and the firewall
### M10 Logs & Monitoring (4)
- `m10-l1` Where logs live
- `m10-l2` Following logs live
- `m10-l3` Hunting in logs
- `m10-l4` Resources: free, top, uptime
### M11 SSH & Remote Access (4)
- `m11-l1` Connecting with ssh
- `m11-l2` SSH keys
- `m11-l3` ssh config and copying files
- `m11-l4` Hardening SSH
### M12 Shell Scripting & Cron (4)
- `m12-l1` Your first script
- `m12-l2` Conditionals and exit codes
- `m12-l3` Loops and arguments
- `m12-l4` Scheduling with cron
### M13 Debugging & Troubleshooting (4)
- `m13-l1` Exit codes and 'command not found'
- `m13-l2` Port conflicts with lsof
- `m13-l3` Tracing with strace
- `m13-l4` Incident: a service won't start

### Act 3 · Ship It (18)
### M14 Docker & Containers (4 — cut l1 images list)
- `m14-l2` Running containers
- `m14-l3` Exec, logs and cleanup
- `m14-l4` Building your own image
- `m14-l5` Multi-container with compose
### M15 Web Stack: Build & Deploy (4 — cut l4 certbot, Caddy owns TLS)
- `m15-l1` nginx basics
- `m15-l2` Reverse proxy
- `m15-l3` Run the app with systemd
- `m15-l5` Deploying with git
### M16 Capstone: Deploy a Full App (2)
- `m16-l1` Capstone brief
- `m16-l2` Capstone: verify and document
### M19 PostgreSQL in Production (4 — cut l5 ss:5432 dup)
- `m19-l1` Start PostgreSQL and connect
- `m19-l2` Create a database and role
- `m19-l3` Inspect databases and roles
- `m19-l4` Logical backups with pg_dump
### M20 Caddy & Modern Web Serving (4)
- `m20-l1` Install Caddy
- `m20-l2` Write a Caddyfile reverse proxy
- `m20-l3` Validate and run Caddy
- `m20-l4` Reload and read Caddy logs

### Act 4 · Survive Production (40)
### M21 Monitoring & Observability (4 — cut l2 mpstat intro, l4 SMART)
- `m21-l1` Load average and uptime
- `m21-l3` Disk and inode pressure
- `m21-l5` Triage with journalctl by priority
- `m21-l6` Application health endpoints
### M22 Performance & Load Testing (4 — cut l1 ab, reps in M30)
- `m22-l2` Modern load testing with hey and wrk
- `m22-l3` Timing individual requests with curl
- `m22-l4` Find the bottleneck
- `m22-l5` Tune the kernel for throughput
### M23 Automation & IaC (4 — cut l3 cron dup, l5 at, l7 make)
- `m23-l1` Robust scripts: set -euo pipefail
- `m23-l2` Functions and arguments
- `m23-l4` systemd timers: the modern cron
- `m23-l6` Configuration management with Ansible
### M24 Backups, Restore & DR (4 — cut l2 pg_dump dup, l6 cron automate)
- `m24-l1` The 3-2-1 rule and rsync
- `m24-l3` Encrypted, deduplicated backups with restic
- `m24-l4` Test your restores
- `m24-l5` Offsite copies with rclone
### M25 Robust Networking, Diagnostics & LB (4 — cut l1+l2 viewing dups)
- `m25-l3` Packet capture with tcpdump
- `m25-l4` Scan ports and test connectivity
- `m25-l5` Diagnose latency with mtr
- `m25-l6` Load balancing with nginx upstreams
### M26 Production Incident Response (4)
- `m26-l1` Incident: 502 Bad Gateway
- `m26-l2` Incident: disk pressure
- `m26-l3` Incident: runaway CPU
- `m26-l4` Incident: OOM kill and mitigation
### M27 Zero-Downtime Deploys & CI/CD (4)
- `m27-l1` Blue-green switch with nginx
- `m27-l2` Health-gated deploys
- `m27-l3` Container rollout with Compose
- `m27-l4` Trigger and watch a CI pipeline
### M28 Secrets Management & Security Hardening (4 — cut l5 trivy)
- `m28-l1` Hunt for leaked secrets
- `m28-l2` Centralise secrets with Vault
- `m28-l3` Least privilege on disk
- `m28-l4` File integrity & audit with auditd
### M29 Observability & Alerting (4 — cut l4 journal persist)
- `m29-l1` Export host metrics
- `m29-l2` Prometheus scrape config
- `m29-l3` Alert rules
- `m29-l5` Alertmanager routing
### M30 Capacity Planning & Performance Tuning (4 — cut l2 perf profiler)
- `m30-l1` Baseline throughput and headroom
- `m30-l3` Benchmark storage and CPU
- `m30-l4` Raise system limits
- `m30-l5` Write the capacity plan

### 🥋 Drill Bank (16 — Learn-external, own counter, never blocking)
### B1 Boss 1 · Log Ambush (after Act 1)
- `b1-l1` Rank the 404 probers
- `b1-l2` Scrub the log, prove the diff
- `b1-l3` Lock down the evidence locker
- `b1-l4` Kill the runaway
### B2 Boss 2 · Dark Server (after Act 2)
- `b2-l1` Firewall intent vs listener truth
- `b2-l2` Prove ssh three ways
- `b2-l3` Ship a script, gate the result
- `b2-l4` Port 80: two witnesses
### B3 Boss 3 · Ship It Live (after Act 3)
- `b3-l1` Throwaway web, clean dock
- `b3-l2` Where does nginx point?
- `b3-l3` Database parade + readiness
- `b3-l4` Caddy active and valid
- `m37-l7` Rollback drill → `kubectl rollout history deploy/web && kubectl rollout undo deploy/web && kubectl rollout status deploy/web`

### B4 Boss 4 · 2AM Meltdown (after Act 4)
- `b4-l1` Incident bundle in one file
- `b4-l2` 502: bag evidence, restore backend
- `b4-l3` Prove you are backed up
- `b4-l4` Secrets locked, signals valid

## 6. How it was built (4 parts, all shipped)

1. Part 1: archived `curriculum-extra.js`, added ACTS order + sidebar grouping, stable glyphs.
2. Part 2: trimmed Act 1+2 (M17 6→4, M18 5→4) + `validIds` Done guard.
3. Part 3: trimmed Act 3+4 (16 cuts) → 118 tasks.
4. Part 4: Drill Bank (`drillbank.js`, 16 fights) + mkdir ownership fix + tests (98 checks).

## 7. Acceptance

- [x] 118 Learn IDs (frozen, gaps) + 16 drill IDs; `npm test` → `ALL TESTS PASSED` (134 solved).
- [x] Header shows Level/XP/Done/Study/TotalCmds; bar shows `x/118` + drill `x/16`.
- [x] Wrong command still +1 Total; empty Enter +0.
- [x] Reset progress keeps Total; Reset machine zeroes Total (type-RESET).
- [x] Mouseless complete: palette covers lessons, fights, tips, resets, theme, logout.
- [x] Search finds Learn + fights; Tip of Day rotates; 141 tips via `Ctrl+T`.
- [x] Bosses never block Next; M30-l5 toasts completion; footer credit in status bar.
- [x] Every button reachable via `Ctrl+K`; map matches PRD §8.
- [x] State-graded checks (files/modes/services), never substring-only.
- [x] `?theme=` + `#palette/#help/#tips` links work; offline reload keeps progress.
