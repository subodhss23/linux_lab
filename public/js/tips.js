/* ============================================================================
 * tips.js — 125+ pro tips from senior Linux engineers, plus a keyboard-first
 * browser. Exposes window.TIPS, window.openTips(), window.openRandomTip().
 * ==========================================================================*/
(function () {
  "use strict";
  if (window.TIPS) return;

  var CATS = {
    shell: { label: "Shell & History", icon: "⌨️" },
    text: { label: "Text & Data", icon: "🔤" },
    files: { label: "Files & Storage", icon: "🗂️" },
    proc: { label: "Processes", icon: "⚙️" },
    net: { label: "Networking", icon: "🌐" },
    systemd: { label: "systemd", icon: "🛠️" },
    docker: { label: "Containers", icon: "🐳" },
    security: { label: "Security", icon: "🛡️" },
    perf: { label: "Performance", icon: "🏎️" },
    debug: { label: "Debugging", icon: "🐞" },
    ssh: { label: "SSH & Remote", icon: "🔑" },
    auto: { label: "Automation", icon: "🤖" },
    pg: { label: "PostgreSQL", icon: "🐘" },
    term: { label: "Terminal Power", icon: "🖥️" }
  };

  var TIPS = [
    /* ---------- shell ---------- */
    { cat: "shell", title: "Reverse-search your history", cmd: "Ctrl+R", why: "Type a fragment, hit Ctrl+R repeatedly to cycle older matches, Enter to run — the single biggest time-saver in a shell." },
    { cat: "shell", title: "Re-run the last command with sudo", cmd: "sudo !!", why: "Forget sudo? Don't retype the whole line. (Read it first: `!!:p` prints it.)" },
    { cat: "shell", title: "Grab the previous command's last argument", cmd: "Alt+.", why: "Press repeatedly to walk back through last-arguments of earlier commands. `!$` does it once." },
    { cat: "shell", title: "Fix a typo in the previous command", cmd: "^old^new", why: "Replaces the first occurrence of `old` with `new` and re-runs — faster than arrow-up hunting." },
    { cat: "shell", title: "Never lose history again", cmd: "shopt -s histappend; PROMPT_COMMAND='history -a'", why: "Multiple shells append instead of overwriting each other's history." },
    { cat: "shell", title: "Timestamp and dedupe history", cmd: "export HISTTIMEFORMAT='%F %T ' HISTCONTROL=ignoreboth:erasedups", why: "Know *when* you ran something, and stop duplicate entries from flooding the list." },
    { cat: "shell", title: "Delete one sensitive line from history", cmd: "history -d 1234", why: "Remove a command containing a secret without nuking your whole history." },
    { cat: "shell", title: "Recursive globbing", cmd: "shopt -s globstar; ls **/*.log", why: "`**` matches across directories — no more find gymnastics for simple cases." },
    { cat: "shell", title: "Create a whole tree in one shot", cmd: "mkdir -p app/{src,test,dist}", why: "Brace expansion builds parallel directory structures instantly." },
    { cat: "shell", title: "Jump back to the previous directory", cmd: "cd -", why: "Toggles between two directories — perfect for config vs. project." },
    { cat: "shell", title: "Use functions instead of aliases for arguments", cmd: "gk(){ git checkout \"$1\"; }", why: "Aliases append args at the end; functions let you place parameters where they belong." },
    { cat: "shell", title: "Vim keys on the command line", cmd: "set -o vi", why: "If you already know vim, your editing speed doubles — Esc then vim motions." },
    { cat: "shell", title: "Kill the whole line instantly", cmd: "Ctrl+U / Ctrl+Y", why: "Ctrl+U cuts to the start; Ctrl+Y pastes it back — great for prefix-swapping." },
    { cat: "shell", title: "Move by word", cmd: "Alt+B / Alt+F", why: "Skip a word at a time instead of holding the arrow key." },

    /* ---------- text ---------- */
    { cat: "text", title: "Compact JSON, one record per line", cmd: "jq -c '.'", why: "Makes JSON greppable and diff-friendly; pair with grep/awk downstream." },
    { cat: "text", title: "Slurp JSON arrays", cmd: "jq -s 'add'", why: "Merge many JSON objects/arrays from a stream into one value." },
    { cat: "text", title: "Extract only the matches", cmd: "grep -oE '\\b\\d{1,3}(\\.\\d{1,3}){3}\\b'", why: "Pull IPs, IDs, or tokens out of prose without post-processing." },
    { cat: "text", title: "Perl regex lookarounds", cmd: "grep -P '(?<=user=)\\w+'", why: "Lookbehind lets you match context without consuming it — impossible with basic grep." },
    { cat: "text", title: "In-place edit with a backup", cmd: "sed -i.bak 's/old/new/g' file", why: "You always have a rollback next to the file. Use anchors (^...$) to avoid surprises." },
    { cat: "text", title: "Human-readable numeric sort", cmd: "du -h | sort -h", why: "Sorts 2K, 10M, 3G correctly — regular sort gets this wrong." },
    { cat: "text", title: "Sort by a specific column", cmd: "sort -t: -k3 -n /etc/passwd", why: "Field-aware sorting powers reports and quick analysis." },
    { cat: "text", title: "Frequency table in one line", cmd: "cut -d' ' -f1 access.log | sort | uniq -c | sort -rn", why: "The universal 'who/what is the top offender' idiom." },
    { cat: "text", title: "Squeeze repeated whitespace", cmd: "tr -s ' ' < file", why: "Normalise messy output before parsing it." },
    { cat: "text", title: "Align columns beautifully", cmd: "column -t -s,", why: "Turns CSV into a readable table for the terminal or a report." },
    { cat: "text", title: "Parallelise with xargs", cmd: "find . -name '*.log' -print0 | xargs -0 -P8 -n1 gzip", why: "8 workers turn a 10-minute job into ~1.5 minutes." },
    { cat: "text", title: "Handle filenames with spaces", cmd: "find . -print0 | xargs -0", why: "Null-delimited piping survives spaces, newlines and quotes in names." },
    { cat: "text", title: "See the middle of a huge file", cmd: "sed -n '1000,1050p' big.log", why: "Jump straight to a region; no interactive pager needed." },
    { cat: "text", title: "Follow a file across log rotation", cmd: "tail -F /var/log/nginx/access.log", why: "`-F` reopens the file after rotation, unlike `-f`." },
    { cat: "text", title: "less, but live", cmd: "less +F error.log", why: "Start following like tail -f, Ctrl+C to stop and scroll, Shift+F to resume." },
    { cat: "text", title: "Read wide output without wrapping", cmd: "less -S", why: "Keeps columns aligned; scroll horizontally instead of reading wrapped soup." },
    { cat: "text", title: "Write to a root file safely", cmd: "echo 'x' | sudo tee -a /etc/file", why: "Redirection runs as *you*, not sudo — tee is how you write privileged files." },
    { cat: "text", title: "Compare sorted files", cmd: "comm -13 <(sort a) <(sort b)", why: "Show only lines unique to one side — great for diffing inventories." },
    { cat: "text", title: "Format a table inside vim", cmd: ":%!column -t", why: "Pipes the buffer through a command — instant tidy tables." },

    /* ---------- files ---------- */
    { cat: "files", title: "Find the space hogs", cmd: "du -xh --max-depth=1 / | sort -h", why: "`-x` stays on one filesystem; sort -h ranks them correctly." },
    { cat: "files", title: "Check inode exhaustion", cmd: "df -i", why: "You can be out of inodes with free disk space — millions of tiny files do this." },
    { cat: "files", title: "Files changed in the last hour", cmd: "find /etc -type f -mmin -60", why: "See what an install or config change actually touched." },
    { cat: "files", title: "Batch -exec is much faster", cmd: "find . -name '*.tmp' -exec rm {} +", why: "`+` passes many paths per invocation; `\\;` forks once per file." },
    { cat: "files", title: "Find and delete safely", cmd: "find /tmp -type f -mtime +7 -delete", why: "Print first without -delete, then add it." },
    { cat: "files", title: "Perfect rsync for migrations", cmd: "rsync -aHAX --delete src/ dst/", why: "Preserves hardlinks (H), ACLs (A), xattrs (X); --delete makes dst an exact mirror." },
    { cat: "files", title: "Total rsync progress", cmd: "rsync -a --info=progress2 src/ dst/", why: "A single overall percentage/ETA instead of a wall of per-file lines." },
    { cat: "files", title: "Archive with excludes", cmd: "tar czf app.tgz --exclude='*.log' --exclude=node_modules .", why: "Keeps backups small and restores fast." },
    { cat: "files", title: "Instant big file", cmd: "fallocate -l 2G /swapfile", why: "Allocates without writing zeros — near-instant vs dd." },
    { cat: "files", title: "Safe atomic symlink swap", cmd: "ln -sfn /releases/v2 current", why: "`-f` replaces and `-n` treats an existing symlink-to-dir correctly — the basis of atomic deploys." },
    { cat: "files", title: "Who is holding the mount busy?", cmd: "fuser -vm /mnt", why: "Before umount, find the PIDs using it instead of guessing." },
    { cat: "files", title: "Who has files open in a directory?", cmd: "lsof +D /srv/app", why: "Pinpoints processes with working dirs or open files under a tree." },
    { cat: "files", title: "Insightful file details", cmd: "stat -c '%A %U:%G %s %n' *", why: "Custom format strings make stat scriptable." },

    /* ---------- processes ---------- */
    { cat: "proc", title: "Reload many daemons without restart", cmd: "kill -HUP <pid>", why: "SIGHUP re-reads config for nginx, sshd, rsyslog and friends — zero downtime." },
    { cat: "proc", title: "Test if a process exists", cmd: "kill -0 <pid> && echo alive", why: "Exit code tells you liveness without sending a real signal." },
    { cat: "proc", title: "See the full command line of matches", cmd: "pgrep -a nginx", why: "`-a` prints the whole cmdline, so you target the right process." },
    { cat: "proc", title: "Top memory processes, clearly", cmd: "ps -eo pid,ppid,%mem,rss,cmd --sort=-%mem | head", why: "RSS (resident) is what actually matters for OOM." },
    { cat: "proc", title: "Run beyond logout", cmd: "setsid ./long-job </dev/null >job.log 2>&1 &", why: "Detaches from the terminal so an SSH drop won't kill it." },
    { cat: "proc", title: "Run a transient systemd unit", cmd: "systemd-run --scope -p MemoryMax=512M ./app", why: "Get cgroup limits and journal logging without writing a unit file." },
    { cat: "proc", title: "Inspect a process environment", cmd: "tr '\\0' '\\n' < /proc/<pid>/environ", why: "See the exact env (and secrets) a running service has." },
    { cat: "proc", title: "Watch a process's open files", cmd: "ls -l /proc/<pid>/fd", why: "Reveals sockets, logs and config files it holds open." },
    { cat: "proc", title: "Summary of syscalls", cmd: "strace -c -p <pid>", why: "Which syscalls dominate — instantly shows a busy-loop or blocked read." },
    { cat: "proc", title: "Human-readable kernel messages", cmd: "dmesg -T -w", why: "`-T` gives real timestamps; `-w` follows live (OOM kills, disk errors)." },
    { cat: "proc", title: "Protect a critical process from OOM", cmd: "echo -1000 > /proc/<pid>/oom_score_adj", why: "Makes the kernel avoid killing your database before a random worker." },

    /* ---------- networking ---------- */
    { cat: "net", title: "One-line socket overview", cmd: "ss -tulpn", why: "Listening TCP/UDP with owning process — replaces netstat." },
    { cat: "net", title: "Which interface reaches a host?", cmd: "ip route get 1.1.1.1", why: "Tells you the exact route and source IP the kernel will use." },
    { cat: "net", title: "Scan the DNS delegation", cmd: "dig +trace example.com", why: "Walk root → TLD → authoritative to find where DNS breaks." },
    { cat: "net", title: "Ask a specific resolver", cmd: "dig @1.1.1.1 example.com +short", why: "Bypasses local config to test public DNS vs. your resolver." },
    { cat: "net", title: "Test a host before DNS is live", cmd: "curl -sS --resolve app.com:443:10.0.2.5 https://app.com/", why: "Validate a new server without touching /etc/hosts." },
    { cat: "net", title: "Time a request in detail", cmd: "curl -o /dev/null -s -w '%{time_connect} %{time_starttransfer} %{time_total}\\n' URL", why: "Separates DNS/connect/TTFB — find whether the network or the app is slow." },
    { cat: "net", title: "Fail fast in automation", cmd: "curl -fsS --max-time 5 --retry 3 URL", why: "`-f` exits non-zero on HTTP errors, so scripts and health checks work." },
    { cat: "net", title: "Read HTTP payload off the wire", cmd: "tcpdump -nn -A -s0 port 80", why: "ASCII dump of packets — see exactly what the client sent." },
    { cat: "net", title: "Replay a capture later", cmd: "tcpdump -i eth0 -w out.pcap", why: "Capture on the server, analyse in Wireshark on your laptop." },
    { cat: "net", title: "Per-hop loss and latency", cmd: "mtr -rwzbc 50 host", why: "Report mode (-r) with wide (-w) and ASN (-z) fields is the incident-ready format." },
    { cat: "net", title: "Fast full-port scan", cmd: "nmap -sT -p- --min-rate 2000 host", why: "`--min-rate` skips the slow default timing for internal audits." },
    { cat: "net", title: "Kill a stuck connection", cmd: "ss -K dst 10.0.2.9", why: "Force-closes matching sockets without restarting the app." },

    /* ---------- systemd ---------- */
    { cat: "systemd", title: "See a unit and its drop-ins together", cmd: "systemctl cat nginx", why: "Shows the base unit plus every override in one view." },
    { cat: "systemd", title: "Safe override without editing the package", cmd: "systemctl edit --full app", why: "Drop-ins survive package upgrades — the correct way to customise units." },
    { cat: "systemd", title: "What slowed the boot?", cmd: "systemd-analyze blame", why: "Ranks units by boot time; fix the top offender." },
    { cat: "systemd", title: "Only the failures", cmd: "systemctl list-units --failed", why: "Fast triage after a reboot or deploy." },
    { cat: "systemd", title: "Read a property precisely", cmd: "systemctl show -p MainPID,ActiveState app", why: "Machine-readable values for scripts." },
    { cat: "systemd", title: "Logs without the noise", cmd: "journalctl -u app -o cat -n 50", why: "`-o cat` drops metadata so you see just the messages." },
    { cat: "systemd", title: "Investigate the previous boot", cmd: "journalctl -b -1 -p err", why: "Post-mortem a crash after the machine came back." },
    { cat: "systemd", title: "A timer that catches missed runs", cmd: "OnCalendar=daily / Persistent=true", why: "Persistent timers run once if the machine was off at the scheduled time — cron can't." },

    /* ---------- docker ---------- */
    { cat: "docker", title: "Reclaim disk from Docker", cmd: "docker system df", why: "Shows images/containers/volumes/build-cache usage before you prune." },
    { cat: "docker", title: "One-click cleanup", cmd: "docker system prune -af --volumes", why: "Nukes unused images and volumes — the classic 'disk full' fix. Read the prompt." },
    { cat: "docker", title: "Instant resource snapshot", cmd: "docker stats --no-stream", why: "Current CPU/mem per container for a script or a quick look." },
    { cat: "docker", title: "Shell into a running container", cmd: "docker exec -it app sh", why: "Debug from inside with the same view the app has." },
    { cat: "docker", title: "Check container health programmatically", cmd: "docker inspect -f '{{.State.Health.Status}}' app", why: "Wire it into monitoring or a deploy gate." },
    { cat: "docker", title: "Override the entrypoint to debug", cmd: "docker run --rm -it --entrypoint sh image", why: "Get a shell even when the image has a broken CMD." },
    { cat: "docker", title: "Move an image to an air-gapped host", cmd: "docker save app:1 | ssh host 'docker load'", why: "No registry required — pipe over SSH." },
    { cat: "docker", title: "Faster, safer run", cmd: "docker run --read-only --security-opt no-new-privileges app", why: "Immutable filesystem and no privilege escalation — cheap hardening." },
    { cat: "docker", title: "Validate compose before deploying", cmd: "docker compose config", why: "Catches YAML mistakes and shows the fully-resolved stack." },

    /* ---------- security ---------- */
    { cat: "security", title: "Find setuid binaries", cmd: "find / -perm -4000 -type f 2>/dev/null", why: "Every setuid binary is a potential privilege-escalation path — audit them." },
    { cat: "security", title: "Make a file impossible to change", cmd: "chattr +i /etc/resolv.conf", why: "Even root can't edit it — stops a service from clobbering your config." },
    { cat: "security", title: "Catch secrets before you commit", cmd: "grep -rInE 'password|secret|api[_-]?key' .", why: "A one-second scan beats rotating leaked credentials for a week." },
    { cat: "security", title: "Rate-limit SSH guesses", cmd: "ufw limit ssh", why: "Blocks brute-force sources automatically after repeated attempts." },
    { cat: "security", title: "Baseline hardening score", cmd: "lynis audit system", why: "Gives a hardening index and prioritised recommendations." },
    { cat: "security", title: "Scan images for CVEs", cmd: "trivy image nginx:latest", why: "Find known vulnerabilities before they reach production." },
    { cat: "security", title: "Watch a sensitive file", cmd: "auditctl -w /etc/passwd -p wa -k identity", why: "Records who changed it and when, with `ausearch -k identity`." },
    { cat: "security", title: "Generate modern keys", cmd: "ssh-keygen -t ed25519 -a 100", why: "Ed25519 is small, fast and strong; `-a 100` hardens the passphrase KDF." },

    /* ---------- performance ---------- */
    { cat: "perf", title: "Live kernel profile", cmd: "perf top", why: "See which functions burn CPU system-wide, live — no instrumentation." },
    { cat: "perf", title: "Counters for one command", cmd: "perf stat -d ./app", why: "Cycles, instructions, cache misses, IPC — know if you're CPU or memory bound." },
    { cat: "perf", title: "Attribute CPU to processes over time", cmd: "pidstat 1", why: "Per-process CPU sampled every second — find the culprit during an incident." },
    { cat: "perf", title: "Disk utilisation and latency", cmd: "iostat -xz 1", why: "High %util with growing await means the disk, not the app, is the bottleneck." },
    { cat: "perf", title: "Is the machine run-queue bound?", cmd: "vmstat 1", why: "The `r` column > CPU count and high `wa` tell you CPU vs. IO pressure." },
    { cat: "perf", title: "Historical performance", cmd: "sar -u 1 5", why: "sysstat's sar answers 'was it slow last night?' — enable it and check later." },
    { cat: "perf", title: "Realistic disk benchmark", cmd: "fio --name=rand --rw=randrw --size=1G --bs=4k --iodepth=32", why: "Mirrors database-style IO so results mean something." },
    { cat: "perf", title: "Pin a process to a CPU", cmd: "taskset -c 2,3 ./app", why: "Reduces cache thrash for latency-sensitive workloads." },
    { cat: "perf", title: "Micro-benchmark any command", cmd: "hyperfine 'cmd-a' 'cmd-b'", why: "Statistically sound timing with warmups — settle 'which is faster' properly." },

    /* ---------- debugging ---------- */
    { cat: "debug", title: "Trace a script line by line", cmd: "bash -x script.sh", why: "See exactly which command produced each result — the fastest first move." },
    { cat: "debug", title: "Fail fast and loudly", cmd: "set -euo pipefail", why: "Errors abort, undefined vars abort, pipe failures surface — no silent damage." },
    { cat: "debug", title: "Report where a script failed", cmd: "trap 'echo FAIL line $LINENO' ERR", why: "A one-line trap turns a cryptic exit into a precise location." },
    { cat: "debug", title: "Lint before you ship", cmd: "shellcheck deploy.sh", why: "Catches quoting bugs and footguns that only bite in production." },
    { cat: "debug", title: "Catch failure in a pipeline", cmd: "cmd1 | cmd2; echo ${PIPESTATUS[@]}", why: "$? only shows the last stage; PIPESTATUS shows every stage." },
    { cat: "debug", title: "Expose hidden characters", cmd: "cat -A file", why: "Reveals stray CR, tabs and non-breaking spaces that break configs." },
    { cat: "debug", title: "Hex-dump the mystery bytes", cmd: "xxd file | head", why: "Confirm BOMs, CRLF, or binary magic when `file` isn't enough." },
    { cat: "debug", title: "Talk TCP from pure bash", cmd: "exec 3<>/dev/tcp/host/80; echo -e 'GET / HTTP/1.0\\r' >&3; cat <&3", why: "No curl/nc required — diagnose connectivity on a bare system." },
    { cat: "debug", title: "Log to syslog from a script", cmd: "logger -t deploy 'v1.2 shipped'", why: "Unifies app and system logs so journalctl sees everything." },

    /* ---------- ssh & remote ---------- */
    { cat: "ssh", title: "Jump through a bastion", cmd: "ssh -J bastion internal-host", why: "One hop with one command; ProxyJump in config makes it permanent." },
    { cat: "ssh", title: "A config that saves typing", cmd: "Host web\\n  HostName 10.0.2.5\\n  User deploy\\n  IdentityFile ~/.ssh/id_ed25519", why: "`ssh web` beats a 60-character command — and centralises per-host rules." },
    { cat: "ssh", title: "Local port-forward", cmd: "ssh -L 5432:db1:5432 web", why: "Reach a private database through a public host, encrypted." },
    { cat: "ssh", title: "Instant SOCKS proxy", cmd: "ssh -D 1080 web", why: "Route browser or CLI traffic through the server as a VPN-lite." },
    { cat: "ssh", title: "Keep connections alive", cmd: "ServerAliveInterval 30 ServerAliveCountMax 3", why: "Stops NAT/firewalls from silently dropping your session." },
    { cat: "ssh", title: "Mount a remote directory", cmd: "sshfs web:/srv/app /mnt/app", why: "Edit remote files with local tools over SSH." },
    { cat: "ssh", title: "Resumable transfers", cmd: "rsync -avP --partial src/ host:dst/", why: "`-P` shows progress and keeps partials so a dropped link resumes." },

    /* ---------- automation ---------- */
    { cat: "auto", title: "Use systemd timers over cron", cmd: "OnCalendar=*-*-* 03:00:00", why: "Journal logging, dependencies and missed-run persistence — cron has none of it." },
    { cat: "auto", title: "Clean up no matter what", cmd: "tmp=$(mktemp -d); trap 'rm -rf \"$tmp\"' EXIT", why: "Your temp dir is removed even if the script errors out." },
    { cat: "auto", title: "Parse flags properly", cmd: "while getopts 'vhf:' o; do ...; done", why: "Handles -v -h -f file the way users expect, with no fragile $1 shifting." },
    { cat: "auto", title: "Idempotent installs", cmd: "command -v nginx >/dev/null || apt-get install -y nginx", why: "Running twice is safe — the core property of automation." },
    { cat: "auto", title: "Render config templates", cmd: "envsubst < app.conf.tpl > app.conf", why: "Substitute $VARS from the environment without a template engine." },
    { cat: "auto", title: "Run jobs in parallel", cmd: "find . -name '*.json' | xargs -P8 -I{} jq . {} >/dev/null", why: "Uses all cores for CPU-bound batch work." },
    { cat: "auto", title: "Reusable tasks with make", cmd: "make deploy", why: "A Makefile is a language-agnostic task runner your whole team can run." },
    { cat: "auto", title: "Time-box a command", cmd: "timeout 30 ./flaky.sh || echo 'timed out'", why: "Prevents a hung step from wedging your whole pipeline." },

    /* ---------- postgres ---------- */
    { cat: "pg", title: "Readable query output", cmd: "psql -x -c 'SELECT * FROM users LIMIT 1'", why: "Expanded mode prints one field per line — no horizontal scrolling." },
    { cat: "pg", title: "Fast parallel backups", cmd: "pg_dump -Fc -j4 appdb > app.dump", why: "Directory/custom format plus parallelism beats plain SQL dumps on big DBs." },
    { cat: "pg", title: "Parallel restore", cmd: "pg_restore -j4 -d appdb app.dump", why: "Restores multi-threaded — hours become minutes." },
    { cat: "pg", title: "Find the slow query", cmd: "EXPLAIN (ANALYZE, BUFFERS) SELECT ...", why: "Shows actual rows, time and buffer hits so you fix the real problem." },
    { cat: "pg", title: "Build indexes without locking", cmd: "CREATE INDEX CONCURRENTLY idx ON t(col);", why: "No long write lock — safe to run in production." },
    { cat: "pg", title: "Top queries by time", cmd: "SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC;", why: "Enable the extension once; it tells you exactly what to optimise." },
    { cat: "pg", title: "Load-test the database", cmd: "pgbench -c 10 -j 2 -T 60 appdb", why: "Built-in benchmark to baseline TPS before and after tuning." },

    /* ---------- terminal power ---------- */
    { cat: "term", title: "Survive a dropped SSH session", cmd: "tmux new -s work", why: "Detach with Ctrl+B d and reattach with `tmux a` — your work keeps running." },
    { cat: "term", title: "Run one command in every pane", cmd: "Ctrl+B : setw synchronize-panes", why: "Type once, execute on all servers at once — great for fleets." },
    { cat: "term", title: "Highlight changes in a command", cmd: "watch -d -n 2 'kubectl get pods'", why: "`-d` highlights what changed between refreshes." },
    { cat: "term", title: "Suspend and resume anything", cmd: "Ctrl+Z  ...  bg", why: "Free the prompt, then continue in the background." },
    { cat: "term", title: "Print before you run a bang command", cmd: "!!:p", why: "Verify a history expansion before it executes — no nasty surprises." },
    { cat: "term", title: "Read files with paging + search", cmd: "less /var/log/syslog", why: "`/` searches, `G` ends, `F` follows — more capable than cat." },
    { cat: "term", title: "Turn off the terminal's scroll trap", cmd: "reset", why: "Recovers a session where binary output corrupted the display." }
  ];

  // attach stable ids
  TIPS.forEach(function (t, i) { t.id = "tip-" + (i + 1); t.icon = (CATS[t.cat] || {}).icon || "💡"; });
  window.TIPS = TIPS;
  window.TIP_CATEGORIES = CATS;

  /* ------------------------------ UI ------------------------------ */
  var $overlay, $card, $search, $cats, $list, $detail;
  var ui = { open: false, idx: 0, filtered: TIPS.slice(), cat: "all" };

  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }

  function build() {
    if ($overlay) return;
    $overlay = el(
      '<div class="overlay hidden" id="tips-overlay">' +
        '<div class="overlay-card tips-card">' +
          '<div class="tips-head">' +
            '<span class="tips-badge">PRO TIPS</span>' +
            '<input id="tips-search" class="palette-input" type="text" placeholder="Search ' + TIPS.length + ' pro tips…" autocomplete="off" spellcheck="false" />' +
            '<span class="palette-hint">↑↓ move · Enter insert · Esc close</span>' +
          '</div>' +
          '<div id="tips-cats" class="tips-cats"></div>' +
          '<div class="tips-body">' +
            '<div id="tips-list" class="tips-list"></div>' +
            '<div id="tips-detail" class="tips-detail"></div>' +
          '</div>' +
        '</div>' +
      '</div>');
    document.body.appendChild($overlay);
    $card = $overlay.querySelector(".tips-card");
    $search = document.getElementById("tips-search");
    $cats = document.getElementById("tips-cats");
    $list = document.getElementById("tips-list");
    $detail = document.getElementById("tips-detail");

    $search.addEventListener("input", function () { ui.idx = 0; render(); });
    $overlay.addEventListener("mousedown", function (e) { if (e.target === $overlay) close(); });
    document.addEventListener("keydown", onKey, true);
  }

  function catCounts() {
    var counts = { all: TIPS.length };
    TIPS.forEach(function (t) { counts[t.cat] = (counts[t.cat] || 0) + 1; });
    return counts;
  }
  function renderCats() {
    var counts = catCounts();
    var html = '<button class="tips-cat' + (ui.cat === "all" ? " active" : "") + '" data-cat="all">All <b>' + counts.all + '</b></button>';
    Object.keys(CATS).forEach(function (k) {
      if (!counts[k]) return;
      html += '<button class="tips-cat' + (ui.cat === k ? " active" : "") + '" data-cat="' + k + '">' + CATS[k].icon + " " + esc(CATS[k].label) + " <b>" + counts[k] + "</b></button>";
    });
    $cats.innerHTML = html;
    Array.prototype.forEach.call($cats.querySelectorAll(".tips-cat"), function (b) {
      b.addEventListener("click", function () { ui.cat = b.getAttribute("data-cat"); ui.idx = 0; render(); $search.focus(); });
    });
  }

  function apply() {
    var q = ($search.value || "").toLowerCase().trim();
    ui.filtered = TIPS.filter(function (t) {
      if (ui.cat !== "all" && t.cat !== ui.cat) return false;
      if (!q) return true;
      var hay = (t.title + " " + (t.cmd || "") + " " + t.why + " " + CATS[t.cat].label).toLowerCase();
      return q.split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
    });
    if (ui.idx >= ui.filtered.length) ui.idx = Math.max(0, ui.filtered.length - 1);
  }

  function render() {
    apply();
    if (!ui.filtered.length) {
      $list.innerHTML = '<div class="tips-empty">No tips match that search.</div>';
      $detail.innerHTML = "";
      return;
    }
    $list.innerHTML = ui.filtered.map(function (t, i) {
      return '<button class="tips-item' + (i === ui.idx ? " active" : "") + '" data-i="' + i + '">' +
        '<span class="ti-icon">' + t.icon + "</span>" +
        '<span class="ti-title">' + esc(t.title) + "</span>" +
        '<span class="ti-cat">' + esc(CATS[t.cat].label) + "</span></button>";
    }).join("");
    Array.prototype.forEach.call($list.querySelectorAll(".tips-item"), function (b) {
      b.addEventListener("mouseenter", function () { ui.idx = +b.getAttribute("data-i"); paintActive(); renderDetail(); });
      b.addEventListener("click", function () { ui.idx = +b.getAttribute("data-i"); renderDetail(); });
    });
    renderDetail();
  }

  function paintActive() {
    Array.prototype.forEach.call($list.querySelectorAll(".tips-item"), function (b, i) {
      b.classList.toggle("active", i === ui.idx);
    });
    var a = $list.querySelector(".tips-item.active");
    if (a && a.scrollIntoView) a.scrollIntoView({ block: "nearest" });
  }

  function renderDetail() {
    var t = ui.filtered[ui.idx];
    if (!t) { $detail.innerHTML = ""; return; }
    $detail.innerHTML =
      '<div class="td-cat">' + t.icon + " " + esc(CATS[t.cat].label) + "</div>" +
      '<h3 class="td-title">' + esc(t.title) + "</h3>" +
      (t.cmd ? '<div class="td-cmd"><code>' + esc(t.cmd) + "</code></div>" : "") +
      '<p class="td-why">' + esc(t.why) + "</p>" +
      (t.cmd ? '<div class="td-actions"><button class="btn" id="tips-insert">Insert command</button>' +
        '<button class="btn ghost" id="tips-copy">Copy</button></div>' : "");
    var insertBtn = document.getElementById("tips-insert");
    if (insertBtn) insertBtn.addEventListener("click", insertSelected);
    var copyBtn = document.getElementById("tips-copy");
    if (copyBtn) copyBtn.addEventListener("click", function () {
      var cmd = t.cmd;
      if (navigator.clipboard) navigator.clipboard.writeText(cmd).catch(function () {});
      if (window.__lmToast) window.__lmToast("Copied to clipboard");
    });
  }

  function insertSelected() {
    var t = ui.filtered[ui.idx];
    if (!t || !t.cmd) return;
    // Shortcut-style tips (Ctrl+R, Alt+., …) can't be pasted — copy them instead.
    if (/^(Ctrl|Alt|Shift|Esc|Tab|Enter|↑|↓)\b/.test(t.cmd.trim()) || /\b(Ctrl|Alt|Shift)\+/.test(t.cmd)) {
      if (navigator.clipboard) navigator.clipboard.writeText(t.cmd).catch(function () {});
      if (window.__lmToast) window.__lmToast("Shortcut copied: " + t.cmd);
      return;
    }
    var cmd = t.cmd;
    var input = document.getElementById("cmd");
    close();
    if (input && cmd) {
      input.value = cmd;
      input.focus();
      try { input.setSelectionRange(cmd.length, cmd.length); } catch (e) {}
    }
  }

  function move(d) {
    if (!ui.filtered.length) return;
    ui.idx = (ui.idx + d + ui.filtered.length) % ui.filtered.length;
    paintActive();
    renderDetail();
  }

  function onKey(e) {
    if (!ui.open) return;
    var k = e.key;
    if (k === "Escape") { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (k === "ArrowDown") { e.preventDefault(); e.stopPropagation(); move(1); return; }
    if (k === "ArrowUp") { e.preventDefault(); e.stopPropagation(); move(-1); return; }
    if (k === "Enter") { e.preventDefault(); e.stopPropagation(); insertSelected(); return; }
    if (k === "Tab") {
      e.preventDefault(); e.stopPropagation();
      var keys = ["all"].concat(Object.keys(CATS).filter(function (c) { return TIPS.some(function (t) { return t.cat === c; }); }));
      var i = keys.indexOf(ui.cat);
      ui.cat = keys[(i + 1) % keys.length];
      render(); return;
    }
    // let other keys fall through to the search input
  }

  function open(idOrRandom) {
    build();
    ui.open = true;
    window.__LM_OVERLAY__ = true;
    $overlay.classList.remove("hidden");
    if (idOrRandom === "random") {
      ui.idx = Math.floor(Math.random() * TIPS.length);
      var r = TIPS[ui.idx];
      ui.cat = r.cat;
      $search.value = "";
    } else if (typeof idOrRandom === "string") {
      var found = TIPS.findIndex(function (t) { return t.id === idOrRandom; });
      if (found >= 0) { ui.idx = found; ui.cat = TIPS[found].cat; $search.value = ""; }
    }
    renderCats();
    render();
    setTimeout(function () { $search.focus(); }, 0);
  }
  function close() {
    if (!$overlay) return;
    ui.open = false;
    window.__LM_OVERLAY__ = false;
    $overlay.classList.add("hidden");
    var input = document.getElementById("cmd");
    if (input) input.focus();
  }

  window.openTips = function () { open(); };
  window.openRandomTip = function () { open("random"); };
  window.openTip = function (id) { open(id); };

  /* tip teaser in the sidebar */
  function teaser() {
    var host = document.getElementById("tip-teaser");
    if (!host) return;
    var day = Math.floor(Date.now() / 86400000);
    var t = TIPS[day % TIPS.length];
    host.innerHTML =
      '<div class="tip-teaser-head"><span class="tip-teaser-dot"></span>Tip of the day</div>' +
      '<div class="tip-teaser-title">' + esc(t.title) + "</div>" +
      (t.cmd ? '<code class="tip-teaser-cmd">' + esc(t.cmd) + "</code>" : "") +
      '<div class="tip-teaser-foot">Press <span class="key">Ctrl</span>+<span class="key">T</span> for ' + TIPS.length + ' more</div>';
    host.addEventListener("click", function () { window.openTip(t.id); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", teaser);
  else teaser();
})();
