# Technical Design — Linux Mastery: 4 Acts + Drill Bank (118 tasks + 16 fights)

Target: Next.js 16 App Router, Vercel-deployable, framework-agnostic vanilla-JS simulator
in `public/js/`. Preserves V1 architecture; deltas are explicit.

## 1. Architecture Overview

```
+------------------------------------------------------------------+
| Next.js 16 (App Router)                                          |
|  app/layout.tsx ...... <html>, pre-paint theme, globals.css      |
|  app/page.tsx .......... renders <Simulator/>                    |
|  components/Simulator .. boots engine (client, double-mount safe)|
|  app/api/progress .... optional sync (no-op on Vercel)           |
|                                                                  |
| Browser (client, offline-capable after first load)               |
|  lib/markup.ts + public/js/:                                     |
|   app.js ......... UI ctrl, Acts, Drill Bank, metrics, keys      |
|   tips.js ........ pro tips + browser + tip-of-day               |
|   curriculum.js .. 30 modules / 118 lessons + ACTS (4 Acts)      |
|   drillbank.js ... Drill Bank: 4 bosses x 4 fights (Learn-external)|
|   shell.js ....... parser + interpreter (pipes, redir, &&/||/;)  |
|    └─ commands.js  190+ cmds (docker, k8s-free: no netns/LVM)    |
|    └─ filesystem.js virtual FS (inodes, modes, symlinks, owners) |
|    └─ machine.js .. pristine Ubuntu seed + svc/net/docker/pg state|
| Persistence: localStorage (source of truth) + POST /api/progress |
+------------------------------------------------------------------+
```
Note: `curriculum-extra.js` (91 deepening + 72 review lessons) is ARCHIVED on
disk and NOT loaded. The abandoned 211-task / M31–M38 "linux advanced" plan was
never built and is superseded by this doc.

React owns shell/theming/deploy; engine owns terminal/curriculum/grading/tips.
No runtime network calls except optional progress sync.

## 2. Simulator deltas (v1 → now)

### 2.1 Virtual filesystem (`filesystem.js`) — ownership fix (Part 4)
Node: `{name,type,owner,group,mode,content,target,children,mtime}`.
Resolution: absolute/relative, `.`/`..`, `~`/`~user`, symlink loop-guard.
Ops: `resolve, stat, list, mkdir -p, remove -r, copy -r, move, read/write/append, chmod, chown, touch, link`.
Fixtures (in `machine.js`): `/var/log/nginx/access.log`, `/srv/app/config.json`,
`/etc/ssh/sshd_config`, postgres seed DBs, docker images (`nginx`, `postgres:16`),
`offsite` rclone remote, `web1`/`db1` ansible inventory.

Ownership rule (fixed Part 4 — `mkdir -p ~/a/b` used to fail with Permission
denied): `VFS.mkdir` assigns new dirs to `owner` param → `env.USER` → `"root"`;
`C.mkdir` passes `ctx.sudo ? "root" : m.user`. So user `mkdir` is user-owned,
`sudo mkdir` stays root-owned — matching real Ubuntu.

Permission checks enforced; `sudo` passwordless bypass (lab convenience).

### 2.2 Shell (`shell.js`) — unchanged pipeline, one new counter hook
```
input → tokenize(quotes,escapes,$VARS,$(…)) → split ; && || → split | →
expand globs/vars → redirections(> >> < 2> 2>> &>) → dispatch commands.js →
{stdout,stderr,code}
```
`ShellState`: `{cwd,user,env(PATH,HOME,USER),history,aliases,jobs,fs}`.
**New:** after every Enter (even parse error / non-zero exit), `app.js:recordCommand(input, result)`
fires exactly once. Empty input (just Enter) does NOT count.

### 2.3 Command registry (`commands.js`) — ~190 simulated commands
Each: `(state,args,ctx{stdin,fs}) => {stdout,stderr,code}`. Root-gated: `useradd,mount,systemctl`.
Kept set (all deterministic, `--help` everywhere): `find,awk,grep,sed,jq,cut,sort,uniq,
tr,column,paste,diff,tee,head,tail,wc,chmod,chown,chgrp,stat,id,useradd,usermod,userdel,
su,sudo,ps,top,pgrep,pkill,kill,jobs,nohup,nice,renice,systemctl,journalctl,systemd-analyze,
hostnamectl,timedatectl,df,du,lsblk,mount,tar,ip,ss,ping,dig,curl,wget,ufw,tcpdump,nmap,
nc,mtr,resolvectl,ssh,sshd,ssh-keygen,scp,bash,printf,crontab,at,strace,lsof,dmesg,
docker (+compose),nginx,certbot,git,apt,dpkg,psql,pg_dump,pg_isready,caddy,smartctl,
mpstat,sar,vmstat,ab,hey,wrk,sysctl,perf,fio,sysbench,ansible-playbook,make,rsync,
restic,rclone,vault,auditctl,trivy,promtool,amtool,gh`.

### 2.4 Machine-state model (what `check(env)` can assert)
Beyond FS, `machine.js` holds: `services{active,enabled}`, `network.listeners[]`,
`firewall{enabled,rules}`, `docker{images,containers}`, `apt{installed}`,
`users/groups`, `cron[]`, `at[]`, `sysctl{}`, `swaps[]`, `postgres{databases,users}`,
`backups{resticRepos,resticSnapshots}`, `ansible{lastPlay}`, `vault{secrets}`,
`audit[]`, `ci{runs}`. There is NO netns/LVM/k8s model (that plan was dropped).
`resetMachine()` restores the pristine seed. `resetProgress()` leaves machine intact.

## 3. Curriculum engine (`curriculum.js` + `drillbank.js`)

```js
// curriculum.js: 30 modules / 118 lessons + ACTS order
{
 id:"m17", title:"Server Bootstrap: Day-0 Checklist", icon:"🧰", hours:2,
 blurb:"…",
 lessons:[{
  id:"m17-l1", title:"Update the system first",
  objective:"…", theory:`…`,
  examples:[{cmd:"sudo apt update", desc:"…"}, …],
  task:{ prompt:"…", hint:"…", solution:"…",
         check:(env)=> env.fs.exists("…") || {ok:false,reason:"…"} }
 }]}
var ACTS = [
 { id:"act1", title:"Act 1 · Survive the Box", payoff:"…",
   modules:["m01","m02","m03","m04","m05","m06","m07","m08"] },
 { id:"act2", title:"Act 2 · Operate & Connect", payoff:"…",
   modules:["m17","m18","m09","m10","m11","m12","m13"] },
 { id:"act3", title:"Act 3 · Ship It", payoff:"…",
   modules:["m14","m15","m16","m19","m20"] },
 { id:"act4", title:"Act 4 · Survive Production", payoff:"…",
   modules:["m21","m22","m23","m24","m25","m26","m27","m28","m29","m30"] }
];
// drillbank.js: 4 bosses x 4 fights, Learn-external (own 0/16 counter)
{ id:"b1", actId:"act1", title:"Boss 1 · Log Ambush", hours:1,
  lessons:[{ id:"b1-l1", … }] } // … b4-l4
```

- `check(env)` receives `{fs,m,cmd,result,history}` → `true | {ok:false,reason}`.
  State-changing checks assert FS/machine state, never mere history substrings.
- IDs are frozen keeps (`m17-l1,m17-l3,m17-l4,m17-l5` — gaps where trimmed, never
  renamed, so saved progress survives trims). Drill IDs are namespaced `bN-lM`.
- UI follows ACTS order (M17/M18 before M09), NOT physical array order.
- 19 Learn tasks were trimmed as duplicates-or-niche (full list in `summary.md`);
  cut content survives in git history + archived `curriculum-extra.js`.

## 4. UI (`app.js` + markup + globals.css)

Layout (preserve V1 DOM ids; add new):
- Topbar: `#stat-level,#stat-xp,#stat-done,#stat-time,#stat-cmds`, `#stat-xpbar`,
  `#overall-fill,#overall-text` (“87 / 118 tasks”), buttons `#btn-tips,#btn-theme,#btn-reset-machine,#btn-reset-progress,#btn-logout`.
- Left: `#lesson-search` (unified index), `#modules` (4 `.act` sections with
  per-act progress + Drill Bank `.act.drill` section with its own counter), `#tip-teaser`.
- Center: `#terminal > #output + #promptline>#prompt+#cmd`, `.term-hint` exact string:
  `Esc navigate · Ctrl+K jump · Ctrl+T tips · Alt+↑/↓ lesson · Ctrl+H hint · Ctrl+G solution`.
- Right: `#lesson-content` (objective/theory/examples/task/hint/solution/XP).
- Footer: `#mode-indicator` (TERMINAL/NAV), `#status-hint`, `.status-right`
  (“mouse-free · tips · **Built in California by Subodh**”), `#overlay>#palette,#help`, `#toast`.

Navigation follows ACTS order (`orderedCurriculum()`), not array order: Next/Prev,
palette, `h/l` module jumps, and nav-mode flat list (Learn + bosses at the end).
Boss boundaries stop with a toast (never leak into Learn); finishing M30-l5 toasts
“Curriculum complete 🎓”. Glyphs are stable numbers from IDs (`01`–`30`, `B1`–`B4`).
`validIds` restricts the Done counter to current Learn lessons, so removed lessons
never inflate progress.

### 4.1 Keyboard-first (capture-phase handler, auto-focus)
- Input auto-focus; printable keystroke anywhere refocuses (unless overlay open).
- `onGlobalKey`: NAV mode (`Esc`), palette (`Ctrl+K`), tips (`Ctrl+T`), lesson nav (`Alt+↑/↓`),
  hint (`Ctrl+H`), solution (`Ctrl+G`), next (`Ctrl+Enter`), theme (`Ctrl+Shift+D`),
  clear (`Ctrl+L`), cancel (`Ctrl+C`), help (`?` on empty), history (`↑/↓`), complete (`Tab`).
- Palette opens with **Next lesson** preselected → `Ctrl+K,Enter` advances.
- NAV: `h j k l / arrows / g G / Enter / 1-9 / i q Esc`. Tips overlay: `↑↓ / Tab category / Enter insert / Esc`.
- All actions (exam start, export, resets, theme, copy example) have palette entries → mouseless-complete.

### 4.2 Theming
Semantic CSS vars on `:root` (dark) + `[data-theme=light]`; pre-paint inline script
(`localStorage["linuxmastery.theme"]` or `?theme=`); toggle persists; terminal follows.

## 5. Gamification & metrics (normative formulas)

```js
STORE_KEY="linuxmastery.progress.v2"; // bump from v1; migrate v1→v2 on load
defaultProgress()=>({xp:0, lessons:{}, activeSeconds:0, totalCommands:0,
  streak:{count:0,lastDay:null}, badges:{}, examHistory:[], createdAt:Date.now()});
levelFor=xp=>Math.floor(Math.sqrt(xp/50))+1; xpForLevel=l=>(l-1)**2*50;
// per-task: base 10, +5 first-try (no hint/sol, first graded Enter passes), -3 hint, -5 sol, floor 2
```

- `recordCommand`: `p.totalCommands++` on every non-empty Enter; save throttled (every 10 s + on pass).
- `activeSeconds`: +1 s ticker when `!document.hidden && focused`; save every 10 s.
- `renderStats`: Level, XP (+`xpbar` fill to next), Done (Learn-valid IDs only:
  `Object.keys(lessons).filter(k => validIds[k] && lessons[k].done).length`),
  Study `HH:MM:SS`, TotalCmds raw count. Overall bar `done/118`; Drill Bank has its own `done/16`.
- Badges: per-module 100% rings; per-Act ✔ header; Drill Bank ✔ at 16/16.

### 5.1 Reset logic (must-match PRD §13)
```js
resetProgress(){ confirm(...) → keep = state.progress.totalCommands;
  state.progress = {...defaultProgress(), totalCommands: keep}; save(); renderAll();
  toast(`Progress reset — lifetime commands kept (${keep})`); }
resetMachine(){ doubleConfirm(type RESET) → state.shell.reset(pristineMachine());
  state.progress = defaultProgress(); // totalCommands → 0
  save(); renderAll(); toast("Machine factory-reset — everything cleared"); }
```
Tooltips: progress btn “Erase XP/tasks/time (keeps lifetime commands)”; machine btn “Factory reset (clears everything)”.

## 6. Search, tips, progress bar

- Search index: Learn lessons (title/prompt) + drill fights + tips + actions.
  `lesson-search` input filters sidebar live (bosses included); `Ctrl+K` palette same index.
- `tips.js`: `window.TIPS` pro-tip library `{cmd,why,cat}`; `openTips/openRandomTip`;
  tip-of-day `TIPS[dayOfYear % len]`; deep links `#tips,#tips-random`; `Enter` inserts runnable or copies shortcut.
- Progress: top overall track (`done/118`) + per-module rings (SVG stroke-dashoffset) +
  per-Act headers with counts + Drill Bank counter (`done/16`) + XP thin bar.

## 7. Persistence & API

- `localStorage[STORE_KEY]` source of truth. Migration: if `linuxmastery.progress.v1` exists and v2 missing → copy `{xp,lessons,activeSeconds}` + `totalCommands:0`.
- `GET /api/progress → {}`; `POST /api/progress → {ok:true}` (swap KV/DB later, same contract).
- Export/import: `downloadProgress()` JSON blob; `importProgress(file)` validates schema version.
- No secrets/PII; no external calls at runtime.

## 8. Testing

- `test/run.js` (98 checks, `ALL TESTS PASSED`): engine spot-checks (FS, perms incl.
  nested-`mkdir -p ~` ownership, text pipes, users, procs, services, storage, net,
  SSH, docker, cron, postgres, restic, ansible, sysctl, load tools, nmap/mtr/tcpdump,
  fail2ban, smartctl, caddy, curl), then curriculum integrity (30 modules / 118 lessons /
  4 Acts covering all modules / 4 bosses x 4 fights, IDs unique + namespaced), then
  auto-solves **all 118 + all 16 drill fights** via `solution` fields on one shared
  machine (Learn first, bosses after — the graduate order). Fails if any ID is
  duplicated or any check needs real net/root.
- `test/ui-smoke.js`: build+serve, headless Chrome CDP — stats render (incl. `#stat-cmds`),
  34 modules / 134 lessons listed, wrong command increments odometer, pass increments
  Done/XP, `Reset progress` keeps odometer (`0 / 118`), `Reset machine` zeroes it,
  keyboard flows (`Esc,Ctrl+K,Ctrl+T,Alt+↓,Ctrl+H,Ctrl+G`), search, tip-day, theme.
- Manual gate: finish Act 1 + Boss 1 unaided in the simulator.

## 9. File layout (v2)

```
linux_lab/                  # repo root (this folder)
 prd.md technical_design.md features.md instructions.md summary.md content.md
 app/{layout.tsx,lab/page.tsx,globals.css,api/progress/route.ts,login/}
 components/Simulator.tsx
 lib/{markup.ts}
 public/js/{filesystem,machine,commands,shell,curriculum,drillbank,tips,app}.js
 public/js/curriculum-extra.js  # ARCHIVED (not loaded): 91 deepening + 72 reviews
 test/{run.js,ui-smoke.js}
 package.json next.config.mjs tsconfig.json
```

## 10. Extensibility recipes

- Add task: append lesson to `CURRICULUM` (new stable ID) + walkthrough covers it; update the `118` count in `test/run.js`, `ui-smoke.js`, and these docs.
- Add boss fight: append lesson to a boss in `DRILLBANK` (`bN-lM`) + drill walkthrough covers it; update the `16` count.
- Add command: implement in `commands.js`, register map, add `--help` + test line.
- Add tip: push to `TIPS`.
- Real backend later: swap `shell.js` dispatch with `fetch('/api/exec',{cmd})` keeping `{stdout,stderr,code}` contract; `check` unchanged.
