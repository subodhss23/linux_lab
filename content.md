# content.md — Linux Mastery: 39 Chapters (30 + 9 Reviews), Real Ubuntu Commands Only

> High-level content spec for the rebuild of https://linuxlearning-sage.vercel.app/.
> Same 30 chapters as the live site, deepened to 228 lessons, plus 9 combination
> review chapters (72 lessons) — one after every 3–4 chapters, using only commands
> from the chapters it reviews. 300 lessons total. No code in this file — content only.
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

## Chapter overview (39 chapters, 300 lessons, ~117h)

| # | ID | Chapter (from live site) | Lessons | Hours | Level |
|---|---|---|---|---|---|
| 1 | m01 | Foundations: Fluency Drill | 6 | 2.5 | Intermediate |
| 2 | m02 | Data Wrangling & System Introspection | 8 | 3.5 | Intermediate |
| 3 | m03 | Viewing & Text Processing | 12 | 4 | Intermediate |
| 4 | m04 | Permissions & Ownership | 8 | 3.5 | Intermediate |
| 5 | m05 | Users & Groups | 8 | 3 | Intermediate |
| 6 | m06 | Processes & Jobs | 7 | 3.5 | Intermediate |
| 7 | m07 | Services & systemd | 6 | 2.5 | Intermediate |
| 8 | m08 | Filesystems & Storage | 6 | 3 | Intermediate |
| 9 | m09 | Networking | 12 | 4.5 | Intermediate |
| 10 | m10 | Logs & Monitoring | 8 | 3 | Intermediate |
| 11 | m11 | SSH & Remote Access | 6 | 3 | Intermediate |
| 12 | m12 | Shell Scripting & Cron | 7 | 3.5 | Intermediate |
| 13 | m13 | Debugging & Troubleshooting | 6 | 2.5 | Intermediate |
| 14 | m14 | Docker & Containers | 10 | 4.5 | Intermediate |
| 15 | m15 | Web Stack: Build & Deploy | 7 | 4 | Intermediate |
| 16 | m16 | Capstone: Deploy a Full App | 3 | 2 | Intermediate |
| 17 | m17 | Server Bootstrap: Day-0 Checklist | 8 | 3.5 | Intermediate |
| 18 | m18 | Ubuntu Server Essentials & Packages | 7 | 2.5 | Intermediate |
| 19 | m19 | PostgreSQL in Production | 7 | 3 | Intermediate |
| 20 | m20 | Caddy & Modern Web Serving | 6 | 2.5 | Intermediate |
| 21 | m21 | Monitoring & Observability | 9 | 3 | Intermediate |
| 22 | m22 | Performance & Load Testing | 7 | 3 | Advanced |
| 23 | m23 | Automation & Infrastructure as Code | 9 | 3.5 | Advanced |
| 24 | m24 | Backups, Restore & Disaster Recovery | 10 | 4 | Advanced |
| 25 | m25 | Robust Networking, Diagnostics & Load Balancing | 10 | 4 | Advanced |
| 26 | m26 | Production Incident Response | 7 | 4 | Advanced |
| 27 | m27 | Zero-Downtime Deploys & CI/CD | 6 | 3.5 | Advanced |
| 28 | m28 | Secrets Management & Security Hardening | 8 | 3.5 | Advanced |
| 29 | m29 | Observability & Alerting | 7 | 3 | Advanced |
| 30 | m30 | Capacity Planning & Performance Tuning | 7 | 3.5 | Advanced |
| R1 | r01 | Review I: Find, Inspect, Transform | 8 | 2 | Intermediate |
| R2 | r02 | Review II: People, Permissions, Processes | 8 | 2 | Intermediate |
| R3 | r03 | Review III: Serve, Store, Connect, Observe | 8 | 2 | Intermediate |
| R4 | r04 | Review IV: Remote, Scripted, Debugged | 8 | 2 | Intermediate |
| R5 | r05 | Review V: Ship It and Secure the Host | 8 | 2 | Intermediate |
| R6 | r06 | Review VI: Packages, Data, Serving | 8 | 2 | Intermediate |
| R7 | r07 | Review VII: Watch It, Load It, Back It Up | 8 | 2 | Advanced |
| R8 | r08 | Review VIII: Diagnose, Survive, Ship | 8 | 2 | Advanced |
| R9 | r09 | Review IX: Secrets, Signal, Scale | 8 | 2 | Advanced |

Total: 300 lessons (137 carried + 91 deepened + 72 review). V1 IDs `m01-l1 … m30-l5` are frozen;
new IDs are `mXX-lN` continuations plus `r01-l1 … r09-l8`.

---

## Ch 1 — m01 Foundations: Fluency Drill (2.5h, 6 lessons)

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

**Added lessons (deepening):**

- m01-l5 Find by size and age — `find /var/log -type f -size +1c -mtime -30 > ~/recent-logs.txt`
- m01-l6 Batch with xargs — `find /var/log -type f -name '*.log' | xargs ls -l > ~/log-details.txt`
## Ch 2 — m02 Data Wrangling & System Introspection (3.5h, 8 lessons)

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

**Added lessons (deepening):**

- m02-l5 jq arrays and filters — `jq '.features[]' /srv/app/config.json`
- m02-l6 jq numbers and raw output — `jq -r '.database.port' /srv/app/config.json`
- m02-l7 Rank request paths with awk — `awk '{print $7}' /var/log/nginx/access.log | sort | uniq -c | sort -rn > ~/paths-ranked.txt`
- m02-l8 Unique values with sort -u and tee — `cut -d' ' -f1 /var/log/nginx/access.log | sort -u | tee ~/unique-ips.txt | wc -l`
## Ch 3 — m03 Viewing & Text Processing (4h, 12 lessons)

Goal: pipes, grep, cut/sort, sed/awk — the daily text toolkit.

- m03-l1 Pipes and redirection — `echo 'Linux rocks' > ~/motto.txt` — verify `cat ~/motto.txt`
- m03-l2 Searching with grep — `grep -i ubuntu /etc/os-release` — verify exit `0`
- m03-l3 Cutting, sorting, counting — `cut -d: -f1 /etc/passwd | sort | uniq -c | sort -rn` — verify `cut -d: -f1 /etc/passwd | head`
- m03-l4 Transforming with sed and awk — `sed 's/ubuntu/server/g' /etc/hostname` + `awk -F: '{print $1}' /etc/passwd` — verify outputs

**Added lessons (deepening):**

- m03-l5 Recursive grep — `grep -r 'SECRET' /srv/app > ~/secret-refs.txt`
- m03-l6 Extended regex with grep -E — `grep -cE '^[0-9]' /var/log/nginx/access.log`
- m03-l7 Act on finds with -exec — `find /etc -maxdepth 1 -name 'host*' -exec basename {} \\; > ~/host-files.txt`
- m03-l8 Delete lines with sed — `sed '/404/d' /var/log/nginx/access.log > ~/no-404.txt`
- m03-l9 Filter then count with awk and wc — `awk '$9==404 {print $1}' /var/log/nginx/access.log | wc -l > ~/404-count.txt`
- m03-l10 Sort by key fields — `sort -t: -k3 -n /etc/passwd | cut -d: -f1 > ~/users-by-uid.txt`
- m03-l11 Rank with uniq -c — `cut -d' ' -f9 /var/log/nginx/access.log | sort | uniq -c | sort -rn > ~/status-ranked.txt`
- m03-l12 Head, tail and word counts — `head -n 2 /var/log/nginx/access.log > ~/head2.txt && wc -l ~/head2.txt > ~/head2-wc.txt`
## Ch 4 — m04 Permissions & Ownership (3.5h, 8 lessons)

Goal: read `rwx`, chmod octal/symbolic, chown, umask/sticky.

- m04-l1 Reading permissions — `ls -l /etc/passwd` — verify `stat -c %a /etc/passwd`
- m04-l2 chmod octal — `chmod 640 ~/notes` — verify `stat -c %a ~/notes`
- m04-l3 symbols/chown — `chmod u+x ~/notes`, `sudo chown sam:sam ~/notes`, `sudo chgrp sam ~/notes`
- m04-l4 umask/sticky — `mkdir -p ~/shared && chmod 1777 ~/shared && umask 027` — verify `stat -c %a ~/shared`

**Added lessons (deepening):**

- m04-l5 Hunt risky permissions with find — `find /srv -type f -perm -o+w > ~/world-writable.txt`
- m04-l6 Files 640, dirs 750 — `mkdir -p /tmp/rev-perm/sub && touch /tmp/rev-perm/sub/a.txt && chmod 640 /tmp/rev-perm/sub/a.txt && chmod 755 /tmp/rev-perm /tmp/rev-perm/sub`
- m04-l7 Own a deploy tree with chown -R — `sudo mkdir -p /srv/rev-owned && sudo chown -R deploy:deploy /srv/rev-owned && sudo chmod 750 /srv/rev-owned`
- m04-l8 Setgid team directories — `sudo mkdir -p /srv/rev-team && sudo chgrp developers /srv/rev-team && sudo chmod 2770 /srv/rev-team`
## Ch 5 — m05 Users & Groups (3h, 8 lessons)

- m05-l1 Who am I — `id`, `groups`, `who` — verify `id`
- m05-l2 Creating users — `sudo useradd -m -s /bin/bash charlie` — verify `id charlie`
- m05-l3 Groups and sudo — `sudo usermod -aG sudo charlie` — verify `groups charlie`
- m05-l4 su and sudo — `sudo -u charlie whoami`, `sudo whoami` — verify outputs

**Added lessons (deepening):**

- m05-l5 Create groups with groupadd — `sudo groupadd revops`
- m05-l6 Create a user straight into groups — `sudo useradd -m -s /bin/bash -G revops revuser1`
- m05-l7 Inspect password aging with chage — `chage -l sam`
- m05-l8 Remove a user and group cleanly — `sudo groupadd revops2 && sudo useradd -G revops2 revtmp && sudo userdel -r revtmp && sudo groupdel revops2`
## Ch 6 — m06 Processes & Jobs (3.5h, 7 lessons)

- m06-l1 ps and top — `ps aux | head`, `top -b -n1 | head` — verify `ps aux`
- m06-l2 Signals — `pkill -f manage.py`, `kill PID`, `kill -9 PID`
- m06-l3 Jobs/background — `sleep 60 &`, `jobs`, `nohup sleep 120 &`
- m06-l4 Priority — `nice -n 19 sleep 120 &`, `renice -n 10 -p PID`, `ps -o pid,ni,cmd`

**Added lessons (deepening):**

- m06-l5 Find processes with ps and grep — `ps aux | grep [n]ginx > ~/nginx-ps.txt`
- m06-l6 Stop by pattern with pkill -f — `sleep 120 & pkill -f 'sleep 120'`
- m06-l7 Rank CPU hogs — `ps aux --sort=-%cpu | head -n 10 > ~/top-cpu.txt`
## Ch 7 — m07 Services & systemd (2.5h, 6 lessons)

- m07-l1 status/start/stop — `systemctl status nginx --no-pager`, `sudo systemctl start nginx`
- m07-l2 enable/disable — `sudo systemctl enable nginx`, `systemctl is-enabled nginx`
- m07-l3 journalctl — `journalctl -u nginx -n 20 --no-pager`
- m07-l4 Own unit — write `/etc/systemd/system/app.service`, `sudo systemctl daemon-reload && sudo systemctl start app`, verify `systemctl is-active app`

**Added lessons (deepening):**

- m07-l5 Ask is-active / is-enabled — `systemctl is-active app && systemctl is-enabled cron`
- m07-l6 Reload and restart cleanly — `sudo systemctl daemon-reload && sudo systemctl restart app && systemctl is-active app`
## Ch 8 — m08 Filesystems & Storage (3h, 6 lessons)

- m08-l1 Space — `df -h`, `du -sh /var/log/* | sort -rh | head`
- m08-l2 Devices/mounts — `lsblk -f`, `mount | grep ' / '`, `findmnt`
- m08-l3 fstab — `cat /etc/fstab`, `findmnt --verify`
- m08-l4 tar — `tar czf ~/etc-backup.tar.gz /etc`, `tar tzf ~/etc-backup.tar.gz | head`

**Added lessons (deepening):**

- m08-l5 Inodes and mount truth — `df -i / > ~/inodes.txt && mount | grep ' / ' >> ~/inodes.txt`
- m08-l6 Rank disk hogs with du — `du -sh /var/* 2>/dev/null | sort -rh | head -n 5 > ~/big-dirs.txt`
## Ch 9 — m09 Networking (4.5h, 12 lessons)

Goal: view interfaces/routes/DNS, test connectivity, inspect ports, fetch HTTP + firewall.

- m09-l1 Interfaces and routes — `ip addr`, `ip route`, `ip -brief addr`
- m09-l2 Connectivity and DNS — `ping -c 4 web1`, `dig +short web1`, `getent hosts web1`
- m09-l3 Ports and sockets — `ss -tlnp`, `ss -tulpn`
- m09-l4 HTTP + firewall — `curl -sI http://localhost/`, `sudo ufw allow 443/tcp && sudo ufw enable`, `sudo ufw status`
- Solutions: `ip a` · `ping -c 4 web1` · `ss -tlpn` · `sudo ufw allow 443/tcp && sudo ufw enable`

**Added lessons (deepening):**

- m09-l5 Name resolution: dig and host — `dig +short web1`
- m09-l6 Full interface state with ip — `ip addr | head -n 12 && ip route`
- m09-l7 Pin a name in /etc/hosts — `echo '10.20.0.50 lab-api' | sudo tee -a /etc/hosts && grep lab-api /etc/hosts`
- m09-l8 Audit listeners into a file — `ss -tlnp > ~/listeners.txt && grep ':22' ~/listeners.txt`
- m09-l9 Deny and allow with ufw — `sudo ufw deny 23/tcp && sudo ufw allow 8080/tcp && sudo ufw status`
- m09-l10 Fetch with curl and wget — `curl -sI http://localhost/ > ~/headers.txt && wget -q -O /tmp/rev-page.html http://localhost/`
- m09-l11 Ping with evidence — `ping -c 2 -W 2 web1 > ~/ping-web1.txt`
- m09-l12 Trace the path: traceroute and mtr — `mtr -rwc 2 web1 > ~/mtr-web1.txt`
## Ch 10 — m10 Logs & Monitoring (3h, 8 lessons)

- m10-l1 Where logs live — `sudo tail -n 20 /var/log/auth.log`, `ls -lh /var/log/`
- m10-l2 Following live — `tail -F /var/log/syslog`, `journalctl -f`
- m10-l3 Hunting — `grep -c 'Failed password' /var/log/auth.log`, `grep -i error /var/log/syslog | tail`
- m10-l4 Resources — `free -h`, `uptime`, `top -b -n1 | head`

**Added lessons (deepening):**

- m10-l5 Errors only with journalctl -p — `journalctl -p err -b -n 10 --no-pager > ~/err-logs.txt`
- m10-l6 Logs since a time — `journalctl --since '2026-09-10 09:00' -n 5 --no-pager > ~/since-logs.txt`
- m10-l7 Kernel ring and OOM evidence — `dmesg | grep -i 'out of memory' > ~/oom.txt`
- m10-l8 Preview rotation with logrotate -d — `sudo logrotate -d /etc/logrotate.conf > ~/rotate-debug.txt 2>&1`
## Ch 11 — m11 SSH & Remote Access (3h, 6 lessons)

- m11-l1 Connecting — `ssh web1 uptime`
- m11-l2 Keys — `ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N ''`, `cat ~/.ssh/id_ed25519.pub`
- m11-l3 Config + copy — `~/.ssh/config` Host block, `scp ~/etc-backup.tar.gz web1:/tmp/`, `scp -r`
- m11-l4 Hardening — `sudo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config && sudo sshd -t`, verify `sudo sshd -T | grep passwordauthentication`

**Added lessons (deepening):**

- m11-l5 Run remote compound commands — `ssh web1 'uptime && free -h'`
- m11-l6 Grow the ssh config — `printf 'Host db1\\n  HostName 10.0.2.31\\n  User ubuntu\\n' >> ~/.ssh/config && cat ~/.ssh/config`
## Ch 12 — m12 Shell Scripting & Cron (3.5h, 7 lessons)

- m12-l1 First script — `printf '#!/bin/bash\necho Hello Linux\n' > ~/hello.sh && chmod +x ~/hello.sh && ~/hello.sh`
- m12-l2 Conditionals — `if [ -f /etc/passwd ]; then echo exists; fi`, `echo $?`
- m12-l3 Loops/args — `for i in 1 2 3; do echo $i; done`, `for f in "$@"`
- m12-l4 Cron — `echo '0 2 * * * /home/sam/hello.sh' | crontab -`, `crontab -l`

**Added lessons (deepening):**

- m12-l5 Read exit codes — `/home/sam/hello.sh; echo \"exit=$?\"`
- m12-l6 Prove script contents with grep — `printf '#!/bin/bash\\necho \"first=$1 count=$#\"\\n' > ~/args.sh && chmod +x ~/args.sh && grep -c 'first=' ~/args.sh > ~/args-count.txt`
- m12-l7 Sequences with seq — `seq 1 5 > ~/nums.txt`
## Ch 13 — m13 Debugging & Troubleshooting (2.5h, 6 lessons)

- m13-l1 Exit codes — `ls /does-not-exist; echo $?`, `command -v foo || echo MISSING`
- m13-l2 Port conflicts — `lsof -i :8000`, `ss -tlnp | grep 8000`, `fuser 8000/tcp`
- m13-l3 strace — `strace -e openat ls /etc 2>&1 | head`, `strace -c ls`
- m13-l4 Service won't start — `sudo journalctl -u app -n 20 --no-pager; sudo systemctl start app; systemctl is-active app`

**Added lessons (deepening):**

- m13-l5 Count the opens — `strace -e openat ls /etc 2>&1 | grep -c openat > ~/strace-count.txt`
- m13-l6 Locate binaries with which — `which python3 > ~/py-path.txt`
## Ch 14 — m14 Docker & Containers (4.5h, 10 lessons)

- m14-l1 Images/containers — `docker images`, `docker ps -a`
- m14-l2 Running — `docker run -d --name web -p 8080:80 nginx`, verify `docker ps | grep web`
- m14-l3 Exec/logs — `docker exec web nginx -t`, `docker logs web --tail 5`, `docker rm -f`
- m14-l4 Build image — `Dockerfile` with `FROM nginx`, `docker build -t lab-web .`
- m14-l5 Compose — `docker compose up -d`, `docker compose ps`, `docker compose down`

**Added lessons (deepening):**

- m14-l6 Stop and remove a container — `docker run -d --name rev-temp nginx && docker stop rev-temp && docker rm rev-temp`
- m14-l7 Pull images explicitly — `docker pull ubuntu:22.04 && docker images | grep ubuntu`
- m14-l8 Inspect a container — `docker inspect web > ~/web-inspect.txt`
- m14-l9 Named volumes for data — `docker volume create rev-data && docker volume ls`
- m14-l10 List container networks — `docker network ls > ~/nets.txt && grep bridge ~/nets.txt`
## Ch 15 — m15 Web Stack: Build & Deploy (4h, 7 lessons)

- m15-l1 nginx basics — `sudo nginx -t`, `systemctl status nginx --no-pager`
- m15-l2 Reverse proxy — `server { listen 80; location / { proxy_pass http://127.0.0.1:8000; } }` in `/etc/nginx/sites-available/app` + `ln -s` to `sites-enabled` + `sudo nginx -t`
- m15-l3 systemd app — `sudo systemctl daemon-reload && sudo systemctl enable --now app`
- m15-l4 TLS — `sudo certbot --nginx -d app.example.com --non-interactive --agree-tos -m ops@example.com`
- m15-l5 git deploy — `sudo git clone https://github.com/example/app.git /srv/app`, `sudo git -C /srv/app pull`

**Added lessons (deepening):**

- m15-l6 Test config then reload — `sudo nginx -t && sudo systemctl reload nginx`
- m15-l7 Inventory enabled sites — `ls -l /etc/nginx/sites-enabled/ > ~/enabled-sites.txt`
## Ch 16 — m16 Capstone: Deploy a Full App (2h, 3 lessons)

- m16-l1 Build+run — `docker build -t lab-web ~/projects/web && docker run -d --name web -p 8080:80 lab-web`
- m16-l2 Verify+document — `curl -fsS http://localhost:8080/`, `sudo nginx -t`, `echo '# Runbook' > ~/RUNBOOK.md`

**Added lessons (deepening):**

- m16-l3 Write the deploy notes — `printf '# Deploy notes\\n- nginx reverse proxy\\n- app via systemd\\n- web container\\n' > ~/DEPLOY-NOTES.md && cat ~/DEPLOY-NOTES.md`
## Ch 17 — m17 Server Bootstrap: Day-0 Checklist (3.5h, 8 lessons)

Real order used by every ops team on a fresh Ubuntu box:

1. m17-l1 `sudo apt update && sudo apt upgrade -y`
2. m17-l2 `sudo hostnamectl set-hostname prod-web && sudo timedatectl set-timezone Etc/UTC` (+ `timedatectl`)
3. m17-l3 `sudo useradd -m -s /bin/bash ops && sudo usermod -aG sudo ops && id ops`
4. m17-l4 Harden SSH: `PermitRootLogin no`, `PasswordAuthentication no`, `sudo sshd -t`
5. m17-l5 `sudo ufw allow OpenSSH && sudo ufw --force enable && sudo ufw status`
6. m17-l6 Swap: `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile && free -h`

**Added lessons (deepening):**

- m17-l7 Automatic security updates — `sudo apt install -y unattended-upgrades && sudo systemctl enable unattended-upgrades`
- m17-l8 Set the login banner — `echo 'Authorized use only - all activity is logged' | sudo tee /etc/motd`
## Ch 18 — m18 Ubuntu Server Essentials & Packages (2.5h, 7 lessons)

- m18-l1 Toolbox — `sudo apt update && sudo apt install -y htop tmux vim jq tree rsync`
- m18-l2 dpkg query — `dpkg -l | grep -i nginx`, `dpkg -S /usr/bin/nginx`
- m18-l3 APT depth — `apt list --installed`, `apt show nginx`, `apt-cache policy nginx`
- m18-l4 Remove cleanly — `sudo apt remove -y tmux && sudo apt autoremove -y`
- m18-l5 Service install — `sudo apt install -y fail2ban && sudo systemctl enable --now fail2ban`

**Added lessons (deepening):**

- m18-l6 Show package details with apt — `apt show nginx 2>/dev/null | head -n 8 > ~/nginx-show.txt`
- m18-l7 Confirm an installed package file — `dpkg -l openssh-server | tail -n 2 > ~/ssh-pkg.txt`
## Ch 19 — m19 PostgreSQL in Production (3h, 7 lessons)

- m19-l1 Start+connect — `sudo systemctl start postgresql && sudo -u postgres psql -c 'SELECT version();'`
- m19-l2 DB+role — `sudo -u postgres psql -c "CREATE ROLE app LOGIN PASSWORD 'secret';" -c 'CREATE DATABASE appdb OWNER app;'`
- m19-l3 Inspect — `sudo -u postgres psql -l`, `sudo -u postgres psql -c '\du'`
- m19-l4 Backup — `sudo -u postgres pg_dump appdb > /backups/appdb.sql`, `ls -lh /backups/appdb.sql`
- m19-l5 Listening — `ss -tlnp | grep 5432`

**Added lessons (deepening):**

- m19-l6 A second database and role — `sudo -u postgres psql -c \"CREATE DATABASE shopdb\" && sudo -u postgres psql -c \"CREATE USER shopuser WITH LOGIN\" && sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE shopdb TO shopuser\"`
- m19-l7 Dump the second database — `sudo -u postgres pg_dump shopdb > /backups/shopdb.sql`
## Ch 20 — m20 Caddy & Modern Web Serving (2.5h, 6 lessons)

- m20-l1 Install — `sudo apt install -y caddy && caddy version`
- m20-l2 Caddyfile — `app.example.com { reverse_proxy 127.0.0.1:8000 }` in `/etc/caddy/Caddyfile`
- m20-l3 Validate+run — `sudo caddy validate --config /etc/caddy/Caddyfile && sudo systemctl enable --now caddy`
- m20-l4 Reload+logs — `sudo systemctl reload caddy && journalctl -u caddy -n 20 --no-pager`

**Added lessons (deepening):**

- m20-l5 Format the Caddyfile — `sudo caddy fmt --overwrite /etc/caddy/Caddyfile && echo formatted`
- m20-l6 Start Caddy properly — `sudo caddy start --config /etc/caddy/Caddyfile && systemctl is-active caddy`
## Ch 21 — m21 Monitoring & Observability (3h, 9 lessons)

- m21-l1 Load/uptime — `uptime`, `cat /proc/loadavg`
- m21-l2 CPU sampling — `mpstat 1 2`, `sar -u 1 2`
- m21-l3 Disk/inode — `df -h`, `df -i`, `du -sh /var/* | sort -rh | head`
- m21-l4 SMART — `sudo smartctl -a /dev/sda | head -n 40`
- m21-l5 journalctl priority — `journalctl -p err -b -n 20 --no-pager`
- m21-l6 Health endpoint — `curl -fsS http://localhost/health`, `curl -s http://localhost/metrics | head`

**Added lessons (deepening):**

- m21-l7 Memory with sar -r — `sar -r 1 2 > ~/sar-mem.txt`
- m21-l8 vmstat in two seconds — `vmstat 1 2 > ~/vmstat.txt`
- m21-l9 One-line health: uptime — `uptime > ~/uptime.txt`
## Ch 22 — m22 Performance & Load Testing (3h, 7 lessons)

- m22-l1 ab baseline — `ab -n 1000 -c 50 http://localhost/ | tee ~/ab.txt`
- m22-l2 hey/wrk — `hey -n 500 -c 20 http://localhost/`, `wrk -t2 -c20 -d10s http://localhost/`
- m22-l3 curl timing — `curl -s -o /dev/null -w 'total:%{time_total} connect:%{time_connect}\n' http://localhost/`
- m22-l4 Bottleneck — `mpstat 1 2`, `pidstat -u 1 2`, `top -b -n1 | head`
- m22-l5 Kernel tune — `sudo sysctl -w net.core.somaxconn=8192 && sudo sysctl -w net.ipv4.ip_forward=1`

**Added lessons (deepening):**

- m22-l6 wrk in detail — `wrk -t2 -c10 -d5s http://localhost/ > ~/wrk.txt`
- m22-l7 Per-process IO with pidstat — `pidstat -d 1 2 > ~/pidstat-io.txt`
## Ch 23 — m23 Automation & Infrastructure as Code (3.5h, 9 lessons)

- m23-l1 Robust script — `#!/bin/bash` + `set -euo pipefail`, `bash -n ~/deploy.sh`, `chmod +x`
- m23-l2 Functions/args — `greet(){ echo "hi $1"; }`, `"$@"`
- m23-l3 cron — `echo '0 * * * * /home/sam/deploy.sh' | crontab -`, `crontab -l`
- m23-l4 systemd timer — `systemctl list-timers --no-pager`, `sudo systemctl enable backup.timer`
- m23-l5 at — `echo '/home/sam/deploy.sh' | at 02:00`, `atq`
- m23-l6 Ansible — `site.yml` with `- hosts: all`, `ansible-playbook --syntax-check ~/site.yml`
- m23-l7 Make — `Makefile` with `all:` target, `make`

**Added lessons (deepening):**

- m23-l8 Lint before you schedule — `bash -n ~/deploy.sh && echo SYNTAX-OK > ~/deploy-check.txt && ls -l ~/deploy.sh >> ~/deploy-check.txt`
- m23-l9 Ad-hoc ansible ping — `ansible all -m ping > ~/ansible-ping.txt`
## Ch 24 — m24 Backups, Restore & Disaster Recovery (4h, 10 lessons)

- m24-l1 rsync 3-2-1 — `sudo mkdir -p /backups/home && sudo rsync -av /home/sam/ /backups/home/`
- m24-l2 DB backup — `sudo -u postgres pg_dump appdb > /backups/db-appdb.sql`
- m24-l3 restic — `restic init --repo /backups/restic`, `restic -r /backups/restic backup /etc`
- m24-l4 Restore test — `restic -r /backups/restic snapshots`, `restic -r /backups/restic restore latest --target /tmp/restore-test`
- m24-l5 rclone offsite — `rclone copy /backups offsite:backups --dry-run`, `rclone lsd offsite:`
- m24-l6 Automate — `echo '30 2 * * * /home/sam/backup.sh' | crontab -`

**Added lessons (deepening):**

- m24-l7 Verify archives by listing — `tar tzf ~/etc-backup.tar.gz > ~/tar-list.txt`
- m24-l8 Re-sync the tree verbosely — `sudo rsync -av /home/sam/ /backups/home/ > ~/rsync-full.txt`
- m24-l9 Prove copies with cmp — `cp /home/sam/todo.txt /tmp/todo-copy.txt && cmp /home/sam/todo.txt /tmp/todo-copy.txt && echo IDENTICAL > ~/backup-cmp.txt`
- m24-l10 List restic snapshots — `restic -r /backups/restic snapshots > ~/restic-snaps.txt`
## Ch 25 — m25 Robust Networking, Diagnostics & Load Balancing (4h, 10 lessons)

- m25-l1 Routes/DNS — `ip route`, `resolvectl status`, `cat /etc/resolv.conf`
- m25-l2 Sockets — `ss -tulpn`
- m25-l3 tcpdump — `sudo tcpdump -i eth0 -n port 80 -c 5`, `sudo tcpdump -i any -c 3`
- m25-l4 Scan/test — `nmap -p 22,80,443 localhost`, `nc -zv localhost 80`
- m25-l5 mtr — `mtr -rwc 5 web1 | tee ~/mtr.txt`
- m25-l6 nginx upstream — `upstream app { server 127.0.0.1:8000; server 127.0.0.1:8001; }` + `sudo nginx -t`

**Added lessons (deepening):**

- m25-l7 Socket summary with ss -s — `ss -s > ~/ss-summary.txt`
- m25-l8 Addresses and routes, filed — `ip addr > ~/addrs.txt && ip route >> ~/addrs.txt`
- m25-l9 Time HTTP with curl -w — `curl -s -o /dev/null -w 'code:%{http_code} time:%{time_total}\\n' http://localhost/ > ~/curl-timing.txt`
- m25-l10 Probe ports with nc — `nc -zv localhost 22 > ~/nc-ssh.txt 2>&1`
## Ch 26 — m26 Production Incident Response (4h, 7 lessons)

Playbook per incident: observe → hypothesize → fix → verify.

- m26-l1 502 — `sudo tail -n 20 /var/log/nginx/error.log`, `sudo systemctl restart app`, `curl -fsS http://localhost/health`
- m26-l2 Disk pressure — `df -h /`, `du -sh /var/log/* | sort -rh | head`, `sudo truncate -s 0 /var/log/syslog`, `sudo logrotate -f /etc/logrotate.conf`
- m26-l3 CPU — `top -b -n1 | head -n 20`, `ps aux --sort=-%cpu | head`, `pkill -f manage.py`
- m26-l4 OOM — `dmesg | grep -i -m2 'out of memory'`, `sudo sysctl -w vm.swappiness=10`, `free -h`

**Added lessons (deepening):**

- m26-l5 Hunt 5xx in the access log — `awk '$9 ~ /^5/ {print}' /var/log/nginx/access.log > ~/server-errors.txt; wc -l ~/server-errors.txt`
- m26-l6 List open sockets with lsof — `lsof -i -P | head -n 10 > ~/open-sockets.txt`
- m26-l7 Snapshot load + errors together — `uptime > ~/incident-load.txt && journalctl -p err -b -n 5 --no-pager >> ~/incident-load.txt`
## Ch 27 — m27 Zero-Downtime Deploys & CI/CD (3.5h, 6 lessons)

- m27-l1 Blue-green — swap `proxy_pass 8000 → 8001` in nginx site, `sudo nginx -t && sudo systemctl reload nginx`
- m27-l2 Health-gated — `curl -fsS http://127.0.0.1:8001/health && sudo systemctl reload nginx && echo DEPLOY_OK > ~/deploy-status.txt`
- m27-l3 Compose rollout — `docker compose -f ~/projects/web/compose.yaml up -d --build && docker compose ps`
- m27-l4 CI trigger — `gh workflow run deploy.yml && gh run list --limit 3`

**Added lessons (deepening):**

- m27-l5 Start a repo the right way — `mkdir -p ~/rev-app && cd ~/rev-app && git init && git status > ~/git-status.txt`
- m27-l6 Read pipeline history with gh — `gh run list --limit 5 > ~/ci-runs.txt`
## Ch 28 — m28 Secrets Management & Security Hardening (3.5h, 8 lessons)

- m28-l1 Hunt secrets — `grep -rniE 'password|secret|AKIA' /srv/app 2>/dev/null | tee ~/leaks.txt`
- m28-l2 Vault — `vault kv put secret/app db_password='s3cr3t-rotated'`, `vault kv get secret/app`
- m28-l3 Least privilege — `sudo chown root:root /srv/app/.env && sudo chmod 600 /srv/app/.env && ls -l /srv/app/.env`
- m28-l4 auditd — `sudo auditctl -w /etc/passwd -p wa -k identity && sudo auditctl -l | grep identity`
- m28-l5 Image scan — `trivy image --severity HIGH,CRITICAL nginx:latest | tee ~/trivy.txt`

**Added lessons (deepening):**

- m28-l6 A second Vault secret — `vault kv put secret/rev/ci token=r3v-t0k3n && vault kv get secret/rev/ci > ~/ci-secret.txt`
- m28-l7 List audit rules — `sudo auditctl -l > ~/audit-rules.txt && grep identity ~/audit-rules.txt`
- m28-l8 Case-insensitive secret sweep — `grep -rniE 'secret' /srv/app > ~/sweep.txt`
## Ch 29 — m29 Observability & Alerting (3h, 7 lessons)

- m29-l1 node_exporter — `sudo systemctl enable --now node_exporter`, `curl -s http://localhost:9100/metrics | head`
- m29-l2 Prometheus scrape — `scrape_configs: [{job_name: node, static_configs: [{targets: ["localhost:9100"]}]}]` in `/etc/prometheus/prometheus.yml`, `promtool check config`
- m29-l3 Alert rules — `groups: [{name: host, rules: [{alert: HighLoad, expr: node_load1 > 4}]}]`, `promtool check rules`
- m29-l4 Persistent journal — `sudo mkdir -p /var/log/journal && sudo systemctl restart systemd-journald && journalctl --disk-usage`
- m29-l5 Alertmanager — `route: {receiver: default}` in `~/alertmanager.yml`, `amtool check-config`

**Added lessons (deepening):**

- m29-l6 Validate Prometheus config — `promtool check config /etc/prometheus/prometheus.yml > ~/prom-check.txt 2>&1`
- m29-l7 Scrape the exporter yourself — `curl -s http://localhost:9100/metrics > ~/metrics.txt`
## Ch 30 — m30 Capacity Planning & Performance Tuning (3.5h, 7 lessons)

- m30-l1 Baseline/headroom — `ab -n 2000 -c 50 http://localhost/ | tee ~/baseline.txt`, `mpstat 1 2`
- m30-l2 perf — `sudo perf stat -e cycles,instructions -- sleep 1`, `sudo perf top -b -n 5`
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

## Review r02 — People, Permissions, Processes (2h, 8 lessons)

Combination of m04–m06: every task uses only commands taught in those chapters.

- r02-l1 Setgid dir for the new team — `sudo mkdir -p /srv/rev-r02 && sudo chgrp revops /srv/rev-r02 && sudo chmod 2770 /srv/rev-r02`
- r02-l2 Onboard a teammate properly — `sudo useradd -m -s /bin/bash -G revops revmate && id revmate > ~/reviews/r02-revmate.txt`
- r02-l3 Lock down the new home with find — `sudo find /home/revmate -type f -exec chmod 640 {} \\;`
- r02-l4 Whose processes? ps by user — `ps aux | grep -c www-data > ~/reviews/r02-www-count.txt`
- r02-l5 List then kill your own sleepers — `sleep 90 & sleep 91 & pgrep -f 'sleep 9' > ~/reviews/r02-sleepers.txt && pkill -f 'sleep 9'`
- r02-l6 Home-dir disk by owner — `du -sh /home/revmate /home/sam 2>/dev/null > ~/reviews/r02-home-du.txt`
- r02-l7 Account report: id plus groups — `id revmate > ~/reviews/r02-acct.txt && groups revmate >> ~/reviews/r02-acct.txt`
- r02-l8 Offboard cleanly, file the proof — `sudo userdel -r revmate && echo OFFBOARDED > ~/reviews/r02-offboard.txt`

## Review r03 — Serve, Store, Connect, Observe (2h, 8 lessons)

Combination of m07–m10: every task uses only commands taught in those chapters.

- r03-l1 SSH chain: unit, port, log — `systemctl is-active ssh && ss -tlnp | grep ':22' && journalctl -u ssh -n 3 --no-pager > ~/reviews/r03-ssh-chain.txt`
- r03-l2 Disk free plus biggest logs — `df -h / > ~/reviews/r03-disk.txt && du -sh /var/log/* 2>/dev/null | sort -rh | head -n 3 >> ~/reviews/r03-disk.txt`
- r03-l3 Firewall meets listeners — `sudo ufw status > ~/reviews/r03-fw.txt && ss -tlnp >> ~/reviews/r03-fw.txt`
- r03-l4 Boot time plus failed units — `systemd-analyze time > ~/reviews/r03-boot.txt 2>&1; systemctl list-units --failed --no-pager >> ~/reviews/r03-boot.txt`
- r03-l5 Mount intent versus truth — `mount | grep ' / ' > ~/reviews/r03-mount.txt && grep -v '^#' /etc/fstab | grep -v '^$' >> ~/reviews/r03-mount.txt`
- r03-l6 Errors then kernel tail — `journalctl -p err -b -n 5 --no-pager > ~/reviews/r03-errs.txt && dmesg | tail -n 3 >> ~/reviews/r03-errs.txt`
- r03-l7 Restart cron, prove with logs — `sudo systemctl restart cron && systemctl is-active cron && journalctl -u cron -n 3 --no-pager > ~/reviews/r03-cron.txt`
- r03-l8 Triage one-pager — `uptime > ~/reviews/r03-triage.txt && df -h / | grep sda1 >> ~/reviews/r03-triage.txt`

## Review r04 — Remote, Scripted, Debugged (2h, 8 lessons)

Combination of m11–m13: every task uses only commands taught in those chapters.

- r04-l1 Remote health in one trip — `ssh web1 'uptime && free -h' > ~/reviews/r04-remote.txt`
- r04-l2 Ship a script, run it there — `scp ~/hello.sh web1:/tmp/ && ssh web1 'ls -l /tmp/hello.sh'`
- r04-l3 Linted script on a schedule — `bash -n ~/hello.sh && echo '*/5 * * * * /home/sam/hello.sh' | crontab - && crontab -l > ~/reviews/r04-cron.txt`
- r04-l4 Audit your ssh client config — `cat ~/.ssh/config > ~/reviews/r04-sshconf.txt && grep -c '^Host' ~/.ssh/config >> ~/reviews/r04-sshconf.txt`
- r04-l5 Port 80: two witnesses — `ss -tlnp | grep ':80' > ~/reviews/r04-port80.txt; lsof -i :80 >> ~/reviews/r04-port80.txt`
- r04-l6 Trace your own script — `strace -e openat ~/hello.sh > ~/reviews/r04-trace.txt 2>&1`
- r04-l7 Remote true/false gate — `ssh web1 true && echo REMOTE-OK > ~/reviews/r04-remote-ok.txt || echo REMOTE-FAIL > ~/reviews/r04-remote-ok.txt`
- r04-l8 A script that audits logs — `printf '#!/bin/bash\\ngrep -c Failed /var/log/auth.log\\n' > ~/reviews/r04-failcount.sh && chmod +x ~/reviews/r04-failcount.sh && grep -c Failed /var/log/auth.log > ~/reviews/r04-failcount.txt`

## Review r05 — Ship It and Secure the Host (2h, 8 lessons)

Combination of m14–m17: every task uses only commands taught in those chapters.

- r05-l1 Throwaway web on 8081 — `docker run -d --name rev-nginx -p 8081:80 nginx && curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8081/ > ~/reviews/r05-revcode.txt`
- r05-l2 Remove the throwaway — `docker stop rev-nginx && docker rm rev-nginx && docker ps > ~/reviews/r05-ps.txt`
- r05-l3 nginx test plus hosts proof — `sudo nginx -t && grep lab-api /etc/hosts > ~/reviews/r05-webproof.txt`
- r05-l4 Bootstrap audit one-pager — `echo '# bootstrap audit' > ~/reviews/r05-audit.txt && id ops >> ~/reviews/r05-audit.txt && dpkg -l unattended-upgrades | tail -n 1 >> ~/reviews/r05-audit.txt`
- r05-l5 Image inventory — `docker images > ~/reviews/r05-images.txt && grep nginx ~/reviews/r05-images.txt`
- r05-l6 Host identity card — `hostnamectl | head -n 3 > ~/reviews/r05-host.txt && free -h | head -n 2 >> ~/reviews/r05-host.txt`
- r05-l7 Final notes, review edition — `printf '# Final\\n- proxy: nginx:80\\n- unit: app.service\\n- container: web\\n' > ~/reviews/r05-final-notes.md && cat ~/reviews/r05-final-notes.md`
- r05-l8 Restart app, count the fleet — `sudo systemctl restart app && docker ps | grep -c Up > ~/reviews/r05-upcount.txt`

## Review r06 — Packages, Data, Serving (2h, 8 lessons)

Combination of m18–m20: every task uses only commands taught in those chapters.

- r06-l1 Filter the package list — `dpkg -l | grep -E 'nginx|openssh' > ~/reviews/r06-toolbox.txt`
- r06-l2 Both databases on parade — `sudo -u postgres psql -l > ~/reviews/r06-dbs.txt && grep -E 'appdb|shopdb' ~/reviews/r06-dbs.txt`
- r06-l3 Is Postgres ready? — `pg_isready -h localhost -p 5432 > ~/reviews/r06-ready.txt`
- r06-l4 Caddy active and valid — `systemctl is-active caddy && sudo caddy validate --config /etc/caddy/Caddyfile > ~/reviews/r06-caddy.txt`
- r06-l5 Postgres version on record — `sudo -u postgres psql -c 'SELECT version();' > ~/reviews/r06-pgver.txt`
- r06-l6 Reload Caddy, read its journal — `sudo caddy reload --config /etc/caddy/Caddyfile && journalctl -u caddy -n 5 --no-pager > ~/reviews/r06-caddylog.txt`
- r06-l7 Read before you install — `apt show tree 2>/dev/null | head -n 3 > ~/reviews/r06-tree.txt`
- r06-l8 Version inventory — `caddy version > ~/reviews/r06-versions.txt && dpkg -l caddy | tail -n 1 >> ~/reviews/r06-versions.txt`

## Review r07 — Watch It, Load It, Back It Up (2h, 8 lessons)

Combination of m21–m24: every task uses only commands taught in those chapters.

- r07-l1 CPU plus memory snapshots — `sar -u 1 1 | tail -n 3 > ~/reviews/r07-perf.txt && vmstat 1 1 | tail -n 1 >> ~/reviews/r07-perf.txt`
- r07-l2 Baseline again, briefly — `ab -n 50 -c 5 http://localhost/ > ~/reviews/r07-ab.txt && grep 'Requests per second' ~/reviews/r07-ab.txt`
- r07-l3 What is actually scheduled? — `crontab -l > ~/reviews/r07-auto.txt`
- r07-l4 Snapshots plus remotes — `restic -r /backups/restic snapshots | head -n 3 > ~/reviews/r07-snaps.txt && rclone lsd offsite: >> ~/reviews/r07-snaps.txt`
- r07-l5 Load plus top slice — `uptime > ~/reviews/r07-top.txt && top -b -n1 | head -n 8 >> ~/reviews/r07-top.txt`
- r07-l6 SMART verdict on record — `sudo smartctl -a /dev/sda | grep -i health > ~/reviews/r07-diskhealth.txt`
- r07-l7 Both dumps listed — `ls -l /backups/appdb.sql /backups/shopdb.sql > ~/reviews/r07-dumps.txt`
- r07-l8 Metrics count plus snapshot count — `curl -s http://localhost:9100/metrics | wc -l > ~/reviews/r07-exam.txt && restic -r /backups/restic snapshots | wc -l >> ~/reviews/r07-exam.txt`

## Review r08 — Diagnose, Survive, Ship (2h, 8 lessons)

Combination of m25–m27: every task uses only commands taught in those chapters.

- r08-l1 Path plus ping — `mtr -rwc 2 web1 | head -n 6 > ~/reviews/r08-path.txt && ping -c 1 -W 2 web1 | tail -n 2 >> ~/reviews/r08-path.txt`
- r08-l2 502 evidence bag — `sudo tail -n 5 /var/log/nginx/error.log > ~/reviews/r08-502.txt && grep -c 'connect() failed' ~/reviews/r08-502.txt >> ~/reviews/r08-502.txt`
- r08-l3 Listener plus memory — `ss -tlnp | grep ':80' > ~/reviews/r08-res.txt && free -h | head -n 2 >> ~/reviews/r08-res.txt`
- r08-l4 Where does nginx point? — `grep -h proxy_pass /etc/nginx/sites-enabled/* > ~/reviews/r08-proxy.txt 2>/dev/null; cat ~/reviews/r08-proxy.txt`
- r08-l5 Gate on /health, file it — `curl -fsS http://localhost/health > ~/reviews/r08-health.txt`
- r08-l6 Fleet census: compose plus docker — `docker compose ps > ~/reviews/r08-fleet.txt && docker ps >> ~/reviews/r08-fleet.txt`
- r08-l7 CI runs on record — `cd ~ && gh run list --limit 3 > ~/reviews/r08-ship.txt`
- r08-l8 Incident bundle in one file — `echo '# bundle' > ~/reviews/r08-bundle.txt && uptime >> ~/reviews/r08-bundle.txt && df -h / | grep sda1 >> ~/reviews/r08-bundle.txt && ss -tlnp | grep -c ':80' >> ~/reviews/r08-bundle.txt`

## Review r09 — Secrets, Signal, Scale (2h, 8 lessons)

Combination of m28–m30: every task uses only commands taught in those chapters.

- r09-l1 Vault secret to locked file — `vault kv get secret/app > ~/reviews/r09-appsecret.txt && chmod 600 ~/reviews/r09-appsecret.txt`
- r09-l2 Validate config AND rules — `promtool check config /etc/prometheus/prometheus.yml > ~/reviews/r09-prom.txt 2>&1; promtool check rules /etc/prometheus/alerts.yml >> ~/reviews/r09-prom.txt 2>&1`
- r09-l3 Alertmanager file plus journal size — `cat ~/alertmanager.yml > ~/reviews/r09-am.txt && journalctl --disk-usage >> ~/reviews/r09-am.txt`
- r09-l4 Tuning values on record — `sysctl net.core.somaxconn > ~/reviews/r09-tune.txt && sysctl vm.swappiness >> ~/reviews/r09-tune.txt`
- r09-l5 Quick fio plus ab headline — `fio --name=quick --rw=read --size=16M --bs=4k 2>&1 | tail -n 3 > ~/reviews/r09-bench.txt && ab -n 50 -c 5 http://localhost/ | grep 'Requests per second' >> ~/reviews/r09-bench.txt`
- r09-l6 Grow the capacity doc — `printf '\\n## Review: headroom confirmed\\n- load < cpus\\n- disk < 80%%\\n' | sudo tee -a /srv/capacity.md > /dev/null && tail -n 5 /srv/capacity.md`
- r09-l7 Final sweep plus perf sample — `grep -rniE 'password' /srv/app --include='*.py' > ~/reviews/r09-final-scan.txt; sudo perf stat ls /etc >> ~/reviews/r09-final-scan.txt 2>&1`
- r09-l8 Graduate: the whole box in a file 🎓 — `echo '# graduate' > ~/reviews/r09-graduate.txt && (id; uptime; df -h / | tail -n 1; systemctl is-active app; systemctl is-active cron) >> ~/reviews/r09-graduate.txt`

---

## Command index (real Ubuntu, grouped — simulator must match)

- Files/find: `find ls stat file cat less head tail cut sort uniq wc tr column paste join diff patch tee`
- Text: `grep awk sed perl jq yq`
- Perms/users: `chmod chown chgrp umask stat id groups who useradd usermod userdel passwd su sudo visudo`
- Procs: `ps top htop pgrep pkill kill killall jobs fg bg nohup nice renice`
- systemd: `systemctl journalctl systemd-analyze hostnamectl timedatectl loginctl`
- Storage: `df du lsblk blkid mount umount findmnt tar gzip fallocate dd mkswap swapon mkfs fsck`
- Net: `ip ss ping dig host getent curl wget ufw nft iptables tcpdump nmap nc mtr resolvectl networkctl`
- SSH: `ssh sshd ssh-keygen ssh-copy-id scp sftp`
- Scripting: `bash printf test [ echo export alias history crontab at make`
- Debug: `strace ltrace lsof fuser dmesg`
- Docker/web: `docker nginx nginx -t certbot git`
- Data: `apt dpkg psql pg_dump caddy smartctl mpstat sar pidstat iostat vmstat ab hey wrk curl sysctl tuned-adm perf`
- Ops: `ansible-playbook rsync restic rclone haproxy vault auditctl aide fail2ban trivy promtool amtool gh kubectl helm`

## Simulation fidelity notes

- Output text mirrors real Ubuntu (same column order for `ss -tlnp`, `ps aux`, `df -h`, `ls -l`).
- Tab-complete, `↑/↓` history, `!!`, pipes, `> >> < 2>`, `&& || ;`, `$(…)`, globs, `~` behave like bash.
- `sudo` is passwordless (lab convenience) but required exactly where real Ubuntu requires root — solutions above already place it correctly.
- No real network egress or real daemon is needed: `ping/dig/curl/ssh/tcpdump` return canned-but-realistic outputs matching the formats above; grading checks state (files, modes, services, ports) not string equality.

## Suggested study order (39 chapters: reviews are interleaved, never skipped)

Weeks 1–2: m01→m08 (fluency, text, perms, users, procs, systemd, storage).
Week 3: m09→m13 (networking, logs, SSH, scripting, debugging).
Week 4: m14→m16 (docker, web, capstone — first full deploy).
Weeks 5–6: m17→m20 (bootstrap, apt, postgres, caddy).
Weeks 7–10: m21→m30 (monitoring, perf, automation, backups, net-diag, incidents, CI/CD, secrets, alerting, capacity).
Daily: 10 min in Pro Tips (`Ctrl+T`); redo any task you cannot run from memory on real Ubuntu.

**Added lessons (deepening):**

- m30-l6 Read the file ceiling — `sysctl fs.file-max > ~/file-max.txt`
- m30-l7 Small controlled ab run — `ab -n 100 -c 5 http://localhost/ > ~/ab-small.txt`
