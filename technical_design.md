# Technical Design — Linux Mastery v2 (211 tasks, Total Commands, linux advanced)

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
|   app.js ......... UI ctrl, gamification, metrics, resets, keys  |
|   tips.js ........ 180+ tips + browser + tip-of-day              |
|   curriculum.js .. 38 modules / 211 lessons (M31-M38 new folder) |
|   shell.js ....... parser + interpreter (pipes, redir, &&/||/;)  |
|    └─ commands.js  190+ cmds (add net-create, lvm, nft, wg, bpf) |
|    └─ filesystem.js virtual FS (inodes, modes, symlinks)        |
|    └─ machine.js .. pristine Ubuntu seed + net/proc/svc fixtures|
| Persistence: localStorage (source of truth) + POST /api/progress |
+------------------------------------------------------------------+
```

React owns shell/theming/deploy; engine owns terminal/curriculum/grading/tips.
No runtime network calls except optional progress sync.

## 2. Simulator deltas (v1 → v2)

### 2.1 Virtual filesystem (`filesystem.js`) — unchanged API, new fixtures
Node: `{name,type,owner,group,mode,content,target,children,mtime}`.
Resolution: absolute/relative, `.`/`..`, `~`/`~user`, symlink loop-guard.
Ops: `resolve, stat, list, mkdir -p, remove -r, copy -r, move, read/write/append, chmod, chown, touch, link`.
V2 fixtures (in `machine.js`): `/etc/netplan/`, `/etc/systemd/network/`, `/etc/nftables.conf`,
`/etc/wireguard/`, `/srv/data/*.csv|json|log`, `/var/log/nginx/access.log` (large),
`/etc/ssh/sshd_config`, LVM stub files (`/dev/vg0/*` simulated), `/etc/fail2ban/`.

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

### 2.3 Command registry (`commands.js`) — 170 → ~195
Each: `(state,args,ctx{stdin,fs}) => {stdout,stderr,code}`. Root-gated: `useradd,mount,systemctl,nft,ip,wg,lv*`.
V1 set kept. V2 adds/stubs (simulated, deterministic):

- net-create: `ip {link,addr,route,netns}`, `bridge`, `netplan {apply,try}`, `networkctl`,
  `nft`, `ufw`, `iptables` (alias → nft note), `wg`, `wg-quick`, `ss`, `dig`, `host`, `mtr`,
  `tcpdump` (canned pcap), `socat`, `haproxy -c`, `nginx -t`
- text/data: `less` (pager stub), `column`, `paste`, `join`, `tr`, `mlr`, `csvkit` (`csvcut/csvstat`),
  `yq`, `jq` (extended filters), `sqlite3`, `datamash` (stub), `parallel`/`xargs -P` (sequential sim)
- sys adv: `sysctl`, `lsmod`, `modprobe`, `dmesg`, `grub-mkconfig` (stub), `loginctl`,
  `lvs/vgs/pvs`, `lvcreate/lvextend`, `mdadm` (stub), `cryptsetup`, `btrfs` (subvolume/snapshot stubs),
  `fail2ban-client`, `aa-status`, `auditctl`, `perf` (stub), `bpftrace` (one-liner echo),
  `kubectl` (apply/get stubs), `helm` (stub), `restic`, `rclone`
- All new commands: `--help` output, realistic stdout, non-zero on bad flags, man entries.

### 2.4 Network-state model (new, lightweight)
Beyond FS, `machine.js` holds `net = {links,addrs,routes,rules,namespaces,tunnels,upstreams}`.
`ip/netplan/nft/wg` mutate `net`; `check(env)` can assert `env.net.*` + FS.
`resetMachine()` restores deep-clone of pristine `net` + FS. `resetProgress()` leaves both intact.

## 3. Curriculum engine (`curriculum.js`)

```js
{
 id:"m09", title:"Networking", icon:"🌐", hours:5, level:"Intermediate",
 folder:"core", // or "linux advanced" for m31-m38
 lessons:[{
  id:"m09-l5", title:"Create a netplan config",
  objective:"…", theory:`…`,
  examples:[{cmd:"cat /etc/netplan/01-netcfg.yaml", desc:"…"}, …],
  task:{ prompt:"…", hint:"…", solution:"…",
         check:(env)=> env.fs.exists("…") || {pass:false,reason:"…"} }
 }]}
```

- `check(env)` receives `{fs,state,net,lastCommand,lastResult,history}` → `true | {pass:false,reason}`.
- Networking-create checks MUST assert state (file content / `net` entry), not substring.
  Example: `m09-l5` checks `/etc/netplan/10-lab.yaml` contains `addresses:` + `net.applied==true`.
- IDs `m01-l1…m30-l5` immutable. New: `m02-l5…l8, m03-l5…l10, m09-l5…l10, m25-l7…l8, m31-l1…m38-l5`.
- `folder` field groups sidebar: `"core"` (M01–M30) vs `"linux advanced"` (M31–M38, collapsible).

## 4. UI (`app.js` + markup + globals.css)

Layout (preserve V1 DOM ids; add new):
- Topbar: `#stat-level,#stat-xp,#stat-done,#stat-time,#stat-cmds` (NEW), `#stat-xpbar`,
  `#overall-fill,#overall-text` (“142 / 211 tasks · 67%”), buttons `#btn-tips,#btn-theme,#btn-reset-machine,#btn-reset-progress`.
- Left: `#lesson-search` (unified index), `#modules` (folders + rings), `#tip-teaser` (tip-of-day).
- Center: `#terminal > #output + #promptline>#prompt+#cmd`, `.term-hint` exact string:
  `Esc navigate · Ctrl+K jump · Ctrl+T tips · Alt+↑/↓ lesson · Ctrl+H hint · Ctrl+G solution`.
- Right: `#lesson-content` (objective/theory/examples/task/hint/solution/XP).
- Footer: `#mode-indicator` (TERMINAL/NAV), `#status-hint`, `#overlay>#palette,#help`, `#toast`.

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
- `renderStats`: Level, XP (+`xpbar` fill to next), Done (`Object.values(lessons).filter(l=>l.done).length`),
  Study `HH:MM:SS`, TotalCmds raw count. Overall bar `done/211`.
- Badges: module 100% → `badges[m]=true`; folder badge when all 8/30 complete.
- Exam/boss/quest write to `examHistory`/streak but never decrement `totalCommands`.

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

- Search index: modules + lessons (title/prompt) + tips (cmd/why/category) + actions.
  `lesson-search` input filters sidebar live; `Ctrl+K` palette same index + fuzzy (subsequence) rank.
- `tips.js`: `window.TIPS` 180+ `{cmd,why,cat}`; `openTips/openRandomTip/openTip`;
  tip-of-day `TIPS[dayOfYear % len]`; deep links `#tips,#tips-random`; `Enter` inserts runnable or copies shortcut.
- Progress bar: top overall track + per-module ring (SVG stroke-dashoffset) + XP thin bar.
  100% → toast + confetti (CSS-only) + badge persist.

## 7. Persistence & API

- `localStorage[STORE_KEY]` source of truth. Migration: if `linuxmastery.progress.v1` exists and v2 missing → copy `{xp,lessons,activeSeconds}` + `totalCommands:0`.
- `GET /api/progress → {}`; `POST /api/progress → {ok:true}` (swap KV/DB later, same contract).
- Export/import: `downloadProgress()` JSON blob; `importProgress(file)` validates schema version.
- No secrets/PII; no external calls at runtime.

## 8. Testing

- `test/run.js`: loads engine, runs representative commands (incl. all NEW cmds), then
  auto-solves **all 211** via `solution` fields + asserts `check` passes. Ends `ALL TESTS PASSED`.
  Fails if any V1 ID missing/renamed or any check needs real net/root.
- `test/ui-smoke.js`: build+serve, headless Chrome CDP: 50+ checks — stats render (incl. `#stat-cmds`),
  wrong command increments odometer, pass increments Done/XP, `Reset progress` keeps odometer,
  `Reset machine` zeroes it, keyboard flows (`Esc,Ctrl+K,Ctrl+T,Alt+↓,Ctrl+H,Ctrl+G`), search, tip-day, theme, progress bar `x/211`.
- Manual gate: complete M09-l5 (netplan create) and M32-l3 (namespace) unaided in simulator.

## 9. File layout (v2)

```
linux_advanced/            # this spec folder (docs-first phase)
 prd.md technical_design.md features.md instructions.md summary.md
<build root>/              # code phase (Next.js)
 app/{layout.tsx,page.tsx,globals.css,api/progress/route.ts}
 components/Simulator.tsx
 lib/{markup.ts,search.ts}
 public/js/{filesystem,machine,commands,shell,curriculum,tips,app}.js
 test/{run.js,ui-smoke.js}
 package.json next.config.mjs tsconfig.json
```

## 10. Extensibility recipes

- Add task: append lesson to `CURRICULUM` (stable ID) + walkthrough covers it; no other edits.
- Add command: implement in `commands.js`, register map, add `--help` + test line.
- Add tip: push to `TIPS`.
- Real backend later: swap `shell.js` dispatch with `fetch('/api/exec',{cmd})` keeping `{stdout,stderr,code}` contract; `check` unchanged.
