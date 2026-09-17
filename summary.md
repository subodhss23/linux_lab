# Summary — Linux Mastery v2 (spec-first build)

## 1. Executive summary

Rebuild of https://linuxlearning-sage.vercel.app/ (Next.js, V1: 30 modules / 137 tasks / ~89 h /
141 tips) into **v2: 38 modules / 211 tasks / ~112 h / 180+ tips**, keeping the exact 3-pane
format users love (chapters left · terminal center · instructions+examples+task right),
plus:

- **[NEW] Total Commands** odometer in header (counts every Enter, right or wrong).
- Top **curriculum progress bar** (`done/211`) + per-module rings + XP-to-next bar.
- **Networking = 80% creating / 20% viewing** (was view-heavy); Viewing/Text + Data Wrangling doubled.
- New collapsible folder **`linux advanced`** (M31–M38, 56 tasks).
- Precise resets: `Reset progress` keeps Total Commands; `Reset machine` zeroes everything.
- Fully mouseless (`Esc · Ctrl+K · Ctrl+T · Alt+↑/↓ · Ctrl+H · Ctrl+G`), search bar, Tip of the Day,
  plus Daily Quest, Exam mode, Boss fights, analytics, achievements, export, deep links.
- Docs-first: `prd.md` (why/what), `technical_design.md` (how), `features.md` (checklist),
  `instructions.md` (run/learn), this `summary.md` (counts + normative 211-task catalog).

## 2. What changed vs V1 (filed against local `../linux_learning/` + live site)

| Area | V1 | V2 |
|---|---|---|
| Modules/tasks | 30 / 137 | **38 / 211** (IDs `m01-l1…m30-l5` frozen) |
| Hours | ~89 | ~112 |
| Header metrics | Level, XP, Done, Study time | + **Total Commands** (`#stat-cmds`) |
| Progress | sidebar text `0/0` | top bar `x/211 + %` + rings + XP fill |
| Networking | 4 view-heavy | 10 (M09) + 8 (M32) + 8 (M25), ≥80% create |
| Viewing/Text (M03) | 4 | **10** |
| Data Wrangling (M02) | 4 | **8** |
| New folder | — | **linux advanced M31–M38 (56 tasks)** |
| Tips | 141 | **180+** |
| Reset progress | erase XP/tasks | erase XP/tasks/time **but keep Total Commands** |
| Reset machine | FS only, keep XP | **factory: FS + all metrics incl. Total Commands** |
| Extras | palette, tips, theme | + quest/streak, exam, boss, analytics, achievements, export, deep links |
| Tests | solve 137 / 40 UI checks | **solve 211 / 50+ UI checks** (odometer + resets + keyboard) |

## 3. IA & layout (kept)

Topbar (brand · Level XP Done Study TotalCmds · XP bar · Pro-tips/theme/2 resets · overall bar) /
Left (search · folders Core + linux advanced · rings · tip-day) /
Center (simulated `sam@ubuntu-lab:~$`, scrollback, `Esc…Ctrl+G` hint) /
Right (objective/theory/clickable examples/task/hint/solution) /
Statusbar (TERMINAL|NAV + hints). Full keyboard map in `prd.md §8`.

## 4. Module map (38 · 211 tasks · ~112 h)

| ID | Folder | Module | T | H |
|---|---|---|---|---|
| M01 | core | Foundations: Fluency Drill | 4 | 2 |
| M02 | core | Data Wrangling & System Introspection | 8 | 4.5 |
| M03 | core | Viewing & Text Processing | 10 | 5 |
| M04 | core | Permissions & Ownership | 4 | 3 |
| M05 | core | Users & Groups | 4 | 2.5 |
| M06 | core | Processes & Jobs | 4 | 3 |
| M07 | core | Services & systemd | 4 | 2.5 |
| M08 | core | Filesystems & Storage | 4 | 3 |
| M09 | core | Networking (80% create) | 10 | 5 |
| M10 | core | Logs & Monitoring | 4 | 2.5 |
| M11 | core | SSH & Remote Access | 4 | 3 |
| M12 | core | Shell Scripting & Cron | 4 | 3 |
| M13 | core | Debugging & Troubleshooting | 4 | 2.5 |
| M14 | core | Docker & Containers | 5 | 3.5 |
| M15 | core | Web Stack: Build & Deploy | 5 | 4 |
| M16 | core | Capstone: Deploy a Full App | 2 | 1.5 |
| M17 | core | Server Bootstrap: Day-0 Checklist | 6 | 3 |
| M18 | core | Ubuntu Server Essentials & Packages | 5 | 2.5 |
| M19 | core | PostgreSQL in Production | 5 | 3 |
| M20 | core | Caddy & Modern Web Serving | 4 | 2.5 |
| M21 | core | Monitoring & Observability | 6 | 3 |
| M22 | core | Performance & Load Testing | 5 | 3 |
| M23 | core | Automation & IaC | 7 | 3.5 |
| M24 | core | Backups, Restore & DR | 6 | 3 |
| M25 | core | Robust Networking, Diagnostics & LB | 8 | 4 |
| M26 | core | Production Incident Response | 4 | 4 |
| M27 | core | Zero-Downtime Deploys & CI/CD | 4 | 3.5 |
| M28 | core | Secrets Mgmt & Security Hardening | 5 | 3.5 |
| M29 | core | Observability & Alerting | 5 | 3 |
| M30 | core | Capacity Planning & Perf Tuning | 5 | 3.5 |
| M31 | linux advanced | Adv. Text & Data Wrangling Mastery | 8 | 4 |
| M32 | linux advanced | Adv. Networking: Build & Create | 8 | 4 |
| M33 | linux advanced | Kernel, Boot & Internals | 7 | 3.5 |
| M34 | linux advanced | Storage: LVM, RAID & Encryption | 7 | 3.5 |
| M35 | linux advanced | Security, Hardening & Forensics | 7 | 3.5 |
| M36 | linux advanced | Performance Engineering & eBPF | 7 | 3.5 |
| M37 | linux advanced | GitOps, Containers & Prod Delivery | 7 | 3.5 |
| M38 | linux advanced | Final Capstone | 5 | 2.5 |
| | | **Total** | **211** | **~112** |

Count proof: 137 carried + 4 (M02) + 6 (M03) + 6 (M09) + 2 (M25) + 56 (M31–M38) = **211**.

## 5. Normative 211-task catalog (build MUST ship these IDs)

Format: `ID | Title | Task prompt → Solution`. V1 rows (`m01-l1…m30-l5`) preserve live-site
intent (solutions abbreviated where shell-quoting is long; full `check()` in `curriculum.js`
is authoritative). New rows (`m02-l5+, m03-l5+, m09-l5+, m25-l7+, m31+`) are normative as written.

### M01 Foundations: Fluency Drill (4)
- `m01-l1` Inventory the filesystem with find → `find /var/log -type f -name '*.log' > ~/logs.txt`
- `m01-l2` Log forensics: top talkers → `awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn > ~/top-ips.txt`
- `m01-l3` Ownership and symlink hygiene → `sudo mkdir -p /srv/app/run && sudo chown deploy:deploy /srv/app/run && sudo chmod 750 /srv/app/run && ln -sfn /srv/app/run /srv/app/current`
- `m01-l4` Triage runaway process/port → `ss -tlpn | grep 8000 ; pkill -f manage.py`

### M02 Data Wrangling & System Introspection (8: 4 kept + 4 NEW)
- `m02-l1` Parse app config with jq → `jq '.database.host' /srv/app/config.json`
- `m02-l2` Aggregate logs with awk → `awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c`
- `m02-l3` Config surgery with sed -i → `sudo sed -i 's/^X11Forwarding no/X11Forwarding yes/' /etc/ssh/sshd_config`
- `m02-l4` Diff discipline before deploy → `sudo cp /etc/nginx/sites-available/default /tmp/default.new && sudo sed -i 's/listen 80/listen 8080/' /tmp/default.new && diff -u /etc/nginx/sites-available/default /tmp/default.new`
- `m02-l5` [NEW] jq slurp + reduce over JSON logs → `jq -s 'group_by(.status) | map({status: .[0].status, n: length})' /srv/data/requests.json > ~/status-summary.json`
- `m02-l6` [NEW] CSV stats with csvcut/mlr → `csvcut -c city,price /srv/data/listings.csv | mlr --csv stats1 -a mean -f price > ~/avg-price.csv`
- `m02-l7` [NEW] YAML query + sqlite ingest → `yq '.services.web.image' /srv/app/compose.yaml && sqlite3 /tmp/lab.db ".import --csv /srv/data/listings.csv listings" "SELECT count(*) FROM listings;"`
- `m02-l8` [NEW] Parallel transform with xargs → `ls /srv/data/chunk-*.log | xargs -P4 -I{} sh -c 'grep -c ERROR {} > {}.count' && cat /srv/data/chunk-*.count | awk '{s+=$1} END {print s}' > ~/error-total.txt`

### M03 Viewing & Text Processing (10: 4 kept + 6 NEW)
- `m03-l1` Pipes and redirection → `echo 'Linux rocks' > ~/motto.txt`
- `m03-l2` Searching with grep → `grep -i ubuntu /etc/os-release`
- `m03-l3` Cutting, sorting, counting → `cut -d: -f1 /etc/passwd | sort | uniq -c | sort -rn > ~/users.txt`
- `m03-l4` Transforming with sed and awk → `sed 's/ubuntu/server/g' /etc/hostname > ~/hostname.new && awk -F: '{print $1}' /etc/passwd > ~/names.txt`
- `m03-l5` [NEW] Pager mastery: less search/navigate → `less +/Failed /var/log/auth.log` (then `grep -n Failed /var/log/auth.log > ~/failed.txt`)
- `m03-l6` [NEW] head/tail/live follow → `head -n 20 /var/log/nginx/access.log > ~/head.log && tail -n 20 -F /var/log/syslog > ~/tail-capture.txt & sleep 1; kill %1`
- `m03-l7` [NEW] paste/join/column/tr → `paste -d, /srv/data/a.txt /srv/data/b.txt | tr a-z A-Z | column -t -s, > ~/joined.txt`
- `m03-l8` [NEW] sort -u + uniq pipelines → `cut -d' ' -f1 /var/log/nginx/access.log | sort -u | wc -l > ~/unique-ips.txt && uniq -c /srv/data/sorted.txt > ~/counts.txt`
- `m03-l9` [NEW] sed -E capture groups → `sed -E 's/([0-9]{4})-([0-9]{2})-([0-9]{2})/\3\/\2\/\1/' /srv/data/dates.txt > ~/dates-eu.txt`
- `m03-l10` [NEW] awk printf report → `awk -F, '{printf "%-12s %6d\n", $1, $2}' /srv/data/sales.csv | sort -k2 -nr > ~/sales-report.txt`

### M04 Permissions & Ownership (4)
- `m04-l1` Reading permissions → `ls -l /etc/passwd`
- `m04-l2` chmod octal → `chmod 640 ~/notes && ls -l ~/notes`
- `m04-l3` symbols/chown/chgrp → `chmod u+x ~/notes && sudo chown sam:sam ~/notes`
- `m04-l4` umask/setuid/sticky → `mkdir -p ~/shared && chmod 1777 ~/shared && umask 027`

### M05 Users & Groups (4)
- `m05-l1` Who am I → `id && groups && who`
- `m05-l2` Creating users → `sudo useradd -m -s /bin/bash charlie`
- `m05-l3` Groups and sudo → `sudo usermod -aG sudo charlie && groups charlie`
- `m05-l4` su and sudo → `sudo -u charlie whoami`

### M06 Processes & Jobs (4)
- `m06-l1` ps and top → `ps aux | head -n 20`
- `m06-l2` Signals and kill → `pkill -f manage.py; echo $?`
- `m06-l3` Jobs/background/nohup → `sleep 60 & jobs && nohup sleep 120 &`
- `m06-l4` nice/renice → `nice -n 19 sleep 120 & && renice -n 10 -p $!`

### M07 Services & systemd (4)
- `m07-l1` status/start/stop → `systemctl status nginx --no-pager`
- `m07-l2` enable/disable → `sudo systemctl enable nginx && sudo systemctl start nginx`
- `m07-l3` journalctl → `journalctl -u nginx -n 20 --no-pager`
- `m07-l4` Own unit → `sudo tee /etc/systemd/system/app.service > /dev/null && sudo systemctl daemon-reload && sudo systemctl start app`

### M08 Filesystems & Storage (4)
- `m08-l1` df and du → `df -h && du -sh /var/log/* | sort -rh | head`
- `m08-l2` Devices and mounts → `lsblk -f && mount | grep ' / '`
- `m08-l3` fstab → `grep -v '^#' /etc/fstab && findmnt --verify`
- `m08-l4` tar backups → `tar czf ~/etc-backup.tar.gz /etc && tar tzf ~/etc-backup.tar.gz | head`

### M09 Networking — 80% create / 20% view (10: 4 kept + 6 NEW)
- `m09-l1` [VIEW] Interfaces/routes → `ip addr && ip route`
- `m09-l2` [VIEW] Connectivity + DNS → `ping -c2 web1 && dig +short web1 && getent hosts web1`
- `m09-l3` [VIEW→CREATE bridge] Ports/ss → `ss -tlnp && sudo ss -tlnp | grep 8000 || (sudo systemctl start app && ss -tlnp | grep 8000)`
- `m09-l4` [CREATE] HTTP + firewall → `sudo ufw allow 443/tcp && sudo ufw enable && curl -sI http://localhost/ | head -n1`
- `m09-l5` [NEW CREATE] Author netplan YAML + apply → `sudo tee /etc/netplan/10-lab.yaml > /dev/null <<'EOF'
network:
  version: 2
  ethernets:
    eth0:
      addresses: [10.20.0.10/24]
      routes: [{to: default, via: 10.20.0.1}]
      nameservers: {addresses: [1.1.1.1, 8.8.8.8]}
EOF
sudo netplan apply`
- `m09-l6` [NEW CREATE] systemd-networkd unit → `sudo tee /etc/systemd/network/10-lab.network > /dev/null <<'EOF'
[Match]
Name=eth0
[Network]
Address=10.20.0.10/24
Gateway=10.20.0.1
DNS=1.1.1.1
EOF
sudo networkctl reload && networkctl status eth0`
- `m09-l7` [NEW CREATE] veth pair + bridge → `sudo ip link add veth-a type veth peer name veth-b && sudo ip link add br-lab type bridge && sudo ip link set veth-a master br-lab && sudo ip link set br-lab up`
- `m09-l8` [NEW CREATE] Static route + hosts entry → `sudo ip route add 192.168.99.0/24 via 10.20.0.1 && echo '10.20.0.50 lab-api' | sudo tee -a /etc/hosts && getent hosts lab-api`
- `m09-l9` [NEW CREATE] nftables/ufw policy → `sudo nft add table inet lab && sudo nft 'add chain inet lab input { type filter hook input priority 0; }' && sudo nft add rule inet lab input tcp dport 8080 accept && sudo ufw allow 8080/tcp`
- `m09-l10` [NEW CREATE] socat relay + ss proof → `nohup socat TCP-LISTEN:9090,fork TCP:127.0.0.1:8000 & sleep 1; ss -tlnp | grep 9090 && curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:9090/`

### M10 Logs & Monitoring (4)
- `m10-l1` Where logs live → `sudo tail -n 20 /var/log/auth.log`
- `m10-l2` Following live → `timeout 2 tail -F /var/log/syslog | head -n 20`
- `m10-l3` Hunting → `grep -c 'Failed password' /var/log/auth.log`
- `m10-l4` Resources → `free -h && uptime && top -b -n1 | head -n 15`

### M11 SSH & Remote Access (4)
- `m11-l1` Connect → `ssh web1 uptime`
- `m11-l2` Keys → `ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N '' && cat ~/.ssh/id_ed25519.pub`
- `m11-l3` Config + copy → `printf 'Host web1\n  HostName 10.20.0.11\n  User sam\n' > ~/.ssh/config && scp ~/etc-backup.tar.gz web1:/tmp/`
- `m11-l4` Harden → `sudo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config && sudo sshd -t`

### M12 Shell Scripting & Cron (4)
- `m12-l1` First script → `printf '#!/bin/bash\necho Hello Linux\n' > ~/hello.sh && chmod +x ~/hello.sh && ~/hello.sh`
- `m12-l2` Conditionals → `printf '#!/bin/bash\nif [ -f /etc/passwd ]; then echo exists; fi\n' > ~/check.sh && chmod +x ~/check.sh && ~/check.sh`
- `m12-l3` Loops/args → `printf '#!/bin/bash\nfor i in "$@"; do echo "arg:$i"; done\n' > ~/loop.sh && chmod +x ~/loop.sh && ~/loop.sh a b`
- `m12-l4` Cron → `echo '0 2 * * * /home/sam/hello.sh' | crontab - && crontab -l`

### M13 Debugging & Troubleshooting (4)
- `m13-l1` Exit codes → `ls /does-not-exist; echo $?`
- `m13-l2` Port conflicts → `lsof -i :8000 || ss -tlnp | grep 8000`
- `m13-l3` strace → `strace -e openat ls /etc 2>&1 | head`
- `m13-l4` Service won't start → `sudo journalctl -u app -n 20 --no-pager; sudo systemctl start app`

### M14 Docker & Containers (5)
- `m14-l1` Images/containers → `docker images && docker ps -a`
- `m14-l2` Run → `docker run -d --name web -p 8080:80 nginx && docker ps | grep web`
- `m14-l3` Exec/logs/cleanup → `docker exec web nginx -t && docker logs web --tail 5`
- `m14-l4` Build own image → `mkdir -p ~/projects/web && printf 'FROM nginx\nCOPY index.html /usr/share/nginx/html/\n' > ~/projects/web/Dockerfile && docker build -t lab-web ~/projects/web`
- `m14-l5` Compose → `printf 'services:\n  web:\n    image: nginx\n    ports: ["8080:80"]\n' > ~/projects/web/compose.yaml && docker compose -f ~/projects/web/compose.yaml up -d`

### M15 Web Stack: Build & Deploy (5)
- `m15-l1` nginx basics → `sudo nginx -t && systemctl status nginx --no-pager`
- `m15-l2` Reverse proxy → `echo 'server { listen 80; location / { proxy_pass http://127.0.0.1:8000; } }' | sudo tee /etc/nginx/sites-available/app && sudo ln -sf /etc/nginx/sites-available/app /etc/nginx/sites-enabled/app && sudo nginx -t`
- `m15-l3` systemd app → `sudo systemctl daemon-reload && sudo systemctl enable --now app`
- `m15-l4` TLS → `sudo certbot --nginx -d app.example.com --non-interactive --agree-tos -m ops@example.com`
- `m15-l5` git deploy → `sudo git -C /srv/app pull || (sudo git clone https://github.com/example/app.git /srv/app)`

### M16 Capstone: Deploy a Full App (2)
- `m16-l1` Capstone brief/build → `docker build -t lab-web ~/projects/web && docker run -d --name web -p 8080:80 lab-web`
- `m16-l2` Verify/document → `curl -fsS http://localhost:8080/ && sudo nginx -t && echo '# Runbook' > ~/RUNBOOK.md`

### M17 Server Bootstrap: Day-0 Checklist (6)
- `m17-l1` Update → `sudo apt update && sudo apt upgrade -y`
- `m17-l2` Hostname/clock → `sudo hostnamectl set-hostname prod-web && sudo timedatectl set-timezone Etc/UTC`
- `m17-l3` Admin account → `sudo useradd -m -s /bin/bash ops && sudo usermod -aG sudo ops && id ops`
- `m17-l4` Harden SSH → `sudo sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config && sudo sshd -t`
- `m17-l5` Firewall → `sudo ufw allow OpenSSH && sudo ufw --force enable && sudo ufw status`
- `m17-l6` Swap → `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile && free -h`

### M18 Ubuntu Server Essentials & Packages (5)
- `m18-l1` Toolbox → `sudo apt update && sudo apt install -y htop tmux vim jq tree rsync`
- `m18-l2` dpkg query → `dpkg -l | grep -i nginx`
- `m18-l3` APT depth → `apt list --installed 2>/dev/null | head && apt show nginx 2>/dev/null | head -n 10`
- `m18-l4` Remove cleanly → `sudo apt remove -y tmux && sudo apt autoremove -y`
- `m18-l5` Service install → `sudo apt install -y fail2ban && sudo systemctl enable --now fail2ban`

### M19 PostgreSQL in Production (5)
- `m19-l1` Start/connect → `sudo systemctl start postgresql && sudo -u postgres psql -c 'SELECT version();'`
- `m19-l2` DB + role → `sudo -u postgres psql -c "CREATE ROLE app LOGIN PASSWORD 'secret';" -c 'CREATE DATABASE appdb OWNER app;'`
- `m19-l3` Inspect → `sudo -u postgres psql -l && sudo -u postgres psql -c '\du'`
- `m19-l4` Backup → `sudo mkdir -p /backups && sudo -u postgres pg_dump appdb > /backups/appdb.sql && ls -lh /backups/appdb.sql`
- `m19-l5` Listening → `ss -tlnp | grep 5432`

### M20 Caddy & Modern Web Serving (4)
- `m20-l1` Install → `sudo apt install -y caddy && caddy version`
- `m20-l2` Caddyfile → `printf 'app.example.com {\n\treverse_proxy 127.0.0.1:8000\n}\n' | sudo tee /etc/caddy/Caddyfile`
- `m20-l3` Validate/run → `sudo caddy validate --config /etc/caddy/Caddyfile && sudo systemctl enable --now caddy`
- `m20-l4` Reload/logs → `sudo systemctl reload caddy && journalctl -u caddy -n 20 --no-pager`

### M21 Monitoring & Observability (6)
- `m21-l1` Load/uptime → `uptime && cat /proc/loadavg`
- `m21-l2` CPU sampling → `mpstat 1 2 && sar -u 1 2`
- `m21-l3` Disk/inode → `df -h && df -i && du -sh /var/* | sort -rh | head`
- `m21-l4` SMART → `sudo smartctl -a /dev/sda | head -n 40`
- `m21-l5` journalctl priority → `journalctl -p err -b -n 20 --no-pager`
- `m21-l6` Health endpoint → `curl -fsS http://localhost/health && curl -s http://localhost/metrics | head`

### M22 Performance & Load Testing (5)
- `m22-l1` ab baseline → `ab -n 1000 -c 50 http://localhost/ | tee ~/ab.txt`
- `m22-l2` hey/wrk → `hey -n 500 -c 20 http://localhost/ | head -n 20`
- `m22-l3` curl timing → `curl -s -o /dev/null -w 'total:%{time_total} connect:%{time_connect}\n' http://localhost/`
- `m22-l4` Bottleneck → `mpstat 1 2 & pidstat -u 1 2; wait`
- `m22-l5` Kernel tune → `sudo sysctl -w net.core.somaxconn=8192 && sudo sysctl -w net.ipv4.ip_forward=1 && sysctl net.core.somaxconn`

### M23 Automation & IaC (7)
- `m23-l1` Robust script → `printf '#!/bin/bash\nset -euo pipefail\necho deploying\n' > ~/deploy.sh && chmod +x ~/deploy.sh && bash -n ~/deploy.sh`
- `m23-l2` Functions/args → `printf '#!/bin/bash\ngreet(){ echo "hi $1"; }; greet sam\n' > ~/func.sh && bash ~/func.sh`
- `m23-l3` cron → `echo '0 * * * * /home/sam/deploy.sh' | crontab - && crontab -l`
- `m23-l4` systemd timer → `systemctl list-timers --no-pager | head && sudo systemctl enable backup.timer`
- `m23-l5` at job → `echo '/home/sam/deploy.sh' | at 02:00 && atq`
- `m23-l6` Ansible → `printf -- '---\n- hosts: all\n  tasks:\n    - ping:\n' > ~/site.yml && ansible-playbook --syntax-check ~/site.yml`
- `m23-l7` Make → `printf 'all:\n\techo building\n' > ~/Makefile && make`

### M24 Backups, Restore & DR (6)
- `m24-l1` rsync 3-2-1 → `sudo mkdir -p /backups/home && sudo rsync -av /home/sam/ /backups/home/ | tail -n 5`
- `m24-l2` DB backup → `sudo -u postgres pg_dump appdb > /backups/db-appdb.sql && ls -lh /backups/db-appdb.sql`
- `m24-l3` restic → `restic init --repo /backups/restic 2>/dev/null; restic -r /backups/restic backup /etc`
- `m24-l4` Restore test → `restic -r /backups/restic snapshots && restic -r /backups/restic restore latest --target /tmp/restore-test`
- `m24-l5` rclone offsite → `rclone copy /backups offsite:backups --dry-run`
- `m24-l6` Automate → `echo '30 2 * * * /home/sam/backup.sh' | crontab - && crontab -l | grep backup`

### M25 Robust Networking, Diagnostics & LB (8: 6 kept + 2 NEW)
- `m25-l1` Routes/DNS → `ip route && resolvectl status`
- `m25-l2` Sockets → `ss -tulpn`
- `m25-l3` tcpdump → `sudo timeout 5 tcpdump -i any -n port 80 -c 3 || sudo tcpdump -i eth0 -n -c 3`
- `m25-l4` Scan/test → `nmap -p 22,80,443 localhost; nc -zv localhost 80`
- `m25-l5` mtr → `mtr -rwc 5 web1 | tee ~/mtr.txt`
- `m25-l6` nginx upstream → `printf 'upstream app {\n  server 127.0.0.1:8000;\n  server 127.0.0.1:8001;\n}\n' | sudo tee /etc/nginx/conf.d/upstream.conf && sudo nginx -t`
- `m25-l7` [NEW CREATE] HAProxy backend + check → `printf 'frontend http\n  bind *:8081\n  default_backend app\nbackend app\n  server a1 127.0.0.1:8000 check\n' | sudo tee /etc/haproxy/haproxy.cfg && haproxy -c -f /etc/haproxy/haproxy.cfg`
- `m25-l8` [NEW CREATE] WireGuard peer → `sudo mkdir -p /etc/wireguard && sudo wg genkey | tee /tmp/wg-priv | wg pubkey > /tmp/wg-pub && printf '[Interface]\nPrivateKey = $(cat /tmp/wg-priv)\nListenPort = 51820\n[Peer]\nPublicKey = PEERKEY\nAllowedIPs = 10.99.0.2/32\nEndpoint = 203.0.113.10:51820\n' | sudo tee /etc/wireguard/wg0.conf && sudo wg-quick up wg0 || sudo wg setconf wg0 /etc/wireguard/wg0.conf`

### M26 Production Incident Response (4)
- `m26-l1` 502 → `sudo tail -n 20 /var/log/nginx/error.log; sudo systemctl restart app; curl -fsS http://localhost/health`
- `m26-l2` Disk pressure → `df -h / | tee ~/disk.txt && sudo truncate -s 0 /var/log/syslog && sudo logrotate -f /etc/logrotate.conf`
- `m26-l3` CPU → `top -b -n1 | head -n 20 > ~/top.txt && ps aux --sort=-%cpu | head`
- `m26-l4` OOM → `dmesg | grep -i -m2 'out of memory'; sudo sysctl -w vm.swappiness=10 && free -h`

### M27 Zero-Downtime Deploys & CI/CD (4)
- `m27-l1` Blue-green → `printf 'server { listen 80; location / { proxy_pass http://127.0.0.1:8001; } }\n' | sudo tee /etc/nginx/sites-enabled/app && sudo nginx -t && sudo systemctl reload nginx`
- `m27-l2` Health-gated → `curl -fsS http://127.0.0.1:8001/health && sudo systemctl reload nginx && echo DEPLOY_OK > ~/deploy-status.txt`
- `m27-l3` Compose rollout → `docker compose -f ~/projects/web/compose.yaml up -d --build && docker compose ps`
- `m27-l4` CI trigger → `gh workflow run deploy.yml && gh run list --limit 3`

### M28 Secrets Mgmt & Security Hardening (5)
- `m28-l1` Hunt secrets → `grep -rniE 'password|secret|AKIA' /srv/app 2>/dev/null | tee ~/leaks.txt`
- `m28-l2` Vault → `vault kv put secret/app db_password='s3cr3t-rotated' && vault kv get secret/app`
- `m28-l3` Least privilege → `sudo chown root:root /srv/app/.env && sudo chmod 600 /srv/app/.env && ls -l /srv/app/.env`
- `m28-l4` auditd → `sudo auditctl -w /etc/passwd -p wa -k identity && sudo auditctl -l | grep identity`
- `m28-l5` Image scan → `trivy image --severity HIGH,CRITICAL nginx:latest | tee ~/trivy.txt`

### M29 Observability & Alerting (5)
- `m29-l1` node_exporter → `sudo systemctl enable --now node_exporter && curl -s http://localhost:9100/metrics | head`
- `m29-l2` Prometheus scrape → `printf 'scrape_configs:\n  - job_name: node\n    static_configs:\n      - targets: ["localhost:9100"]\n' | sudo tee /etc/prometheus/prometheus.yml && promtool check config /etc/prometheus/prometheus.yml`
- `m29-l3` Alert rules → `printf 'groups:\n- name: host\n  rules:\n  - alert: HighLoad\n    expr: node_load1 > 4\n' | sudo tee /etc/prometheus/alerts.yml && promtool check rules /etc/prometheus/alerts.yml`
- `m29-l4` Persistent journal → `sudo mkdir -p /var/log/journal && sudo systemctl restart systemd-journald && journalctl --disk-usage`
- `m29-l5` Alertmanager → `printf 'route:\n  receiver: default\nreceivers:\n- name: default\n' > ~/alertmanager.yml && amtool check-config ~/alertmanager.yml`

### M30 Capacity Planning & Perf Tuning (5)
- `m30-l1` Baseline/headroom → `ab -n 2000 -c 50 http://localhost/ | grep -E 'Requests|Failed' | tee ~/baseline.txt`
- `m30-l2` perf → `sudo perf stat -e cycles,instructions -- sleep 1 2>&1 | tee ~/perf.txt`
- `m30-l3` fio/sysbench → `fio --name=seqread --rw=read --size=64M --bs=4k --numjobs=1 | tail -n 10 | tee ~/fio.txt`
- `m30-l4` Limits → `sudo sysctl -w net.core.somaxconn=16384 && echo '* soft nofile 65535' | sudo tee -a /etc/security/limits.conf`
- `m30-l5` Capacity plan → `printf '## Capacity Plan\nTarget: 70%% CPU at p95, 2x headroom\n' | sudo tee /srv/capacity.md && cat /srv/capacity.md`

### M31 linux advanced / Adv. Text & Data Wrangling Mastery (8 NEW)
- `m31-l1` csvkit clean + shape → `csvstat /srv/data/listings.csv > ~/csvstat.txt && csvcut -c id,city,price /srv/data/listings.csv > ~/listings-cut.csv`
- `m31-l2` jq multi-file join → `jq -s 'add | sort_by(.id)' /srv/data/a.json /srv/data/b.json > ~/merged.json && jq length ~/merged.json`
- `m31-l3` mlr reshape wide→long → `mlr --csv reshape -r 'q[0-9]' -o quarter,revenue /srv/data/quarterly.csv > ~/long.csv && head ~/long.csv`
- `m31-l4` yq edit in place → `yq -i '.services.web.replicas = 3' /srv/app/compose.yaml && yq '.services.web.replicas' /srv/app/compose.yaml`
- `m31-l5` sqlite analytics → `sqlite3 /tmp/lab.db "DROP TABLE IF EXISTS listings; .mode csv .import /srv/data/listings.csv listings" "SELECT city, AVG(price) FROM listings GROUP BY city ORDER BY 2 DESC;" | tee ~/city-avg.txt`
- `m31-l6` perl one-liner rewrite → `perl -pe 's/\bERROR\b/ERR/g' /var/log/app.log > ~/app-err.txt && grep -c ERR ~/app-err.txt`
- `m31-l7` parallel grep farm → `ls /srv/data/shard-*.log | xargs -P4 -I{} sh -c 'grep -h -o "[0-9]\\{3\\}" {} | sort | uniq -c' | awk '{a[$2]+=$1} END {for (k in a) print a[k], k}' | sort -rn > ~/codes-rollup.txt`
- `m31-l8` diff + patch workflow → `diff -u /etc/nginx/sites-available/default /tmp/default.new > ~/site.patch || true; sudo patch --dry-run -p0 < ~/site.patch`

### M32 linux advanced / Adv. Networking: Build & Create (8 NEW, create-heavy)
- `m32-l1` netns lab topology → `sudo ip netns add red && sudo ip netns add blue && ip netns list | tee ~/netns.txt`
- `m32-l2` veth + bridge + address → `sudo ip link add v-red type veth peer name v-red-br && sudo ip link set v-red netns red && sudo ip link add br-lab type bridge && sudo ip link set v-red-br master br-lab && sudo ip link set br-lab up && ip -d link show br-lab`
- `m32-l3` namespace routing → `sudo ip netns exec red ip addr add 10.200.1.1/24 dev v-red && sudo ip netns exec red ip link set v-red up && sudo ip netns exec red ip route | tee ~/red-routes.txt`
- `m32-l4` NAT masquerade → `sudo nft add table inet nat2; sudo nft 'add chain inet nat2 postrouting { type nat hook postrouting priority 100; }'; sudo nft add rule inet nat2 postrouting oifname eth0 masquerade; nft list ruleset > ~/nft.txt`
- `m32-l5` traffic shaping with tc → `sudo tc qdisc add dev eth0 root netem delay 50ms loss 1% && tc -s qdisc show dev eth0 | tee ~/tc.txt && sudo tc qdisc del dev eth0 root`
- `m32-l6` WireGuard full peer bring-up → `sudo wg-quick up wg0 || true; wg show | tee ~/wg.txt`
- `m32-l7` nginx stream LB create → `printf 'upstream api { server 127.0.0.1:8000; server 127.0.0.1:8001; }\nserver { listen 8090; location / { proxy_pass http://api; } }\n' | sudo tee /etc/nginx/conf.d/api-lb.conf && sudo nginx -t && curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8090/ || ss -tlnp | grep 8090`
- `m32-l8` tcpdump evidence + report → `sudo timeout 3 tcpdump -i any -w /tmp/lab.pcap -c 10 || true; tcpdump -r /tmp/lab.pcap -nn | head | tee ~/capture.txt`

### M33 linux advanced / Kernel, Boot & Internals (7 NEW)
- `m33-l1` dmesg triage → `dmesg --level=err,warn | tail -n 20 | tee ~/dmesg.txt && dmesg | grep -ci oom`
- `m33-l2` modules → `lsmod | head && sudo modprobe br_netfilter && lsmod | grep br_netfilter`
- `m33-l3` sysctl persist → `printf 'net.ipv4.ip_forward=1\nnet.core.somaxconn=16384\nvm.swappiness=10\n' | sudo tee /etc/sysctl.d/99-lab.conf && sudo sysctl --system | tail -n 5`
- `m33-l4` GRUB defaults → `grep GRUB_CMDLINE_LINUX /etc/default/grub | tee ~/grub.txt && sudo update-grub || sudo grub-mkconfig -o /boot/grub/grub.cfg`
- `m33-l5` cgroups v2 caps → `sudo mkdir -p /sys/fs/cgroup/lab && echo '100M' | sudo tee /sys/fs/cgroup/lab/memory.max && cat /sys/fs/cgroup/lab/memory.max`
- `m33-l6` namespaces list → `lsns -t net,mnt,pid | head | tee ~/ns.txt && sudo unshare --net --uts sh -c 'hostname lab-ns && hostname'`
- `m33-l7` boot analysis → `systemd-analyze blame | head -n 10 | tee ~/boot.txt && systemctl list-units --failed --no-pager`

### M34 linux advanced / Storage: LVM, RAID & Encryption (7 NEW)
- `m34-l1` LVM pv/vg → `sudo pvcreate /dev/vdb1 || true; sudo vgcreate vg0 /dev/vdb1 || true; sudo vgs | tee ~/vgs.txt`
- `m34-l2` LV create + mkfs + mount → `sudo lvcreate -L 5G -n lvdata vg0 && sudo mkfs.ext4 /dev/vg0/lvdata && sudo mkdir -p /data && sudo mount /dev/vg0/lvdata /data && df -h /data`
- `m34-l3` Resize online → `sudo lvextend -L+2G /dev/vg0/lvdata && sudo resize2fs /dev/vg0/lvdata && df -h /data | tee ~/data-df.txt`
- `m34-l4` mdadm RAID1 → `sudo mdadm --create /dev/md0 --level=1 --raid-devices=2 /dev/vdc1 /dev/vdd1 --run && cat /proc/mdstat | tee ~/mdstat.txt`
- `m34-l5` LUKS encrypt → `sudo cryptsetup luksFormat --batch-mode /dev/vde1 <<<YES; sudo cryptsetup open /dev/vde1 cryptdata <<<YES; sudo mkfs.ext4 /dev/mapper/cryptdata && sudo mount /dev/mapper/cryptdata /secure`
- `m34-l6` btrfs snapshot → `sudo btrfs subvolume snapshot /data /data/snap-$(date +%F) && sudo btrfs subvolume list /data | tee ~/snaps.txt`
- `m34-l7` NFS export → `printf '/data 10.20.0.0/24(rw,sync,no_subtree_check)\n' | sudo tee /etc/exports && sudo exportfs -ra && exportfs -v | tee ~/exports.txt`

### M35 linux advanced / Security, Hardening & Forensics (7 NEW)
- `m35-l1` sudoers least-privilege → `printf 'deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart app\n' | sudo tee /etc/sudoers.d/deploy && sudo visudo -c`
- `m35-l2` fail2ban jail → `printf '[sshd]\nenabled = true\nmaxretry = 3\nbantime = 3600\n' | sudo tee /etc/fail2ban/jail.d/lab.local && sudo systemctl restart fail2ban && sudo fail2ban-client status sshd`
- `m35-l3` AppArmor enforce → `sudo aa-enforce /etc/apparmor.d/usr.sbin.nginx 2>/dev/null || sudo apparmor_status | head -n 20 | tee ~/aa.txt`
- `m35-l4` auditd rules persist → `printf -- '-w /etc/passwd -p wa -k identity\n-w /etc/shadow -p wa -k identity\n' | sudo tee /etc/audit/rules.d/lab.rules && sudo augenrules --load && sudo auditctl -l | grep identity`
- `m35-l5` AIDE integrity baseline → `sudo aide --init 2>/dev/null; sudo cp /var/lib/aide/aide.db.new /var/lib/aide/aide.db 2>/dev/null; sudo aide --check | head -n 30 | tee ~/aide.txt`
- `m35-l6` Secret rotation with Vault → `vault kv put secret/app db_password="rot-$(date +%s)" && vault kv get -field=db_password secret/app > ~/db-pass.txt && chmod 600 ~/db-pass.txt`
- `m35-l7` Forensics timeline → `sudo find /srv/app -xdev -printf '%T+ %p %u:%g %m\n' | sort -r | head -n 20 | tee ~/timeline.txt && sudo lsof -i -P | head`

### M36 linux advanced / Performance Engineering & eBPF (7 NEW)
- `m36-l1` perf hot-spot → `sudo perf stat -d -- sleep 2 2>&1 | tee ~/perf-stat.txt && sudo perf top -n 5 -b | head -n 20`
- `m36-l2` bpftrace opensnoop → `sudo bpftrace -e 'tracepoint:syscalls:sys_enter_openat { printf("%s %s\n", comm, str(args->filename)); }' -c 'ls /etc' 2>&1 | head | tee ~/opensnoop.txt`
- `m36-l3` flame-graph workflow → `sudo perf record -F 99 -g -- sleep 3 && sudo perf script | stackcollapse-perf.pl | flamegraph.pl > ~/flame.svg; ls -lh ~/flame.svg`
- `m36-l4` I/O + vm pressure → `iostat -x 1 2 | tee ~/iostat.txt; vmstat 1 2 | tee ~/vmstat.txt; pidstat -d 1 2 | head`
- `m36-l5` tuned profile → `sudo tuned-adm active; sudo tuned-adm profile throughput-performance; tuned-adm active | tee ~/tuned.txt`
- `m36-l6` cgroup throttle test → `sudo systemd-run --unit=loadtest --property=CPUQuota=50% --property=MemoryMax=256M stress-ng --cpu 2 --timeout 5; systemctl show loadtest -p CPUQuotaPerSecUSec,MemoryMax`
- `m36-l7` limits + report → `printf '* soft nofile 65535\n* hard nofile 65535\n' | sudo tee /etc/security/limits.d/99-lab.conf && ulimit -n && printf '# Perf report\n' > ~/perf-report.md && cat ~/perf-stat.txt >> ~/perf-report.md`

### M37 linux advanced / GitOps, Containers & Prod Delivery (7 NEW)
- `m37-l1` Multi-stage Dockerfile → `printf 'FROM node:20 AS build\nWORKDIR /app\nCOPY . .\nRUN npm ci && npm run build\nFROM nginx\nCOPY --from=build /app/dist /usr/share/nginx/html\n' > ~/projects/web/Dockerfile && docker build -t lab-web:prod ~/projects/web | tail -n 3`
- `m37-l2` Compose prod rollout → `docker compose -f ~/projects/web/compose.yaml up -d --build && docker compose ps && curl -fsS http://localhost:8080/health`
- `m37-l3` k3s manifest apply → `printf 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: web\nspec:\n  replicas: 2\n  selector:\n    matchLabels: {app: web}\n  template:\n    metadata: {labels: {app: web}}\n    spec:\n      containers:\n      - {name: web, image: lab-web:prod, ports: [{containerPort: 80}]}\n' > ~/web-deploy.yaml && kubectl apply -f ~/web-deploy.yaml && kubectl get deploy web`
- `m37-l4` Helm values override → `helm upgrade --install web ./chart --set image.tag=prod --set replicaCount=3 --dry-run | head -n 20 | tee ~/helm.txt`
- `m37-l5` Health-gated switch → `curl -fsS http://127.0.0.1:8001/health && printf 'server { listen 80; location / { proxy_pass http://127.0.0.1:8001; } }\n' | sudo tee /etc/nginx/sites-enabled/app && sudo nginx -t && sudo systemctl reload nginx`
- `m37-l6` CI pipeline watch → `gh workflow run deploy.yml --ref main && sleep 2; gh run list --limit 3 | tee ~/ci.txt`
- `m37-l7` Rollback drill → `kubectl rollout history deploy/web && kubectl rollout undo deploy/web && kubectl rollout status deploy/web`

### M38 linux advanced / Final Capstone (5 NEW)
- `m38-l1` Ship hardened stack → `sudo ufw allow 80,443/tcp && sudo systemctl enable --now app caddy node_exporter && curl -fsS http://localhost/health && ss -tlnp | grep -E '80|443'`
- `m38-l2` Break-fix: disk + 502 → `df -h / | tee ~/pre.txt; sudo journalctl -u app -p err -n 10 --no-pager; sudo systemctl restart app; curl -fsS http://localhost/health && echo RECOVERED > ~/recovered.txt`
- `m38-l3` Break-fix: CPU + OOM guard → `ps aux --sort=-%cpu | head -n 5 | tee ~/cpu.txt; sudo sysctl -w vm.swappiness=10; sudo systemctl set-property app CPUQuota=80% MemoryMax=512M; systemctl show app -p CPUQuotaPerSecUSec,MemoryMax`
- `m38-l4` Write POSTMORTEM + runbook → `printf '# Postmortem\n## Timeline\n## Root cause\n## Fix\n## Prevention\n' > ~/POSTMORTEM.md && printf '# Runbook\nHealth: curl -fsS http://localhost/health\nLogs: journalctl -u app -f\n' > ~/RUNBOOK.md && ls -lh ~/POSTMORTEM.md ~/RUNBOOK.md`
- `m38-l5` Exit interview (explain stack) → `echo 'Stack: Caddy→nginx→systemd app→postgres; obs: node_exporter+prom; deploys: blue-green+compose+k8s' | tee ~/stack.txt && curl -fsS http://localhost/health && sudo nginx -t && kubectl get deploy web 2>/dev/null || docker ps | grep web`

## 6. Build order (code phase, after these docs)

1. Scaffold Next.js + port V1 `public/js` as-is (green baseline, 137 pass).
2. Add `totalCommands` + `#stat-cmds` + new reset semantics + top `x/211` bar.
3. Add search index, tip-day, 40 new tips (180+), palette actions.
4. Add new commands + `net` model + fixtures (net-create, LVM, nft/wg, eBPF stubs).
5. Append 74 lessons (IDs above) with state-based checks; walkthrough solves 211.
6. Quest/streak/exam/boss/analytics/achievements/export/deep-links + theme.
7. UI smoke 50+ checks (odometer, resets, keyboard, search, bar). Vercel deploy.

## 7. Acceptance

- [ ] 211 IDs present, V1 IDs untouched; `npm test` → `ALL TESTS PASSED` (211 solved).
- [ ] Header shows Level/XP/Done/Study/TotalCmds; bar shows `x/211`.
- [ ] Wrong command still +1 Total; empty Enter +0.
- [ ] Reset progress keeps Total; Reset machine zeroes Total (type-RESET).
- [ ] Mouseless complete: every button reachable via `Ctrl+K`; map matches PRD §8.
- [ ] Search finds any task; Tip of Day rotates; 180+ tips browsable via `Ctrl+T`.
- [ ] Networking tasks ≥80% create-graded on state; `linux advanced` folder collapses.
- [ ] Vercel production URL green; `?theme=` + `#m..-l..` links work.
