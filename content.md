# content.md — Linux Mastery: 30 Modules in 4 Acts + Drill Bank, Real Ubuntu Commands Only

> High-level content spec. 30 modules / 118 tasks (~80h) in 4 completable Acts, plus a
> Drill Bank of 4 boss fights x 4 (16 reps) using only already-taught commands.
> `curriculum-extra.js` (91 deepening + 72 review lessons) is archived, not loaded.
> No code in this file — content only.
> Rule: every `cmd` / `solution` below must run identically on real Ubuntu 22.04/24.04
> and in the simulator. If a flag does not exist in `man <cmd>` on Ubuntu, it is forbidden here.

## How to read this doc

Each chapter has:

- `Goal` — what you can do after it on a real server.
- `Lessons[]` — each: `objective`, `key commands` (real binaries + real flags),
  `examples` (click-to-insert in UI, copy-pasteable on real Ubuntu),
  `task` (what the learner must do) + `solution` (canonical real command) + `verify`
  (real Ubuntu command to prove it worked).

UI mapping (unchanged): chapters left · terminal center · instruction/examples/task right.
Task grading in the simulator checks the same state a real `verify` command would show.

## Real-command fidelity rules (normative)

1. Only real Ubuntu binaries: `find awk grep sed jq cut sort uniq tr column paste ip ss ping dig curl ufw nft tcpdump nmap nc mtr nginx systemctl journalctl ls chmod chown id useradd usermod sudo ps kill pkill jobs nice renice df du lsblk mount tar apt dpkg ssh ssh-keygen scp sshd crontab strace lsof docker git hostnamectl timedatectl psql pg_dump caddy smartctl mpstat sar ab hey sysbench fio perf ansible make rsync restic rclone haproxy vault auditctl trivy promtool amtool` etc.
2. Only real flags as documented in Ubuntu man pages. Examples: `ss -tlnp`, `ip addr`, `ip route`, `df -h`, `du -sh`, `chmod 640`, `tar czf`, `apt update`, `systemctl status`, `journalctl -u`, `curl -fsS`, `grep -i`, `sed -i 's/a/b/'`, `awk '{print $1}'`.
3. No invented subcommands. If simulator needs a stub (e.g. `trivy image`), stdout format must match the real tool's `--help` / first lines.
4. Every solution must be idempotent-safe to re-run and must include `sudo` exactly where real Ubuntu requires root (`/etc/`, `useradd`, `ufw`, `systemctl`, `mount`, `apt`).
5. Paths are real FHS paths: `/etc/ssh/sshd_config`, `/etc/nginx/sites-available/default`, `/var/log/auth.log`, `/var/log/nginx/access.log`, `/home/sam` (`~`).

## Chapter overview (30 modules · 118 tasks · ~80h + Drill Bank 16)

UI order follows Acts (M17/M18 before M09). IDs frozen (gaps where trimmed).

| Act | ID | Chapter | N | Hours |
|---|---|---|---|---|
| 1 Survive | m01 | Foundations: Fluency Drill | 4 | 2 |
| 1 Survive | m02 | Data Wrangling & System Introspection | 4 | 3 |
| 1 Survive | m03 | Viewing & Text Processing | 4 | 3 |
| 1 Survive | m04 | Permissions & Ownership | 4 | 3 |
| 1 Survive | m05 | Users & Groups | 4 | 2.5 |
| 1 Survive | m06 | Processes & Jobs | 4 | 3 |
| 1 Survive | m07 | Services & systemd | 4 | 2.5 |
| 1 Survive | m08 | Filesystems & Storage | 4 | 3 |
| 2 Operate | m17 | Server Bootstrap: Day-0 Checklist | 4 | 2 |
| 2 Operate | m18 | Ubuntu Server Essentials & Packages | 4 | 2 |
| 2 Operate | m09 | Networking | 4 | 3 |
| 2 Operate | m10 | Logs & Monitoring | 4 | 2.5 |
| 2 Operate | m11 | SSH & Remote Access | 4 | 3 |
| 2 Operate | m12 | Shell Scripting & Cron | 4 | 3 |
| 2 Operate | m13 | Debugging & Troubleshooting | 4 | 2.5 |
| 3 Ship | m14 | Docker & Containers | 4 | 3 |
| 3 Ship | m15 | Web Stack: Build & Deploy | 4 | 3 |
| 3 Ship | m16 | Capstone: Deploy a Full App | 2 | 1.5 |
| 3 Ship | m19 | PostgreSQL in Production | 4 | 2.5 |
| 3 Ship | m20 | Caddy & Modern Web Serving | 4 | 2.5 |
| 4 Production | m21 | Monitoring & Observability | 4 | 2 |
| 4 Production | m22 | Performance & Load Testing | 4 | 2.5 |
| 4 Production | m23 | Automation & Infrastructure as Code | 4 | 2.5 |
| 4 Production | m24 | Backups, Restore & Disaster Recovery | 4 | 2.5 |
| 4 Production | m25 | Robust Networking, Diagnostics & Load Balancing | 4 | 2.5 |
| 4 Production | m26 | Production Incident Response | 4 | 4 |
| 4 Production | m27 | Zero-Downtime Deploys & CI/CD | 4 | 3.5 |
| 4 Production | m28 | Secrets Management & Security Hardening | 4 | 3 |
| 4 Production | m29 | Observability & Alerting | 4 | 2.5 |
| 4 Production | m30 | Capacity Planning & Performance Tuning | 4 | 3 |
| 🥋 Drill | b1 | Boss 1 · Log Ambush (after Act 1) | 4 | 1 |
| 🥋 Drill | b2 | Boss 2 · Dark Server (after Act 2) | 4 | 1 |
| 🥋 Drill | b3 | Boss 3 · Ship It Live (after Act 3) | 4 | 1 |
| 🥋 Drill | b4 | Boss 4 · 2AM Meltdown (after Act 4) | 4 | 1 |

Total: 118 Learn (137 carried − 19 trimmed, IDs frozen) + 16 drill (`b1-l1…b4-l4`).
19 trimmed as duplicates-or-niche: M17-l2,l6 · M18-l4 · M14-l1 · M15-l4 · M19-l5 ·
M21-l2,l4 · M22-l1 · M23-l3,l5,l7 · M24-l2,l6 · M25-l1,l2 · M28-l5 · M29-l4 · M30-l2.

---

## Ch 1 — m01 Foundations: Fluency Drill (2h, 4 lessons)

Goal: drill the find/pipe/ownership/port skills every later chapter assumes.

### m01-l1 Inventory the filesystem with find
- Objective: locate files by name/type/size.
- Key: `find /var/log -type f -name '*.log'`, `find /etc -type f -size +10k`, `find ... -mtime -1`
- Examples: `find /var/log -type f -name '*.log'` · `find /etc -type f -size +10k`
- Task: list every `*.log` under `/var/log` into `~/logs.txt`
- Solution: `find /var/log -type f -name '*.log' > ~/logs.txt`
- Verify (real): `cat ~/logs.txt`

### m01-l2 Log forensics: top talkers
- Objective: rank client IPs from access log.
- Key: `awk '{print $1}'`, `sort`, `uniq -c`, `sort -rn`
- Examples: `awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn` · `awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c`
- Task: ranked IP counts → `~/top-ips.txt`
- Solution: `awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn > ~/top-ips.txt`
- Verify: `head ~/top-ips.txt`

### m01-l3 Ownership and symlink hygiene
- Objective: least-privilege dir + atomic release symlink.
- Key: `sudo mkdir -p`, `sudo chown deploy:deploy`, `sudo chmod 750`, `sudo ln -sfn`
- Task: `/srv/app/run` owned `deploy:deploy` mode `750`, link `/srv/app/current -> /srv/app/run`
- Solution: `sudo mkdir -p /srv/app/run && sudo chown deploy:deploy /srv/app/run && sudo chmod 750 /srv/app/run && sudo ln -sfn /srv/app/run /srv/app/current`
- Verify: `ls -l /srv/app/ && stat -c '%U:%G %a' /srv/app/run`

### m01-l4 Triage a runaway process and its port
- Objective: port → process → signal.
- Key: `ss -tlpn`, `lsof -i :8000`, `pkill -f manage.py`
- Task: confirm listener on 8000, terminate `manage.py`
- Solution: `ss -tlpn | grep 8000 ; pkill -f manage.py`
- Verify: `ss -tlnp | grep 8000 || echo CLOSED`
## Ch 2 — m02 Data Wrangling & System Introspection (3h, 4 lessons)

Goal: query JSON, aggregate logs, edit config safely, prove diffs.

### m02-l1 Parse app config with jq
- Key: `jq '.'`, `jq '.database.host'`, `jq -r`, `jq '.features[]'`
- Examples: `jq '.database.host' /srv/app/config.json` · `jq '.features[]' /srv/app/config.json`
- Task: print DB host from `/srv/app/config.json`
- Solution: `jq '.database.host' /srv/app/config.json`
- Verify: same command shows `"db1.internal"`

### m02-l2 Aggregate logs with awk
- Key: `awk '{print $9}'`, `sort | uniq -c`, `awk '$9==404'`
- Task: status-code frequency table
- Solution: `awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c`
- Verify: output contains `200` and `404` rows

### m02-l3 Config surgery with sed -i
- Key: `sudo sed -i 's/^X11Forwarding no/X11Forwarding yes/' /etc/ssh/sshd_config`, `grep`
- Task: flip `X11Forwarding no → yes`
- Solution: `sudo sed -i 's/^X11Forwarding no/X11Forwarding yes/' /etc/ssh/sshd_config`
- Verify: `grep X11Forwarding /etc/ssh/sshd_config`

### m02-l4 Diff discipline before deploy
- Key: `cp`, `diff -u`, `> ~/nginx.diff`
- Task: copy default site to `/tmp/default.new`, change `listen 80 → 8080`, save diff to `~/nginx.diff`
- Solution: `sudo cp /etc/nginx/sites-available/default /tmp/default.new && sudo sed -i 's/listen 80/listen 8080/' /tmp/default.new && diff /etc/nginx/sites-available/default /tmp/default.new > ~/nginx.diff`
- Verify: `cat ~/nginx.diff`
## Ch 3 — m03 Viewing & Text Processing (3h, 4 lessons)

Goal: pipes, grep, cut/sort, sed/awk — the daily text toolkit.

- m03-l1 Pipes and redirection — `echo 'Linux rocks' > ~/motto.txt` — verify `cat ~/motto.txt`
- m03-l2 Searching with grep — `grep -i ubuntu /etc/os-release` — verify exit `0`
- m03-l3 Cutting, sorting, counting — `cut -d: -f1 /etc/passwd | sort | uniq -c | sort -rn` — verify `cut -d: -f1 /etc/passwd | head`
- m03-l4 Transforming with sed and awk — `sed 's/ubuntu/server/g' /etc/hostname` + `awk -F: '{print $1}' /etc/passwd` — verify outputs
## Ch 4 — m04 Permissions & Ownership (3h, 4 lessons)

Goal: read `rwx`, chmod octal/symbolic, chown, umask/sticky.

- m04-l1 Reading permissions — `ls -l /etc/passwd` — verify `stat -c %a /etc/passwd`
- m04-l2 chmod octal — `chmod 640 ~/notes` — verify `stat -c %a ~/notes`
- m04-l3 symbols/chown — `chmod u+x ~/notes`, `sudo chown sam:sam ~/notes`, `sudo chgrp sam ~/notes`
- m04-l4 umask/sticky — `mkdir -p ~/shared && chmod 1777 ~/shared && umask 027` — verify `stat -c %a ~/shared`
## Ch 5 — m05 Users & Groups (2.5h, 4 lessons)

- m05-l1 Who am I — `id`, `groups`, `who` — verify `id`
- m05-l2 Creating users — `sudo useradd -m -s /bin/bash charlie` — verify `id charlie`
- m05-l3 Groups and sudo — `sudo usermod -aG sudo charlie` — verify `groups charlie`
- m05-l4 su and sudo — `sudo -u charlie whoami`, `sudo whoami` — verify outputs
## Ch 6 — m06 Processes & Jobs (3h, 4 lessons)

- m06-l1 ps and top — `ps aux | head`, `top -b -n1 | head` — verify `ps aux`
- m06-l2 Signals — `pkill -f manage.py`, `kill PID`, `kill -9 PID`
- m06-l3 Jobs/background — `sleep 60 &`, `jobs`, `nohup sleep 120 &`
- m06-l4 Priority — `nice -n 19 sleep 120 &`, `renice -n 10 -p PID`, `ps -o pid,ni,cmd`
## Ch 7 — m07 Services & systemd (2.5h, 4 lessons)

- m07-l1 status/start/stop — `systemctl status nginx --no-pager`, `sudo systemctl start nginx`
- m07-l2 enable/disable — `sudo systemctl enable nginx`, `systemctl is-enabled nginx`
- m07-l3 journalctl — `journalctl -u nginx -n 20 --no-pager`
- m07-l4 Own unit — write `/etc/systemd/system/app.service`, `sudo systemctl daemon-reload && sudo systemctl start app`, verify `systemctl is-active app`
## Ch 8 — m08 Filesystems & Storage (3h, 4 lessons)

- m08-l1 Space — `df -h`, `du -sh /var/log/* | sort -rh | head`
- m08-l2 Devices/mounts — `lsblk -f`, `mount | grep ' / '`, `findmnt`
- m08-l3 fstab — `cat /etc/fstab`, `findmnt --verify`
- m08-l4 tar — `tar czf ~/etc-backup.tar.gz /etc`, `tar tzf ~/etc-backup.tar.gz | head`
## Ch 9 — m09 Networking (3h, 4 lessons)

Goal: view interfaces/routes/DNS, test connectivity, inspect ports, fetch HTTP + firewall.

- m09-l1 Interfaces and routes — `ip addr`, `ip route`, `ip -brief addr`
- m09-l2 Connectivity and DNS — `ping -c 4 web1`, `dig +short web1`, `getent hosts web1`
- m09-l3 Ports and sockets — `ss -tlnp`, `ss -tulpn`
- m09-l4 HTTP + firewall — `curl -sI http://localhost/`, `sudo ufw allow 443/tcp && sudo ufw enable`, `sudo ufw status`
- Solutions: `ip a` · `ping -c 4 web1` · `ss -tlpn` · `sudo ufw allow 443/tcp && sudo ufw enable`
## Ch 10 — m10 Logs & Monitoring (2.5h, 4 lessons)

- m10-l1 Where logs live — `sudo tail -n 20 /var/log/auth.log`, `ls -lh /var/log/`
- m10-l2 Following live — `tail -F /var/log/syslog`, `journalctl -f`
- m10-l3 Hunting — `grep -c 'Failed password' /var/log/auth.log`, `grep -i error /var/log/syslog | tail`
- m10-l4 Resources — `free -h`, `uptime`, `top -b -n1 | head`
## Ch 11 — m11 SSH & Remote Access (3h, 4 lessons)

- m11-l1 Connecting — `ssh web1 uptime`
- m11-l2 Keys — `ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N ''`, `cat ~/.ssh/id_ed25519.pub`
- m11-l3 Config + copy — `~/.ssh/config` Host block, `scp ~/etc-backup.tar.gz web1:/tmp/`, `scp -r`
- m11-l4 Hardening — `sudo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config && sudo sshd -t`, verify `sudo sshd -T | grep passwordauthentication`
## Ch 12 — m12 Shell Scripting & Cron (3h, 4 lessons)

- m12-l1 First script — `printf '#!/bin/bash\necho Hello Linux\n' > ~/hello.sh && chmod +x ~/hello.sh && ~/hello.sh`
- m12-l2 Conditionals — `if [ -f /etc/passwd ]; then echo exists; fi`, `echo $?`
- m12-l3 Loops/args — `for i in 1 2 3; do echo $i; done`, `for f in "$@"`
- m12-l4 Cron — `echo '0 2 * * * /home/sam/hello.sh' | crontab -`, `crontab -l`
## Ch 13 — m13 Debugging & Troubleshooting (2.5h, 4 lessons)

- m13-l1 Exit codes — `ls /does-not-exist; echo $?`, `command -v foo || echo MISSING`
- m13-l2 Port conflicts — `lsof -i :8000`, `ss -tlnp | grep 8000`, `fuser 8000/tcp`
- m13-l3 strace — `strace -e openat ls /etc 2>&1 | head`, `strace -c ls`
- m13-l4 Service won't start — `sudo journalctl -u app -n 20 --no-pager; sudo systemctl start app; systemctl is-active app`
## Ch 14 — m14 Docker & Containers (3h, 4 lessons)

- m14-l2 Running — `docker run -d --name web -p 8080:80 nginx`, verify `docker ps | grep web`
- m14-l3 Exec/logs — `docker exec web nginx -t`, `docker logs web --tail 5`, `docker rm -f`
- m14-l4 Build image — `Dockerfile` with `FROM nginx`, `docker build -t lab-web .`
- m14-l5 Compose — `docker compose up -d`, `docker compose ps`, `docker compose down`
## Ch 15 — m15 Web Stack: Build & Deploy (3h, 4 lessons)

- m15-l1 nginx basics — `sudo nginx -t`, `systemctl status nginx --no-pager`
- m15-l2 Reverse proxy — `server { listen 80; location / { proxy_pass http://127.0.0.1:8000; } }` in `/etc/nginx/sites-available/app` + `ln -s` to `sites-enabled` + `sudo nginx -t`
- m15-l3 systemd app — `sudo systemctl daemon-reload && sudo systemctl enable --now app`
- m15-l5 git deploy — `sudo git clone https://github.com/example/app.git /srv/app`, `sudo git -C /srv/app pull`
## Ch 16 — m16 Capstone: Deploy a Full App (1.5h, 2 lessons)

- m16-l1 Build+run — `docker build -t lab-web ~/projects/web && docker run -d --name web -p 8080:80 lab-web`
- m16-l2 Verify+document — `curl -fsS http://localhost:8080/`, `sudo nginx -t`, `echo '# Runbook' > ~/RUNBOOK.md`
## Ch 17 — m17 Server Bootstrap: Day-0 Checklist (2h, 4 lessons)

Real order used by every ops team on a fresh Ubuntu box (day-0 spine):

1. m17-l1 `sudo apt update && sudo apt upgrade -y`
2. m17-l3 `sudo useradd -m -s /bin/bash ops && sudo usermod -aG sudo ops && id ops`
3. m17-l4 Harden SSH: `PermitRootLogin no`, `PasswordAuthentication no`, `sudo sshd -t`
4. m17-l5 `sudo ufw allow OpenSSH && sudo ufw --force enable && sudo ufw status`
## Ch 18 — m18 Ubuntu Server Essentials & Packages (2h, 4 lessons)

- m18-l1 Toolbox — `sudo apt update && sudo apt install -y htop tmux vim jq tree rsync`
- m18-l2 dpkg query — `dpkg -l | grep -i nginx`, `dpkg -S /usr/bin/nginx`
- m18-l3 APT depth — `apt list --installed`, `apt show nginx`, `apt-cache policy nginx`
- m18-l5 Service install — `sudo apt install -y fail2ban && sudo systemctl enable --now fail2ban`
## Ch 19 — m19 PostgreSQL in Production (2.5h, 4 lessons)

- m19-l1 Start+connect — `sudo systemctl start postgresql && sudo -u postgres psql -c 'SELECT version();'`
- m19-l2 DB+role — `sudo -u postgres psql -c "CREATE ROLE app LOGIN PASSWORD 'secret';" -c 'CREATE DATABASE appdb OWNER app;'`
- m19-l3 Inspect — `sudo -u postgres psql -l`, `sudo -u postgres psql -c '\du'`
- m19-l4 Backup — `sudo -u postgres pg_dump appdb > /backups/appdb.sql`, `ls -lh /backups/appdb.sql`
## Ch 20 — m20 Caddy & Modern Web Serving (2.5h, 4 lessons)

- m20-l1 Install — `sudo apt install -y caddy && caddy version`
- m20-l2 Caddyfile — `app.example.com { reverse_proxy 127.0.0.1:8000 }` in `/etc/caddy/Caddyfile`
- m20-l3 Validate+run — `sudo caddy validate --config /etc/caddy/Caddyfile && sudo systemctl enable --now caddy`
- m20-l4 Reload+logs — `sudo systemctl reload caddy && journalctl -u caddy -n 20 --no-pager`
## Ch 21 — m21 Monitoring & Observability (2h, 4 lessons)

- m21-l1 Load/uptime — `uptime`, `cat /proc/loadavg`
- m21-l3 Disk/inode — `df -h`, `df -i`, `du -sh /var/* | sort -rh | head`
- m21-l5 journalctl priority — `journalctl -p err -b -n 20 --no-pager`
- m21-l6 Health endpoint — `curl -fsS http://localhost/health`, `curl -s http://localhost/metrics | head`
## Ch 22 — m22 Performance & Load Testing (2.5h, 4 lessons)

- m22-l2 hey/wrk — `hey -n 500 -c 20 http://localhost/`, `wrk -t2 -c20 -d10s http://localhost/`
- m22-l3 curl timing — `curl -s -o /dev/null -w 'total:%{time_total} connect:%{time_connect}\n' http://localhost/`
- m22-l4 Bottleneck — `mpstat 1 2`, `pidstat -u 1 2`, `top -b -n1 | head`
- m22-l5 Kernel tune — `sudo sysctl -w net.core.somaxconn=8192 && sudo sysctl -w net.ipv4.ip_forward=1`
## Ch 23 — m23 Automation & Infrastructure as Code (2.5h, 4 lessons)

- m23-l1 Robust script — `#!/bin/bash` + `set -euo pipefail`, `bash -n ~/deploy.sh`, `chmod +x`
- m23-l2 Functions/args — `greet(){ echo "hi $1"; }`, `"$@"`
- m23-l4 systemd timer — `systemctl list-timers --no-pager`, `sudo systemctl enable backup.timer`
- m23-l6 Ansible — `site.yml` with `- hosts: all`, `ansible-playbook --syntax-check ~/site.yml`
## Ch 24 — m24 Backups, Restore & Disaster Recovery (2.5h, 4 lessons)

- m24-l1 rsync 3-2-1 — `sudo mkdir -p /backups/home && sudo rsync -av /home/sam/ /backups/home/`
- m24-l3 restic — `restic init --repo /backups/restic`, `restic -r /backups/restic backup /etc`
- m24-l4 Restore test — `restic -r /backups/restic snapshots`, `restic -r /backups/restic restore latest --target /tmp/restore-test`
- m24-l5 rclone offsite — `rclone copy /backups offsite:backups --dry-run`, `rclone lsd offsite:`
## Ch 25 — m25 Robust Networking, Diagnostics & Load Balancing (2.5h, 4 lessons)

- m25-l3 tcpdump — `sudo tcpdump -i eth0 -n port 80 -c 5`, `sudo tcpdump -i any -c 3`
- m25-l4 Scan/test — `nmap -p 22,80,443 localhost`, `nc -zv localhost 80`
- m25-l5 mtr — `mtr -rwc 5 web1 | tee ~/mtr.txt`
- m25-l6 nginx upstream — `upstream app { server 127.0.0.1:8000; server 127.0.0.1:8001; }` + `sudo nginx -t`
## Ch 26 — m26 Production Incident Response (4h, 4 lessons)

Playbook per incident: observe → hypothesize → fix → verify.

- m26-l1 502 — `sudo tail -n 20 /var/log/nginx/error.log`, `sudo systemctl restart app`, `curl -fsS http://localhost/health`
- m26-l2 Disk pressure — `df -h /`, `du -sh /var/log/* | sort -rh | head`, `sudo truncate -s 0 /var/log/syslog`, `sudo logrotate -f /etc/logrotate.conf`
- m26-l3 CPU — `top -b -n1 | head -n 20`, `ps aux --sort=-%cpu | head`, `pkill -f manage.py`
- m26-l4 OOM — `dmesg | grep -i -m2 'out of memory'`, `sudo sysctl -w vm.swappiness=10`, `free -h`
## Ch 27 — m27 Zero-Downtime Deploys & CI/CD (3.5h, 4 lessons)

- m27-l1 Blue-green — swap `proxy_pass 8000 → 8001` in nginx site, `sudo nginx -t && sudo systemctl reload nginx`
- m27-l2 Health-gated — `curl -fsS http://127.0.0.1:8001/health && sudo systemctl reload nginx && echo DEPLOY_OK > ~/deploy-status.txt`
- m27-l3 Compose rollout — `docker compose -f ~/projects/web/compose.yaml up -d --build && docker compose ps`
- m27-l4 CI trigger — `gh workflow run deploy.yml && gh run list --limit 3`
## Ch 28 — m28 Secrets Management & Security Hardening (3h, 4 lessons)

- m28-l1 Hunt secrets — `grep -rniE 'password|secret|AKIA' /srv/app 2>/dev/null | tee ~/leaks.txt`
- m28-l2 Vault — `vault kv put secret/app db_password='s3cr3t-rotated'`, `vault kv get secret/app`
- m28-l3 Least privilege — `sudo chown root:root /srv/app/.env && sudo chmod 600 /srv/app/.env && ls -l /srv/app/.env`
- m28-l4 auditd — `sudo auditctl -w /etc/passwd -p wa -k identity && sudo auditctl -l | grep identity`
## Ch 29 — m29 Observability & Alerting (2.5h, 4 lessons)

- m29-l1 node_exporter — `sudo systemctl enable --now node_exporter`, `curl -s http://localhost:9100/metrics | head`
- m29-l2 Prometheus scrape — `scrape_configs: [{job_name: node, static_configs: [{targets: ["localhost:9100"]}]}]` in `~/prometheus.yml`, `promtool check config`
- m29-l3 Alert rules — `groups: [{name: host, rules: [{alert: HighLoad, expr: node_load1 > 4}]}]` in `~/alerts.yml`, `promtool check rules`
- m29-l5 Alertmanager — `route: {receiver: default}` in `~/alertmanager.yml`, `amtool check-config`
## Ch 30 — m30 Capacity Planning & Performance Tuning (3h, 4 lessons)

- m30-l1 Baseline/headroom — `ab -n 2000 -c 50 http://localhost/ | tee ~/baseline.txt`, `mpstat 1 2`
- m30-l3 fio/sysbench — `fio --name=seqread --rw=read --size=64M --bs=4k --numjobs=1`, `sysbench cpu run`
- m30-l4 Limits — `sudo sysctl -w net.core.somaxconn=16384`, `* soft nofile 65535` in `/etc/security/limits.conf`, `ulimit -n`
- m30-l5 Capacity plan — `printf '## Capacity Plan\nTarget: 70%% CPU at p95, 2x headroom\n' | sudo tee /srv/capacity.md`

---

---

## Review r01 — Find, Inspect, Transform (2h, 8 lessons)

Combination of m01–m03: every task uses only commands taught in those chapters.

- r01-l1 Failed logins across logs — `mkdir -p ~/reviews && grep -h 'Failed' /var/log/*.log > ~/reviews/r01-failed.txt`
- r01-l2 Who is probing 404s? — `awk '$9==404 {print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn > ~/reviews/r01-probers.txt`
- r01-l3 Scrub then diff — `sed 's/203\\.0\\.113\\.9/ATTACKER/g' /var/log/nginx/access.log > /tmp/r01-scrubbed.log; diff /var/log/nginx/access.log /tmp/r01-scrubbed.log > ~/reviews/r01-scrub.diff`
- r01-l4 Config facts to file — `jq -r '.database.host, .database.port' /srv/app/config.json > ~/reviews/r01-db.txt`
- r01-l5 Size up /etc with find + xargs — `find /etc -maxdepth 1 -type f -mtime -60 | xargs wc -l > ~/reviews/r01-etc-sizes.txt`
- r01-l6 Rank login shells — `cut -d: -f7 /etc/passwd | sort | uniq -c | sort -rn > ~/reviews/r01-shells.txt`
- r01-l7 Build a headed report — `echo '# client IPs' > ~/reviews/r01-ips.txt && cut -d' ' -f1 /var/log/nginx/access.log | sort -u >> ~/reviews/r01-ips.txt`
- r01-l8 Histogram plus total — `awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -rn > ~/reviews/r01-hist.txt && awk 'END {print NR}' /var/log/nginx/access.log >> ~/reviews/r01-hist.txt`

## Boss B1 — Log Ambush (1h, 4 fights, after Act 1)

Combination of Act 1 skills. Evidence lands in `~/drill/`.

- b1-l1 Rank the 404 probers — `awk '$9==404 {print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn > ~/drill/b1-probers.txt`
- b1-l2 Scrub the log, prove the diff — `sed 's/203\\.0\\.113\\.9/ATTACKER/g' /var/log/nginx/access.log > /tmp/b1-scrubbed.log; diff /var/log/nginx/access.log /tmp/b1-scrubbed.log > ~/drill/b1-scrub.diff`
- b1-l3 Lock down the evidence locker — `mkdir -p ~/drill/locker && chmod 700 ~/drill/locker`
- b1-l4 Kill the runaway — `ss -tlnp | grep 8000 ; pkill -f manage.py`

## Boss B2 — Dark Server (1h, 4 fights, after Act 2)

Combination of Act 2 skills.

- b2-l1 Firewall intent vs listener truth — `sudo ufw status > ~/drill/b2-fw.txt && ss -tlnp >> ~/drill/b2-fw.txt`
- b2-l2 Prove ssh three ways — `systemctl is-active ssh && ss -tlnp | grep ':22' && journalctl -u ssh -n 3 --no-pager > ~/drill/b2-ssh-chain.txt`
- b2-l3 Ship a script, gate the result — `scp ~/hello.sh web1:/tmp/ && ssh web1 true && echo REMOTE-OK > ~/drill/b2-remote-ok.txt || echo REMOTE-FAIL > ~/drill/b2-remote-ok.txt`
- b2-l4 Port 80: two witnesses — `ss -tlnp | grep ':80' > ~/drill/b2-port80.txt; lsof -i :80 >> ~/drill/b2-port80.txt`

## Boss B3 — Ship It Live (1h, 4 fights, after Act 3)

Combination of Act 3 skills.

- b3-l1 Throwaway web, clean dock — `docker run -d --name rev-nginx -p 8081:80 nginx && curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8081/ > ~/drill/b3-revcode.txt && docker stop rev-nginx && docker rm rev-nginx`
- b3-l2 Where does nginx point? — `grep -h proxy_pass /etc/nginx/sites-enabled/* > ~/drill/b3-proxy.txt`
- b3-l3 Database parade + readiness — `sudo -u postgres psql -l > ~/drill/b3-dbs.txt && grep appdb ~/drill/b3-dbs.txt && pg_isready -h localhost -p 5432`
- b3-l4 Caddy active and valid — `systemctl is-active caddy && sudo caddy validate --config /etc/caddy/Caddyfile > ~/drill/b3-caddy.txt`

## Boss B4 — 2AM Meltdown (1h, 4 fights, after Act 4)

Combination of Act 4 skills. The on-call exam.

- b4-l1 Incident bundle in one file — `echo '# bundle' > ~/drill/b4-bundle.txt && uptime >> ~/drill/b4-bundle.txt && df -h / | grep sda1 >> ~/drill/b4-bundle.txt && ss -tlnp | grep -c ':80' >> ~/drill/b4-bundle.txt`
- b4-l2 502: bag evidence, restore backend — `sudo tail -n 5 /var/log/nginx/error.log && sudo systemctl restart app && ss -tlnp | grep 8000`
- b4-l3 Prove you are backed up — `restic -r /backups/restic snapshots | head -n 3 > ~/drill/b4-safety.txt && rclone lsd offsite: >> ~/drill/b4-safety.txt && ls -l /backups/appdb.sql >> ~/drill/b4-safety.txt`
- b4-l4 Secrets locked, signals valid — `vault kv get secret/app > ~/drill/b4-appsecret.txt && chmod 600 ~/drill/b4-appsecret.txt && promtool check config ~/prometheus.yml > ~/drill/b4-prom.txt 2>&1; promtool check rules ~/alerts.yml >> ~/drill/b4-prom.txt 2>&1`

---

## Command index (real Ubuntu, grouped — simulator must match)

- Files/find: `find ls stat file cat head tail cut sort uniq wc tr column paste diff tee`
- Text: `grep awk sed jq`
- Perms/users: `chmod chown chgrp umask stat id groups who useradd usermod userdel su sudo`
- Procs: `ps top pgrep pkill kill jobs nohup nice renice`
- systemd: `systemctl journalctl systemd-analyze hostnamectl timedatectl`
- Storage: `df du lsblk mount tar fallocate mkswap swapon`
- Net: `ip ss ping dig getent curl wget ufw tcpdump nmap nc mtr resolvectl`
- SSH: `ssh sshd ssh-keygen scp`
- Scripting: `bash printf test [ echo export history crontab at`
- Debug: `strace lsof dmesg`
- Docker/web: `docker nginx certbot git`
- Data: `apt dpkg psql pg_dump pg_isready caddy smartctl mpstat sar vmstat ab hey wrk curl sysctl perf fio sysbench`
- Ops: `ansible-playbook make rsync restic rclone vault auditctl trivy promtool amtool gh`

## Simulation fidelity notes

- Output text mirrors real Ubuntu (same column order for `ss -tlnp`, `ps aux`, `df -h`, `ls -l`).
- Tab-complete, `↑/↓` history, `!!`, pipes, `> >> < 2>`, `&& || ;`, `$(…)`, globs, `~` behave like bash.
- `sudo` is passwordless (lab convenience) but required exactly where real Ubuntu requires root — solutions above already place it correctly.
- Ownership behaves like real Ubuntu: your `mkdir` makes your dirs (`mkdir -p ~/a/b` works), `sudo mkdir` makes root's.
- No real network egress or real daemon is needed: `ping/dig/curl/ssh/tcpdump` return canned-but-realistic outputs matching the formats above; grading checks state (files, modes, services, ports) not string equality.

## Suggested study order (4 Acts + Drill Bank)

Act 1 (m01→m08, ~1 week): survive any box. Then Boss B1.
Act 2 (m17,m18,m09→m13, ~1 week): fresh VPS to working. Then Boss B2.
Act 3 (m14→m16,m19,m20, ~1 week): first full deploy — celebrate. Then Boss B3.
Act 4 (m21→m30, ~2 weeks): on-call ready. Then Boss B4.
Daily: 10 min in Pro Tips (`Ctrl+T`); redo any task you cannot run from memory on real Ubuntu.
