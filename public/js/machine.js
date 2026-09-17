/* ============================================================================
 * machine.js — Builds the default simulated Ubuntu server state.
 * Exposes: createMachine() -> { fs, state }
 * ==========================================================================*/
(function (global) {
  "use strict";

  var VFS = global.VFS;
  if (typeof require !== "undefined" && !VFS) VFS = require("./filesystem.js");

  function logLines(entries) {
    return entries.join("\n") + "\n";
  }

  function buildFs() {
    var fs = VFS.build({
      bin: {}, sbin: {}, lib: {}, lib64: {}, usr: { bin: {}, lib: {}, share: {}, local: { bin: {}, share: {} } },
      boot: {}, dev: {}, sys: {}, proc: {}, run: {},
      opt: {}, srv: { app: { _owner: "deploy", _group: "deploy", _mode: 0o755,
        ".env": { _owner: "deploy", _group: "deploy", _mode: 0o644, content: "DATABASE_URL=postgres://appuser:supersecret@db1:5432/appdb\nDB_PASSWORD=supersecret\nSECRET_KEY=sk_live_9f8a7b6c5d4e\nDEBUG=false\n" },
        "app.py": { _owner: "deploy", _group: "deploy", _mode: 0o644, content: "from flask import Flask\napp = Flask(__name__)\napp.run(host=\"127.0.0.1\", port=8000)\n" },
        "requirements.txt": { _owner: "deploy", _group: "deploy", content: "flask==3.0.0\ngunicorn==21.2.0\npsycopg2-binary==2.9.9\n" },
        "config.json": { _owner: "deploy", _group: "deploy", content: '{\n  "app": "web",\n  "database": { "host": "db1", "port": 5432, "name": "appdb" },\n  "workers": 4,\n  "features": ["api", "admin"]\n}\n' } } },
      etc: {
        hostname: { content: "ubuntu-lab\n" },
        hosts: { content: "127.0.0.1 localhost\n127.0.1.1 ubuntu-lab\n::1 localhost ip6-localhost\n" },
        "os-release": { content: 'PRETTY_NAME="Ubuntu 22.04.4 LTS"\nNAME="Ubuntu"\nVERSION_ID="22.04"\nVERSION="22.04.4 LTS (Jammy Jellyfish)"\nID=ubuntu\nID_LIKE=debian\nHOME_URL="https://www.ubuntu.com/"\n' },
        passwd: { content: "root:x:0:0:root:/root:/bin/bash\nsam:x:1000:1000:Sam Learner:/home/sam:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\ndeploy:x:1001:1001:Deploy User:/home/deploy:/bin/bash\n" },
        group: { content: "root:x:0:\nsudo:x:27:sam\nsam:x:1000:\nwww-data:x:33:\ndeploy:x:1001:\ndevelopers:x:1002:sam,deploy\n" },
        shadow: { content: "root:*:19000:0:99999:7:::\nsam:$6$lab$hash:19000:0:99999:7:::\n", _mode: 0o640 },
        sudoers: { content: "Defaults env_reset\nroot ALL=(ALL:ALL) ALL\n%sudo ALL=(ALL:ALL) ALL\n", _mode: 0o440 },
        ssh: {
          sshd_config: { content: "# OpenSSH server configuration\nPort 22\nPermitRootLogin prohibit-password\nPasswordAuthentication yes\nPubkeyAuthentication yes\nPermitEmptyPasswords no\nX11Forwarding no\n" },
          _mode: 0o755
        },
        caddy: {},
        "logrotate.d": {},
        security: { "limits.conf": { content: "# /etc/security/limits.conf\n#<domain>      <type>  <item>         <value>\n*               soft    core            0\n*               hard    nofile          65535\n" } },
        nginx: {
          "nginx.conf": { content: "user www-data;\nworker_processes auto;\nevents { worker_connections 768; }\nhttp {\n  include /etc/nginx/sites-enabled/*;\n}\n" },
          "sites-available": { default: { content: "server {\n  listen 80 default_server;\n  root /var/www/html;\n  index index.html;\n}\n" } },
          "sites-enabled": {}
        },
        systemd: { system: {} },
        fstab: { content: "# <file system> <mount point> <type> <options> <dump> <pass>\nUUID=abcd-1234 / ext4 errors=remount-ro 0 1\ntmpfs /tmp tmpfs defaults 0 0\n" },
        crontab: { content: "# /etc/crontab: system-wide crontab\nSHELL=/bin/sh\nPATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin\n17 * * * * root cd / && run-parts --report /etc/cron.hourly\n" },
        resolv: { conf: { content: "nameserver 1.1.1.1\nnameserver 8.8.8.8\n" } },
        apt: { "sources.list": { content: "deb http://archive.ubuntu.com/ubuntu jammy main restricted universe multiverse\n" } },
        environment: { content: "PATH=\"/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin\"\n" }
      },
      var: {
        log: {
          syslog: { content: "" }, "auth.log": { content: "", _mode: 0o640 }, kern: { log: { content: "" } },
          dpkg: { log: { content: "" } },
          nginx: { "access.log": { content: "" }, "error.log": { content: "" }, _owner: "www-data" }
        },
        www: { html: { "index.html": { content: "<h1>Welcome to nginx</h1>\n" } } },
        lib: {}, cache: {}, tmp: {}
      },
      root: { ".bashrc": { content: "# root bashrc\n" }, ".ssh": {} },
      home: {
        sam: {
          _owner: "sam", _group: "sam",
          ".bashrc": { content: "# ~/.bashrc\nexport PS1='\\u@\\h:\\w\\$ '\nalias ll='ls -alF'\nalias la='ls -A'\n" },
          ".profile": { content: "# ~/.profile\n" },
          ".ssh": { _owner: "sam", _group: "sam", _mode: 0o700, authorized_keys: { content: "", _owner: "sam", _group: "sam" } },
          notes: { content: "My Linux learning notes\n" },
          projects: { _owner: "sam", _group: "sam" },
          downloads: { _owner: "sam", _group: "sam" },
          "todo.txt": { content: "learn linux\npractice daily\n" }
        },
        deploy: { _owner: "deploy", _group: "deploy", ".ssh": { _mode: 0o700 }, app: {} },
        alice: { _owner: "alice", _group: "alice" },
        bob: { _owner: "bob", _group: "bob" }
      },
      tmp: { "install.log": { content: "installing...\n" } }
    });
    return fs;
  }

  function createMachine() {
    var fs = buildFs();

    fs.writeFile("/var/log/syslog", "/", {}, logLines([
      "Sep 10 08:01:12 ubuntu-lab systemd[1]: Started Daily apt download activities.",
      "Sep 10 08:15:44 ubuntu-lab kernel: [    0.000000] Linux version 5.15.0-91-generic (buildd@lcy02)",
      "Sep 10 08:21:03 ubuntu-lab systemd[1]: Starting User Manager for UID 1000...",
      "Sep 10 09:02:11 ubuntu-lab sshd[2210]: Accepted publickey for sam from 10.0.2.2 port 51234 ssh2",
      "Sep 10 09:14:55 ubuntu-lab nginx[2401]: started",
      "Sep 10 09:30:02 ubuntu-lab CRON[3100]: (root) CMD (cd / && run-parts --report /etc/cron.hourly)",
      "Sep 10 09:41:19 ubuntu-lab sudo:     sam : TTY=pts/0 ; PWD=/home/sam ; USER=root ; COMMAND=/usr/bin/apt update",
      "Sep 10 09:59:48 ubuntu-lab systemd[1]: Reloading nginx.service.",
      "Sep 10 10:00:00 ubuntu-lab systemd[1]: nginx.service: Succeeded.",
      "Sep 10 10:12:37 ubuntu-lab kernel: [ 4312.223311] eth0: link becomes ready"
    ]));

    fs.writeFile("/var/log/auth.log", "/", {}, logLines([
      "Sep 10 08:00:03 ubuntu-lab sshd[2001]: Server listening on 0.0.0.0 port 22.",
      "Sep 10 09:02:10 ubuntu-lab sshd[2210]: Accepted publickey for sam from 10.0.2.2 port 51234 ssh2: RSA SHA256:AbC123",
      "Sep 10 09:20:41 ubuntu-lab sudo:  www-data : user NOT in sudoers ; TTY=pts/1 ; COMMAND=/bin/bash",
      "Sep 10 10:05:19 ubuntu-lab sshd[2410]: Failed password for invalid user admin from 203.0.113.9 port 44210 ssh2",
      "Sep 10 10:05:22 ubuntu-lab sshd[2412]: Failed password for invalid user oracle from 203.0.113.9 port 44211 ssh2",
      "Sep 10 10:05:25 ubuntu-lab sshd[2414]: Failed password for invalid user test from 203.0.113.9 port 44212 ssh2"
    ]));

    fs.writeFile("/var/log/kern.log", "/", {}, logLines([
      "Sep 10 08:15:44 ubuntu-lab kernel: [    0.000000] Command line: BOOT_IMAGE=/vmlinuz-5.15.0-91-generic root=UUID=abcd-1234 ro",
      "Sep 10 08:15:45 ubuntu-lab kernel: [    1.234567] EXT4-fs (sda1): mounted filesystem with ordered data mode",
      "Sep 10 09:12:37 ubuntu-lab kernel: [ 4312.223311] eth0: link becomes ready",
      "Sep 10 10:04:58 ubuntu-lab kernel: [ 6120.112233] python3 invoked oom-killer: gfp_mask=0x140cca(GFP_HIGHUSER_MOVABLE|__GFP_COMP), order=0",
      "Sep 10 10:04:59 ubuntu-lab kernel: [ 6120.334455] Out of memory: Killed process 3010 (python3) total-vm:123456kB, anon-rss:98765kB, file-rss:0kB"
    ]));

    fs.writeFile("/var/log/nginx/access.log", "/", {}, logLines([
      '10.0.2.2 - - [10/Sep/2026:09:14:55 +0000] "GET / HTTP/1.1" 200 612 "-" "Mozilla/5.0"',
      '10.0.2.2 - - [10/Sep/2026:09:15:01 +0000] "GET /favicon.ico HTTP/1.1" 404 153 "-" "Mozilla/5.0"',
      '203.0.113.9 - - [10/Sep/2026:09:40:11 +0000] "GET /wp-login.php HTTP/1.1" 404 153 "-" "curl/7.81"',
      '203.0.113.9 - - [10/Sep/2026:09:40:14 +0000] "GET /.env HTTP/1.1" 403 153 "-" "curl/7.81"'
    ]));

    fs.writeFile("/var/log/nginx/error.log", "/", {}, logLines([
      "2026/09/10 09:15:01 [error] 2401#2401: *1 open() \"/var/www/html/favicon.ico\" failed (2: No such file or directory)",
      "2026/09/10 09:40:11 [error] 2401#2401: *9 open() \"/var/www/html/wp-login.php\" failed (2: No such file or directory)",
      "2026/09/10 10:20:00 [error] 2401#2401: *20 connect() failed (111: Connection refused) while connecting to upstream, client: 10.0.2.2, server: app.example.com, request: \"GET / HTTP/1.1\", upstream: \"http://127.0.0.1:8000/\", host: \"app.example.com\"",
      "2026/09/10 10:20:01 [error] 2401#2401: *20 no live upstreams while connecting to upstream, client: 10.0.2.2, server: app.example.com"
    ]));

    var state = {
      fs: fs,
      hostname: "ubuntu-lab",
      kernel: "5.15.0-91-generic",
      osPretty: "Ubuntu 22.04.4 LTS",
      user: "sam",
      cwd: "/home/sam",
      env: {
        HOME: "/home/sam", USER: "sam", SHELL: "/bin/bash", HOSTNAME: "ubuntu-lab",
        PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin",
        PWD: "/home/sam", LANG: "en_US.UTF-8", PS1: "\\u@\\h:\\w\\$ ", EDITOR: "nano"
      },
      aliases: { ll: "ls -alF", la: "ls -A", "..": "cd .." },
      functions: {},
      umask: 0o022,
      history: [],
      jobs: [],
      users: {
        root: { uid: 0, gid: 0, home: "/root", shell: "/bin/bash", groups: ["root"], password: "" },
        sam: { uid: 1000, gid: 1000, home: "/home/sam", shell: "/bin/bash", groups: ["sam", "sudo", "developers"], password: "lab" },
        "www-data": { uid: 33, gid: 33, home: "/var/www", shell: "/usr/sbin/nologin", groups: ["www-data"], password: "!" },
        deploy: { uid: 1001, gid: 1001, home: "/home/deploy", shell: "/bin/bash", groups: ["deploy", "developers"], password: "lab" },
        alice: { uid: 1002, gid: 1002, home: "/home/alice", shell: "/bin/bash", groups: ["alice"], password: "!" },
        bob: { uid: 1003, gid: 1003, home: "/home/bob", shell: "/bin/bash", groups: ["bob"], password: "!" },
        nobody: { uid: 65534, gid: 65534, home: "/nonexistent", shell: "/usr/sbin/nologin", groups: ["nogroup"], password: "!" }
      },
      groups: {
        root: [0, []], sudo: [27, ["sam"]], sam: [1000, ["sam"]], "www-data": [33, []],
        deploy: [1001, ["deploy"]], developers: [1002, ["sam", "deploy"]],
        alice: [1002, ["alice"]], bob: [1003, ["bob"]], nogroup: [65534, []]
      },
      nextUid: 1004,
      processes: [
        { pid: 1, user: "root", cpu: 0.0, mem: 0.1, tty: "?", stat: "Ss", start: "08:00", time: "00:00:03", command: "/sbin/init" },
        { pid: 214, user: "root", cpu: 0.0, mem: 0.6, tty: "?", stat: "Ss", start: "08:00", time: "00:00:01", command: "/lib/systemd/systemd-journald" },
        { pid: 402, user: "root", cpu: 0.0, mem: 0.2, tty: "?", stat: "Ss", start: "08:00", time: "00:00:00", command: "/lib/systemd/systemd-resolved" },
        { pid: 512, user: "root", cpu: 0.0, mem: 0.5, tty: "?", stat: "Ss", start: "08:00", time: "00:00:02", command: "/usr/sbin/cron -f" },
        { pid: 640, user: "root", cpu: 0.0, mem: 0.7, tty: "?", stat: "Ss", start: "08:00", time: "00:00:00", command: "sshd: /usr/sbin/sshd -D [listener]" },
        { pid: 2210, user: "sam", cpu: 0.1, mem: 0.4, tty: "pts/0", stat: "Ss", start: "09:02", time: "00:00:00", command: "-bash" },
        { pid: 2301, user: "www-data", cpu: 0.0, mem: 0.9, tty: "?", stat: "S", start: "09:14", time: "00:00:05", command: "nginx: worker process" },
        { pid: 2300, user: "root", cpu: 0.0, mem: 0.5, tty: "?", stat: "Ss", start: "09:14", time: "00:00:00", command: "nginx: master process /usr/sbin/nginx" },
        { pid: 2500, user: "root", cpu: 0.0, mem: 1.2, tty: "?", stat: "Ssl", start: "08:01", time: "00:00:08", command: "/usr/bin/dockerd -H fd://" },
        { pid: 2512, user: "root", cpu: 0.0, mem: 0.3, tty: "?", stat: "S", start: "08:01", time: "00:00:00", command: "containerd" },
        { pid: 3010, user: "sam", cpu: 1.4, mem: 2.1, tty: "pts/0", stat: "R", start: "10:15", time: "00:00:12", command: "python3 manage.py runserver" }
      ],
      nextPid: 3100,
      services: {
        ssh: { description: "OpenBSD Secure Shell server", active: true, enabled: true },
        nginx: { description: "A high performance web server", active: true, enabled: true },
        docker: { description: "Docker Application Container Engine", active: true, enabled: true },
        cron: { description: "Regular background program processing daemon", active: true, enabled: true },
        ufw: { description: "Uncomplicated firewall", active: false, enabled: false },
        postgresql: { description: "PostgreSQL RDBMS", active: false, enabled: false },
        caddy: { description: "Caddy web server", active: false, enabled: false },
        fail2ban: { description: "Fail2Ban service", active: false, enabled: false },
        node_exporter: { description: "Prometheus Node Exporter", active: false, enabled: false },
        "systemd-journald": { description: "Journal Service", active: true, enabled: true },
        "app.service": { description: "Sample web application", active: false, enabled: false },
        "certbot.timer": { description: "Run certbot twice daily", active: true, enabled: true },
        "logrotate.timer": { description: "Daily rotation of log files", active: true, enabled: true },
        "backup.timer": { description: "Nightly backup job", active: false, enabled: false },
        "systemd-resolved": { description: "Network Name Resolution", active: true, enabled: true },
        "unattended-upgrades": { description: "Unattended Upgrades Shutdown", active: true, enabled: true }
      },
      docker: {
        images: [
          { repository: "nginx", tag: "latest", id: "a8758716bb6a", size: "187MB", created: "2 weeks ago" },
          { repository: "ubuntu", tag: "22.04", id: "b1d2c3e4f5a6", size: "77.8MB", created: "3 weeks ago" },
          { repository: "node", tag: "20-alpine", id: "c2e3f4a5b6c7", size: "128MB", created: "5 days ago" },
          { repository: "postgres", tag: "16", id: "d3f4a5b6c7d8", size: "412MB", created: "1 week ago" }
        ],
        containers: [],
        volumes: [],
        networks: [{ name: "bridge", driver: "bridge" }, { name: "host", driver: "host" }, { name: "none", driver: "null" }],
        nextId: 1
      },
      network: {
        interfaces: [
          { name: "lo", flags: "LOOPBACK,UP", mtu: 65536, state: "UNKNOWN", addr: "127.0.0.1/8", mac: "00:00:00:00:00:00" },
          { name: "eth0", flags: "BROADCAST,MULTICAST,UP", mtu: 1500, state: "UP", addr: "10.0.2.15/24", mac: "52:54:00:12:34:56" },
          { name: "docker0", flags: "BROADCAST,MULTICAST,UP", mtu: 1500, state: "UP", addr: "172.17.0.1/16", mac: "02:42:ac:11:00:01" }
        ],
        routes: [
          { dest: "default", via: "10.0.2.2", dev: "eth0" },
          { dest: "10.0.2.0/24", via: "0.0.0.0", dev: "eth0" },
          { dest: "172.17.0.0/16", via: "0.0.0.0", dev: "docker0" }
        ],
        dns: ["1.1.1.1", "8.8.8.8"],
        listeners: [
          { proto: "tcp", local: "0.0.0.0:22", process: "sshd" },
          { proto: "tcp", local: "0.0.0.0:80", process: "nginx" },
          { proto: "tcp", local: "127.0.0.1:8000", process: "python3" },
          { proto: "tcp", local: "127.0.0.53:53", process: "systemd-resolve" }
        ]
      },
      firewall: { enabled: false, defaultIncoming: "deny", rules: [] },
      ssd: { port: 22, passwordAuth: true, rootLogin: "prohibit-password", publicKeyAuth: true },
      apt: {
        installed: ["nginx", "openssh-server", "docker.io", "docker-compose-plugin", "python3", "git", "curl", "wget", "ufw", "cron", "postgresql-client"],
        available: ["htop", "vim", "tmux", "mc", "net-tools", "tcpdump", "nmap", "netcat-openbsd", "mtr-tiny", "apache2-utils", "wrk", "hey", "siege", "nginx", "caddy", "redis-server", "fail2ban", "certbot", "unattended-upgrades", "postgresql", "mysql-server", "jq", "tree", "unzip", "restic", "rclone", "ansible", "lynis", "auditd", "acl", "smartmontools", "sysstat"]
      },
      cron: [
        { schedule: "17 * * * *", user: "root", command: "cd / && run-parts --report /etc/cron.hourly", source: "/etc/crontab" }
      ],
      sysctl: {
        "net.ipv4.ip_forward": 0,
        "net.core.somaxconn": 4096,
        "vm.swappiness": 60,
        "fs.file-max": 2097152,
        "net.ipv4.tcp_syncookies": 1
      },
      swaps: [],
      at: [],
      limits: { "open files": 1024, "max user processes": 4096 },
      postgres: { version: "16", databases: ["postgres", "template0", "template1"], users: ["postgres"], listening: "127.0.0.1", backups: [] },
      caddy: { version: "v2.7.6", running: false, config: null },
      backups: { resticRepos: [], resticSnapshots: [], rcloneRemotes: ["offsite"] },
      ansible: { inventory: ["web1", "db1"], lastPlay: null },
      logrotate: { config: true },
      vault: { secrets: {}, sealed: false },
      audit: [],
      ci: { runs: [] },
      monitoring: { exporters: [], prometheusConfig: false, alertRules: false },
      perf: {},
      hosts: { "ubuntu-lab": "127.0.1.1", "web1": "10.0.2.21", "db1": "10.0.2.31", "app.example.com": "10.0.2.15" },
      remote: {
        web1: { host: "10.0.2.21", user: "deploy", reachable: true, files: "/var/www/app" },
        db1: { host: "10.0.2.31", user: "ubuntu", reachable: true }
      },
      disks: [
        { filesystem: "/dev/sda1", size: 25, used: 7.2, avail: 17, usePct: 30, mount: "/" },
        { filesystem: "tmpfs", size: 0.4, used: 0, avail: 0.4, usePct: 0, mount: "/run" },
        { filesystem: "/dev/sda15", size: 0.1, used: 0.005, avail: 0.1, usePct: 6, mount: "/boot/efi" },
        { filesystem: "tmpfs", size: 0.9, used: 0, avail: 0.9, usePct: 0, mount: "/dev/shm" }
      ],
      mounts: [
        { device: "/dev/sda1", mount: "/", type: "ext4", options: "(rw,relatime)" },
        { device: "tmpfs", mount: "/run", type: "tmpfs", options: "(rw,nosuid,nodev)" },
        { device: "tmpfs", mount: "/dev/shm", type: "tmpfs", options: "(rw,nosuid,nodev)" }
      ],
      version: "22.04.4 LTS (Jammy Jellyfish)"
    };

    state.fs = fs;
    return state;
  }

  var api = { createMachine: createMachine, buildFs: buildFs };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.Machine = api;
})(typeof window !== "undefined" ? window : globalThis);
