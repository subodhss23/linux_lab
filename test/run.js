/* ============================================================================
 * test/run.js — Headless test harness for the Linux Mastery simulator.
 * Run: node test/run.js
 * ==========================================================================*/
"use strict";
const path = require("path");
require(path.join(__dirname, "..", "public", "js", "filesystem.js"));
require(path.join(__dirname, "..", "public", "js", "machine.js"));
require(path.join(__dirname, "..", "public", "js", "commands.js"));
require(path.join(__dirname, "..", "public", "js", "shell.js"));

const { Machine, Shell } = global;

let passed = 0, failed = 0;
const failures = [];

function check(name, cond, detail) {
  if (cond) { passed++; process.stdout.write("."); }
  else { failed++; failures.push(name + (detail ? "  -> " + detail : "")); process.stdout.write("F"); }
}
function group(title) { process.stdout.write("\n\n" + title + "\n"); }

function fresh() {
  const m = Machine.createMachine();
  const sh = new Shell(m);
  return { m, sh, run(cmd) { return sh.exec(cmd); } };
}

/* -------------------- filesystem -------------------- */
group("Filesystem basics");
{
  const { m, run } = fresh();
  run("mkdir -p /tmp/a/b/c");
  check("mkdir -p nested", m.fs.exists("/tmp/a/b/c", "/", m.env, "dir"));
  run("echo hello > /tmp/a/file.txt");
  check("redirection writes file", m.fs.readFile("/tmp/a/file.txt", "/", m.env) === "hello\n");
  run("echo world >> /tmp/a/file.txt");
  check("append redirection", m.fs.readFile("/tmp/a/file.txt", "/", m.env) === "hello\nworld\n");
  run("cp -r /tmp/a /tmp/copy");
  check("cp -r", m.fs.exists("/tmp/copy/b/c", "/", m.env, "dir"));
  run("mv /tmp/copy /tmp/moved");
  check("mv", m.fs.exists("/tmp/moved/file.txt", "/", m.env, "file"));
  run("rm -rf /tmp/moved");
  check("rm -rf", !m.fs.exists("/tmp/moved", "/", m.env));
}

/* -------------------- permissions -------------------- */
group("Permissions");
{
  const { m, run } = fresh();
  run("touch /tmp/p.txt");
  run("chmod 640 /tmp/p.txt");
  check("chmod octal", (m.fs.stat("/tmp/p.txt", "/", m.env).mode & 0o777) === 0o640);
  run("chmod u+x /tmp/p.txt");
  check("chmod symbolic", (m.fs.stat("/tmp/p.txt", "/", m.env).mode & 0o100) !== 0);
  run("chmod 1777 /tmp");
  check("sticky bit", (m.fs.stat("/tmp", "/", m.env).mode & 0o1000) !== 0);
  run("mkdir -p ~/drillnest/inner");
  check("mkdir -p nested via ~ succeeds", m.fs.exists("/home/sam/drillnest/inner", "/", m.env, "dir"));
  check("mkdir sets owner to current user", m.fs.stat("/home/sam/drillnest/inner", "/", m.env).owner === "sam");
  run("sudo mkdir -p /srv/sudodir/sub");
  check("sudo mkdir stays root-owned", m.fs.stat("/srv/sudodir/sub", "/", m.env).owner === "root");
}

/* -------------------- text processing -------------------- */
group("Text processing");
{
  const { run } = fresh();
  let r = run('printf "c\\na\\nb\\na\\n" > /tmp/t.txt');
  r = run("sort /tmp/t.txt");
  check("sort", r.output.indexOf("a\nb\nc") !== -1, JSON.stringify(r.output));
  r = run("sort /tmp/t.txt | uniq -c");
  check("uniq -c", r.output.indexOf("2 a") !== -1, JSON.stringify(r.output));
  r = run("grep -c a /tmp/t.txt");
  check("grep -c", r.output.trim() === "2", JSON.stringify(r.output));
  r = run("cut -d: -f1 /etc/passwd | head -n 2");
  check("cut pipe head", r.output.indexOf("root") !== -1 && r.output.indexOf("sam") !== -1, JSON.stringify(r.output));
  r = run("echo 'hello world' | tr ' ' '_'");
  check("tr", r.output.trim() === "hello_world", JSON.stringify(r.output));
  r = run("sed 's/root/admin/g' /etc/passwd | head -n 1");
  check("sed", r.output.indexOf("admin") !== -1, JSON.stringify(r.output));
  r = run("awk -F: '{print $1}' /etc/passwd | head -n 1");
  check("awk", r.output.trim() === "root", JSON.stringify(r.output));
  r = run("wc -l /etc/passwd");
  check("wc -l", /^\s*\d+/.test(r.output), JSON.stringify(r.output));
}

/* -------------------- shell features -------------------- */
group("Shell features");
{
  const { m, run } = fresh();
  run("export GREETING=hi");
  let r = run("echo $GREETING");
  check("variable expansion", r.output.trim() === "hi", JSON.stringify(r.output));
  r = run("echo $(whoami)");
  check("command substitution", r.output.trim() === "sam", JSON.stringify(r.output));
  r = run("true && echo yes");
  check("&& success branch", r.output.trim() === "yes");
  r = run("false || echo fallback");
  check("|| branch", r.output.trim() === "fallback");
  r = run("false && echo no");
  check("&& failure short-circuit", r.output.trim() === "");
  r = run("echo one; echo two");
  check("; sequencing", r.output.trim() === "one\ntwo", JSON.stringify(r.output));
  r = run("ls /etc/*.conf 2>/dev/null; echo end");
  check("glob + stderr redirect", r.output.indexOf("end") !== -1);
  r = run("echo error > /tmp/e.txt 2>&1");
  check("2>&1", m.fs.exists("/tmp/e.txt", "/", m.env));
  r = run("printf 'x\\ny\\n' | grep y");
  check("pipe stdin", r.output.trim() === "y", JSON.stringify(r.output));
}

/* -------------------- users & sudo -------------------- */
group("Users, groups, sudo");
{
  const { m, run } = fresh();
  let r = run("sudo useradd -m -s /bin/bash charlie");
  check("sudo useradd", !!m.users.charlie, JSON.stringify(r.output));
  check("useradd -m home", m.fs.exists("/home/charlie", "/", m.env, "dir"));
  run("sudo usermod -aG sudo charlie");
  check("usermod group", m.users.charlie.groups.indexOf("sudo") !== -1);
  r = run("sudo whoami");
  check("sudo whoami root", r.output.trim() === "root", JSON.stringify(r.output));
  r = run("su - charlie");
  check("su changes user", m.user === "charlie");
  run("exit");
}

/* -------------------- processes -------------------- */
group("Processes");
{
  const { m, run } = fresh();
  let r = run("ps aux");
  check("ps aux", r.output.indexOf("PID") !== -1 && r.output.indexOf("systemd") !== -1);
  r = run("pgrep manage.py");
  check("pgrep", /3010/.test(r.output), JSON.stringify(r.output));
  run("pkill -f manage.py");
  check("pkill removes process", !m.processes.some((p) => p.command.indexOf("manage.py") !== -1));
}

/* -------------------- services -------------------- */
group("systemd services");
{
  const { m, run } = fresh();
  let r = run("systemctl status nginx");
  check("systemctl status", r.output.indexOf("nginx") !== -1);
  run("sudo systemctl stop nginx");
  check("systemctl stop", m.services.nginx.active === false);
  run("sudo systemctl start app");
  check("systemctl start app", m.services["app.service"].active === true);
  run("sudo systemctl enable docker");
  check("systemctl enable", m.services.docker.enabled === true);
  r = run("journalctl -u nginx -n 5");
  check("journalctl", r.output.indexOf("Logs begin") !== -1);
}

/* -------------------- storage -------------------- */
group("Storage");
{
  const { run } = fresh();
  let r = run("df -h");
  check("df -h", r.output.indexOf("/dev/sda1") !== -1);
  r = run("du -sh /etc");
  check("du -sh", /\d/.test(r.output));
  r = run("lsblk");
  check("lsblk", r.output.indexOf("sda") !== -1);
  r = run("tar czf /tmp/etc.tgz /etc");
  check("tar create", /tar/.test(r.output) === false);
}

/* -------------------- networking -------------------- */
group("Networking");
{
  const { m, run } = fresh();
  let r = run("ip a");
  check("ip a", r.output.indexOf("eth0") !== -1);
  r = run("ping -c 4 web1");
  check("ping", r.output.indexOf("4 packets transmitted, 4 received") !== -1);
  r = run("dig app.example.com");
  check("dig", r.output.indexOf("10.0.2.15") !== -1);
  r = run("ss -tlpn");
  check("ss", r.output.indexOf("LISTEN") !== -1);
  r = run("curl -I http://localhost");
  check("curl -I", r.output.indexOf("HTTP") !== -1);
  run("sudo ufw allow 443/tcp");
  run("sudo ufw enable");
  check("ufw enable", m.firewall.enabled === true);
}

/* -------------------- ssh -------------------- */
group("SSH");
{
  const { m, run } = fresh();
  run("ssh-keygen -t ed25519 -N '' -f /home/sam/.ssh/id_ed25519");
  check("ssh-keygen", m.fs.exists("/home/sam/.ssh/id_ed25519.pub", "/", m.env));
  const priv = m.fs.stat("/home/sam/.ssh/id_ed25519", "/", m.env);
  check("ssh-keygen private mode 600", (priv.mode & 0o777) === 0o600);
  let r = run("ssh web1 uptime");
  check("ssh one-off command", r.output.indexOf("up") !== -1);
  r = run("scp /home/sam/notes web1:/tmp/");
  check("scp", r.output.indexOf("100%") !== -1);
}

/* -------------------- docker -------------------- */
group("Docker");
{
  const { m, run } = fresh();
  let r = run("docker images");
  check("docker images", r.output.indexOf("nginx") !== -1);
  r = run("docker run -d --name web -p 8080:80 nginx");
  check("docker run", m.docker.containers.some((c) => c.name === "web" && c.status.indexOf("Up") === 0));
  r = run("docker ps");
  check("docker ps", r.output.indexOf("web") !== -1);
  m.fs.writeFile("Dockerfile", "/home/sam", m.env, "FROM nginx\n");
  r = run("cd /home/sam && docker build -t web:1.0 .");
  check("docker build", m.docker.images.some((i) => i.repository === "web" && i.tag === "1.0"));
  run("docker compose up -d");
  check("docker compose", m.docker.containers.some((c) => c.name === "app_web_1"));
}

/* -------------------- cron -------------------- */
group("Cron");
{
  const { m, run } = fresh();
  run("echo '0 2 * * * /home/sam/hello.sh' | crontab -");
  check("crontab install", m.cron.some((c) => c.command.indexOf("hello.sh") !== -1 && c.schedule === "0 2 * * *"));
}

/* -------------------- extended tooling (new in v2) -------------------- */
group("Extended tooling");
{
  const { m, run } = fresh();
  run("sudo systemctl start postgresql");
  check("postgresql starts and listens on 5432", m.services.postgresql.active && m.network.listeners.some((l) => l.local.endsWith(":5432")));
  let r = run('sudo -u postgres psql -c "CREATE DATABASE appdb"');
  check("psql creates a database", m.postgres.databases.indexOf("appdb") !== -1, JSON.stringify(r.output));
  r = run("sudo -u postgres pg_dump appdb");
  check("pg_dump produces a dump", /database dump/.test(r.output));
  run("restic init --repo /backups/restic");
  run("restic -r /backups/restic backup /etc");
  check("restic repo + snapshot", m.backups.resticRepos.indexOf("/backups/restic") !== -1 && m.backups.resticSnapshots.length > 0);
  r = run("ansible all -m ping");
  check("ansible ping returns pong", /pong/.test(r.output));
  run("echo '---' > /tmp/site.yml && echo '- hosts: all' >> /tmp/site.yml");
  r = run("ansible-playbook /tmp/site.yml");
  check("ansible-playbook runs and records play", /PLAY RECAP/.test(r.output) && /site\.yml/.test(m.ansible.lastPlay || ""));
  run("sudo sysctl -w net.core.somaxconn=8192");
  check("sysctl -w sets a value", String(m.sysctl["net.core.somaxconn"]) === "8192");
  run("echo '0 * * * * /home/sam/deploy.sh' | crontab -");
  check("crontab installs a job", m.cron.some((c) => /deploy\.sh/.test(c.command) && c.schedule === "0 * * * *"));
  run("echo '/home/sam/deploy.sh' | at 02:00");
  check("at schedules a one-off job", m.at.some((j) => /deploy\.sh/.test(j.command)));
  r = run("ab -n 100 -c 10 http://localhost/");
  check("ab reports requests per second", /Requests per second/.test(r.output));
  r = run("hey -n 100 -c 10 http://localhost/");
  check("hey reports Requests/sec", /Requests\/sec/.test(r.output));
  r = run("nmap -p 22,80 localhost");
  check("nmap reports open ports", /open/.test(r.output));
  r = run("mtr -rwc 5 web1");
  check("mtr produces a report", /Loss%/.test(r.output));
  r = run("sudo tcpdump -i eth0 -n port 80 -c 5");
  check("tcpdump captures packets", /packets captured/.test(r.output));
  r = run("sudo fail2ban-client status sshd");
  check("fail2ban reports banned IPs", /Currently banned/.test(r.output));
  r = run("sudo smartctl -a /dev/sda");
  check("smartctl reports health", /SMART overall-health/.test(r.output));
  run("sudo apt install -y caddy");
  r = run("caddy version");
  check("caddy installs and reports version", m.apt.installed.indexOf("caddy") !== -1 && /v2\./.test(r.output));
  r = run('curl -s -o /dev/null -w "%{http_code}" http://localhost/');
  check("curl -w emits the status code", r.output.trim() === "200", JSON.stringify(r.output));
}

/* -------------------- curriculum integrity -------------------- */
group("Curriculum integrity");
{
  require(path.join(__dirname, "..", "public", "js", "curriculum.js"));
  // NOTE (Part 1): curriculum-extra.js is ARCHIVED — 91 deepening + 72 review
  // lessons hidden from UI, file kept on disk. Integrity checks cover Learn path only.
  require(path.join(__dirname, "..", "public", "js", "drillbank.js"));
  const curr = global.CURRICULUM;
  check("30 learn modules (extra archived)", curr.length === 30, "got " + curr.length);
  let lessons = 0, hours = 0;
  curr.forEach((mod) => {
    hours += mod.hours;
    lessons += mod.lessons.length;
    mod.lessons.forEach((l) => {
      if (!l.task || typeof l.task.check !== "function") { failed++; failures.push("lesson missing task check: " + l.id); }
      if (!l.task.prompt || !l.task.hint || !l.task.solution) { failed++; failures.push("lesson missing task fields: " + l.id); }
    });
  });
  check("total hours >= 60", hours >= 60, "got " + hours);
  check("118 learn lessons (3-4 per chapter)", lessons === 118, "got " + lessons);
  let allIds = new Set();
  let dup = false;
  curr.forEach((mod) => mod.lessons.forEach((l) => { if (allIds.has(l.id)) dup = true; allIds.add(l.id); }));
  check("lesson ids unique", !dup);
  // 4-Act structure (Part 1): every module in exactly one Act
  const acts = global.ACTS || [];
  check("4 acts defined", acts.length === 4, "got " + acts.length);
  const actIds = [];
  acts.forEach((a) => actIds.push.apply(actIds, a.modules));
  check("acts cover all 30 modules exactly once",
    actIds.length === 30 && curr.every((m) => actIds.indexOf(m.id) !== -1),
    "act modules: " + actIds.length);
  // Act 2 starts with bootstrap (M17/M18 before M09)
  const act2 = acts[1] || { modules: [] };
  check("act2 leads with M17 bootstrap", act2.modules[0] === "m17" && act2.modules[1] === "m18",
    "got " + act2.modules.slice(0, 3).join(","));
  // Drill Bank (Part 4): 4 bosses x 4 fights, ids namespaced bN-lM
  const drill = global.DRILLBANK || [];
  check("4 boss fights", drill.length === 4, "got " + drill.length);
  let fights = 0;
  drill.forEach((b) => {
    fights += b.lessons.length;
    if (!b.actId || !acts.some((a) => a.id === b.actId)) { failed++; failures.push("boss missing valid actId: " + b.id); }
    b.lessons.forEach((l) => {
      if (!/^b[1-4]-l[1-4]$/.test(l.id)) { failed++; failures.push("bad drill id: " + l.id); }
      if (allIds.has(l.id)) { failed++; failures.push("drill id collides with learn: " + l.id); }
      allIds.add(l.id);
      if (!l.task || typeof l.task.check !== "function") { failed++; failures.push("drill missing task check: " + l.id); }
      if (!l.task.prompt || !l.task.hint || !l.task.solution) { failed++; failures.push("drill missing task fields: " + l.id); }
      if (!l.examples || l.examples.length < 1) { failed++; failures.push("drill missing examples: " + l.id); }
    });
  });
  check("16 drill fights (4 per boss)", fights === 16, "got " + fights);
}

/* -------------------- solution walkthrough (end-to-end) -------------------- */
group("Solution walkthrough (each lesson solution passes its own check)");
{
  const curr = global.CURRICULUM;
  const m = Machine.createMachine();
  const sh = new Shell(m);
  const helperH = { ok: true };
  let solved = 0, broke = [];
  curr.forEach((mod) => {
    mod.lessons.forEach((lesson) => {
      const sol = lesson.task.solution;
      const res = sh.exec(sol);
      const env = { fs: m.fs, m: m, cmd: sol, result: res, history: m.history };
      let r;
      try { r = lesson.task.check(env); } catch (e) { r = { ok: false, reason: "check threw: " + e.message }; }
      if (r === true || (r && r.ok)) solved++;
      else broke.push(lesson.id + " [" + lesson.title + "] -> " + ((r && r.reason) || "failed") + "  (solution: " + sol.split("\n")[0].slice(0, 70) + ")");
    });
  });
  check("all lesson solutions satisfy their checks", broke.length === 0, broke.join(" | "));
  if (broke.length) broke.forEach((b) => failures.push("walkthrough: " + b));
  console.log("  (" + solved + " lessons auto-solved)");
  // Drill Bank walkthrough: bosses run on the post-Learn machine (same order a
  // graduate meets them) — every fight solution must satisfy its own check.
  let dsolved = 0;
  const dbroke = [];
  const drill = global.DRILLBANK || [];
  drill.forEach((boss) => {
    boss.lessons.forEach((lesson) => {
      const sol = lesson.task.solution;
      const res = sh.exec(sol);
      const env = { fs: m.fs, m: m, cmd: sol, result: res, history: m.history };
      let r;
      try { r = lesson.task.check(env); } catch (e) { r = { ok: false, reason: "check threw: " + e.message }; }
      if (r === true || (r && r.ok)) { solved++; dsolved++; }
      else dbroke.push(lesson.id + " [" + lesson.title + "] -> " + ((r && r.reason) || "failed") + "  (solution: " + sol.split("\n")[0].slice(0, 70) + ")");
    });
  });
  check("all drill solutions satisfy their checks", dbroke.length === 0, dbroke.join(" | "));
  if (dbroke.length) dbroke.forEach((b) => failures.push("drill walkthrough: " + b));
  console.log("  (" + dsolved + " drill fights auto-solved)");
}

/* -------------------- v2 shell wiring (Total cmds + resets + header) -------------------- */
group("v2 shell wiring");
{
  const fs = require("fs");
  const appSrc = fs.readFileSync(path.join(__dirname, "..", "public", "js", "app.js"), "utf8");
  const markupSrc = fs.readFileSync(path.join(__dirname, "..", "lib", "markup.ts"), "utf8");
  check("odometer increments on every Enter", /state\.progress\.totalCommands\s*=\s*\(state\.progress\.totalCommands\s*\|\|\s*0\)\s*\+\s*1/.test(appSrc));
  check("odometer rendered to #stat-cmds", /getElementById\("stat-cmds"\)/.test(appSrc));
  check("header has Total cmds stat", /id="stat-cmds"/.test(markupSrc));
  check("Reset progress keeps Total cmds", /var keep = state\.progress\.totalCommands/.test(appSrc));
  check("Reset machine factory-clears all (RESET confirm)", /resetMachineFactory/.test(appSrc) && /Type RESET/.test(appSrc));
  check("store key is v2 with v1 migration", /linuxmastery\.progress\.v2/.test(appSrc) && /STORE_KEY_V1/.test(appSrc));
  check("search Esc-clear wired", /lesson-search/.test(appSrc) && /renderModules\(""\)/.test(appSrc));
}

/* -------------------- summary -------------------- */
process.stdout.write("\n\n");
if (failed === 0) {
  console.log("ALL TESTS PASSED  (" + passed + " checks)");
  process.exit(0);
} else {
  console.log("TEST FAILURES: " + failed + " of " + (passed + failed));
  failures.forEach((f) => console.log("  ✗ " + f));
  process.exit(1);
}
