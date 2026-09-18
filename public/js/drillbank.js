/* ============================================================================
 * drillbank.js — Drill Bank: 4 optional Boss Fights, one per Act.
 * Loads AFTER curriculum.js. Reviews are OUT of the main flow: bosses never
 * block Next, never count toward the 118-task Learn total, and reuse only
 * skills taught in their Act. IDs are bN-lM (never collide with mXX-lN).
 * Exposes: global.DRILLBANK ([boss modules]) — app.js renders it separately.
 * ==========================================================================*/
(function (global) {
  "use strict";

  var H = global.CurriculumHelpers.H;
  var T = global.CurriculumHelpers.T;
  function bad(reason) { return { ok: false, reason: reason }; }

  var DRILLBANK = [

  /* ================= BOSS 1 · Log Ambush (Act 1 skills) =================
   * Attempt after Act 1. Only find/pipes/text/perms/users/procs. */
  {
    id: "b1", actId: "act1", title: "Boss 1 · Log Ambush", icon: "🥋", hours: 1, level: "Intermediate",
    blurb: "Act 1 under fire: rank attackers, scrub logs, lock evidence, kill the runaway.",
    lessons: [
      { id: "b1-l1", title: "Rank the 404 probers",
        objective: "Turn the access log into a ranked suspect list.",
        theory: T("Filter first (`$9==404`), extract the IP, rank the counts.",
          "One IP owning every 404 is a prober — file the list before you block anyone."),
        examples: [ { cmd: "awk '$9==404 {print $1}' /var/log/nginx/access.log", desc: "Prober IPs" }, { cmd: "awk '$9==404 {print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn", desc: "Ranked" } ],
        task: { prompt: "Rank client IPs behind 404s into ~/drill/b1-probers.txt.", hint: "awk '$9==404 {print $1}' ... | sort | uniq -c | sort -rn > ~/drill/b1-probers.txt", solution: "mkdir -p ~/drill && awk '$9==404 {print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn > ~/drill/b1-probers.txt", check: H.all(H.file("/home/sam/drill/b1-probers.txt"), H.content("/home/sam/drill/b1-probers.txt", "203.0.113.9"), H.ran(/awk/)) } },
      { id: "b1-l2", title: "Scrub the log, prove the diff",
        objective: "Redact a copy and file reviewable proof.",
        theory: T("Never redact the original: `sed` into a copy, `diff` the pair.",
          "The diff file is what you paste into the ticket — not your memory of it."),
        examples: [ { cmd: "sed 's/203\\.0\\.113\\.9/ATTACKER/g' /var/log/nginx/access.log > /tmp/b1-scrubbed.log", desc: "Redact copy" }, { cmd: "diff /var/log/nginx/access.log /tmp/b1-scrubbed.log | head", desc: "Prove delta" } ],
        task: { prompt: "Copy the access log with 203.0.113.9 replaced by ATTACKER (/tmp/b1-scrubbed.log) and diff it into ~/drill/b1-scrub.diff.", hint: "sed ... > /tmp/b1-scrubbed.log; diff ... > ~/drill/b1-scrub.diff", solution: "sed 's/203\\.0\\.113\\.9/ATTACKER/g' /var/log/nginx/access.log > /tmp/b1-scrubbed.log; diff /var/log/nginx/access.log /tmp/b1-scrubbed.log > ~/drill/b1-scrub.diff", check: H.all(H.file("/home/sam/drill/b1-scrub.diff"), H.content("/home/sam/drill/b1-scrub.diff", "ATTACKER"), H.ran(/diff/)) } },
      { id: "b1-l3", title: "Lock down the evidence locker",
        objective: "A private directory for the case files.",
        theory: T("Evidence dirs are mode `700`: only you can even list them.",
          "`mkdir -p` then `chmod 700` — create and fortify in one breath."),
        examples: [ { cmd: "mkdir -p ~/drill/locker", desc: "Create" }, { cmd: "chmod 700 ~/drill/locker && ls -ld ~/drill/locker", desc: "Fortify + prove" } ],
        task: { prompt: "Create ~/drill/locker with mode 700.", hint: "mkdir -p ~/drill/locker && chmod 700 ~/drill/locker", solution: "mkdir -p ~/drill/locker && chmod 700 ~/drill/locker", check: H.all(H.dir("/home/sam/drill/locker"), H.mode("/home/sam/drill/locker", 0o700)) } },
      { id: "b1-l4", title: "Kill the runaway",
        objective: "Port evidence first, signal second.",
        theory: T("`ss -tlnp | grep 8000` names the listener; `pkill -f manage.py` ends it.",
          "Evidence before action — the report must show what you saw before you fired."),
        examples: [ { cmd: "ss -tlnp | grep 8000", desc: "Witness" }, { cmd: "pkill -f manage.py", desc: "Fire" } ],
        task: { prompt: "Show the port-8000 listener evidence, then terminate manage.py.", hint: "ss -tlnp | grep 8000 ; pkill -f manage.py", solution: "ss -tlnp | grep 8000 ; pkill -f manage.py", check: H.all(H.ran(/ss\s+-[a-z]*l/), H.procGone("manage.py")) } }
    ]
  },

  /* ================= BOSS 2 · Dark Server (Act 2 skills) =================
   * Attempt after Act 2. Bootstrap, packages, net, logs, SSH, cron, debug. */
  {
    id: "b2", actId: "act2", title: "Boss 2 · Dark Server", icon: "🥋", hours: 1, level: "Intermediate",
    blurb: "A box you have never seen: audit policy vs reality, reach it, schedule on it.",
    lessons: [
      { id: "b2-l1", title: "Firewall intent vs listener truth",
        objective: "Policy beside reality in one file.",
        theory: T("`ufw status` is INTENT; `ss -tlnp` is TRUTH.",
          "Allowed but not listening = app down. Listening but not allowed = blocked at the wire."),
        examples: [ { cmd: "sudo ufw status > ~/drill/b2-fw.txt", desc: "Intent" }, { cmd: "ss -tlnp >> ~/drill/b2-fw.txt", desc: "Truth appended" } ],
        task: { prompt: "File ufw status plus full ss listeners to ~/drill/b2-fw.txt.", hint: "sudo ufw status > file && ss -tlnp >> file", solution: "mkdir -p ~/drill && sudo ufw status > ~/drill/b2-fw.txt && ss -tlnp >> ~/drill/b2-fw.txt", check: H.all(H.firewallOn(), H.file("/home/sam/drill/b2-fw.txt"), H.ran(/ufw/), H.ran(/ss/)) } },
      { id: "b2-l2", title: "Prove ssh three ways",
        objective: "Supervisor, kernel, and logs must all agree.",
        theory: T("`is-active` (supervisor) + `ss | grep :22` (kernel) + `journalctl -u ssh` (logs).",
          "All three green = running. Any red = exactly where to dig."),
        examples: [ { cmd: "systemctl is-active ssh && ss -tlnp | grep ':22'", desc: "Two proofs" }, { cmd: "journalctl -u ssh -n 3 --no-pager", desc: "Third proof" } ],
        task: { prompt: "Prove ssh three ways, filing journal output to ~/drill/b2-ssh-chain.txt.", hint: "is-active && ss | grep && journalctl -u ssh ... > file", solution: "systemctl is-active ssh && ss -tlnp | grep ':22' && journalctl -u ssh -n 3 --no-pager > ~/drill/b2-ssh-chain.txt", check: H.all(H.serviceActive("ssh"), H.file("/home/sam/drill/b2-ssh-chain.txt"), H.content("/home/sam/drill/b2-ssh-chain.txt", "Logs begin"), H.ran(/journalctl/)) } },
      { id: "b2-l3", title: "Ship a script, gate the result",
        objective: "scp deploy atom plus a remote success gate.",
        theory: T("Ship (`scp`), then branch on the far exit code (`ssh web1 true && ... || ...`).",
          "Health gates in real deploy scripts are exactly this shape."),
        examples: [ { cmd: "scp ~/hello.sh web1:/tmp/", desc: "Ship" }, { cmd: "ssh web1 true && echo REMOTE-OK", desc: "Gate" } ],
        task: { prompt: "Copy ~/hello.sh to web1:/tmp/ and file the ssh gate result (REMOTE-OK) to ~/drill/b2-remote-ok.txt.", hint: "scp ... && ssh web1 true && echo REMOTE-OK > file || echo REMOTE-FAIL > file", solution: "scp ~/hello.sh web1:/tmp/ && ssh web1 true && echo REMOTE-OK > ~/drill/b2-remote-ok.txt || echo REMOTE-FAIL > ~/drill/b2-remote-ok.txt", check: H.all(H.file("/home/sam/drill/b2-remote-ok.txt"), H.content("/home/sam/drill/b2-remote-ok.txt", "REMOTE-OK"), H.ran(/scp/), H.ran(/ssh/)) } },
      { id: "b2-l4", title: "Port 80: two witnesses",
        objective: "Kernel view plus process view on one port.",
        theory: T("`ss` says what the kernel hears; `lsof -i` says which process owns it.",
          "Both naming nginx = settled. Disagreement = the interesting ticket."),
        examples: [ { cmd: "ss -tlnp | grep ':80'", desc: "Witness one" }, { cmd: "lsof -i :80", desc: "Witness two" } ],
        task: { prompt: "File ss and lsof evidence for port 80 to ~/drill/b2-port80.txt.", hint: "ss ... | grep > file; lsof -i :80 >> file", solution: "ss -tlnp | grep ':80' > ~/drill/b2-port80.txt; lsof -i :80 >> ~/drill/b2-port80.txt", check: H.all(H.file("/home/sam/drill/b2-port80.txt"), H.ran(/lsof/), H.ran(/ss/)) } }
    ]
  },

  /* ================= BOSS 3 · Ship It Live (Act 3 skills) =================
   * Attempt after Act 3. Containers, proxy, data, serving — the deploy loop. */
  {
    id: "b3", actId: "act3", title: "Boss 3 · Ship It Live", icon: "🥋", hours: 1, level: "Intermediate",
    blurb: "Throwaway container, proxy targets, live data, validated serving.",
    lessons: [
      { id: "b3-l1", title: "Throwaway web, clean dock",
        objective: "Publish, probe, and remove without a trace.",
        theory: T("Experiments get UNIQUE names (`rev-nginx`, `:8081`) — never graze the real `web`.",
          "Stop + remove + receipt: no orphans after experiments."),
        examples: [ { cmd: "docker run -d --name rev-nginx -p 8081:80 nginx", desc: "Publish" }, { cmd: "docker stop rev-nginx && docker rm rev-nginx", desc: "Clean" } ],
        task: { prompt: "Run rev-nginx on 8081, file its HTTP code to ~/drill/b3-revcode.txt, then stop and remove it.", hint: "run ... && curl ... :8081/ > file && stop && rm", solution: "docker run -d --name rev-nginx -p 8081:80 nginx && curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8081/ > ~/drill/b3-revcode.txt && docker stop rev-nginx && docker rm rev-nginx", check: H.all(H.file("/home/sam/drill/b3-revcode.txt"), H.ran(/docker run/), function (env) { var hit = env.m.docker.containers.some(function (c) { return c.name === "rev-nginx"; }); return hit ? bad("rev-nginx still exists") : true; }) } },
      { id: "b3-l2", title: "Where does nginx point?",
        objective: "Collect every live proxy target.",
        theory: T("`grep -h proxy_pass` across enabled sites lists every upstream in one view.",
          "`:8000` vs `:8001` tells you which color is live."),
        examples: [ { cmd: "grep -h proxy_pass /etc/nginx/sites-enabled/*", desc: "Targets" }, { cmd: "sudo nginx -t", desc: "Config valid?" } ],
        task: { prompt: "Collect proxy_pass targets from enabled sites into ~/drill/b3-proxy.txt.", hint: "grep -h proxy_pass /etc/nginx/sites-enabled/* > ...", solution: "mkdir -p ~/drill && grep -h proxy_pass /etc/nginx/sites-enabled/* > ~/drill/b3-proxy.txt 2>/dev/null; cat ~/drill/b3-proxy.txt", check: H.all(H.file("/home/sam/drill/b3-proxy.txt"), H.ran(/proxy_pass/)) } },
      { id: "b3-l3", title: "Database parade + readiness",
        objective: "List it, filter to yours, prove it answers.",
        theory: T("Full list first (`psql -l`), then YOUR rows (`grep appdb`).",
          "`pg_isready` gates app talk — never sleep-and-pray."),
        examples: [ { cmd: "sudo -u postgres psql -l | grep appdb", desc: "Yours" }, { cmd: "pg_isready -h localhost -p 5432", desc: "Ready?" } ],
        task: { prompt: "File the database list showing appdb to ~/drill/b3-dbs.txt and check readiness.", hint: "psql -l > file && grep appdb file && pg_isready", solution: "sudo -u postgres psql -l > ~/drill/b3-dbs.txt && grep appdb ~/drill/b3-dbs.txt && pg_isready -h localhost -p 5432", check: H.all(H.file("/home/sam/drill/b3-dbs.txt"), H.content("/home/sam/drill/b3-dbs.txt", "appdb"), H.ran(/pg_isready/)) } },
      { id: "b3-l4", title: "Caddy active and valid",
        objective: "Supervisor plus validator must both be green.",
        theory: T("Active-but-invalid = running yesterday's config. Valid-but-inactive = serving nothing.",
          "Two green lights before you call serving done."),
        examples: [ { cmd: "systemctl is-active caddy", desc: "Supervisor" }, { cmd: "sudo caddy validate --config /etc/caddy/Caddyfile", desc: "Validator" } ],
        task: { prompt: "Prove caddy active and file its validation to ~/drill/b3-caddy.txt.", hint: "is-active && validate ... > ...", solution: "systemctl is-active caddy && sudo caddy validate --config /etc/caddy/Caddyfile > ~/drill/b3-caddy.txt", check: H.all(H.serviceActive("caddy"), H.file("/home/sam/drill/b3-caddy.txt"), H.ran(/caddy validate/)) } }
    ]
  },

  /* ================= BOSS 4 · 2AM Meltdown (Act 4 skills) =================
   * Attempt after Act 4. Diagnose, survive, ship — the on-call exam. */
  {
    id: "b4", actId: "act4", title: "Boss 4 · 2AM Meltdown", icon: "🥋", hours: 1, level: "Advanced",
    blurb: "Pager goes off: bundle evidence, fix the 502, prove safety, lock secrets.",
    lessons: [
      { id: "b4-l1", title: "Incident bundle in one file",
        objective: "Header, load, disk, listener — thirty seconds.",
        theory: T("One file, top to bottom: what (`# bundle`), load (`uptime`), disk (`df`), sockets (`ss`).",
          "This file IS the first reply in every incident thread."),
        examples: [ { cmd: "echo '# bundle' > ~/drill/b4-bundle.txt && uptime >> ~/drill/b4-bundle.txt", desc: "Two beats" }, { cmd: "df -h / | grep sda1 >> ~/drill/b4-bundle.txt && ss -tlnp | grep -c ':80' >> ~/drill/b4-bundle.txt", desc: "Disk + sockets" } ],
        task: { prompt: "Write the 4-beat incident bundle to ~/drill/b4-bundle.txt.", hint: "echo header > file && uptime >> file && df ... >> file && ss ... >> file", solution: "mkdir -p ~/drill && echo '# bundle' > ~/drill/b4-bundle.txt && uptime >> ~/drill/b4-bundle.txt && df -h / | grep sda1 >> ~/drill/b4-bundle.txt && ss -tlnp | grep -c ':80' >> ~/drill/b4-bundle.txt", check: H.all(H.file("/home/sam/drill/b4-bundle.txt"), H.content("/home/sam/drill/b4-bundle.txt", "/dev/sda1"), H.ran(/ss/)) } },
      { id: "b4-l2", title: "502: bag evidence, restore backend",
        objective: "Read the error log, restart the app, confirm the port.",
        theory: T("502 = proxy fine, upstream dead. Tail the error log FIRST (exhibit),",
          "then restart the backend and prove it listens — never restart nginx first."),
        examples: [ { cmd: "sudo tail -n 5 /var/log/nginx/error.log", desc: "Exhibit" }, { cmd: "sudo systemctl restart app && ss -tlnp | grep 8000", desc: "Restore + prove" } ],
        task: { prompt: "Bag the last 5 nginx errors, restart app, confirm it listens on 8000.", hint: "tail error.log && restart app && ss | grep 8000", solution: "sudo tail -n 5 /var/log/nginx/error.log && sudo systemctl restart app && ss -tlnp | grep 8000", check: H.all(H.serviceActive("app.service"), H.ran(/error\.log/)) } },
      { id: "b4-l3", title: "Prove you are backed up",
        objective: "Snapshots local, copies offsite, dumps listed.",
        theory: T("Local snapshots without offsite = one fire away from nothing.",
          "Three proofs, one file: restic chain, rclone remote, dump rows."),
        examples: [ { cmd: "restic -r /backups/restic snapshots | head -n 3", desc: "Chain head" }, { cmd: "rclone lsd offsite:", desc: "Offsite proof" } ],
        task: { prompt: "File restic head, rclone offsite listing, and the appdb dump row to ~/drill/b4-safety.txt.", hint: "restic ... | head > file && rclone lsd ... >> file && ls -l ... >> file", solution: "restic -r /backups/restic snapshots | head -n 3 > ~/drill/b4-safety.txt && rclone lsd offsite: >> ~/drill/b4-safety.txt && ls -l /backups/appdb.sql >> ~/drill/b4-safety.txt", check: H.all(H.file("/home/sam/drill/b4-safety.txt"), H.content("/home/sam/drill/b4-safety.txt", "appdb.sql"), H.ran(/restic/), H.ran(/rclone/)) } },
      { id: "b4-l4", title: "Secrets locked, signals valid",
        objective: "Fetch to a fortified file; validate the whole signal chain.",
        theory: T("Secrets at 644 are broadcasts — fetch then `chmod 600` in one breath.",
          "Monitoring you cannot validate you cannot trust: config AND rules."),
        examples: [ { cmd: "vault kv get secret/app > ~/drill/b4-appsecret.txt && chmod 600 ~/drill/b4-appsecret.txt", desc: "Fetch + fortify" }, { cmd: "promtool check config ~/prometheus.yml", desc: "Validate signal" } ],
        task: { prompt: "Fetch secret/app to ~/drill/b4-appsecret.txt at mode 600, and validate Prometheus config + rules into ~/drill/b4-prom.txt.", hint: "vault ... > file && chmod 600 file && check config > prom 2>&1; check rules >> prom 2>&1", solution: "vault kv get secret/app > ~/drill/b4-appsecret.txt && chmod 600 ~/drill/b4-appsecret.txt && promtool check config ~/prometheus.yml > ~/drill/b4-prom.txt 2>&1; promtool check rules ~/alerts.yml >> ~/drill/b4-prom.txt 2>&1", check: H.all(H.file("/home/sam/drill/b4-appsecret.txt"), H.mode("/home/sam/drill/b4-appsecret.txt", 0o600), H.ran(/promtool check config/), H.ran(/promtool check rules/)) } }
    ]
  }

  ];

  global.DRILLBANK = DRILLBANK;
})(typeof window !== "undefined" ? window : globalThis);
