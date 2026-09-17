/* ============================================================================
 * shell.js — Command-line parser + interpreter for the Linux Mastery simulator.
 * Supports: quoting, $VARS, ${VARS}, $(...), `...`, globs, pipes, redirection,
 *           && || ; &, aliases, history, background jobs, ssh remote sessions.
 * Exposes: global.Shell
 * ==========================================================================*/
(function (global) {
  "use strict";
  var VFS = global.VFS, Commands = global.Commands;

  var OPCHARS = "|&;<>()";

  function Shell(machine) {
    this.m = machine;
    this.sessions = []; // stack of {machine, prompt}
  }

  Shell.prototype.current = function () {
    return this.sessions.length ? this.sessions[this.sessions.length - 1].machine : this.m;
  };

  /* ---------------- tokenizer ---------------- */
  Shell.prototype.scan = function (line) {
    var m = this.m;
    var toks = [], i = 0, n = line.length;
    function isWS(c) { return c === " " || c === "\t"; }
    while (i < n) {
      var c = line[i];
      if (isWS(c)) { i++; continue; }
      // fd-specific redirections: 2>, 2>>, 2>&1
      if (c === "2" && line[i + 1] === ">" && (i === 0 || isWS(line[i - 1]))) {
        if (line[i + 2] === "&" && line[i + 3] === "1") { toks.push({ op: "2>&1" }); i += 4; continue; }
        if (line[i + 2] === ">") { toks.push({ op: "2>>" }); i += 3; continue; }
        toks.push({ op: "2>" }); i += 2; continue;
      }
      // control / redirection operators
      if (OPCHARS.indexOf(c) !== -1) {
        var two = line.substr(i, 2);
        if (two === ">>") { toks.push({ op: ">>" }); i += 2; continue; }
        if (two === "||") { toks.push({ op: "||" }); i += 2; continue; }
        if (two === "&&") { toks.push({ op: "&&" }); i += 2; continue; }
        if (two === "&>") { toks.push({ op: "&>" }); i += 2; continue; }
        if (c === "|") { toks.push({ op: "|" }); i++; continue; }
        if (c === "&") { toks.push({ op: "&" }); i++; continue; }
        if (c === ";") { toks.push({ op: ";" }); i++; continue; }
        if (c === ">") { toks.push({ op: ">" }); i++; continue; }
        if (c === "<") { toks.push({ op: "<" }); i++; continue; }
        if (c === "(" || c === ")") { toks.push({ op: c }); i++; continue; }
      }
      // word
      var val = "", quoted = false, ok = true;
      while (i < n) {
        c = line[i];
        if (isWS(c) || OPCHARS.indexOf(c) !== -1) {
          // allow 2> style handled: if c==='2' before '>' it's part of op
          if (c === "2" && line[i + 1] === ">") { val += c; i++; continue; }
          break;
        }
        if (c === "'") {
          quoted = true; i++;
          while (i < n && line[i] !== "'") { val += line[i++]; }
          i++; continue;
        }
        if (c === '"') {
          quoted = true; i++;
          while (i < n && line[i] !== '"') {
            if (line[i] === "\\" && i + 1 < n) {
              var nx = line[i + 1];
              if (nx === '"' || nx === "\\" || nx === "$" || nx === "`") { val += nx; i += 2; continue; }
              val += "\\"; i++; continue;
            }
            if (line[i] === "$") { var r = this.expandDollar(line, i, m); if (r) { val += r.val; i = r.next; continue; } }
            if (line[i] === "`") { var rb = this.expandBacktick(line, i, m); if (rb) { val += rb.val; i = rb.next; continue; } }
            val += line[i++];
          }
          i++; continue;
        }
        if (c === "\\") { if (i + 1 < n) { val += line[i + 1]; i += 2; continue; } i++; continue; }
        if (c === "$") { var r2 = this.expandDollar(line, i, m); if (r2) { val += r2.val; i = r2.next; continue; } val += c; i++; continue; }
        if (c === "`") { var r3 = this.expandBacktick(line, i, m); if (r3) { val += r3.val; i = r3.next; continue; } val += c; i++; continue; }
        val += c; i++;
      }
      toks.push({ word: val, quoted: quoted });
    }
    return toks;
  };

  Shell.prototype.expandDollar = function (s, i, m) {
    if (s[i] !== "$") return null;
    var n = s.length, j = i + 1;
    if (s[j] === "(") {
      var depth = 1, k = j + 1, start = k;
      while (k < n && depth > 0) { if (s[k] === "(") depth++; else if (s[k] === ")") depth--; if (depth === 0) break; k++; }
      var cmd = s.slice(start, k);
      var res = this.exec(cmd, { capture: true });
      return { val: (res.output || "").replace(/\n$/, ""), next: k + 1 };
    }
    if (s[j] === "{") {
      var end = s.indexOf("}", j);
      if (end === -1) return null;
      var name = s.slice(j + 1, end);
      return { val: m.env[name] != null ? String(m.env[name]) : "", next: end + 1 };
    }
    if (s[j] === "?") return { val: String(this._lastCode || 0), next: j + 1 };
    if (s[j] === "#") return { val: "0", next: j + 1 };
    if (s[j] === "$") return { val: "1", next: j + 1 };
    var mm = /^[A-Za-z_][A-Za-z0-9_]*/.exec(s.slice(j));
    if (!mm) return null;
    var val = m.env[mm[0]];
    return { val: val == null ? "" : String(val), next: j + mm[0].length };
  };

  Shell.prototype.expandBacktick = function (s, i, m) {
    var end = s.indexOf("`", i + 1);
    if (end === -1) return null;
    var res = this.exec(s.slice(i + 1, end), { capture: true });
    return { val: (res.output || "").replace(/\n$/, ""), next: end + 1 };
  };

  /* ---------------- glob ---------------- */
  Shell.prototype.glob = function (pattern, m) {
    var cwd = m.cwd;
    var abs = m.fs.resolve(pattern, cwd, m.env);
    var reStr = "^" + abs.split("/").map(function (seg) {
      return seg.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*").replace(/\?/g, "[^/]");
    }).join("/") + "$";
    var rx;
    try { rx = new RegExp(reStr); } catch (e) { return [pattern]; }
    var matches = [];
    (function walk(node, path) {
      for (var k in node.children) {
        var child = node.children[k];
        var childPath = (path === "/" ? "" : path) + "/" + k;
        if (rx.test(childPath)) matches.push(childPath);
        if (child.type === VFS.type.DIR) walk(child, childPath);
      }
    })(m.fs.root, "/");
    if (!matches.length) return [pattern];
    return matches.sort();
  };

  /* ---------------- parse into pipelines ---------------- */
  Shell.prototype.parse = function (toks) {
    var groups = []; // array of {connector, pipeline}
    var pipeline = [];
    var connector = null;
    var cur = [];
    function flushPipe() { if (cur.length) { pipeline.push(cur); cur = []; } }
    function flushPipeline() { flushPipe(); if (pipeline.length) { groups.push({ connector: connector, pipeline: pipeline }); pipeline = []; } connector = null; }
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i];
      if (t.op) {
        if (t.op === "|") { flushPipe(); }
        else if (t.op === "&&" || t.op === "||" || t.op === ";" || t.op === "&") { flushPipeline(); connector = t.op; }
        else { cur.push(t); } // redirection operator stays in command
      } else cur.push(t);
    }
    flushPipeline();
    return groups;
  };

  Shell.prototype.expandAliases = function (argv, m) {
    if (!argv.length) return argv;
    var first = argv[0].v;
    if (m.aliases[first]) {
      var aliasToks = this.scan(m.aliases[first]).map(function (t) { return t; });
      return aliasToks.concat(argv.slice(1));
    }
    return argv;
  };

  /* ---------------- execute ---------------- */
  Shell.prototype.exec = function (line, opts) {
    opts = opts || {};
    var m = this.current();
    m.env.PWD = m.cwd;
    line = String(line);
    var toks;
    try { toks = this.scan(line); } catch (e) { return { output: "", code: 1 }; }
    if (!toks.length) return { output: "", code: 0 };
    if (!opts.capture) m.history.push(line.trim());

    var groups = this.parse(toks);
    var output = "";
    var code = 0;
    var lastResult = null;
    var state = { clear: false, exit: false, ssh: null, attachContainer: null };

    for (var gi = 0; gi < groups.length; gi++) {
      var g = groups[gi];
      // short-circuit
      if (g.connector === "&&" && code !== 0) continue;
      if (g.connector === "||" && code === 0) continue;

      var pipelineResult = this.runPipeline(g.pipeline, m);
      output += pipelineResult.output;
      code = pipelineResult.code;
      lastResult = pipelineResult;
      if (pipelineResult.ssh) state.ssh = pipelineResult.ssh;
      if (pipelineResult.attachContainer) state.attachContainer = pipelineResult.attachContainer;
      if (pipelineResult.exit) { state.exit = true; if (!opts.capture) break; }
      if (pipelineResult.clear) state.clear = true;

      if (g.connector === "&") {
        m.jobs.push({ state: "Running", command: g.pipeline.map(function (c) { return c.filter(function (t) { return t.word != null; }).map(function (t) { return t.word; }).join(" "); }).join(" | ") });
        code = 0;
      }
    }
    this._lastCode = code;
    return { output: output, code: code, clear: state.clear, exit: state.exit, ssh: state.ssh, result: lastResult, machine: m };
  };

  Shell.prototype.runPipeline = function (pipeline, m) {
    var stdin = "";
    var result = { output: "", code: 0 };
    for (var i = 0; i < pipeline.length; i++) {
      var cmd = pipeline[i];
      var res = this.runSimple(cmd, stdin, m);
      if (res.ssh) return { output: result.output + (res.stdout || "") + (res.stderr || ""), code: res.code, ssh: res.ssh, exit: res.exit, clear: res.clear, attachContainer: res.attachContainer };
      if (res.attachContainer) return { output: result.output, code: 0, attachContainer: res.attachContainer };
      if (res.clear) return { output: result.output, code: 0, clear: true };
      if (res.exit) return { output: result.output + (res.stdout || "") + (res.stderr || ""), code: res.code || 0, exit: true };
      if (i < pipeline.length - 1) {
        stdin = res.stdout || "";
        continue;
      }
      result.output += (res.stdout || "") + (res.stderr || "");
      result.code = res.code == null ? 0 : res.code;
    }
    return result;
  };

  Shell.prototype.runSimple = function (cmdToks, stdin, m) {
    // separate redirections
    var argv = [];
    var redir = {}; // {stdout:file, append:bool, stderr:file, stdin:file, all:file, stderrToStdout:bool}
    for (var i = 0; i < cmdToks.length; i++) {
      var t = cmdToks[i];
      if (t.op === ">" || t.op === ">>" || t.op === "&>" || t.op === "<" || t.op === "2>" || t.op === "2>>" || t.op === "2>&1") {
        var file = cmdToks[i + 1] && cmdToks[i + 1].word;
        i++;
        if (t.op === ">") redir.stdout = { file: file, append: false };
        else if (t.op === ">>") redir.stdout = { file: file, append: true };
        else if (t.op === "&>") redir.all = { file: file, append: false };
        else if (t.op === "<") redir.stdin = file;
        else if (t.op === "2>") redir.stderr = { file: file, append: false };
        else if (t.op === "2>>") redir.stderr = { file: file, append: true };
        else if (t.op === "2>&1") redir.stderrToStdout = true;
        continue;
      }
      if (t.word != null) argv.push(t);
    }
    // (redirections already captured above)

    if (!argv.length) {
      if (redir.stdout) { this.writeRedir(m, redir.stdout, ""); }
      return { stdout: "", stderr: "", code: 0 };
    }

    // alias + glob expansion
    var words = [];
    for (var j = 0; j < argv.length; j++) {
      var tok = argv[j];
      if (!tok.quoted && /[*?]/.test(tok.word)) {
        var g2 = this.glob(tok.word, m);
        g2.forEach(function (x) { words.push({ word: x, quoted: false }); });
      } else words.push(tok);
    }
    if (words.length && !words[0].quoted && m.aliases[words[0].word]) {
      words = this.expandAliases(words, m);
    }

    var name = words[0].word;
    var args = words.slice(1).map(function (t) { return t.word; });

    // input redirection
    if (redir.stdin) {
      try { stdin = m.fs.readFile(redir.stdin, m.cwd, m.env); }
      catch (e) { return { stdout: "", stderr: "bash: " + redir.stdin + ": No such file or directory\n", code: 1 }; }
    }

    var ctx = { stdin: stdin || "", sudo: false, cwd: m.cwd, env: m.env, user: m.user };
    var res = Commands.run(m, name, args, ctx);

    var stdout = res.stdout || "";
    var stderr = res.stderr || "";

    // apply redirections
    if (redir.stderrToStdout) { stdout = stdout + stderr; stderr = ""; }
    if (redir.all) { this.writeRedir(m, redir.all, stdout + stderr); stdout = ""; stderr = ""; }
    if (redir.stdout) { this.writeRedir(m, redir.stdout, stdout); stdout = ""; }
    if (redir.stderr) { this.writeRedir(m, redir.stderr, stderr); stderr = ""; }

    return {
      stdout: stdout, stderr: stderr, code: res.code == null ? 0 : res.code,
      ssh: res.ssh, exit: res.exit, clear: res.clear, attachContainer: res.attachContainer
    };
  };

  Shell.prototype.writeRedir = function (m, r, text) {
    if (!r.file) return;
    try { m.fs.writeFile(r.file, m.cwd, m.env, text, r.append); } catch (e) {}
  };

  /* ---------------- ssh session management ---------------- */
  Shell.prototype.enterRemote = function (sshInfo) {
    var base = this.current();
    var remote = global.Machine.createMachine();
    remote.hostname = sshInfo.host;
    remote.user = sshInfo.user;
    remote.env.USER = sshInfo.user;
    remote.env.HOSTNAME = sshInfo.host;
    remote.env.HOME = remote.users[sshInfo.user] ? remote.users[sshInfo.user].home : "/root";
    remote.cwd = remote.env.HOME;
    remote._local = base;
    // remote login banner
    var banner = "Welcome to Ubuntu 22.04.4 LTS (GNU/Linux 5.15.0-91-generic x86_64)\n\n * Documentation:  https://help.ubuntu.com\n * Management:     https://landscape.canonical.com\n * Support:        https://ubuntu.com/pro\n\n" +
      "  System information as of Wed Sep 10 10:30:00 UTC 2026\n\n  System load:  0.08              Processes:             128\n  Usage of /:   32.0% of 39.2GB   Users logged in:       0\n  Memory usage: 21%               IPv4 address for eth0: 10.0.2.21\n  Swap usage:   0%\n\nLast login: Wed Sep 10 09:00:00 2026 from 10.0.2.2\n";
    this.sessions.push({ machine: remote, prompt: sshInfo.user + "@" + sshInfo.host + ":~$ ", banner: banner });
    return banner;
  };

  Shell.prototype.leaveRemote = function () {
    if (this.sessions.length) { this.sessions.pop(); return true; }
    return false;
  };

  Shell.prototype.prompt = function () {
    if (this.sessions.length) return this.sessions[this.sessions.length - 1].prompt;
    var m = this.m;
    var home = m.env.HOME || "/root";
    var p = m.cwd.indexOf(home) === 0 ? "~" + m.cwd.slice(home.length) : m.cwd;
    var sym = m.user === "root" ? "#" : "$";
    return m.user + "@" + m.hostname + ":" + p + sym + " ";
  };

  Shell.prototype.reset = function (machine) {
    if (machine) this.m = machine;
    this.sessions = [];
  };

  if (typeof module !== "undefined" && module.exports) module.exports = Shell;
  global.Shell = Shell;
})(typeof window !== "undefined" ? window : globalThis);
