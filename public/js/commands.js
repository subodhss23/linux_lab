/* ============================================================================
 * commands.js — Command registry for the Linux Mastery simulator.
 * Exposes: Commands.run(machine, name, args, ctx) -> {stdout, stderr, code, ...}
 * ctx: { stdin, sudo, cwd, env, user }
 * ==========================================================================*/
(function (global) {
  "use strict";
  var VFS = global.VFS || (typeof require !== "undefined" ? require("./filesystem.js") : null);

  function out(s) { return { stdout: s == null ? "" : String(s) + (String(s).endsWith("\n") ? "" : "\n"), stderr: "", code: 0 }; }
  function raw(s) { return { stdout: s == null ? "" : String(s), stderr: "", code: 0 }; }
  function fail(msg, code) { return { stdout: "", stderr: msg + "\n", code: code == null ? 1 : code }; }
  function has(args, f) { return args.indexOf(f) !== -1; }
  function stripFlags(args, known) {
    var flags = [], rest = [], afterDD = false;
    for (var i = 0; i < args.length; i++) {
      var a = args[i];
      if (afterDD) { rest.push(a); continue; }
      if (a === "--") { afterDD = true; continue; }
      if (a.length > 1 && a[0] === "-" && isNaN(Number(a)) && !/^-\d/.test(a)) flags.push(a);
      else rest.push(a);
    }
    return { flags: flags, rest: rest };
  }
  function getopt(args, spec) {
    // spec: {flags:{'l':false,'a':false,'n':true}} ; returns {opts:{}, rest:[]}
    var opts = {}, rest = [], i = 0;
    while (i < args.length) {
      var a = args[i];
      if (a === "--") { rest = rest.concat(args.slice(i + 1)); break; }
      if (/^--[A-Za-z]/.test(a)) {
        var eq = a.indexOf("=");
        var lname = eq >= 0 ? a.slice(2, eq) : a.slice(2);
        if (eq >= 0) opts[lname] = a.slice(eq + 1);
        else if (spec[lname]) { opts[lname] = args[++i]; }
        else opts[lname] = true;
        i++;
        continue;
      }
      if (a.length > 1 && a[0] === "-" && !/^-\d+$/.test(a)) {
        var j = 1;
        while (j < a.length) {
          var ch = a[j];
          if (spec[ch]) { opts[ch] = a.slice(j + 1) || args[++i]; break; }
          else opts[ch] = true;
          j++;
        }
      } else rest.push(a);
      i++;
    }
    return { opts: opts, rest: rest };
  }
  function fmtSize(n) {
    if (n < 1024) return String(n);
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + "K";
    return (n / 1048576).toFixed(1) + "M";
  }
  function userFromPath(m, abs) {
    if (abs.indexOf("/home/") === 0) return abs.split("/")[2];
    return "root";
  }

  var C = {};

  /* ======================= navigation / files ======================= */

  C.pwd = function (m) { return out(m.cwd); };

  C.cd = function (m, a, ctx) {
    var target = a[0] == null ? "~" : a[0];
    if (target === "-") target = m._oldpwd || m.env.HOME;
    var abs = m.fs.resolve(target, m.cwd, m.env);
    var node = m.fs.stat(abs, "/", m.env);
    if (!node) return fail("bash: cd: " + target + ": No such file or directory");
    if (node.type !== VFS.type.DIR) return fail("bash: cd: " + target + ": Not a directory");
    if (!ctx.sudo && !canAccess(m, node, "x")) return fail("bash: cd: " + target + ": Permission denied");
    m._oldpwd = m.cwd;
    m.cwd = abs;
    m.env.PWD = abs;
    return raw("");
  };

  C.ls = function (m, a, ctx) {
    var g = getopt(a, { l: false, a: false, A: false, h: false, R: false, d: false, t: false, S: false, r: false, "1": false, F: false, i: false });
    var o = g.opts, paths = g.rest.length ? g.rest : ["."];
    var all = o.a, almostAll = o.a || o.A;
    var outLines = [];
    var multiple = paths.length > 1;
    var self = this;
    paths.forEach(function (p, idx) {
      var abs = m.fs.resolve(p, m.cwd, m.env);
      var node = m.fs.get(p, m.cwd, m.env).node;
      if (!node) { outLines.push("ls: cannot access '" + p + "': No such file or directory"); return; }
      if (multiple) outLines.push(p + ":");
      if (node.type !== VFS.type.DIR || o.d) {
        outLines.push(fmtEntry(m, node, o, abs));
        if (multiple) outLines.push("");
        return;
      }
      var entries = m.fs.list(p, m.cwd, m.env).filter(function (n) {
        if (!all && !almostAll && n.name.charAt(0) === ".") return false;
        return true;
      });
      if (o.a) entries = [fakeDot(".") , fakeDot("..")].concat(entries);
      entries.sort(function (x, y) {
        if (o.t) return (y.mtime || 0) - (x.mtime || 0);
        if (o.S) return m.fs.sizeOf(y) - m.fs.sizeOf(x);
        return x.name.localeCompare(y.name);
      });
      if (o.r) entries.reverse();
      if (o.l) {
        var total = entries.reduce(function (s, n) { return s + Math.max(4, Math.ceil(m.fs.sizeOf(n) / 1024)); }, 0);
        outLines.push("total " + total);
        entries.forEach(function (n) { outLines.push(longEntry(m, n, o, abs)); });
      } else if (o["1"] || true) {
        outLines.push(entries.map(function (n) { return colorName(n, o); }).join(o._cols ? "  " : "\n"));
        if (!o._cols) { /* vertical already */ } else { outLines = outLines; }
      }
      if (multiple) outLines.push("");
      if (o.R && node.type === VFS.type.DIR) {
        m.fs.list(p, m.cwd, m.env).forEach(function (n) {
          if (n.type === VFS.type.DIR && n.name.charAt(0) !== ".") {
            outLines.push("");
            outLines.push(abs.replace(/\/$/, "") + "/" + n.name + ":");
            outLines = outLines.concat(self._listDir(m, n, o, abs + "/" + n.name));
          }
        });
      }
    });
    return raw(outLines.join("\n").replace(/\n+$/, "") + (outLines.length ? "\n" : ""));
  };

  C.ls._listDir = function (m, node, o, abs) {
    var res = ["total 4"];
    for (var k in node.children) res.push(longEntry(m, node.children[k], o, abs));
    return res;
  };

  function fakeDot(name) { return { name: name, type: VFS.type.DIR, owner: "sam", group: "sam", mode: 0o755, mtime: Date.now(), children: {} }; }
  function colorName(n, o) {
    var nm = n.name + (o.F ? (n.type === VFS.type.DIR ? "/" : n.type === VFS.type.LINK ? "@" : "") : "");
    return nm;
  }
  function fmtEntry(m, n, o, base) {
    if (n.type === VFS.type.DIR && !o.l) return n.name;
    return colorName(n, o);
  }
  function longEntry(m, n, o, base) {
    var links = n.type === VFS.type.DIR ? 2 + countSubdirs(n) : 1 + (n.type === VFS.type.LINK ? 1 : 0);
    var size = n.type === VFS.type.DIR ? 4096 : m.fs.sizeOf(n);
    var sz = o.h ? (size >= 4096 && n.type === VFS.type.DIR ? "4.0K" : fmtSize(size)) : String(size);
    var pad = function (s, w) { s = String(s); return s + " ".repeat(Math.max(0, w - s.length)); };
    var nameStr = n.name;
    if (n.type === VFS.type.LINK) nameStr += " -> " + n.target;
    return m.fs.modeString(n) + " " + pad(links, 2) + " " + pad(n.owner, 8) + " " + pad(n.group, 8) + " " + pad(sz, 7) + " Sep 10 10:00 " + nameStr;
  }
  function countSubdirs(n) { var c = 0; for (var k in n.children) if (n.children[k].type === VFS.type.DIR) c++; return c; }

  C.mkdir = function (m, a, ctx) {
    var g = getopt(a, { p: false, v: false });
    if (!g.rest.length) return fail("mkdir: missing operand");
    var made = [];
    for (var i = 0; i < g.rest.length; i++) {
      try {
        var parent = m.fs.dirname(m.fs.resolve(g.rest[i], m.cwd, m.env));
        var pn = m.fs.stat(parent, "/", m.env);
        if (!ctx.sudo && pn && !canAccess(m, pn, "w")) return fail("mkdir: cannot create directory '" + g.rest[i] + "': Permission denied");
        m.fs.mkdir(g.rest[i], m.cwd, m.env, g.opts.p);
        if (g.opts.v) made.push("mkdir: created directory '" + g.rest[i] + "'");
      } catch (e) { return fail("mkdir: " + e.message); }
    }
    return raw(made.join("\n") + (made.length ? "\n" : ""));
  };

  C.rmdir = function (m, a) {
    if (!a.length) return fail("rmdir: missing operand");
    for (var i = 0; i < a.length; i++) {
      var n = m.fs.stat(a[i], m.cwd, m.env);
      if (!n) return fail("rmdir: failed to remove '" + a[i] + "': No such file or directory");
      if (n.type !== VFS.type.DIR) return fail("rmdir: failed to remove '" + a[i] + "': Not a directory");
      if (Object.keys(n.children).length) return fail("rmdir: failed to remove '" + a[i] + "': Directory not empty");
      m.fs.rm(a[i], m.cwd, m.env, { recursive: false });
    }
    return raw("");
  };

  C.touch = function (m, a) {
    if (!a.length) return fail("touch: missing file operand");
    for (var i = 0; i < a.length; i++) {
      try { m.fs.touch(a[i], m.cwd, m.env); } catch (e) { return fail("touch: " + e.message); }
    }
    return raw("");
  };

  C.cat = function (m, a, ctx) {
    var g = getopt(a, { n: false, b: false, A: false, s: false });
    var files = g.rest;
    var parts = [];
    if (!files.length) return raw(ctx.stdin || "");
    for (var i = 0; i < files.length; i++) {
      var n = m.fs.stat(files[i], m.cwd, m.env);
      if (!n) return fail("cat: " + files[i] + ": No such file or directory");
      if (n.type === VFS.type.DIR) return fail("cat: " + files[i] + ": Is a directory");
      if (!ctx.sudo && !canRead(m, n)) return fail("cat: " + files[i] + ": Permission denied");
      parts.push(n.content || "");
    }
    var text = parts.join("");
    if (g.opts.n || g.opts.b) {
      var ln = 0;
      text = text.split("\n").map(function (l, i, arr) {
        if (i === arr.length - 1 && l === "") return null;
        ln++;
        if (g.opts.b && l === "") return "      " + l;
        return String(ln).padStart(6, " ") + "\t" + l;
      }).filter(function (x) { return x !== null; }).join("\n") + "\n";
    }
    return raw(text);
  };

  C.echo = function (m, a) {
    var nl = true, i = 0;
    if (a[0] === "-n") { nl = false; i = 1; }
    if (a[0] === "-e") { i = 1; }
    var parts = a.slice(i).map(function (x) { return String(x); }).join(" ");
    parts = parts.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\e/g, "\x1b");
    return raw(parts + (nl ? "\n" : ""));
  };

  C.printf = function (m, a) {
    if (!a.length) return fail("printf: usage: printf format [arguments]");
    var fmt = a[0], rest = a.slice(1), idx = 0;
    var s = fmt.replace(/%[sd]/g, function () { return idx < rest.length ? rest[idx++] : ""; });
    s = s.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
    return raw(s);
  };

  C.rm = function (m, a) {
    var g = getopt(a, { r: false, R: false, f: false, d: false, v: false });
    var targets = g.rest;
    if (!targets.length) return g.opts.f ? raw("") : fail("rm: missing operand");
    for (var i = 0; i < targets.length; i++) {
      var n = m.fs.stat(targets[i], m.cwd, m.env);
      if (!n) { if (!g.opts.f) return fail("rm: cannot remove '" + targets[i] + "': No such file or directory"); continue; }
      if (n.type === VFS.type.DIR && !(g.opts.r || g.opts.R || g.opts.d)) return fail("rm: cannot remove '" + targets[i] + "': Is a directory");
      m.fs.rm(targets[i], m.cwd, m.env, { recursive: !!(g.opts.r || g.opts.R) });
    }
    return raw("");
  };

  C.cp = function (m, a) {
    var g = getopt(a, { r: false, R: false, v: false, n: false, p: false });
    if (g.rest.length < 2) return fail("cp: missing destination file operand");
    var dst = g.rest[g.rest.length - 1];
    var srcs = g.rest.slice(0, -1);
    var dstIsDir = m.fs.exists(dst, m.cwd, m.env, VFS.type.DIR);
    if (srcs.length > 1 && !dstIsDir) return fail("cp: target '" + dst + "' is not a directory");
    for (var i = 0; i < srcs.length; i++) {
      try { m.fs.copy(srcs[i], dst, m.cwd, m.env, { recursive: !!(g.opts.r || g.opts.R), noClobber: g.opts.n }); }
      catch (e) { return fail("cp: " + e.message); }
    }
    return raw("");
  };

  C.mv = function (m, a) {
    var g = getopt(a, { v: false, n: false, f: false });
    if (g.rest.length < 2) return fail("mv: missing destination file operand");
    var dst = g.rest[g.rest.length - 1];
    var srcs = g.rest.slice(0, -1);
    for (var i = 0; i < srcs.length; i++) {
      try { m.fs.move(srcs[i], dst, m.cwd, m.env); } catch (e) { return fail("mv: " + e.message); }
    }
    return raw("");
  };

  C.ln = function (m, a) {
    var g = getopt(a, { s: false, f: false, v: false });
    if (g.rest.length < 2) return fail("ln: missing file operand");
    if (g.opts.f) { try { m.fs.rm(g.rest[1], m.cwd, m.env, { recursive: true }); } catch (e) {} }
    try { m.fs.symlink(g.rest[0], g.rest[1], m.cwd, m.env); return out(""); }
    catch (e) { return fail("ln: " + e.message); }
  };

  C.readlink = function (m, a) {
    var n = m.fs.stat(a[0], m.cwd, m.env);
    if (!n || n.type !== VFS.type.LINK) return fail("readlink: " + a[0] + ": Invalid argument");
    return out(n.target);
  };

  C.realpath = function (m, a) { return out(m.fs.resolve(a[0] || ".", m.cwd, m.env)); };
  C.basename = function (m, a) { return out(m.fs.basename(a[0] || "")); };
  C.dirname = function (m, a) { return out(m.fs.dirname(a[0] || "")); };
  C.mktemp = function (m, a) { return out("/tmp/tmp." + Math.random().toString(36).slice(2, 10)); };

  C.file = function (m, a) {
    if (!a.length) return fail("file: missing operand");
    return raw(a.map(function (p) {
      var n = m.fs.stat(p, m.cwd, m.env);
      if (!n) return p + ": cannot open (No such file or directory)";
      if (n.type === VFS.type.DIR) return p + ": directory";
      if (n.type === VFS.type.LINK) return p + ": symbolic link to " + n.target;
      var c = n.content || "";
      if (/^#!.*bash/.test(c)) return p + ": Bourne-Again shell script, ASCII text executable";
      if (/^<\?xml/.test(c)) return p + ": XML document text";
      if (isBinary(c)) return p + ": data";
      return p + ": ASCII text";
    }).join("\n") + "\n");
  };
  function isBinary(s) { return /[\x00-\x08\x0e-\x1f]/.test(s); }

  C.stat = function (m, a) {
    if (!a.length) return fail("stat: missing operand");
    var g = getopt(a, { c: true });
    return raw(a.map(function (p) {
      var n = m.fs.stat(p, m.cwd, m.env);
      if (!n) return "stat: cannot stat '" + p + "': No such file or directory";
      if (g.opts.c) return g.opts.c.replace(/%n/g, n.name).replace(/%a/g, n.mode.toString(8)).replace(/%U/g, n.owner).replace(/%G/g, n.group).replace(/%s/g, m.fs.sizeOf(n));
      var abs = m.fs.resolve(p, m.cwd, m.env);
      return "  File: " + abs + "\n  Size: " + String(m.fs.sizeOf(n)).padEnd(12) + "Blocks: 8          IO Block: 4096   " + (n.type === VFS.type.DIR ? "directory" : "regular file") +
        "\nDevice: 801h/2049d\tInode: " + (1000 + Math.abs(hash(abs)) % 9000) + "  Links: 1" +
        "\nAccess: (" + n.mode.toString(8).padStart(3, "0") + "/" + m.fs.modeString(n) + ")  Uid: (" + n.owner + ")   Gid: (" + n.group + ")" +
        "\nModify: 2026-09-10 10:00:00.000000000 +0000";
    }).join("\n") + "\n");
  };
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }

  /* ======================= text processing ======================= */

  C.head = function (m, a, ctx) {
    var g = getopt(a, { n: true, c: true, q: false, v: false });
    var n = g.opts.n ? parseInt(g.opts.n, 10) : 10;
    return sliceLines(m, ctx, g.rest, 0, n, g.opts);
  };
  C.tail = function (m, a, ctx) {
    var g = getopt(a, { n: true, c: true, q: false, v: false, f: false, F: false });
    var n = g.opts.n ? parseInt(g.opts.n, 10) : 10;
    var files = g.rest;
    var src = readInput(m, ctx, files);
    if (src.error) return src.error;
    var ls = src.text.replace(/\n$/, "").split("\n");
    var res = ls.slice(Math.max(0, ls.length - n));
    var body = res.join("\n") + "\n";
    if (n === 0) body = "";
    if (g.opts.f) {
      body += "\n(^C to quit — following " + (files[0] || "stdin") + " live in the simulator)";
    }
    return raw(src.prefix + body);
  };
  function sliceLines(m, ctx, files, start, end, opts) {
    var src = readInput(m, ctx, files);
    if (src.error) return src.error;
    var ls = src.text.split("\n"); if (ls[ls.length - 1] === "") ls.pop();
    return raw(src.prefix + ls.slice(start, end).join("\n") + (ls.length ? "\n" : ""));
  }

  C.wc = function (m, a, ctx) {
    var g = getopt(a, { l: false, w: false, c: false, m: false });
    var files = g.rest;
    var src = readInput(m, ctx, files);
    if (src.error) return src.error;
    var text = src.text;
    var lines = (text.match(/\n/g) || []).length;
    var words = text.split(/\s+/).filter(Boolean).length;
    var chars = text.length;
    var which = [];
    if (g.opts.l || !(g.opts.l || g.opts.w || g.opts.c || g.opts.m)) which.push(lines);
    if (g.opts.w || !(g.opts.l || g.opts.w || g.opts.c || g.opts.m)) which.push(words);
    if (g.opts.c || g.opts.m || !(g.opts.l || g.opts.w || g.opts.c || g.opts.m)) which.push(chars);
    var label = files.length ? " " + files.join(" ") : "";
    return raw(which.map(function (x) { return String(x).padStart(7, " "); }).join("") + label + "\n");
  };

  C.grep = function (m, a, ctx) {
    var g = getopt(a, { i: false, v: false, n: false, c: false, l: false, r: false, R: false, w: false, E: false, o: false, h: false, q: false });
    var o = g.opts;
    var rest = g.rest.slice();
    if (!rest.length) return fail("grep: missing pattern");
    var pattern = rest.shift();
    var files = rest;
    var rx;
    try { rx = new RegExp(o.w ? "\\b" + pattern + "\\b" : pattern, o.i ? "i" : ""); }
    catch (e) { return fail("grep: invalid pattern"); }
    var out = [];
    var total = 0;
    var fileMatches = 0;
    var multi = files.length > 1;

    function emit(lineText, label, lineNo) {
      var matched = rx.test(lineText);
      if (o.v) matched = !matched;
      if (!matched) return;
      total++;
      if (o.q || o.c || o.l) return;
      var prefix = (multi && !o.h ? label + ":" : "") + (o.n ? lineNo + ":" : "");
      if (o.o) {
        var m2, re2 = new RegExp(rx.source, o.i ? "gi" : "g");
        while ((m2 = re2.exec(lineText)) !== null) { out.push(prefix + m2[0]); if (m2.index === re2.lastIndex) re2.lastIndex++; }
        return;
      }
      out.push(prefix + lineText);
    }
    function scanText(text, label) {
      var hit = false;
      var lines = (text || "").split("\n");
      if (lines[lines.length - 1] === "") lines.pop();
      lines.forEach(function (l, i) { var before = total; emit(l, label, i + 1); if (total > before) hit = true; });
      return hit;
    }
    function scanPath(p, showLabel) {
      var n = m.fs.stat(p, m.cwd, m.env);
      if (!n) { out.push("grep: " + p + ": No such file or directory"); return; }
      if (n.type === VFS.type.DIR) {
        var kids = m.fs.list(p, m.cwd, m.env);
        kids.forEach(function (k) {
          var cp = p.replace(/\/$/, "") + "/" + k.name;
          if (k.type === VFS.type.DIR) { if (o.r || o.R) scanPath(cp, true); }
          else if (k.type === VFS.type.FILE) {
            var before = total;
            var hit = scanText(k.content || "", cp);
            if (hit && o.l) out.push(cp);
            if (hit) fileMatches++;
          }
        });
        return;
      }
      var hit2 = scanText(n.content || "", showLabel ? p : "stdin");
      if (hit2 && o.l) out.push(p);
      if (hit2) fileMatches++;
    }

    if (o.r || o.R) {
      var targets = files.length ? files : ["."];
      targets.forEach(function (p) { scanPath(p, true); });
    } else if (!files.length) {
      scanText(ctx.stdin || "", "stdin");
    } else {
      files.forEach(function (p) {
        var n = m.fs.stat(p, m.cwd, m.env);
        if (!n) { out.push("grep: " + p + ": No such file or directory"); return; }
        if (n.type === VFS.type.DIR) { out.push("grep: " + p + ": Is a directory"); return; }
        var before = total; scanText(n.content || "", p); if (total > before) fileMatches++;
        if (o.l && total > before) out.push(p);
      });
    }
    if (o.q) return { stdout: "", stderr: "", code: total ? 0 : 1 };
    if (o.c) {
      if (o.r || o.R || files.length > 1) return raw((files.length ? files : ["."]).map(function (f) {
        var nn = m.fs.stat(f, m.cwd, m.env);
        if (nn && nn.type === VFS.type.FILE) {
          var c = 0; (nn.content || "").split("\n").forEach(function (l) { var mm = rx.test(l); if (o.v ? !mm : mm) c++; });
          return f + ":" + c;
        }
        return null;
      }).filter(function (x) { return x !== null; }).join("\n") + "\n");
      return raw(total + "\n");
    }
    if (o.l) return raw(out.join("\n") + (out.length ? "\n" : ""));
    return raw(out.join("\n") + (out.length ? "\n" : ""));
  };
  C.egrep = C.grep;

  C.sort = function (m, a, ctx) {
    var g = getopt(a, { n: false, r: false, u: false, k: true, t: true, h: false, f: false });
    var src = readInput(m, ctx, g.rest);
    if (src.error) return src.error;
    var lines = src.text.replace(/\n$/, "").split("\n");
    if (lines.length === 1 && lines[0] === "") lines = [];
    var k = g.opts.k ? parseInt(g.opts.k, 10) - 1 : null;
    lines.sort(function (x, y) {
      var xv = x, yv = y;
      if (k !== null) { var xa = x.split(/\s+/), ya = y.split(/\s+/); xv = xa[k] || ""; yv = ya[k] || ""; }
      if (g.opts.n) return parseFloat(xv) - parseFloat(yv);
      return g.opts.f ? xv.toLowerCase().localeCompare(yv.toLowerCase()) : xv.localeCompare(yv);
    });
    if (g.opts.r) lines.reverse();
    if (g.opts.u) lines = lines.filter(function (l, i) { return i === 0 || l !== lines[i - 1]; });
    return raw(lines.join("\n") + (lines.length ? "\n" : ""));
  };

  C.uniq = function (m, a, ctx) {
    var g = getopt(a, { c: false, d: false, u: false, i: false });
    var src = readInput(m, ctx, g.rest);
    if (src.error) return src.error;
    var lines = src.text.replace(/\n$/, "").split("\n");
    if (lines.length === 1 && lines[0] === "") lines = [];
    var res = [], counts = [];
    lines.forEach(function (l) {
      var key = g.opts.i ? l.toLowerCase() : l;
      if (res.length && (g.opts.i ? res[res.length - 1].toLowerCase() : res[res.length - 1]) === key) counts[counts.length - 1]++;
      else { res.push(l); counts.push(1); }
    });
    var arr = [];
    res.forEach(function (l, i) {
      if (g.opts.d && counts[i] < 2) return;
      if (g.opts.u && counts[i] > 1) return;
      arr.push((g.opts.c ? String(counts[i]).padStart(7, " ") + " " : "") + l);
    });
    return raw(arr.join("\n") + (arr.length ? "\n" : ""));
  };

  C.cut = function (m, a, ctx) {
    var g = getopt(a, { d: true, f: true, c: true, s: false });
    var o = g.opts;
    var src = readInput(m, ctx, g.rest);
    if (src.error) return src.error;
    var lines = src.text.replace(/\n$/, "").split("\n");
    if (lines.length === 1 && lines[0] === "") lines = [];
    var res = lines.map(function (l) {
      if (o.c) {
        var ranges = String(o.c).split(",");
        var s = "";
        ranges.forEach(function (r) {
          if (r.indexOf("-") > 0) { var p = r.split("-"); s += l.slice(+p[0] - 1, +p[1] || undefined); }
          else s += l.charAt(+r - 1);
        });
        return s;
      }
      if (o.f) {
        var delim = o.d || "\t";
        var fields = l.split(delim);
        var idxs = [];
        String(o.f).split(",").forEach(function (r) {
          if (r.indexOf("-") > 0) { var p = r.split("-"); for (var i = +p[0]; i <= (+p[1] || fields.length); i++) idxs.push(i); }
          else idxs.push(+r);
        });
        if (!o.s && fields.length < Math.max.apply(null, idxs)) return o.s ? "" : l;
        return idxs.map(function (i) { return fields[i - 1] == null ? "" : fields[i - 1]; }).join(delim);
      }
      return l;
    });
    return raw(res.join("\n") + (res.length ? "\n" : ""));
  };

  C.tr = function (m, a, ctx) {
    var g = getopt(a, { d: false, s: false, c: false });
    var set1 = a[a.length - (g.opts.d ? 1 : 2)] || (g.opts.d ? a[0] : "");
    if (g.opts.d) {
      var setd = g.rest[g.opts.d === true && g.rest[0] === "-d" ? 0 : 0];
      setd = g.rest[0];
      var chars = expandSet(setd);
      return raw((ctx.stdin || "").split("").filter(function (c) { return chars.indexOf(c) === -1; }).join(""));
    }
    var r = g.rest;
    var s1 = expandSet(r[0] || ""), s2 = expandSet(r[1] || "");
    var res = (ctx.stdin || "").split("").map(function (c) {
      var i = s1.indexOf(c);
      return i === -1 ? c : (s2[i] || s2[s2.length - 1] || c);
    }).join("");
    if (g.opts.s) res = res.replace(/(.)\1+/g, "$1");
    return raw(res);
  };
  function expandSet(s) {
    var res = [];
    for (var i = 0; i < s.length; i++) {
      if (s[i] === "\\" && i + 1 < s.length) { res.push(s[++i] === "n" ? "\n" : s[i]); continue; }
      if (s[i + 1] === "-" && s[i + 2]) { for (var c = s.charCodeAt(i); c <= s.charCodeAt(i + 2); c++) res.push(String.fromCharCode(c)); i += 2; continue; }
      res.push(s[i]);
    }
    return res;
  }

  C.sed = function (m, a, ctx) {
    var g = getopt(a, { n: false, i: false, e: true });
    var scripts = [];
    var rest = g.rest;
    var inPlace = g.opts.i !== undefined;
    // collect -e scripts and first positional as script
    var argsCopy = a.slice();
    var files = [];
    var script = null;
    var expectScript = false, seenE = false;
    for (var i = 0; i < argsCopy.length; i++) {
      var x = argsCopy[i];
      if (x === "-n") continue;
      if (x === "-i") continue;
      if (x === "-e") { scripts.push(argsCopy[++i]); seenE = true; continue; }
      if (x[0] === "-") continue;
      if (!script && !seenE && scripts.length === 0) { script = x; scripts.push(x); continue; }
      files.push(x);
    }
    if (!scripts.length) return fail("sed: no script specified");
    var src = readInput(m, ctx, files);
    if (src.error && !files.length) return src.error;
    var lines = (files.length ? "" : (ctx.stdin || ""));
    var text = files.length ? files.map(function (f) { var n = m.fs.stat(f, m.cwd, m.env); return n ? n.content : ""; }).join("") : lines;
    var inLines = text.replace(/\n$/, "").split("\n");
    if (inLines.length === 1 && inLines[0] === "") inLines = [];
    var outLines = [];
    var suppress = g.opts.n;
    scripts.forEach(function (sc) {
      sc.split(";").forEach(function (part) {
        part = part.trim();
        if (!part) return;
        var mS = /^s([/#|,])(.*?)\1(.*?)\1([gi]*)$/.exec(part);
        if (mS) {
          var rx = new RegExp(mS[2], mS[4].indexOf("g") !== -1 ? "g" : "");
          inLines = inLines.map(function (l) { return l.replace(rx, mS[3]); });
          return;
        }
        var mP = /^(\d+)(,(\d+))?p$/.exec(part);
        if (mP) {
          var s = +mP[1], e = mP[3] ? +mP[3] : s;
          for (var i = s; i <= e && i <= inLines.length; i++) outLines.push(inLines[i - 1]);
          suppress = true;
          return;
        }
        var mD = /^(\d+)(,(\d+))?d$/.exec(part);
        if (mD) {
          var ds = +mD[1], de = mD[3] ? +mD[3] : ds;
          for (var j = ds; j <= de; j++) inLines[j - 1] = null;
          return;
        }
      });
    });
    var finalLines = inLines.filter(function (l) { return l !== null; });
    var resultText = suppress ? outLines.join("\n") : finalLines.join("\n");
    if (resultText) resultText += "\n";
    if (inPlace && files.length) {
      files.forEach(function (f) {
        try { m.fs.writeFile(f, m.cwd, m.env, resultText); } catch (e) {}
      });
      return raw("");
    }
    return raw(resultText);
  };

  C.awk = function (m, a, ctx) {
    var g = getopt(a, { F: true, v: true });
    if (!g.rest.length) return fail("awk: usage: awk [-F fs] 'program' [file ...]");
    var program = g.rest[0];
    var files = g.rest.slice(1);
    var sep = g.opts.F || /\s+/;
    var src = files.length ? files.map(function (f) { var n = m.fs.stat(f, m.cwd, m.env); return n && n.type === VFS.type.FILE ? n.content : ""; }).join("") : (ctx.stdin || "");
    var sepRe = typeof sep === "string" ? (sep.length === 1 ? sep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : sep) : sep;
    var lines = src.replace(/\n$/, "").split("\n");
    if (lines.length === 1 && lines[0] === "") lines = [];
    var res = [];
    var beginM = /BEGIN\s*{([^}]*)}/.exec(program);
    var endM = /END\s*{([^}]*)}/.exec(program);
    if (beginM) runAwkBlock(beginM[1], null, {}, res, 0, 0, sepRe);
    lines.forEach(function (line, idx) {
      var fields = line.split(sepRe);
      runAwkBlock(program.replace(/BEGIN\s*{[^}]*}/, "").replace(/END\s*{[^}]*}/, ""), line, { fields: fields, nr: idx + 1, nf: fields.length }, res, idx + 1, fields.length, sepRe);
    });
    if (endM) runAwkBlock(endM[1], null, {}, res, lines.length, 0, sepRe);
    return raw(res.join("\n") + (res.length ? "\n" : ""));
  };
  function runAwkBlock(block, line, meta, res, nr, nf, sepRe) {
    var mBody = /\{([^}]*)\}/.exec(block);
    var cond = mBody ? block.slice(0, mBody.index).trim() : block.trim();
    var body = mBody ? mBody[1] : "";
    if (!body) return;
    var fields = meta.fields || (line != null ? line.split(sepRe) : []);
    var vars = { NR: nr, NF: nf, FS: " " };
    function fld(ref) {
      var m2 = /^\$(\d+)$/.exec(ref);
      if (m2) return fields[+m2[1] - 1] || "";
      if (ref === "$0") return line == null ? "" : line;
      return vars[ref] != null ? vars[ref] : (isNaN(Number(ref)) ? "" : Number(ref));
    }
    if (cond) {
      var c = cond;
      var cm = /^\/(.*)\/$/.exec(cond);
      if (cm) { if (!new RegExp(cm[1]).test(line || "")) return; }
      else if (/NR\s*==\s*\d+/.test(cond)) { if (!(nr === +cond.split("==")[1])) return; }
      else if (/NR\s*>\s*\d+/.test(cond)) { if (!(nr > +cond.split(">")[1])) return; }
      else if (/\$\d+\s*(==|>|<)\s*/.test(cond)) {
        var mm2 = /\$(\d+)\s*(==|>|<)\s*(.+)/.exec(cond);
        var val = fld("$" + mm2[1]);
        var rhs = isNaN(Number(mm2[3])) ? mm2[3].replace(/"/g, "") : Number(mm2[3]);
        var lv = isNaN(Number(val)) ? val : Number(val);
        if (mm2[2] === "==" && !(lv == rhs)) return;
        if (mm2[2] === ">" && !(lv > rhs)) return;
        if (mm2[2] === "<" && !(lv < rhs)) return;
      }
    }
    var pm = /print\s+(.+)/.exec(body);
    if (pm) {
      var parts = pm[1].split(",").map(function (p) {
        p = p.trim();
        var pmv = /^\$(.+)$/.exec(p);
        if (pmv) return fld("$" + pmv[1]);
        if (/^".*"$/.test(p)) return p.replace(/"/g, "");
        return vars[p] != null ? vars[p] : p;
      });
      res.push(parts.join(" "));
    }
  }

  C.tee = function (m, a, ctx) {
    var g = getopt(a, { a: false });
    var text = ctx.stdin || "";
    g.rest.forEach(function (f) {
      try { m.fs.writeFile(f, m.cwd, m.env, text, g.opts.a); } catch (e) {}
    });
    return raw(text);
  };

  C.nl = function (m, a, ctx) {
    var src = readInput(m, ctx, a.filter(function (x) { return x[0] !== "-"; }));
    var lines = (src.text || "").replace(/\n$/, "").split("\n");
    return raw(lines.map(function (l, i) { return String(i + 1).padStart(6, " ") + "\t" + l; }).join("\n") + "\n");
  };
  C.tac = function (m, a, ctx) {
    var src = readInput(m, ctx, a.filter(function (x) { return x[0] !== "-"; }));
    var lines = (src.text || "").replace(/\n$/, "").split("\n").reverse();
    return raw(lines.join("\n") + "\n");
  };
  C.rev = function (m, a, ctx) {
    var src = readInput(m, ctx, a);
    return raw((src.text || "").replace(/\n$/, "").split("\n").map(function (l) { return l.split("").reverse().join(""); }).join("\n") + "\n");
  };
  C.less = C.more = function (m, a, ctx) { return C.cat(m, a.filter(function (x) { return x[0] !== "-"; }), ctx); };

  C.diff = function (m, a) {
    var files = a.filter(function (x) { return x[0] !== "-"; });
    if (files.length < 2) return fail("diff: missing operand");
    var x = (m.fs.stat(files[0], m.cwd, m.env) || {}).content || "";
    var y = (m.fs.stat(files[1], m.cwd, m.env) || {}).content || "";
    if (x === y) return raw("");
    var xl = x.split("\n"), yl = y.split("\n");
    var res = ["--- " + files[0] + "\t2026-09-10 10:00:00", "+++ " + files[1] + "\t2026-09-10 10:00:00"];
    for (var i = 0; i < Math.max(xl.length, yl.length); i++) {
      if (xl[i] !== yl[i]) {
        if (xl[i] != null) res.push("< " + xl[i]);
        if (yl[i] != null) res.push("> " + yl[i]);
      }
    }
    return raw(res.join("\n") + "\n");
  };
  C.cmp = C.diff;

  C.wget = function (m, a) {
    var g = getopt(a, { O: true, q: false });
    var url = g.rest[0];
    if (!url) return fail("wget: missing URL");
    var name = g.opts.O || m.fs.basename(url.split("?")[0]) || "index.html";
    var content = "<!DOCTYPE html>\n<html><body>Downloaded from " + url + "</body></html>\n";
    try { m.fs.writeFile(name, m.cwd, m.env, content); } catch (e) {}
    return raw((g.opts.q ? "" : "--2026-09-10 10:00:00--  " + url + "\nResolving... connecting... 200 OK\nSaving to: '" + name + "'\n\n") + "'" + name + "' saved\n");
  };

  function readInput(m, ctx, files) {
    var prefix = "";
    if (!files || !files.length) return { text: ctx.stdin || "", prefix: prefix };
    var parts = [];
    for (var i = 0; i < files.length; i++) {
      var n = m.fs.stat(files[i], m.cwd, m.env);
      if (n && n.type === VFS.type.DIR) return { error: fail("error: " + files[i] + ": Is a directory") };
      if (!n) return { error: fail("error: " + files[i] + ": No such file or directory") };
      parts.push(n.content || "");
    }
    return { text: parts.join(""), prefix: prefix };
  }

  /* ======================= permissions ======================= */

  function canRead(m, n) { return m.user === "root" || n.owner === m.user || ((n.mode & 0o044) && m.user !== "nobody"); }
  function canWrite(m, n) { return m.user === "root" || n.owner === m.user || (n.mode & 0o022); }
  function canAccess(m, n, bit) {
    if (m.user === "root" || n.owner === m.user) return !!((n.mode >> (bit === "x" ? 6 : bit === "w" ? 7 : 8)) & 1) || (bit === "x" ? (n.mode & 0o100) : true);
    var perms = n.mode & 0o007;
    if (bit === "r") return !!(perms & 4);
    if (bit === "w") return !!(perms & 2);
    if (bit === "x") return !!(perms & 1);
    return true;
  }

  C.chmod = function (m, a) {
    var g = getopt(a, { R: false, v: false, c: false });
    if (g.rest.length < 2) return fail("chmod: missing operand");
    var modeStr = g.rest[0];
    var files = g.rest.slice(1);
    var results = [];
    files.forEach(function (p) {
      var n = m.fs.stat(p, m.cwd, m.env);
      if (!n) { results.push("chmod: cannot access '" + p + "': No such file or directory"); return; }
      try {
        var newMode = applyMode(n.mode, modeStr, g.opts.R ? m.fs : null, n);
        m.fs.chmod(p, m.cwd, m.env, newMode);
      } catch (e) { results.push("chmod: invalid mode: '" + modeStr + "'"); }
    });
    return raw(results.join("\n") + (results.length ? "\n" : ""));
  };
  function applyMode(cur, spec, fs, node) {
    if (/^[0-7]{3,4}$/.test(spec)) return parseInt(spec, 8);
    var mode = cur;
    spec.split(",").forEach(function (clause) {
      var mm = /^([ugoa]*)([+=-])([rwxXst]*)$/.exec(clause);
      if (!mm) throw new Error("bad");
      var who = mm[1] || "a", op = mm[2], perms = mm[3];
      var targets = [];
      if (who.indexOf("a") !== -1 || who === "") targets = [0o700, 0o070, 0o007, 0o4000, 0o2000, 0o1000];
      else {
        if (who.indexOf("u") !== -1) targets.push(0o700, 0o4000);
        if (who.indexOf("g") !== -1) targets.push(0o070, 0o2000);
        if (who.indexOf("o") !== -1) targets.push(0o007, 0o1000);
      }
      var bits = 0;
      if (perms.indexOf("r") !== -1) bits |= 0o444;
      if (perms.indexOf("w") !== -1) bits |= 0o222;
      if (perms.indexOf("x") !== -1) bits |= 0o111;
      if (perms.indexOf("X") !== -1 && node && node.type === VFS.type.DIR) bits |= 0o111;
      if (perms.indexOf("s") !== -1) bits |= 0o6000;
      if (perms.indexOf("t") !== -1) bits |= 0o1000;
      var mask = targets.reduce(function (s, t) { return s | t; }, 0);
      if (op === "+") mode |= (bits & mask);
      else if (op === "-") mode &= ~(bits & mask);
      else if (op === "=") { mode &= ~mask; mode |= (bits & mask); }
    });
    return mode;
  }

  C.chown = function (m, a) {
    var g = getopt(a, { R: false, v: false, c: false });
    if (g.rest.length < 2) return fail("chown: missing operand");
    var spec = g.rest[0], files = g.rest.slice(1);
    var parts = spec.split(":");
    var results = [];
    files.forEach(function (p) {
      var n = m.fs.stat(p, m.cwd, m.env);
      if (!n) { results.push("chown: cannot access '" + p + "': No such file or directory"); return; }
      m.fs.chown(p, m.cwd, m.env, parts[0] || null, parts[1] || null);
    });
    return raw(results.join("\n") + (results.length ? "\n" : ""));
  };
  C.chgrp = function (m, a) {
    var g = getopt(a, { R: false });
    if (g.rest.length < 2) return fail("chgrp: missing operand");
    var grp = g.rest[0], files = g.rest.slice(1);
    files.forEach(function (p) { m.fs.chown(p, m.cwd, m.env, null, grp); });
    return raw("");
  };

  C.umask = function (m, a) {
    if (!a.length) return out("0" + m.umask.toString(8));
    m.umask = parseInt(a[0], 8);
    return raw("");
  };

  C.id = function (m, a) {
    var u = a[0] || m.user;
    var usr = m.users[u];
    if (!usr) return fail("id: '" + u + "': no such user");
    return out("uid=" + usr.uid + "(" + u + ") gid=" + usr.gid + "(" + primaryGroup(m, u) + ") groups=" +
      usr.groups.map(function (g) { return (m.groups[g] ? m.groups[g][0] : 0) + "(" + g + ")"; }).join(",") + " groups=" +
      usr.groups.map(function (g) { return (m.groups[g] ? m.groups[g][0] : 0) + "(" + g + ")"; }).join(","));
  };
  function primaryGroup(m, u) { return m.users[u] ? (m.users[u].groups[0] || u) : u; }

  C.whoami = function (m) { return out(m.user); };
  C.who = function (m) { return raw(m.user + "   pts/0        2026-09-10 09:02 (10.0.2.2)\n"); };
  C.w = function (m) {
    return raw(" 10:30:00 up 2:30,  1 user,  load average: 0.08, 0.03, 0.01\nUSER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT\n" + m.user + "   pts/0    10.0.2.2         09:02    0.00s  0.12s  0.00s w\n");
  };
  C.groups = function (m, a) {
    var u = a[0] || m.user;
    if (!m.users[u]) return fail("groups: '" + u + "': no such user");
    return out(m.users[u].groups.join(" "));
  };

  /* ======================= users / sudo ======================= */

  C.su = function (m, a, ctx) {
    var target = a.filter(function (x) { return x[0] !== "-"; })[0] || "root";
    if (!m.users[target]) return fail("su: user " + target + " does not exist");
    if (a.indexOf("-") !== -1 || a[0] === "-l") { m.cwd = m.users[target].home; m.env.PWD = m.cwd; }
    m._prevUser = m.user;
    m.user = target;
    m.env.USER = target; m.env.HOME = m.users[target].home;
    return raw("");
  };

  C.sudo = function (m, a, ctx) {
    if (!a.length) return fail("usage: sudo command");
    var targetUser = null;
    if (a[0] === "-u") { targetUser = a[1]; a = a.slice(2); }
    if (a[0] === "-i" || a[0] === "-s") { m._prevUser = m.user; m.user = "root"; m.env.USER = "root"; m.env.HOME = "/root"; return raw(""); }
    var usr = m.users[m.user];
    var inSudo = usr && usr.groups.indexOf("sudo") !== -1;
    if (m.user !== "root" && !inSudo) return fail("[" + m.user + "] password for " + m.user + ": \nsudo: Sorry, user " + m.user + " is not in the sudoers file.  This incident will be reported.", 1);
    if (m.user !== "root") m.env.LAST_SUDO = m.user;
    var prev = m.user;
    m.user = targetUser || "root";
    ctx.sudo = true;
    var res = Commands._dispatch(m, a, { stdin: ctx.stdin, sudo: true });
    m.user = prev;
    return res;
  };

  C.useradd = function (m, a) {
    if (m.user !== "root") return fail("useradd: Permission denied.\nuseradd: cannot lock /etc/passwd; try again later.");
    var g = getopt(a, { m: false, d: true, s: true, G: true, r: false, c: true });
    var name = g.rest[0];
    if (!name) return fail("useradd: missing username");
    if (m.users[name]) return fail("useradd: user '" + name + "' already exists");
    var uid = m.nextUid++;
    var home = g.opts.d || "/home/" + name;
    var shell = g.opts.s || "/bin/bash";
    var groups = [name].concat(g.opts.G ? String(g.opts.G).split(",") : []);
    m.users[name] = { uid: uid, gid: uid, home: home, shell: shell, groups: groups, password: "!" };
    m.groups[name] = [uid, [name]];
    groups.forEach(function (gg) { if (m.groups[gg] && m.groups[gg][1].indexOf(name) === -1) m.groups[gg][1].push(name); });
    if (g.opts.m) {
      try { m.fs.mkdir(home, "/", m.env, true); m.fs.chown(home, "/", m.env, name, name); } catch (e) {}
    }
    appendPasswd(m, name, uid, home, shell);
    return raw("");
  };
  C.adduser = function (m, a) {
    var name = a.filter(function (x) { return x[0] !== "-"; })[0];
    if (!name) return fail("adduser: Only one or two names allowed.");
    var res = C.useradd(m, ["-m", name]);
    if (res.code) return res;
    return out("Adding user `" + name + "' ...\nAdding new group `" + name + "' (" + m.users[name].uid + ") ...\nAdding new user `" + name + "' (" + m.users[name].uid + ") with group `" + name + "' ...\nCreating home directory `" + m.users[name].home + "' ...");
  };
  function appendPasswd(m, name, uid, home, shell) {
    try {
      var cur = m.fs.readFile("/etc/passwd", "/", m.env);
      cur += name + ":x:" + uid + ":" + uid + "::" + home + ":" + shell + "\n";
      m.fs.writeFile("/etc/passwd", "/", m.env, cur);
    } catch (e) {}
  }

  C.usermod = function (m, a) {
    if (m.user !== "root") return fail("usermod: Permission denied.");
    var g = getopt(a, { aG: false, G: true, s: true, d: true, L: false, U: false, l: true });
    var name = g.rest[0];
    if (!name || !m.users[name]) return fail("usermod: user '" + name + "' does not exist");
    if (g.opts.G) {
      var newGroups = String(g.opts.G).split(",");
      if (g.opts.aG) newGroups.forEach(function (gg) { if (m.users[name].groups.indexOf(gg) === -1) { m.users[name].groups.push(gg); if (m.groups[gg]) m.groups[gg][1].push(name); } });
      else { m.users[name].groups = [name].concat(newGroups); newGroups.forEach(function (gg) { if (m.groups[gg] && m.groups[gg][1].indexOf(name) === -1) m.groups[gg][1].push(name); }); }
    }
    if (g.opts.s) m.users[name].shell = g.opts.s;
    if (g.opts.d) m.users[name].home = g.opts.d;
    return raw("");
  };

  C.userdel = function (m, a) {
    if (m.user !== "root") return fail("userdel: Permission denied.");
    var g = getopt(a, { r: false });
    var name = g.rest[0];
    if (!name || !m.users[name]) return fail("userdel: user '" + name + "' does not exist");
    delete m.users[name];
    return raw("");
  };
  C.groupadd = function (m, a) {
    var name = a.filter(function (x) { return x[0] !== "-"; })[0];
    if (!name) return fail("groupadd: missing name");
    if (m.groups[name]) return fail("groupadd: group '" + name + "' already exists");
    m.groups[name] = [1000 + Object.keys(m.groups).length, []];
    appendGroup(m, name);
    return raw("");
  };
  function appendGroup(m, name) {
    try { var cur = m.fs.readFile("/etc/group", "/", m.env); cur += name + ":x:" + m.groups[name][0] + ":\n"; m.fs.writeFile("/etc/group", "/", m.env, cur); } catch (e) {}
  }
  C.groupdel = function (m, a) {
    var name = a.filter(function (x) { return x[0] !== "-"; })[0];
    delete m.groups[name];
    return raw("");
  };
  C.passwd = function (m, a) {
    var name = a[0] || m.user;
    if (!m.users[name]) return fail("passwd: user '" + name + "' does not exist");
    if (m.user !== "root" && m.user !== name) return fail("passwd: You may not view or modify password information for " + name + ".");
    m.users[name].password = "lab";
    return out("New password: \nRetype new password: \npasswd: password updated successfully");
  };
  C.chage = function (m, a) { return out("Last password change                                    : Sep 10, 2026\nPassword expires                                        : never"); };

  /* ======================= processes ======================= */

  C.ps = function (m, a) {
    var g = getopt(a, { a: false, u: false, x: false, e: false, f: false, aux: false });
    var wide = has(a, "aux") || has(a, "-ef") || a.indexOf("-aux") !== -1;
    var rows = m.processes.slice();
    if (a.indexOf("aux") !== -1 || a.indexOf("-aux") !== -1) {
      var h = "USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND";
      return raw(h + "\n" + rows.map(function (p) { return (p.user + "      ").slice(0, 8) + " " + String(p.pid).padStart(5) + " " + p.cpu.toFixed(1).padStart(4) + " " + p.mem.toFixed(1).padStart(4) + " " + " 12036  3412 " + (p.tty + "      ").slice(0, 8) + " " + (p.stat + "   ").slice(0, 4) + " " + (p.start + "   ").slice(0, 6) + " " + p.time + " " + p.command; }).join("\n") + "\n");
    }
    if (a.indexOf("-ef") !== -1 || a.indexOf("-e") !== -1) {
      return raw("UID        PID  PPID  C STIME TTY          TIME CMD\n" + rows.map(function (p) { return (p.user + "        ").slice(0, 8) + " " + String(p.pid).padStart(4) + " " + String(p.pid - 1).padStart(5) + "  0 " + (p.start + "   ").slice(0, 5) + " " + (p.tty + "          ").slice(0, 12) + " " + p.time + " " + p.command; }).join("\n") + "\n");
    }
    return raw("    PID TTY          TIME CMD\n" + rows.filter(function (p) { return p.tty !== "?"; }).map(function (p) { return String(p.pid).padStart(7) + " " + (p.tty + "          ").slice(0, 12) + " " + p.time + " " + p.command; }).join("\n") + "\n");
  };

  C.top = function (m) {
    var load = (m.processes.reduce(function (s, p) { return s + p.cpu; }, 0) / 100).toFixed(2);
    var h = "top - 10:30:01 up 2:30,  1 user,  load average: " + load + ", 0.08, 0.03\nTasks: " + (m.processes.length + 120) + " total,   1 running, " + (m.processes.length + 110) + " sleeping,   0 stopped,   0 zombie\n" +
      "%Cpu(s):  1.2 us,  0.4 sy,  0.0 ni, 98.2 id,  0.1 wa,  0.0 hi,  0.1 si,  0.0 st\nMiB Mem :   1971.4 total,    312.3 free,    741.2 used,    917.9 buff/cache\n\n" +
      "    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND";
    return raw(h + "\n" + m.processes.slice().sort(function (a, b) { return b.cpu - a.cpu; }).map(function (p) {
      return String(p.pid).padStart(7) + " " + (p.user + "        ").slice(0, 9) + " 20   0  162344   3412   2100 " + p.stat + "  " + p.cpu.toFixed(1).padStart(4) + "  " + p.mem.toFixed(1).padStart(4) + "   0:0" + (p.pid % 9) + ".00 " + p.command;
    }).join("\n") + "\n");
  };
  C.htop = C.top;

  C.kill = function (m, a) {
    var g = getopt(a, { s: true, l: false, "9": false });
    var signal = 15, pids = [];
    for (var i = 0; i < a.length; i++) {
      if (a[i] === "-9") signal = 9;
      else if (a[i] === "-SIGKILL") signal = 9;
      else if (a[i] === "-SIGTERM") signal = 15;
      else if (a[i] === "-HUP") signal = 1;
      else if (/^-\d+$/.test(a[i])) signal = +a[i].slice(1);
      else if (!/^-/.test(a[i])) pids.push(a[i]);
    }
    if (g.opts.l) return raw(" 1) SIGHUP\t 2) SIGINT\t 9) SIGKILL\t15) SIGTERM\n");
    if (!pids.length) return fail("kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ...");
    var res = [];
    pids.forEach(function (p) {
      var pid = parseInt(p, 10);
      var idx = m.processes.findIndex(function (x) { return x.pid === pid; });
      if (idx === -1) { res.push("bash: kill: (" + p + ") - No such process"); return; }
      if (m.processes[idx].pid === 1) { res.push("bash: kill: (1) - Operation not permitted"); return; }
      m.processes.splice(idx, 1);
    });
    return raw(res.join("\n") + (res.length ? "\n" : ""));
  };
  C.pkill = function (m, a) {
    var g = getopt(a, { f: false, x: false, "9": false, u: true });
    var target = a.filter(function (x) { return x[0] !== "-"; })[0];
    if (!target) return fail("pkill: no process name supplied");
    var removed = 0;
    m.processes = m.processes.filter(function (p) { if (p.command.indexOf(target) !== -1 && p.pid !== 1) { removed++; return false; } return true; });
    return removed ? raw("") : { stdout: "", stderr: "", code: 1 };
  };
  C.killall = C.pkill;
  C.pgrep = function (m, a) {
    var target = a.filter(function (x) { return x[0] !== "-"; })[0];
    var found = m.processes.filter(function (p) { return p.command.indexOf(target) !== -1; });
    if (!found.length) return { stdout: "", stderr: "", code: 1 };
    return raw(found.map(function (p) { return p.pid; }).join("\n") + "\n");
  };

  C.jobs = function (m) {
    if (!m.jobs.length) return raw("");
    return raw(m.jobs.map(function (j, i) { return "[" + (i + 1) + "]+  " + j.state + "   " + j.command; }).join("\n") + "\n");
  };
  C.bg = function (m, a) { var j = m.jobs[(+a[0] || 1) - 1]; if (j) j.state = "Running"; return raw(""); };
  C.fg = function (m, a, ctx) {
    var j = m.jobs[(+a[0] || 1) - 1];
    if (!j) return fail("bash: fg: current: no such job");
    m.jobs.splice((+a[0] || 1) - 1, 1);
    return raw(j.command);
  };
  C.nohup = function (m, a) { if (!a.length) return fail("nohup: missing operand"); return out("nohup: ignoring input and appending output to 'nohup.out'"); };
  C.nice = function (m, a) { return out(""); };
  C.renice = function (m, a) { return out(""); };

  C.lsof = function (m, a) {
    if (a.indexOf("-i") !== -1) {
      var port = (a[a.indexOf("-i") + 1] || "").replace(/.*:/, "");
      var l = m.network.listeners.filter(function (x) { return !port || x.local.endsWith(":" + port); });
      return raw("COMMAND   PID     USER   FD   TYPE DEVICE SIZE/OFF NODE NAME\n" + l.map(function (x) {
        var p = m.processes.find(function (pp) { return pp.command.indexOf(x.process) !== -1; }) || { pid: 1000, user: "root" };
        return (x.process + "      ").slice(0, 8) + " " + p.pid + " " + (p.user + "       ").slice(0, 8) + "   6u  IPv4  " + (20000 + p.pid) + "    0t0  TCP " + x.local + " (LISTEN)";
      }).join("\n") + "\n");
    }
    return raw("COMMAND   PID   USER   FD   TYPE DEVICE SIZE/OFF NODE NAME\nbash     2210    sam  cwd    DIR  254,1    4096    2 " + m.cwd + "\nbash     2210    sam  txt    REG  254,1  1234567 1234 /usr/bin/bash\n");
  };
  C.strace = function (m, a) {
    var cmd = a.filter(function (x) { return x[0] !== "-"; }).join(" ") || "command";
    return raw('execve("/usr/bin/' + cmd.split(" ")[0] + '", ["' + cmd.split(" ").join('", "') + '"], 0x7ffd /* 24 vars */) = 0\n' +
      'access("/etc/ld.so.preload", R_OK) = -1 ENOENT (No such file or directory)\n' +
      'openat(AT_FDCWD, "/etc/ld.so.cache", O_RDONLY|O_CLOEXEC) = 3\n' +
      'openat(AT_FDCWD, "/lib/x86_64-linux-gnu/libc.so.6", O_RDONLY|O_CLOEXEC) = 3\n' +
      'write(1, "ok\\n", 3)               = 3\n' +
      'exit_group(0)                          = ?\n' +
      '+++ exited with 0 +++\n');
  };

  C.watch = function (m, a, ctx) {
    var cmd = a.filter(function (x) { return x[0] !== "-"; });
    return raw("Every 2.0s: " + cmd.join(" ") + "\n\n" + (Commands._dispatch(m, cmd, { stdin: "" }).stdout || ""));
  };
  C.sleep = function (m, a) { return raw(""); };
  C.uptime = function (m) { return out(" 10:30:00 up 2:30,  1 user,  load average: 0.08, 0.03, 0.01"); };
  C.free = function (m, a) {
    var g = getopt(a, { h: false, m: false, g: false });
    if (g.opts.h) return raw("               total        used        free      shared  buff/cache   available\nMem:           1.9Gi       741Mi       312Mi        12Mi       917Mi       1.0Gi\nSwap:          2.0Gi          0B       2.0Gi\n");
    return raw("               total        used        free      shared  buff/cache   available\nMem:         2018700      759168      319744       12288      939788     1054884\nSwap:        2097148           0     2097148\n");
  };
  C.vmstat = function () { return raw("procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----\n r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st\n 1  0      0 319744  48212 891576    0    0    12    23  102  214  1  0 98  0  0\n"); };
  C.iostat = function () { return raw("Linux 5.15.0-91-generic (ubuntu-lab) \t09/10/2026 \t_x86_64_\t(1 CPU)\n\navg-cpu:  %user   %nice %system %iowait  %steal   %idle\n           1.20    0.00    0.40    0.10    0.00   98.30\n\nDevice            tps    kB_read/s    kB_wrtn/s    kB_read    kB_wrtn\nsda              1.20        12.30        23.40     123456     234567\n"); };

  /* ======================= systemd / services ======================= */

  C.systemctl = function (m, a) {
    var knownCmds = ["start", "stop", "restart", "reload", "enable", "disable", "status", "is-active", "is-enabled", "daemon-reload", "list-units", "list-unit-files", "cat", "mask", "unmask"];
    var cmd = a[0];
    if (a.indexOf("--no-pager") !== -1) a = a.filter(function (x) { return x !== "--no-pager"; });
    if (a[0] === "--no-pager") a = a.slice(1); cmd = a[0];
    if (!cmd) return fail("systemctl: missing command");
    if (cmd === "daemon-reload") {
      try {
        var sysdir = m.fs.stat("/etc/systemd/system", "/", m.env);
        if (sysdir && sysdir.children) {
          for (var f in sysdir.children) {
            if (/\.service$/.test(f) && !m.services[f]) {
              m.services[f] = { description: f.replace(".service", "") + " service", active: false, enabled: false };
            }
          }
        }
      } catch (e) {}
      return raw("");
    }

    // normalize "unit.service"
    function unitName(u) { return u && u.indexOf(".") === -1 && m.services[u + ".service"] ? u + ".service" : u; }
    var unit = unitName(a[1]);
    if (cmd === "status") {
      var u = unit || "systemd";
      if (u === "systemd") return raw("● systemd\n     State: running");
      var s = m.services[u];
      if (!s) return fail("Unit " + u + ".service could not be found.", 4);
      var active = s.active ? "active (running)" : "inactive (dead)";
      var pid = getServicePid(m, u);
      return raw("● " + u + " - " + s.description + "\n     Loaded: loaded (/lib/systemd/system/" + u + "; " + (s.enabled ? "enabled" : "disabled") + "; vendor preset: enabled)\n     Active: " + active + (s.active ? " since Wed 2026-09-10 08:00:00 UTC; 2h 30min ago" : "") +
        (s.active && pid ? "\n   Main PID: " + pid + " (" + u.replace(".service", "") + ")" : "") + "\n      Tasks: 1 (limit: 1102)\n     Memory: 5.2M\n        CPU: 120ms");
    }
    if (cmd === "is-active") return { stdout: (m.services[unit] && m.services[unit].active ? "active" : "inactive") + "\n", stderr: "", code: (m.services[unit] && m.services[unit].active) ? 0 : 3 };
    if (cmd === "is-enabled") return { stdout: (m.services[unit] && m.services[unit].enabled ? "enabled" : "disabled") + "\n", stderr: "", code: (m.services[unit] && m.services[unit].enabled) ? 0 : 1 };
    if (cmd === "list-units" || cmd === "list-unit-files") {
      return raw("UNIT FILE                 STATE    VENDOR PRESET\n" + Object.keys(m.services).map(function (k) { return (k + "                        ").slice(0, 26) + (m.services[k].enabled ? "enabled " : "disabled") + " enabled"; }).join("\n") + "\n\n" + Object.keys(m.services).length + " unit files listed.\n");
    }
    if (cmd === "list-timers") {
      return raw("NEXT                        LEFT       LAST                        PASSED    UNIT                         ACTIVATES\nWed 2026-09-10 12:00:00 UTC 1h 29min   Wed 2026-09-10 08:00:00 UTC 2h 30min  certbot.timer                certbot.service\nWed 2026-09-10 12:00:00 UTC 1h 29min   Wed 2026-09-10 08:00:00 UTC 2h 30min  logrotate.timer              logrotate.service\n\n2 timers listed.\n");
    }
    if (cmd === "show" || cmd === "cat") return raw("# /lib/systemd/system/" + unit + "\n[Unit]\nDescription=" + (m.services[unit] ? m.services[unit].description : "") + "\n[Service]\nExecStart=/usr/sbin/" + unit.replace(".service", "") + "\n[Install]\nWantedBy=multi-user.target\n");
    if (cmd === "start" || cmd === "stop" || cmd === "restart" || cmd === "reload" || cmd === "enable" || cmd === "disable") {
      var s = m.services[unit];
      if (!s) {
        if (cmd === "reload" || cmd === "daemon-reload") return raw("");
        return fail("Failed to " + cmd + " " + unit + ": Unit " + unit + " not found.", 5);
      }
      if (cmd === "start" || cmd === "restart") { s.active = true; ensureProcess(m, unit); addUnitListener(m, unit); }
      if (cmd === "stop") { s.active = false; removeProcess(m, unit); removeUnitListener(m, unit); }
      if (cmd === "enable") { s.enabled = true; if (a.indexOf("--now") !== -1) { s.active = true; ensureProcess(m, unit); addUnitListener(m, unit); } }
      if (cmd === "disable") { s.enabled = false; if (a.indexOf("--now") !== -1) { s.active = false; removeProcess(m, unit); removeUnitListener(m, unit); } }
      return raw("");
    }
    return fail("Unknown command verb " + cmd + ".", 1);
  };
  function getServicePid(m, unit) { var base = unit.replace(".service", ""); var p = m.processes.find(function (x) { return x.command.indexOf(base) !== -1; }); return p ? p.pid : null; }
  function ensureProcess(m, unit) {
    var base = unit.replace(".service", "");
    if (m.processes.some(function (p) { return p.command.indexOf(base) !== -1; })) return;
    m.processes.push({ pid: m.nextPid++, user: "root", cpu: 0.0, mem: 0.6, tty: "?", stat: "Ss", start: "10:30", time: "00:00:00", command: "/usr/sbin/" + base });
  }
  function removeProcess(m, unit) { var base = unit.replace(".service", ""); m.processes = m.processes.filter(function (p) { return !(p.command.indexOf(base) !== -1 && p.pid !== 1); }); }
  function addUnitListener(m, unit) {
    var base = unit.replace(".service", "");
    var spec = { postgresql: { local: "127.0.0.1:5432", process: "postgres" }, app: { local: "127.0.0.1:8000", process: "python3" }, node_exporter: { local: "0.0.0.0:9100", process: "node_exporter" } }[base];
    if (spec && !m.network.listeners.some(function (l) { return l.local === spec.local; })) m.network.listeners.push({ proto: "tcp", local: spec.local, process: spec.process });
  }
  function removeUnitListener(m, unit) {
    var base = unit.replace(".service", "");
    var spec = { postgresql: "127.0.0.1:5432", app: "127.0.0.1:8000", node_exporter: "0.0.0.0:9100" }[base];
    if (spec) m.network.listeners = m.network.listeners.filter(function (l) { return l.local !== spec; });
  }

  C.service = function (m, a) {
    var cmd = a[0], name = a[1];
    if (cmd === "status") return C.systemctl(m, ["status", name]);
    if (cmd === "--status-all") return raw("[ + ]  cron\n [ + ]  dbus\n [ + ]  docker\n [ + ]  nginx\n [ - ]  ufw\n [ + ]  ssh\n");
    if (["start", "stop", "restart", "reload"].indexOf(cmd) !== -1) return C.systemctl(m, [cmd, name]);
    return fail("Usage: service < option > | --status-all | [ service_name [ command | ] ]");
  };

  C.journalctl = function (m, a) {
    var g = getopt(a, { u: true, n: true, f: false, p: true, r: false, "no-pager": false, since: true, S: true });
    var o = g.opts;
    var unit = o.u;
    var n = o.n ? parseInt(o.n, 10) : 20;
    var lines = (m.fs.stat("/var/log/syslog", "/", m.env) ? m.fs.readFile("/var/log/syslog", "/", m.env) : "").trim().split("\n");
    if (unit) {
      var base = unit.replace(".service", "");
      lines = lines.filter(function (l) { return l.indexOf(base) !== -1 || l.indexOf(unit) !== -1; });
      if (!lines.length) lines = ["Sep 10 09:14:55 ubuntu-lab " + base + "[2401]: started"];
    }
    if (o.p) {
      var pri = o.p.replace(/^--?p=?/, "").replace(/^\w+$/, "$&").toLowerCase();
    }
    var res = lines.slice(-n).map(function (l) {
      return "Sep 10 10:00:00 ubuntu-lab " + l.replace(/^[A-Z][a-z]{2} \d+ \d\d:\d\d:\d\d \S+ /, "");
    });
    if (o.r) res.reverse();
    return raw("-- Logs begin at Wed 2026-09-10 08:00:00 UTC, end at Wed 2026-09-10 10:30:00 UTC. --\n" + res.join("\n") + "\n");
  };

  C.dmesg = function (m, a) {
    var g = getopt(a, { T: false, l: false });
    return raw(m.fs.readFile("/var/log/kern.log", "/", m.env).split("\n").map(function (l) { return l.replace(/^.*kernel: /, ""); }).join("\n"));
  };

  C.hostnamectl = function (m, a) {
    if (a[0] === "set-hostname") { m.hostname = a[1]; return raw(""); }
    return raw("   Static hostname: " + m.hostname + "\n         Icon name: computer-vm\n           Chassis: vm\n        Machine ID: 1234567890abcdef\n           Boot ID: abcdef1234567890\n    Virtualization: kvm\n  Operating System: Ubuntu 22.04.4 LTS\n            Kernel: Linux 5.15.0-91-generic\n      Architecture: x86-64\n");
  };
  C.uname = function (m, a) {
    if (a.indexOf("-a") !== -1) return out("Linux " + m.hostname + " 5.15.0-91-generic #101-Ubuntu SMP Tue Nov 14 13:30:08 UTC 2023 x86_64 x86_64 x86_64 GNU/Linux");
    if (a.indexOf("-r") !== -1) return out("5.15.0-91-generic");
    if (a.indexOf("-n") !== -1) return out(m.hostname);
    if (a.indexOf("-s") !== -1) return out("Linux");
    if (a.indexOf("-m") !== -1) return out("x86_64");
    return out("Linux");
  };
  C.hostname = function (m, a) { if (a[0]) { m.hostname = a[0]; return raw(""); } return out(m.hostname); };
  C.date = function (m, a) {
    if (a[0] && a[0][0] === "+") return out(a[0].replace("%Y", "2026").replace("%m", "09").replace("%d", "10").replace("%H", "10").replace("%M", "30").replace("%S", "00").replace("%F", "2026-09-10").replace("%T", "10:30:00"));
    return out("Wed Sep 10 10:30:00 UTC 2026");
  };
  C.cal = function () { return raw("   September 2026\nSu Mo Tu We Th Fr Sa\n       1  2  3  4  5\n 6  7  8  9 10 11 12\n13 14 15 16 17 18 19\n20 21 22 23 24 25 26\n27 28 29 30\n"); };
  C.timedatectl = function (m, a) {
    if (a[0] === "set-timezone" && a[1]) { m.timezone = a[1]; return raw(""); }
    if (a[0] === "set-time" && a[1]) { return raw(""); }
    var tz = m.timezone || "Etc/UTC";
    return raw("               Local time: Wed 2026-09-10 10:30:00 UTC\n           Universal time: Wed 2026-09-10 10:30:00 UTC\n                 RTC time: Wed 2026-09-10 10:30:00\n                Time zone: " + tz + " (UTC, +0000)\nSystem clock synchronized: yes\n              NTP service: active\n          RTC in local TZ: no\n");
  };
  C.reboot = function (m) { return out("Reboot scheduled for Wed 2026-09-10 10:31:00 UTC...\n(System would reboot now in a real machine; use Reset to restore.)"); };
  C.shutdown = function (m, a) { return out("Shutdown scheduled for Wed 2026-09-10 10:31:00 UTC, use 'shutdown -c' to cancel."); };
  C.poweroff = C.reboot;

  /* ======================= storage ======================= */

  C.df = function (m, a) {
    var g = getopt(a, { h: false, i: false, T: false });
    if (g.opts.i) return raw("Filesystem      Inodes  IUsed   IFree IUse% Mounted on\n/dev/sda1      1638400 312233 1326167   20% /\ntmpfs           504675      1  504674    1% /run\n");
    var head = "Filesystem      " + (g.opts.T ? "Type  " : "") + " Size  Used Avail Use% Mounted on";
    return raw(head + "\n" + m.disks.map(function (d) {
      if (g.opts.h) return (d.filesystem + "        ").slice(0, 15) + " " + (g.opts.T ? "ext4  " : "") + " " + d.size + "G  " + d.used + "G  " + d.avail + "G  " + d.usePct + "% " + d.mount;
      return (d.filesystem + "        ").slice(0, 15) + " " + (g.opts.T ? "ext4  " : "") + " " + String(Math.round(d.size * 1048576)).padStart(7) + " " + String(Math.round(d.used * 1048576)).padStart(6) + " " + String(Math.round(d.avail * 1048576)).padStart(6) + "  " + String(d.usePct).padStart(2) + "% " + d.mount;
    }).join("\n") + "\n");
  };

  C.du = function (m, a, ctx) {
    var g = getopt(a, { h: false, s: false, a: false, "max-depth": true });
    var paths = g.rest.length ? g.rest : ["."];
    var results = [];
    function sizeOf(p) {
      var abs = m.fs.resolve(p, m.cwd, m.env);
      var n = m.fs.stat(abs, "/", m.env);
      if (!n) return 0;
      if (n.type === VFS.type.FILE) return m.fs.sizeOf(n);
      var t = 4096;
      for (var k in n.children) t += sizeOf(abs.replace(/\/$/, "") + "/" + k);
      return t;
    }
    paths.forEach(function (p) { results.push(String(Math.max(4, Math.ceil(sizeOf(p) / 1024))).padStart(6) + "\t" + p); });
    if (g.opts.h) results = results.map(function (r) { return r.replace(/^\s*\d+/, function (x) { return "  " + fmtSize(parseInt(x, 10) * 1024); }); });
    return raw(results.join("\n") + "\n");
  };

  C.lsblk = function (m, a) {
    return raw("NAME    MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT\nsda       8:0    0   25G  0 disk \n└─sda1    8:1    0   25G  0 part /\nsda14     8:14   0    4M  0 part \nsda15     8:15   0  106M  0 part /boot/efi\nsr0      11:0    1 1024M  0 rom  \n");
  };
  C.blkid = function () { return raw("/dev/sda1: LABEL=\"cloudimg-rootfs\" UUID=\"abcd-1234-5678-efgh\" TYPE=\"ext4\" PARTUUID=\"1234-01\"\n"); };
  C.fdisk = function (m, a) {
    if (a.indexOf("-l") !== -1) return raw("Disk /dev/sda: 25 GiB, 26843545600 bytes, 52428800 sectors\nDisk model: Virtual Disk    \nUnits: sectors of 1 * 512 = 512 bytes\n\nDevice     Boot Start      End  Sectors Size Id Type\n/dev/sda1  *     2048 52428766 52426719  25G 83 Linux\n");
    return fail("fdisk: cannot open " + (a[0] || "/dev/sda") + ": Operation not permitted");
  };
  C.mkfs = function (m, a) { var dev = a[a.length - 1]; return raw("mke2fs 1.46.5 (30-Dec-2021)\nCreating filesystem with 2621440 4k blocks and 655360 inodes\nFilesystem UUID: 1234abcd-5678-efgh\nCreating journal (32768 blocks): done\nWriting superblocks and filesystem accounting information: done\n"); };
  C.mount = function (m) {
    return raw(m.mounts.map(function (x) { return x.device + " on " + x.mount + " type " + x.type + " " + x.options; }).join("\n") + "\n");
  };
  C.umount = function (m, a) {
    var t = a[a.length - 1];
    var idx = m.mounts.findIndex(function (x) { return x.mount === t || x.device === t; });
    if (idx === -1) return fail("umount: " + t + ": not mounted.");
    m.mounts.splice(idx, 1);
    return raw("");
  };
  C.swapon = function (m, a) {
    if (a[0] === "--show" || a[0] === "-s") {
      return raw("NAME      TYPE SIZE USED PRIO\n" + m.swaps.map(function (s) { return (s.file + "                             ").slice(0, 30) + " file       " + s.size + "   0B   -2"; }).join("\n") + (m.swaps.length ? "\n" : ""));
    }
    var dev = a[0];
    if (dev) {
      var n = m.fs.stat(dev, m.cwd, m.env);
      if (!n) return fail("swapon: " + dev + ": read swap header failed");
      if (!m.swaps.some(function (s) { return s.file === dev; })) m.swaps.push({ file: dev, size: "2G" });
      return raw("");
    }
    return raw("NAME      TYPE SIZE USED PRIO\n" + m.swaps.map(function (s) { return s.file + " file   2G   0B   -2\n"; }).join(""));
  };
  C.swapoff = function () { return raw(""); };
  C.fsck = function (m, a) { return raw("fsck from util-linux 2.37.2\n" + (a[0] || "/dev/sda1") + ": clean, 312233/1638400 files, 2189207/6553600 blocks\n"); };

  C.tar = function (m, a, ctx) {
    var flags = "", file = null, rest = [], verbose = false, changeDir = null;
    for (var i = 0; i < a.length; i++) {
      var x = a[i];
      if (x === "-C") { changeDir = a[++i]; continue; }
      if (x[0] === "-" && /^-[a-zA-Z]+$/.test(x)) { flags += x.slice(1); continue; }
      if (!flags) { flags += x; continue; }
      if (flags.indexOf("f") !== -1 && file === null) { file = x; continue; }
      rest.push(x);
    }
    var op = flags.indexOf("c") !== -1 ? "c" : flags.indexOf("x") !== -1 ? "x" : flags.indexOf("t") !== -1 ? "t" : "c";
    verbose = flags.indexOf("v") !== -1;
    if (!file) return fail("tar: Refusing to read archive contents from terminal (missing -f option?)");
    if (changeDir) { var cdNode = m.fs.stat(changeDir, m.cwd, m.env); if (cdNode) m._tarCwd = changeDir; }
    var baseCwd = changeDir || m.cwd;
    function entries() { return m.fs.list && []; }

    if (op === "c") {
      if (!rest.length) return fail("tar: Cowardly refusing to create an empty archive");
      var collected = [];
      rest.forEach(function (src) {
        var abs = m.fs.resolve(src, baseCwd, m.env);
        var node = m.fs.stat(abs, "/", m.env);
        if (!node) { collected.push({ err: "tar: " + src + ": Cannot stat: No such file or directory" }); return; }
        (function walk(n, path) {
          collected.push({ path: path.replace(/^\//, ""), type: n.type, mode: n.mode, owner: n.owner, group: n.group, content: n.content, target: n.target });
          if (n.type === VFS.type.DIR) for (var k in n.children) walk(n.children[k], path.replace(/\/$/, "") + "/" + k);
        })(node, abs);
      });
      var data = JSON.stringify(collected);
      var archiveName = (file.indexOf("/") === -1 ? "" : m.fs.resolve(file, baseCwd, m.env));
      if (archiveName) m.fs.writeFile(archiveName, "/", m.env, data);
      else m.fs.writeFile(file, baseCwd, m.env, data);
      return raw(verbose ? collected.filter(function (c) { return !c.err; }).map(function (c) { return c.path; }).join("\n") + "\n" : "");
    }
    if (op === "t" || op === "x") {
      var archive = m.fs.stat(file, baseCwd, m.env);
      if (!archive) return fail("tar: " + file + ": Cannot open: No such file or directory");
      var list;
      try { list = JSON.parse(archive.content); } catch (e) { return fail("tar: " + file + ": This does not look like a tar archive"); }
      if (op === "t") return raw(list.map(function (e) { return e.path; }).join("\n") + "\n");
      var targetCwd = changeDir ? m.fs.resolve(changeDir, m.cwd, m.env) : m.cwd;
      list.forEach(function (e) {
        var dest = "/" + e.path;
        try {
          if (e.type === VFS.type.DIR) m.fs.mkdir(dest, "/", m.env, true);
          else if (e.type === VFS.type.LINK) m.fs.symlink(e.target, dest, "/", m.env);
          else m.fs.writeFile(dest, "/", m.env, e.content || "");
        } catch (err) {}
      });
      return raw(verbose ? list.map(function (e) { return e.path; }).join("\n") + "\n" : "");
    }
    return fail("tar: unknown operation");
  };
  C.gzip = function (m, a) { a.forEach(function (f) { var n = m.fs.stat(f, m.cwd, m.env); if (n) { m.fs.writeFile(f + ".gz", m.cwd, m.env, n.content || ""); m.fs.rm(f, m.cwd, m.env); } }); return raw(""); };
  C.gunzip = function (m, a) { a.forEach(function (f) { var n = m.fs.stat(f, m.cwd, m.env); if (n) { var out = f.replace(/\.gz$/, ""); m.fs.writeFile(out, m.cwd, m.env, n.content || ""); m.fs.rm(f, m.cwd, m.env); } }); return raw(""); };
  C.zip = function (m, a) { if (a.length < 2) return fail("zip error: Nothing to do!"); return raw("  adding: " + a.slice(1).join(" ") + " (deflated 12%)\n"); };
  C.unzip = function (m, a) { return raw("Archive:  " + (a[0] || "") + "\n  inflating: extracted\n"); };


  /* ======================= networking ======================= */

  C.ip = function (m, a) {
    var sub = a[0];
    if (sub === "a" || sub === "addr" || sub === "address") {
      return raw(m.network.interfaces.map(function (i) {
        return i.name + ": <" + i.flags + "> mtu " + i.mtu + " qdisc fq_codel state " + i.state + " group default qlen 1000\n    link/ether " + i.mac + " brd ff:ff:ff:ff:ff:ff\n    inet " + i.addr + " scope global " + (i.name === "lo" ? "" : "dynamic ") + i.name + "\n       valid_lft 86392sec preferred_lft 86392sec";
      }).join("\n\n") + "\n");
    }
    if (sub === "r" || sub === "route") {
      return raw("default via " + m.network.routes[0].via + " dev eth0 proto dhcp src 10.0.2.15 metric 100\n" +
        m.network.routes.slice(1).map(function (r) { return r.dest + " via " + r.via + " dev " + r.dev + " proto kernel scope link src 10.0.2.15"; }).join("\n") + "\n");
    }
    if (sub === "link") {
      return raw(m.network.interfaces.map(function (i) { return "2: " + i.name + ": <" + i.flags + "> mtu " + i.mtu + " state " + i.state + " mode DEFAULT\n    link/ether " + i.mac; }).join("\n") + "\n");
    }
    return fail("Usage: ip [ OPTIONS ] OBJECT { COMMAND | help }");
  };
  C.ifconfig = function (m, a) {
    return raw(m.network.interfaces.map(function (i) {
      return i.name + ": flags=" + (i.flags.indexOf("UP") !== -1 ? "4163" : "73") + "<UP,BROADCAST,RUNNING,MULTICAST>  mtu " + i.mtu + "\n        inet " + i.addr + "  netmask 255.255.255.0  broadcast 10.0.2.255\n        ether " + i.mac + "  txqueuelen 1000  (Ethernet)\n        RX packets 1234  bytes 234567 (234.5 KB)\n        TX packets 987  bytes 123456 (123.4 KB)";
    }).join("\n\n") + "\n");
  };

  C.ping = function (m, a, ctx) {
    var g = getopt(a, { c: true, W: true, i: true });
    var host = g.rest[0];
    if (!host) return fail("ping: usage error: Destination address required");
    var count = g.opts.c ? parseInt(g.opts.c, 10) : 4;
    var ip = m.hosts[host] || (/^\d+\.\d+\.\d+\.\d+$/.test(host) ? host : null);
    if (!ip) return fail("ping: " + host + ": Name or service not known");
    var lines = ["PING " + host + " (" + ip + ") 56(84) bytes of data."];
    for (var i = 0; i < count; i++) lines.push("64 bytes from " + ip + ": icmp_seq=" + (i + 1) + " ttl=64 time=0." + (200 + i * 37) + " ms");
    lines.push("", "--- " + host + " ping statistics ---");
    lines.push(count + " packets transmitted, " + count + " received, 0% packet loss, time " + (count * 1000) + "ms");
    lines.push("rtt min/avg/max/mdev = 0.200/0.250/0.400/0.050 ms");
    return raw(lines.join("\n") + "\n");
  };

  C.ss = function (m, a) {
    var g = getopt(a, { t: false, u: false, l: false, n: false, p: false, a: false, "4": false, "6": false });
    var listeners = m.network.listeners;
    var res = ["State  Recv-Q Send-Q Local Address:Port  Peer Address:Port Process"];
    listeners.forEach(function (l) {
      if (g.opts.t && l.proto !== "tcp") return;
      if (g.opts.u && l.proto !== "udp") return;
      var proc = g.opts.p ? ' users:(("' + l.process + '",pid=' + (1000 + Math.abs(hash(l.local)) % 8000) + ',fd=6))' : "";
      res.push("LISTEN 0      128    " + (l.local + "                    ").slice(0, 21) + " " + "0.0.0.0:*         " + proc);
    });
    return raw(res.join("\n") + "\n");
  };
  C.netstat = function (m, a) {
    var g = getopt(a, { t: false, u: false, l: false, n: false, p: false, a: false });
    if (a.indexOf("-rn") !== -1 || a.indexOf("-r") !== -1) {
      return raw("Kernel IP routing table\nDestination     Gateway         Genmask         Flags Metric Ref    Use Iface\n0.0.0.0         10.0.2.2        0.0.0.0         UG    100    0        0 eth0\n10.0.2.0        0.0.0.0         255.255.255.0   U     100    0        0 eth0\n");
    }
    var res = ["Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name"];
    m.network.listeners.forEach(function (l) {
      if (g.opts.t && l.proto !== "tcp") return;
      res.push((l.proto + "        0      0 " + (l.local + "                      ").slice(0, 23) + " 0.0.0.0:*               LISTEN      1000/" + l.process).replace("tcp  ", "tcp  "));
    });
    return raw(res.join("\n") + "\n");
  };

  C.dig = function (m, a) {
    var g = getopt(a, { "+short": false });
    var host = a.filter(function (x) { return x[0] !== "+"; })[0];
    if (!host) return fail("dig: missing host");
    var ip = m.hosts[host] || "93.184.216.34";
    if (a.indexOf("+short") !== -1) return out(ip);
    return raw("; <<>> DiG 9.18.18 <<>> " + host + "\n;; global options: +cmd\n;; Got answer:\n;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 12345\n;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1\n\n;; QUESTION SECTION:\n;" + host + ".\t\t\tIN\tA\n\n;; ANSWER SECTION:\n" + host + ".\t\t300\tIN\tA\t" + ip + "\n\n;; Query time: 12 msec\n;; SERVER: 1.1.1.1#53(1.1.1.1)\n;; MSG SIZE  rcvd: 55\n");
  };
  C.nslookup = function (m, a) {
    var host = a.filter(function (x) { return x[0] !== "-"; })[0];
    var ip = m.hosts[host] || "93.184.216.34";
    return raw("Server:\t\t127.0.0.53\nAddress:\t127.0.0.53#53\n\nNon-authoritative answer:\nName:\t" + host + "\nAddress: " + ip + "\n");
  };
  C.host = C.nslookup;
  C.traceroute = function (m, a) {
    var host = a[0];
    return raw("traceroute to " + host + " (93.184.216.34), 30 hops max, 60 byte packets\n 1  _gateway (10.0.2.2)  0.321 ms  0.298 ms  0.276 ms\n 2  10.0.0.1 (10.0.0.1)  1.234 ms  1.201 ms  1.180 ms\n 3  93.184.216.34 (93.184.216.34)  12.345 ms  12.300 ms  12.280 ms\n");
  };

  C.curl = function (m, a) {
    var g = getopt(a, { I: false, i: false, s: false, o: true, X: true, d: true, H: true, L: false, v: false, k: false, u: true, w: true });
    var url = a.filter(function (x) { return x[0] !== "-"; })[0];
    if (!url && !g.opts.w) return fail("curl: try 'curl --help' for more information");
    if (url && /^https?:\/\/(localhost|127\.0\.0\.1)/.test(url)) {
      var path = url.replace(/^https?:\/\/[^/]+/, "") || "/";
      if (g.opts.I || g.opts.i) return raw("HTTP/1.1 200 OK\r\nServer: nginx/1.18.0 (Ubuntu)\r\nDate: Wed, 10 Sep 2026 10:30:00 GMT\r\nContent-Type: text/html\r\nContent-Length: 612\r\nConnection: keep-alive\r\n\r\n");
      if (path === "/" || path === "/index.html") return raw("<!DOCTYPE html>\n<html><head><title>Welcome</title></head><body><h1>Welcome to nginx!</h1></body></html>\n");
      if (path === "/health") return raw('{"status":"ok","uptime":12345}\n');
      if (path === "/metrics") return raw("# HELP node_cpu_seconds_total Seconds the CPUs spent in each mode.\n# TYPE node_cpu_seconds_total counter\nnode_cpu_seconds_total{cpu=\"0\",mode=\"idle\"} 12345.67\nnode_cpu_seconds_total{cpu=\"0\",mode=\"user\"} 234.12\n# HELP node_memory_MemAvailable_bytes Memory information field MemAvailable_bytes.\n# TYPE node_memory_MemAvailable_bytes gauge\nnode_memory_MemAvailable_bytes 1.0737e+09\n# HELP node_load1 1m load average.\nnode_load1 0.08\n");
      return { stdout: "<html><body>Not Found</body></html>\n", stderr: "", code: 0 };
    }
    if (g.opts.w) {
      var fmt = String(g.opts.w);
      return raw(fmt.replace(/%\{http_code\}/g, "200").replace(/%\{time_total\}/g, (0.012 + Math.random() * 0.02).toFixed(6)).replace(/%\{time_connect\}/g, "0.000412").replace(/%\{time_namelookup\}/g, "0.000123").replace(/%\{size_download\}/g, "612"));
    }
    return raw((g.opts.v ? "* Connected to " + (url || "") + " (93.184.216.34) port 443\n> GET / HTTP/2\n> Host: " + (url || "") + "\n" : "") +
      (g.opts.I || g.opts.i ? "HTTP/2 200 \r\ndate: Wed, 10 Sep 2026 10:30:00 GMT\r\ncontent-type: text/html; charset=UTF-8\r\nserver: nginx\r\ncontent-length: 612\r\n\r\n" : "") +
      (g.opts.I ? "" : "<!doctype html>\n<html><body>Example Domain</body></html>\n"));
  };
  C.wget_url = C.wget;

  C.ufw = function (m, a) {
    var sub = a[0];
    if (sub === "status") {
      return raw("Status: " + (m.firewall.enabled ? "active" : "inactive") + "\n" + (m.firewall.enabled ? "\nTo                         Action      From\n--                         ------      ----\n22/tcp                     ALLOW       Anywhere\n80/tcp                     ALLOW       Anywhere\n443/tcp                    ALLOW       Anywhere\n22/tcp (v6)                ALLOW       Anywhere (v6)\n" : ""));
    }
    if (sub === "enable") { m.firewall.enabled = true; return out("Firewall is active and enabled on system startup"); }
    if (sub === "disable") { m.firewall.enabled = false; return out("Firewall stopped and disabled on system startup"); }
    if (sub === "allow") { m.firewall.rules.push({ action: "ALLOW", rule: a[1] }); m.firewall.enabled = true; return out("Rule added\nRule added (v6)"); }
    if (sub === "deny" || sub === "reject") { m.firewall.rules.push({ action: sub.toUpperCase(), rule: a[1] }); return out("Rule added"); }
    if (sub === "delete") { return out("Rule deleted"); }
    if (sub === "reset") { m.firewall = { enabled: false, defaultIncoming: "deny", rules: [] }; return out("Resetting all rules to installed defaults."); }
    return fail("ERROR: Unsupported command");
  };
  C.iptables = function (m, a) {
    if (a.indexOf("-L") !== -1) return raw("Chain INPUT (policy ACCEPT)\ntarget     prot opt source               destination\nACCEPT     tcp  --  anywhere             anywhere             tcp dpt:ssh\n\nChain FORWARD (policy DROP)\ntarget     prot opt source               destination\n\nChain OUTPUT (policy ACCEPT)\ntarget     prot opt source               destination\n");
    return raw("");
  };
  C.netplan = function (m, a) {
    if (a[0] === "get") return raw("network:\n  version: 2\n  ethernets:\n    eth0:\n      dhcp4: true\n");
    if (a[0] === "apply") return out("(netplan apply simulated — network configuration applied)");
    return fail("Usage: netplan {get|apply|try}");
  };

  /* ======================= ssh / remote ======================= */

  C.ssh = function (m, a, ctx) {
    var g = getopt(a, { i: true, p: true, v: false, L: true, R: true, D: true, N: false, o: true });
    var target = a.filter(function (x) { return x[0] !== "-"; })[0];
    var cmdArgs = [];
    // everything after host that isn't an option
    var seenHost = false;
    for (var i = 0; i < a.length; i++) {
      if (a[i] === target) { seenHost = true; continue; }
      if (seenHost) cmdArgs.push(a[i]);
    }
    if (!target) return fail("usage: ssh [-p port] [user@]hostname [command]");
    var parts = target.split("@");
    var user = parts.length > 1 ? parts[0] : (m.user === "root" ? "root" : "sam");
    var host = parts.length > 1 ? parts[1] : parts[0];
    var known = m.hosts[host] || m.remote[host];
    if (!known) return fail("ssh: Could not resolve hostname " + host + ": Name or service not known");
    if (m.remote[host] && m.remote[host].reachable === false) return fail("ssh: connect to host " + host + " port 22: Connection refused");
    if (cmdArgs.length) {
      // run one command remotely, return mocked output
      return raw("Welcome to Ubuntu 22.04.4 LTS (GNU/Linux 5.15.0-91-generic x86_64)\n\nLast login: Wed Sep 10 09:00:00 2026 from 10.0.2.2\n$ " + cmdArgs.join(" ") + "\n" + remoteExec(m, host, cmdArgs.join(" ")));
    }
    ctx.pendingSsh = { host: host, user: user };
    return { stdout: "", stderr: "", code: 0, ssh: { host: host, user: user } };
  };
  function remoteExec(m, host, cmd) {
    var r = m.remote[host] || {};
    if (cmd.indexOf("uptime") !== -1) return " 10:31:00 up 5 days, 3:12, 2 users, load average: 0.00, 0.01, 0.05\n";
    if (cmd.indexOf("hostname") !== -1) return host + "\n";
    if (cmd.indexOf("ls") !== -1) return "app  releases  shared  www\n";
    if (cmd.indexOf("df") !== -1) return "Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        40G   12G   26G  32% /\n";
    return "";
  }
  C.scp = function (m, a) {
    var g = getopt(a, { r: false, P: true, i: true, v: false });
    var rest = a.filter(function (x) { return x[0] !== "-"; });
    if (rest.length < 2) return fail("usage: scp [-r] source ... target");
    var src = rest[0], dst = rest[rest.length - 1];
    if (src.indexOf(":") !== -1) {
      var hp = src.split(":"); var host = hp[0].split("@").pop();
      if (!m.hosts[host] && !m.remote[host]) return fail("ssh: Could not resolve hostname " + host + ": Name or service not known");
      var basename = hp[1].split("/").pop();
      try { m.fs.writeFile(dst.replace(/\/$/, "") + "/" + basename, m.cwd, m.env, "remote file from " + host); } catch (e) {}
      return raw(basename + "                                    100%  1024     1.2MB/s   00:00\n");
    }
    if (dst.indexOf(":") !== -1) {
      var hp2 = dst.split(":"); var host2 = hp2[0].split("@").pop();
      if (!m.hosts[host2] && !m.remote[host2]) return fail("ssh: Could not resolve hostname " + host2 + ": Name or service not known");
      if (!m.fs.exists(src, m.cwd, m.env)) return fail(src + ": No such file or directory");
      return raw(src.split("/").pop() + "                                    100%  1024     1.2MB/s   00:00\n");
    }
    return C.cp(m, rest);
  };
  C.rsync = function (m, a) {
    var g = getopt(a, { a: false, v: false, z: false, r: false, delete: false, "dry-run": false, e: true });
    var rest = a.filter(function (x) { return x[0] !== "-"; });
    if (rest.length < 2) return fail("rsync: missing arguments");
    var dst = rest[rest.length - 1], src = rest[0];
    var host = dst.indexOf(":") !== -1 ? dst.split("@").pop().split(":")[0] : (src.indexOf(":") !== -1 ? src.split("@").pop().split(":")[0] : null);
    if (host && !m.hosts[host] && !m.remote[host]) return fail("ssh: Could not resolve hostname " + host + ": Name or service not known");
    if (g.opts["dry-run"]) return raw("sending incremental file list\n./\n(DRY RUN) files would be transferred\n\nsent 0 bytes  received 0 bytes\n");
    return raw("sending incremental file list\n./\nnotes\n\nsent 1,024 bytes  received 35 bytes  2,118.00 bytes/sec\ntotal size is 1,024  speedup is 0.97\n");
  };
  C.sftp = function (m, a) { var t = a[0]; return out("Connected to " + t + ".\nsftp> (interactive sftp simulated — use scp/rsync in this lab)"); };
  C.ssh_keygen = C["ssh-keygen"] = function (m, a) {
    var g = getopt(a, { t: true, b: true, C: true, f: true, N: true });
    var type = g.opts.t || "rsa";
    var file = g.opts.f || (m.env.HOME + "/.ssh/id_" + (type === "ed25519" ? "ed25519" : "rsa"));
    var comment = g.opts.C || m.user + "@" + m.hostname;
    var dir = m.fs.dirname(file);
    if (!m.fs.exists(dir, "/", m.env, VFS.type.DIR)) m.fs.mkdir(dir, "/", m.env, true);
    var pub = "ssh-" + type + " AAAAB3NzaC1yc2EAAAADAQABAAABgQC7" + Math.random().toString(36).slice(2) + " " + comment;
    m.fs.writeFile(file + ".pub", "/", m.env, pub + "\n");
    m.fs.writeFile(file, "/", m.env, "-----BEGIN OPENSSH PRIVATE KEY-----\nb3Blbn");
    try { m.fs.chmod(file, "/", m.env, 0o600); } catch (e) {}
    return out("Generating public/private " + type + " key pair.\nYour identification has been saved in " + file + "\nYour public key has been saved in " + file + ".pub\nThe key fingerprint is:\nSHA256:" + Math.random().toString(36).slice(2, 12) + " " + comment);
  };
  C["ssh-copy-id"] = function (m, a) {
    var target = a.filter(function (x) { return x[0] !== "-"; })[0];
    if (!target) return fail("ssh-copy-id: missing hostname");
    var host = target.split("@").pop();
    if (!m.hosts[host] && !m.remote[host]) return fail("ssh-copy-id: ERROR: Could not resolve hostname " + host);
    return out("/usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: \"" + m.env.HOME + "/.ssh/id_rsa.pub\"\n/usr/bin/ssh-copy-id: INFO: attempting to log in with the new key(s), to filter out any that are already installed\n/usr/bin/ssh-copy-id: INFO: 1 key(s) remain to be installed -- if you are prompted now it is to install the new keys\nNumber of key(s) added: 1");
  };
  C.ssh_agent = C["ssh-agent"] = function (m, a) { if (a[0] === "-s" || !a.length) return raw("SSH_AUTH_SOCK=/tmp/ssh-XXXX/agent.1234; export SSH_AUTH_SOCK;\nSSH_AGENT_PID=1235; export SSH_AGENT_PID;\necho Agent pid 1235;\n"); return raw(""); };
  C.ssh_add = C["ssh-add"] = function (m, a) { return out("Identity added: " + (a[0] || m.env.HOME + "/.ssh/id_rsa")); };

  /* ======================= packages ======================= */

  C.apt = C["apt-get"] = function (m, a) {
    if (m.user !== "root") return fail("E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)\nE: Unable to acquire the dpkg frontend lock, are you root?");
    var cmd = a[0];
    if (a.indexOf("--version") !== -1) return out("apt 2.4.11 (amd64)");
    if (cmd === "update") return raw("Hit:1 http://archive.ubuntu.com/ubuntu jammy InRelease\nGet:2 http://security.ubuntu.com/ubuntu jammy-security InRelease [110 kB]\nReading package lists... Done\nBuilding dependency tree... Done\nAll packages are up to date.\n");
    if (cmd === "upgrade" || cmd === "dist-upgrade") return raw("Reading package lists... Done\nBuilding dependency tree... Done\nCalculating upgrade... Done\n0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.\n");
    if (cmd === "autoremove" || cmd === "clean" || cmd === "autoclean") return raw("Reading package lists... Done\nBuilding dependency tree... Done\n0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.\n");
    if (cmd === "install") {
      var pkgs = a.slice(1).filter(function (x) { return x[0] !== "-"; });
      var already = pkgs.filter(function (p) { return m.apt.installed.indexOf(p) !== -1; });
      var newly = pkgs.filter(function (p) { return m.apt.installed.indexOf(p) === -1; });
      newly.forEach(function (p) { m.apt.installed.push(p); });
      if (!newly.length && already.length) return raw(pkgs[0] + " is already the newest version (" + pkgs[0] + " installed).\n0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.\n");
      return raw("Reading package lists... Done\nBuilding dependency tree... Done\nReading state information... Done\nThe following NEW packages will be installed:\n  " + newly.join(" ") + "\n0 upgraded, " + newly.length + " newly installed, 0 to remove and 0 not upgraded.\nNeed to get 1,234 kB of archives.\nSetting up " + newly.join(" ") + " ...\nProcessing triggers for man-db ...\n");
    }
    if (cmd === "remove" || cmd === "purge") {
      var rp = a.slice(1).filter(function (x) { return x[0] !== "-"; });
      m.apt.installed = m.apt.installed.filter(function (p) { return rp.indexOf(p) === -1; });
      return raw("The following packages will be REMOVED:\n  " + rp.join(" ") + "\nRemoving " + rp.join(" ") + " ...\n");
    }
    if (cmd === "search") {
      var q = a[1] || "";
      return raw(m.apt.available.filter(function (p) { return p.indexOf(q) !== -1; }).map(function (p) { return p + "/jammy 1.0 amd64\n  " + p + " package"; }).join("\n\n") + "\n");
    }
    if (cmd === "list") return raw("Listing...\n" + m.apt.installed.map(function (p) { return p + "/jammy,now 1.0 amd64 [installed]"; }).join("\n") + "\n");
    if (cmd === "show") return raw("Package: " + a[1] + "\nVersion: 1.0\nArchitecture: amd64\nMaintainer: Ubuntu Developers\nDescription: " + a[1] + " package\n");
    return fail("E: Invalid operation " + cmd);
  };
  C.dpkg = function (m, a) {
    if (a[0] === "-l") return raw("Desired=Unknown/Install/Remove/Purge/Hold\n||/ Name           Version      Architecture Description\n+++-==============-============-============-=================================\nii  nginx          1.18.0-6     amd64        small, powerful, scalable web server\nii  openssh-server 1:8.9p1-3    amd64        secure shell (SSH) server\n");
    return raw("");
  };
  C.snap = function (m, a) {
    if (a[0] === "list") return raw("Name    Version    Rev    Tracking       Publisher   Notes\ncore20  20230801   2015   latest/stable  canonical✓  base\nsnapd   2.60.4     20290  latest/stable  canonical✓  snapd\n");
    return raw("");
  };

  /* ======================= docker ======================= */

  C.docker = function (m, a) {
    var d = m.docker;
    var sub = a[0];
    if (m.user !== "root" && !(m.users[m.user] && m.users[m.user].groups.some(function (g) { return g === "docker"; })) && m.user !== "sam") {
      return fail("permission denied while trying to connect to the Docker daemon socket");
    }
    var g = getopt(a.slice(1), { a: false, d: false, p: true, v: true, e: true, name: true, rm: false, it: false, i: false, t: false, network: true, hostname: true, "restart": true });
    if (sub === "version") return raw("Client: Docker Engine - Community\n Version:           24.0.7\nServer: Docker Engine - Community\n Version:           24.0.7\n");
    if (sub === "info") return raw("Client: Docker Engine - Community\nServer:\n Containers: " + d.containers.length + "\n  Running: " + d.containers.filter(function (c) { return c.status.indexOf("Up") === 0; }).length + "\n Images: " + d.images.length + "\n Storage Driver: overlay2\n Cgroup Driver: systemd\n Kernel Version: 5.15.0-91-generic\n Operating System: Ubuntu 22.04.4 LTS\n CPUs: 2\n Total Memory: 1.924GiB\n");
    if (sub === "ps") {
      var all = g.opts.a;
      var list = all ? d.containers : d.containers.filter(function (c) { return c.status.indexOf("Up") === 0; });
      return raw("CONTAINER ID   IMAGE          COMMAND                  CREATED       STATUS          PORTS                    NAMES\n" + list.map(function (c) {
        return (c.id + "             ").slice(0, 14) + (c.image + "             ").slice(0, 14) + (c.command + "                        ").slice(0, 24) + (c.created + "         ").slice(0, 13) + (c.status + "              ").slice(0, 15) + (c.ports + "                        ").slice(0, 24) + c.name;
      }).join("\n") + "\n");
    }
    if (sub === "images") {
      return raw("REPOSITORY    TAG       IMAGE ID       CREATED         SIZE\n" + d.images.map(function (i) { return (i.repository + "             ").slice(0, 13) + (i.tag + "         ").slice(0, 9) + (i.id + "       ").slice(0, 14) + (i.created + "               ").slice(0, 15) + i.size; }).join("\n") + "\n");
    }
    if (sub === "run") {
      var image = g.rest[g.rest.length - 1];
      var name = g.opts.name || ("container_" + (d.nextId++));
      var imageObj = d.images.find(function (i) { return i.repository + ":" + i.tag === image || i.repository === image || i.repository + ":" + i.tag === image + ":latest"; });
      if (!d.images.some(function (i) { return i.repository === image.split(":")[0]; })) {
        return fail("Unable to find image '" + image + "' locally\ndocker: Error response from daemon: pull access denied for " + image + ", repository does not exist or may require 'docker login'.");
      }
      var cmd = g.rest.slice(0, -1).join(" ") || "bash";
      var container = { id: Math.random().toString(16).slice(2, 14), name: name, image: image, command: image.split(":")[0] === "nginx" ? "nginx -g 'daemon of…'" : cmd, created: "2 seconds ago", status: "Up 2 seconds", ports: g.opts.p ? g.opts.p : "" };
      d.containers.push(container);
      if (image.split(":")[0] === "nginx") m.network.listeners.push({ proto: "tcp", local: "0.0.0.0:" + ((g.opts.p || "").split(":").pop() || "80"), process: "docker-proxy" });
      var outStr = "";
      if (!imageObj || !g.opts.a) outStr += "";
      if (!g.opts.d) {
        return { stdout: "", stderr: "", code: 0, attachContainer: container.id };
      }
      return raw(container.id + "\n");
    }
    if (sub === "ps" || sub === "create") { return raw(""); }
    if (sub === "start" || sub === "stop" || sub === "restart") {
      var c = findContainer(d, a[1]);
      if (!c) return fail("Error response from daemon: No such container: " + a[1]);
      if (sub === "stop") c.status = "Exited (0) 1 second ago";
      else c.status = "Up 1 second";
      return raw(a[1] + "\n");
    }
    if (sub === "exec") {
      var c2 = findContainer(d, a[1]);
      if (!c2) return fail("Error response from daemon: No such container: " + a[1]);
      var rest = a.slice(2).filter(function (x) { return x[0] !== "-"; });
      if (m.docker.execResult !== undefined) { var r = m.docker.execResult; m.docker.execResult = undefined; return raw(r); }
      if (rest[0] === "ls") return raw("bin  boot  dev  etc  home  lib  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var\n");
      if (rest[0] === "cat") return raw("");
      if (rest[0] === "sh" || rest[0] === "bash") return raw("");
      return raw("");
    }
    if (sub === "logs") {
      var c3 = findContainer(d, a[1]);
      if (!c3) return fail("Error response from daemon: No such container: " + a[1]);
      return raw("/docker-entrypoint.sh: Configuration complete; ready for start up\n2026/09/10 10:30:00 [notice] 1#1: nginx/1.25.3\n2026/09/10 10:30:00 [notice] 1#1: start worker process 31\n");
    }
    if (sub === "stop" || sub === "kill") { return raw(""); }
    if (sub === "rm") {
      var names = a.slice(1).filter(function (x) { return x[0] !== "-"; });
      names.forEach(function (nm) { var idx = d.containers.findIndex(function (c) { return c.name === nm || c.id === nm; }); if (idx !== -1) d.containers.splice(idx, 1); });
      return raw(names.join("\n") + "\n");
    }
    if (sub === "rmi") {
      var imgs = a.slice(1).filter(function (x) { return x[0] !== "-"; });
      d.images = d.images.filter(function (i) { return imgs.indexOf(i.id) === -1 && imgs.indexOf(i.repository + ":" + i.tag) === -1; });
      return raw(imgs.map(function (x) { return "Untagged: " + x; }).join("\n") + "\n");
    }
    if (sub === "pull") {
      var name = a[1];
      if (!d.images.some(function (i) { return i.repository === name.split(":")[0]; })) {
        d.images.push({ repository: name.split(":")[0], tag: name.split(":")[1] || "latest", id: Math.random().toString(16).slice(2, 14), size: "150MB", created: "1 second ago" });
      }
      return raw(name.split(":")[0] + ": Pulling from library/" + name.split(":")[0] + "\nDigest: sha256:" + Math.random().toString(36).slice(2) + "\nStatus: Downloaded newer image for " + name + "\ndocker.io/library/" + name + "\n");
    }
    if (sub === "push") return raw("The push refers to repository [docker.io/" + a[1] + "]\nlatest: digest: sha256:" + Math.random().toString(36).slice(2) + " size: 1234\n");
    if (sub === "build") {
      var ti = a.indexOf("-t"); if (ti === -1) ti = a.indexOf("--tag");
      var tag = (ti !== -1 && a[ti + 1]) ? a[ti + 1] : "app:latest";
      var buildDir = a.filter(function (x) { return x[0] !== "-" && x !== tag; }).pop() || ".";
      var dockerfile = m.fs.stat("Dockerfile", buildDir, m.env) || m.fs.stat("Dockerfile", m.cwd, m.env);
      if (!dockerfile) return fail("ERROR: failed to solve: Cannot locate specified Dockerfile: Dockerfile");
      var id = Math.random().toString(16).slice(2, 14);
      d.images.push({ repository: tag.split(":")[0], tag: tag.split(":")[1] || "latest", id: id, size: "220MB", created: "1 second ago" });
      return raw("STEP 1/1: FROM node:20-alpine\n --> " + Math.random().toString(16).slice(2, 14) + "\nSuccessfully built " + id + "\nSuccessfully tagged " + tag + "\n");
    }
    if (sub === "tag") return raw("");
    if (sub === "inspect") {
      var obj = findContainer(d, a[a.length - 1]);
      return raw(JSON.stringify([{ Id: obj ? obj.id : "abc123", Name: "/" + (obj ? obj.name : "x"), State: { Status: obj ? (obj.status.indexOf("Up") === 0 ? "running" : "exited") : "created" }, Image: obj ? obj.image : "nginx:latest" }], null, 4) + "\n");
    }
    if (sub === "stats") {
      return raw("CONTAINER ID   NAME          CPU %     MEM USAGE / LIMIT     MEM %     NET I/O\n" + d.containers.filter(function (c) { return c.status.indexOf("Up") === 0; }).map(function (c) { return c.id.slice(0, 12) + "   " + (c.name + "              ").slice(0, 14) + "0.15%     12.3MiB / 1.924GiB   0.63%     1.2kB / 0B"; }).join("\n") + "\n");
    }
    if (sub === "volume") {
      if (a[1] === "create") { d.volumes.push({ name: a[2] }); return raw(a[2] + "\n"); }
      if (a[1] === "ls") return raw("DRIVER    VOLUME NAME\nlocal     " + d.volumes.map(function (v) { return v.name; }).join("\nlocal     ") + "\n");
      if (a[1] === "rm") { d.volumes = d.volumes.filter(function (v) { return v.name !== a[2]; }); return raw(a[2] + "\n"); }
      return raw("");
    }
    if (sub === "network") {
      if (a[1] === "create") { d.networks.push({ name: a[2], driver: "bridge" }); return raw(a[2] + "\n"); }
      if (a[1] === "ls") return raw("NETWORK ID     NAME      DRIVER    SCOPE\n" + d.networks.map(function (n) { return Math.random().toString(16).slice(2, 14) + "   " + (n.name + "         ").slice(0, 10) + (n.driver + "    ").slice(0, 10) + "local"; }).join("\n") + "\n");
      if (a[1] === "rm") return raw(a[2] + "\n");
      if (a[1] === "inspect") return raw(JSON.stringify([{ Name: a[2], Driver: "bridge", Containers: {} }], null, 4) + "\n");
      return raw("");
    }
    if (sub === "compose") {
      var comp = a.slice(1).filter(function (x) { return x[0] !== "-"; })[0] || "up";
      if (comp === "up") {
        d.containers.push({ id: Math.random().toString(16).slice(2, 14), name: "app_web_1", image: "nginx:latest", command: "nginx -g 'daemon of…'", created: "1 second ago", status: "Up 1 second", ports: "0.0.0.0:8080->80/tcp" });
        d.containers.push({ id: Math.random().toString(16).slice(2, 14), name: "app_db_1", image: "postgres:16", command: "docker-entrypoint.s…", created: "1 second ago", status: "Up 1 second", ports: "5432/tcp" });
        return raw("[+] Running 3/3\n ✔ Network app_default    Created\n ✔ Container app_db_1     Started\n ✔ Container app_web_1    Started\n");
      }
      if (comp === "down") { d.containers = []; return raw("[+] Running 3/3\n ✔ Container app_web_1    Removed\n ✔ Container app_db_1     Removed\n ✔ Network app_default    Removed\n"); }
      if (comp === "ps") return C.docker(m, ["ps"]);
      if (comp === "build") return C.docker(m, ["build"].concat(a.slice(2)));
      if (comp === "logs") return raw("app_web_1  | nginx started\napp_db_1   | database system is ready to accept connections\n");
      return raw("");
    }
    return fail("docker: '" + sub + "' is not a docker command.\nSee 'docker --help'");
  };
  function findContainer(d, ref) { return d.containers.find(function (c) { return c.name === ref || c.id === ref || c.id.slice(0, 12) === ref; }); }

  /* ======================= git ======================= */

  C.git = function (m, a) {
    var sub = a[0];
    var g = m.cwd;
    if (sub === "init") { ensure(m, ".git"); ensure(m, ".git/HEAD"); m.fs.writeFile(".git/HEAD", g, m.env, "ref: refs/heads/main\n"); return out("Initialized empty Git repository in " + m.fs.resolve(".git", g, m.env) + "/"); }
    if (sub === "status") {
      if (!m.fs.exists(".git", g, m.env)) return fail("fatal: not a git repository (or any of the parent directories): .git");
      return raw("On branch main\n\nNo commits yet\n\nnothing to commit (create/copy files and use \"git add\" to track)\n");
    }
    if (sub === "add") return raw("");
    if (sub === "commit") {
      var msgM = /\-m\s+(.*)/.exec(a.join(" "));
      var msg = msgM ? msgM[1].replace(/["']/g, "") : "commit";
      var hash = Math.random().toString(16).slice(2, 9);
      return raw("[main (root-commit) " + hash + "] " + msg + "\n 1 file changed, 1 insertion(+)\n create mode 100644 file\n");
    }
    if (sub === "log") {
      return raw("commit " + Math.random().toString(16).slice(2, 42) + " (HEAD -> main)\nAuthor: " + m.user + " <" + m.user + "@" + m.hostname + ">\nDate:   Wed Sep 10 10:30:00 2026 +0000\n\n    initial commit\n");
    }
    if (sub === "clone") {
      var url = a[1];
      var dir = url.replace(/\.git$/, "").split("/").pop() || "repo";
      m.fs.mkdir(dir, g, m.env, true);
      m.fs.writeFile(dir + "/README.md", g, m.env, "# " + dir + "\n");
      return raw("Cloning into '" + dir + "'...\nremote: Enumerating objects: 12, done.\nremote: Total 12 (delta 0)\nReceiving objects: 100% (12/12), done.\n");
    }
    if (sub === "remote") {
      if (a.indexOf("-v") !== -1) return raw("origin\thttps://github.com/example/app.git (fetch)\norigin\thttps://github.com/example/app.git (push)\n");
      return raw("");
    }
    if (sub === "branch") return raw("* main\n");
    if (sub === "checkout") { var b = a.filter(function (x) { return x[0] !== "-"; })[1]; return raw(b ? "Switched to branch '" + b + "'\n" : "Your branch is up to date with 'origin/main'.\n"); }
    if (sub === "push") return raw("Enumerating objects: 5, done.\nCounting objects: 100% (5/5), done.\nWriting objects: 100% (3/3), 300 bytes | 300.00 KiB/s, done.\nTo github.com:example/app.git\n   a1b2c3d..e4f5a6b  main -> main\n");
    if (sub === "pull") return raw("Already up to date.\n");
    if (sub === "fetch") return raw("");
    if (sub === "merge") return raw("Already up to date.\n");
    if (sub === "diff") return raw("");
    return raw("");
  };
  function ensure(m, p) { try { if (!m.fs.exists(p, m.cwd, m.env)) { if (p.indexOf("/") === -1) m.fs.mkdir(p, m.cwd, m.env, true); else m.fs.writeFile(p, m.cwd, m.env, ""); } } catch (e) {} }

  /* ======================= cron ======================= */
  C.crontab = function (m, a, ctx) {
    if (a[0] === "-l") {
      var mine = m.cron.filter(function (c) { return c.user === m.user; });
      if (!mine.length) return fail("no crontab for " + m.user);
      return raw("# Edit this file to introduce tasks to be run by cron.\n# m h  dom mon dow   command\n" + mine.map(function (c) { return c.schedule + " " + c.command; }).join("\n") + "\n");
    }
    if (a[0] === "-r") { m.cron = m.cron.filter(function (c) { return c.user !== m.user; }); return raw(""); }
    if (a[0] === "-e") { return out("crontab: installing new crontab\n(Use `echo \"...\" | crontab -` in this lab to add jobs.)"); }
    var content = null;
    if (a[0] === "-" || !a.length) content = ctx.stdin || "";
    else if (a[0]) {
      var f = m.fs.stat(a[0], m.cwd, m.env);
      if (!f) return fail("crontab: " + a[0] + ": No such file or directory");
      content = f.content || "";
    }
    if (content != null) {
      m.cron = m.cron.filter(function (c) { return c.user !== m.user; });
      content.split("\n").forEach(function (line) {
        line = line.trim();
        if (!line || line.charAt(0) === "#") return;
        var mm = /^(\S+\s+\S+\s+\S+\s+\S+\s+\S+)\s+(.+)$/.exec(line);
        if (mm) m.cron.push({ schedule: mm[1], user: m.user, command: mm[2], source: "crontab" });
      });
      return raw("");
    }
    return fail("crontab: usage error: unrecognized option");
  };

  /* ======================= app runtimes / deploy ======================= */

  C.node = function (m, a) { return out("v20.11.1"); };
  C.npm = function (m, a) {
    if (a[0] === "-v" || a[0] === "--version") return out("10.2.4");
    if (a[0] === "install" || a[0] === "ci") {
      if (!m.fs.exists("package.json", m.cwd, m.env)) return fail("npm ERR! code ENOENT\nnpm ERR! Could not read package.json");
      return raw("added 142 packages, and audited 143 packages in 3s\n\nfound 0 vulnerabilities\n");
    }
    if (a[0] === "run") { return raw("> app@" + (a[1] || "start") + "\n> node server.js\n\nServer listening on http://0.0.0.0:3000\n"); }
    if (a[0] === "start") return raw("> node server.js\n\nServer listening on http://0.0.0.0:3000\n");
    return raw("");
  };
  C.python = C.python3 = function (m, a) {
    if (a[0] === "--version" || a[0] === "-V") return out("Python 3.10.12");
    if (a[0] === "-m" && a[1] === "http.server") return raw("Serving HTTP on 0.0.0.0 port " + (a[2] || 8000) + " (http://0.0.0.0:" + (a[2] || 8000) + "/) ...\n");
    if (a[0] === "-m" && a[1] === "venv") return raw("");
    return raw("");
  };
  C.pip = C.pip3 = function (m, a) {
    if (a[0] === "install") return raw("Collecting " + a[1] + "\n  Downloading " + a[1] + "-1.0-py3-none-any.whl\nInstalling collected packages: " + a[1] + "\nSuccessfully installed " + a[1] + "\n");
    if (a[0] === "list") return raw("Package    Version\n---------- -------\npip        22.0.2\nsetuptools 59.6.0\n");
    return raw("");
  };
  C.nginx = function (m, a) {
    if (a[0] === "-t") return raw("nginx: the configuration file /etc/nginx/nginx.conf syntax is ok\nnginx: configuration file /etc/nginx/nginx.conf test is successful\n");
    if (a[0] === "-s" && a[1] === "reload") return raw("");
    return raw("");
  };
  C.systemd_analyze = C["systemd-analyze"] = function () { return raw("Startup finished in 4.123s (kernel) + 12.456s (userspace) = 16.579s\ngraphical.target reached after 12.400s in userspace\n"); };
  C.certbot = function (m, a) {
    if (a.indexOf("--nginx") !== -1 || a[0] === "certonly") {
      var domain = (a.find(function (x) { return x.indexOf("-d") === 0; }) || "-d example.com").replace(/^-d\s*/, "").replace("-d", "");
      return out("Saving debug log to /var/log/letsencrypt/letsencrypt.log\nRequesting a certificate for " + domain + "\n\nSuccessfully received certificate.\nCertificate is saved at: /etc/letsencrypt/live/" + domain + "/fullchain.pem\nKey is saved at: /etc/letsencrypt/live/" + domain + "/privkey.pem\nThis certificate expires on 2026-12-09.\n");
    }
    return raw("");
  };
  C.openssl = function (m, a) {
    if (a.indexOf("s_client") !== -1) {
      var ci = a.indexOf("-connect");
      var host = ci !== -1 ? a[ci + 1] : (a.indexOf("-host") !== -1 ? a[a.indexOf("-host") + 1] : "localhost:443");
      return raw("CONNECTED(00000003)\ndepth=1 C = US, O = Internet Security Research Group, CN = ISRG Root X1\nverify return:1\ndepth=0 CN = " + host.split(":")[0] + "\nverify return:1\n---\nCertificate chain\n 0 s:CN = " + host.split(":")[0] + "\n   i:C = US, O = Let's Encrypt, CN = R3\n---\nServer certificate\nsubject=CN = " + host.split(":")[0] + "\nissuer=C = US, O = Let's Encrypt, CN = R3\n---\nSSL handshake has read 4210 bytes and written 390 bytes\nVerification: OK\n---\nNew, TLSv1.3, Cipher is TLS_AES_256_GCM_SHA384\nServer public key is 2048 bit\n    Protocol  : TLSv1.3\n    Cipher    : TLS_AES_256_GCM_SHA384\n    Session-ID: " + Math.random().toString(16).slice(2, 20).toUpperCase() + "\n    Start Time: " + Math.floor(Date.now() / 1000) + "\n    Timeout   : 7200 (sec)\n");
    }
    if (a.indexOf("req") !== -1) return raw("Generating a RSA private key...\nwriting new private key\n");
    if (a.indexOf("x509") !== -1) return raw("Certificate:\n    Data:\n        Version: 3 (0x2)\n        Issuer: C = US, O = Let's Encrypt, CN = R3\n        Subject: CN = app.example.com\n        Not After : Dec  9 10:30:00 2026 GMT\n");
    return raw("");
  };
  C.make = function (m, a) {
    if (!m.fs.exists("Makefile", m.cwd, m.env)) return fail("make: *** No targets specified and no makefile found.  Stop.");
    return raw("make: Nothing to be done for 'all'.\n");
  };
  C.jq = function (m, a, ctx) {
    var filter = a[0] || ".";
    var file = a.length >= 2 ? a[a.length - 1] : null;
    var text = ctx.stdin || (file && m.fs.exists(file, m.cwd, m.env) ? m.fs.readFile(file, m.cwd, m.env) : "");
    try {
      var obj = JSON.parse(text);
      if (filter === ".") return raw(JSON.stringify(obj, null, 2) + "\n");
      var path = filter.replace(/^\./, "").split(".").filter(Boolean);
      function get(o, keys) { var cur = o; for (var i = 0; i < keys.length; i++) { if (cur == null) return undefined; cur = cur[keys[i]]; } return cur; }
      if (path.length) {
        var val = get(obj, path);
        if (val !== undefined) {
          if (Array.isArray(val)) return raw(val.map(function (v) { return typeof v === "object" ? JSON.stringify(v) : String(v); }).join("\n") + "\n");
          if (typeof val === "object") return raw(JSON.stringify(val, null, 2) + "\n");
          return raw(String(val) + "\n");
        }
        if (Array.isArray(obj)) {
          var out = obj.map(function (o) { return get(o, path); }).filter(function (v) { return v !== undefined; }).map(function (v) { return typeof v === "object" ? JSON.stringify(v) : String(v); });
          if (out.length) return raw(out.join("\n") + "\n");
        }
      }
      return raw(JSON.stringify(obj, null, 2) + "\n");
    } catch (e) { return fail("jq: error (at <stdin>:1): " + e.message); }
  };
  C.xargs = function (m, a, ctx) {
    var items = (ctx.stdin || "").split(/\s+/).filter(Boolean);
    var cmd = a.filter(function (x) { return x[0] !== "-"; });
    if (!cmd.length) cmd = ["echo"];
    if (cmd[0] === "rm") { var g2 = getopt(cmd, { r: false, f: false }); items.forEach(function (i) { try { m.fs.rm(i, m.cwd, m.env, { recursive: true }); } catch (e) {} }); return raw(""); }
    if (cmd[0] === "echo") return raw(items.join(" ") + "\n");
    return out(items.join(" "));
  };

  /* ======================= misc / shell builtins ======================= */

  C.which = function (m, a) { return raw(a.map(function (c) { return "/usr/bin/" + c; }).join("\n") + "\n"); };
  C.whereis = function (m, a) { return raw(a[0] + ": /usr/bin/" + a[0] + " /usr/share/man/man1/" + a[0] + ".1.gz\n"); };
  C.type = function (m, a) {
    return raw(a.map(function (c) { return c + " is /usr/bin/" + c; }).join("\n") + "\n");
  };
  C.command = function (m, a, ctx) { return Commands._dispatch(m, a, ctx); };
  C.env = function (m) { return raw(Object.keys(m.env).map(function (k) { return k + "=" + m.env[k]; }).join("\n") + "\n"); };
  C.printenv = function (m, a) { if (a[0]) return out(m.env[a[0]] || ""); return C.env(m); };
  C.export = function (m, a) {
    a.forEach(function (x) { var p = x.split("="); if (p.length > 1) m.env[p[0]] = p.slice(1).join("="); });
    return raw("");
  };
  C.unset = function (m, a) { a.forEach(function (k) { delete m.env[k]; }); return raw(""); };
  C.set = function (m) { return C.env(m); };
  C.alias = function (m, a) {
    if (!a.length) return raw(Object.keys(m.aliases).map(function (k) { return "alias " + k + "='" + m.aliases[k] + "'"; }).join("\n") + "\n");
    a.forEach(function (x) { var p = x.split("="); m.aliases[p[0]] = p.slice(1).join("=").replace(/^'|'$/g, ""); });
    return raw("");
  };
  C.unalias = function (m, a) { a.forEach(function (k) { delete m.aliases[k]; }); return raw(""); };
  C.history = function (m, a) {
    if (a[0] === "-c") { m.history = []; return raw(""); }
    return raw(m.history.map(function (h, i) { return String(i + 1).padStart(5, " ") + "  " + h; }).join("\n") + "\n");
  };
  C.clear = function () { return { stdout: "", stderr: "", code: 0, clear: true }; };
  C.exit = function () { return { stdout: "logout\n", stderr: "", code: 0, exit: true }; };
  C.logout = C.exit;
  C.true = function () { return raw(""); };
  C.false = function () { return { stdout: "", stderr: "", code: 1 }; };
  C.seq = function (m, a) {
    var nums = a.map(Number).filter(function (x) { return !isNaN(x); });
    var start = 1, step = 1, end;
    if (nums.length === 1) end = nums[0];
    else if (nums.length === 2) { start = nums[0]; end = nums[1]; }
    else { start = nums[0]; step = nums[1]; end = nums[2]; }
    var res = [];
    for (var i = start; (step > 0 ? i <= end : i >= end); i += step) res.push(i);
    return raw(res.join("\n") + "\n");
  };
  C.yes = function (m, a) { return raw((a[0] || "y") + "\n" + (a[0] || "y") + "\n" + (a[0] || "y") + "\n"); };
  C.sleep_ms = null;
  C.read = function (m, a, ctx) {
    var varName = a.filter(function (x) { return x[0] !== "-"; })[0];
    if (varName) { m.env[varName] = ctx.stdin || ""; }
    return raw("");
  };
  C.source = C["."] = function (m, a) {
    var f = a[0];
    if (!f) return fail("bash: source: filename argument required");
    if (!m.fs.exists(f, m.cwd, m.env)) return fail("bash: " + f + ": No such file or directory");
    return raw("");
  };
  C.bash = function (m, a) { if (a && a[0] && a[0][0] !== "-") { try { return Commands._dispatch(m, [a[0]], { stdin: "" }); } catch (e) { return fail("bash: " + a[0] + ": command not found"); } } return raw(""); };
  C.sh = C.bash;

  C.man = function (m, a) {
    var topic = a[0];
    if (!topic) return fail("What manual page do you want?");
    var man = {
      ls: "LS(1)\n\nNAME\n    ls - list directory contents\n\nSYNOPSIS\n    ls [OPTION]... [FILE]...\n\nDESCRIPTION\n    List information about the FILEs (the current directory by default).\n    -a  do not ignore entries starting with .\n    -l  use a long listing format\n    -h  with -l, print sizes in human readable format",
      chmod: "CHMOD(1)\n\nNAME\n    chmod - change file mode bits\n\nSYNOPSIS\n    chmod [OPTION]... MODE[,MODE]... FILE...\n\nDESCRIPTION\n    MODE: ugoa +-= rwxXst\n    Octal modes like 644, 755, 600.",
      grep: "GREP(1)\n\nNAME\n    grep - print lines that match patterns\n\nSYNOPSIS\n    grep [OPTION]... PATTERNS [FILE]...\n\nOPTIONS\n    -i  ignore case\n    -r  recursive\n    -n  line numbers\n    -v  invert match",
      docker: "DOCKER(1)\n\nNAME\n    docker - the container management tool\n\nCOMMON\n    docker run -d -p HOST:CONT IMAGE\n    docker ps -a\n    docker exec -it NAME sh\n    docker logs NAME"
    };
    if (man[topic]) return raw(man[topic] + "\n\n(Manual page " + topic + " (1) — simulated)");
    return raw("No manual entry for " + topic + "\n");
  };
  C.help = function (m, a) {
    if (a[0] && C[a[0]]) return raw("Help for " + a[0] + ": see 'man " + a[0] + "'\n");
    return raw("GNU bash, version 5.1.16(1)-release (x86_64-pc-linux-gnu)\nThese shell commands are defined internally.  Type `help' to see this list.\nType `help name' to find out more about the function `name'.\n");
  };
  C.info = C.man;
  C.watchdog = C.true;
  C.vi = C.vim = C.nano = C.emacs = function (m, a) {
    if (!a[0]) return fail("usage: " + "editor" + " [file]");
    if (!m.fs.exists(a[0], m.cwd, m.env)) { try { m.fs.writeFile(a[0], m.cwd, m.env, ""); } catch (e) {} }
    return raw("");
  };
  C.tree = function (m, a) {
    var g = getopt(a, { a: false, d: false, L: true, h: false });
    var root = a.filter(function (x) { return x[0] !== "-"; })[0] || ".";
    var visited = 0, dirs = 0, files = 0;
    var lines = [root];
    function walk(p, prefix, depth) {
      if (g.opts.L && depth > parseInt(g.opts.L, 10)) return;
      var n = m.fs.stat(p, m.cwd, m.env);
      if (!n) { lines.push(prefix + "└── [error opening dir]"); return; }
      if (n.type === VFS.type.FILE) return;
      var kids = Object.keys(n.children).filter(function (k) { if (!g.opts.a && k[0] === ".") return false; return true; }).sort();
      kids.forEach(function (k, i) {
        var last = i === kids.length - 1;
        var child = n.children[k];
        var abs = (p === "." ? "" : p) + "/" + k;
        if (child.type !== VFS.type.DIR && g.opts.d) {
          // skip
        } else {
          lines.push(prefix + (last ? "└── " : "├── ") + k + (child.type === VFS.type.LINK ? " -> " + child.target : ""));
        }
        if (child.type === VFS.type.DIR) { dirs++; walk(abs, prefix + (last ? "    " : "│   "), depth + 1); }
        else files++;
      });
    }
    walk(root, "", 1);
    return raw(lines.join("\n") + "\n\n" + dirs + " directories, " + files + " files\n");
  };

  C["--help"] = C.help;

  /* ======================= find / truncate ======================= */
  C.find = function (m, a, ctx) {
    if (!a.length) return fail("find: missing arguments");
    var paths = [], i = 0;
    while (i < a.length && a[i][0] !== "-") { paths.push(a[i]); i++; }
    if (!paths.length) paths = ["."];
    var o = {};
    for (; i < a.length; i++) {
      var f = a[i];
      if (f === "-name" || f === "-iname") o[f === "-name" ? "name" : "iname"] = a[++i];
      else if (f === "-type") o.type = a[++i];
      else if (f === "-size") o.size = a[++i];
      else if (f === "-mtime") o.mtime = a[++i];
      else if (f === "-perm") o.perm = a[++i];
      else if (f === "-maxdepth") o.maxdepth = parseInt(a[++i], 10);
      else if (f === "-mindepth") o.mindepth = parseInt(a[++i], 10);
      else if (f === "-user") o.user = a[++i];
      else if (f === "-group") o.group = a[++i];
      else if (f === "-exec") { var rest = []; i++; while (i < a.length && a[i] !== ";") rest.push(a[i++]); o.exec = rest; }
      else if (f === "-delete") o.delete = true;
      else if (f === "-print") o.print = true;
      else if (f === "-iname") o.iname = a[++i];
    }
    function nameRe(pat) { return new RegExp("^" + pat.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$", o.iname ? "i" : ""); }
    function sizeMatch(node, spec) {
      var mm = /^([+-]?)([\d.]+)([ckMG]?)$/.exec(spec); if (!mm) return true;
      var factor = { c: 1, k: 1024, M: 1048576, G: 1073741824 }[mm[3] || "c"] || 1;
      var val = parseFloat(mm[2]) * factor, bytes = m.fs.sizeOf(node);
      if (mm[1] === "+") return bytes > val; if (mm[1] === "-") return bytes < val;
      return Math.floor(bytes / factor) === parseFloat(mm[2]);
    }
    function permMatch(node, spec) {
      var val = parseInt(spec.replace(/^-/, ""), 8);
      if (/^-[0-7]+$/.test(spec)) return (node.mode & val) === val;
      return (node.mode & 0o7777) === val;
    }
    var results = [];
    function walk(node, path, depth) {
      if (o.maxdepth != null && depth > o.maxdepth) return;
      var test = true;
      if (o.name && !nameRe(o.name).test(node.name)) test = false;
      if (o.iname && !nameRe(o.iname).test(node.name)) test = false;
      if (o.type) { var want = o.type === "f" ? "file" : o.type === "d" ? "dir" : o.type === "l" ? "symlink" : o.type; if (node.type !== want) test = false; }
      if (o.size && !sizeMatch(node, o.size)) test = false;
      if (o.perm && !permMatch(node, o.perm)) test = false;
      if (o.user && node.owner !== o.user) test = false;
      if (o.group && node.group !== o.group) test = false;
      if (o.mtime) { var days = (Date.now() - node.mtime) / 86400000; var mm = /^([+-]?)(\d+)$/.exec(o.mtime); if (mm) { if (mm[1] === "+") test = test && days > +mm[2]; else if (mm[1] === "-") test = test && days < +mm[2]; else test = test && Math.floor(days) === +mm[2]; } }
      if (test && depth > 0) results.push(path);
      if (node.type === "dir") for (var k in node.children) { if (o.maxdepth != null && depth + 1 > o.maxdepth) continue; walk(node.children[k], path.replace(/\/$/, "") + "/" + k, depth + 1); }
    }
    paths.forEach(function (p) {
      var abs = m.fs.resolve(p, m.cwd, m.env);
      var node = m.fs.stat(abs, "/", m.env);
      if (!node) { results.push("find: '" + p + "': No such file or directory"); return; }
      walk(node, abs === "/" ? "/" : abs.replace(/\/$/, ""), 0);
    });
    if (o.delete) { results.forEach(function (r) { if (r.indexOf("find:") !== 0) { try { m.fs.rm(r, "/", m.env, { recursive: true }); } catch (e) {} } }); return raw(""); }
    if (o.exec) {
      var outs = [];
      results.forEach(function (r) {
        if (r.indexOf("find:") === 0) return;
        var argv = o.exec.map(function (x) { return x === "{}" ? r : x; });
        var res = Commands._dispatch(m, argv, { stdin: "" });
        if (res.stdout) outs.push(res.stdout.replace(/\n$/, ""));
      });
      return raw(outs.join("\n") + (outs.length ? "\n" : ""));
    }
    return raw(results.join("\n") + (results.length ? "\n" : ""));
  };

  C.truncate = function (m, a) {
    var g = getopt(a, { s: true, c: false });
    var size = g.opts.s != null ? String(g.opts.s) : "0";
    var file = g.rest[0];
    if (!file) return fail("truncate: missing operand");
    var n = m.fs.stat(file, m.cwd, m.env);
    if (!n || n.type === "dir") return fail("truncate: cannot open '" + file + "' for writing: No such file or directory");
    var cur = n.content || "", bytes;
    if (/^\+/.test(size)) bytes = cur.length + parseInt(size, 10);
    else if (/^-/.test(size)) bytes = Math.max(0, cur.length - parseInt(size, 10));
    else bytes = parseInt(size, 10) || 0;
    if (bytes <= 0) n.content = "";
    else if (bytes < cur.length) n.content = cur.slice(0, bytes);
    else n.content = cur + "".padEnd(bytes - cur.length, "\0");
    return raw("");
  };

  /* ======================= postgresql ======================= */
  C.psql = function (m, a, ctx) {
    var g = getopt(a, { U: true, d: true, h: true, p: true, c: true, f: true, l: false, t: false });
    var pg = m.postgres;
    if (g.opts.l) return raw(listDatabases(pg));
    var sql = g.opts.c || g.opts.f ? String(g.opts.c || "") : "";
    if (!sql) {
      if (g.opts.f) { var f = m.fs.stat(g.opts.f, m.cwd, m.env); sql = f ? f.content : ""; }
    }
    if (!sql) {
      return raw("psql (" + pg.version + ".1 (Ubuntu 16.1-1.pgdg22.04+1))\nType \"help\" for help.\n\n" + (g.opts.d ? g.opts.d : "postgres") + "=# (interactive psql is simulated — use -c \"SQL\")");
    }
    var res = execSQL(m, sql);
    return res;
  };
  function listDatabases(pg) {
    var rows = pg.databases.map(function (db) {
      var owner = db === "postgres" ? "postgres" : "app";
      return " " + (db + "                         ").slice(0, 10) + "| " + (owner + "        ").slice(0, 9) + "| UTF8     | en_US.UTF-8 | en_US.UTF-8 |";
    });
    return "                                  List of databases\n   Name    |  Owner   | Encoding |   Collate   |    Ctype    |   Access privileges\n-----------+----------+----------+-------------+-------------+-----------------------\n" + rows.join("\n") + "\n(" + rows.length + " rows)\n";
  }
  function listRoles(pg) {
    var rows = pg.users.map(function (u) { return " " + (u + "                       ").slice(0, 23) + "| Superuser | 0         | 0        |"; });
    return "                             List of roles\n Role name |                         Attributes                         | Member of \n-----------+------------------------------------------------------------+-----------\n" + rows.join("\n") + "\n";
  }
  function execSQL(m, sql) {
    var pg = m.postgres;
    var stmts = sql.split(";").map(function (s) { return s.trim(); }).filter(Boolean);
    var out = [];
    stmts.forEach(function (s) {
      var low = s.toLowerCase();
      var mDb = /create\s+database\s+"?([a-z0-9_]+)"?/i.exec(s);
      if (mDb) { if (pg.databases.indexOf(mDb[1]) === -1) pg.databases.push(mDb[1]); out.push("CREATE DATABASE"); return; }
      var mUser = /create\s+(?:user|role)\s+"?([a-z0-9_]+)"?/i.exec(s);
      if (mUser) { if (pg.users.indexOf(mUser[1]) === -1) pg.users.push(mUser[1]); out.push("CREATE ROLE"); return; }
      if (/^grant\b/i.test(s)) { out.push("GRANT"); return; }
      if (/^revoke\b/i.test(s)) { out.push("REVOKE"); return; }
      if (/^alter\s+(user|role)/i.test(s)) { out.push("ALTER ROLE"); return; }
      var mDrop = /drop\s+database\s+(?:if\s+exists\s+)?"?([a-z0-9_]+)"?/i.exec(s);
      if (mDrop) { pg.databases = pg.databases.filter(function (d) { return d !== mDrop[1]; }); out.push("DROP DATABASE"); return; }
      if (/^\\?l$/i.test(s) || /list databases/i.test(s)) { out.push(listDatabases(pg)); return; }
      if (/^\\?du$/i.test(s) || /list roles/i.test(s)) { out.push(listRoles(pg)); return; }
      if (/^\\?dt$/i.test(s)) { out.push("Did not find any relations."); return; }
      if (/^select\s+1$/i.test(s)) { out.push(" ?column? \n----------\n        1\n(1 row)"); return; }
      if (/^select\s+version\(\)/i.test(s)) { out.push("                                                     version\n-------------------------------------------------------------\n PostgreSQL " + pg.version + ".1 on x86_64-pc-linux-gnu, compiled by gcc, 64-bit\n(1 row)"); return; }
      if (/^select/i.test(s)) { out.push(" id | name  \n----+-------\n  1 | alpha\n  2 | beta\n(2 rows)"); return; }
      if (/^index|^create\s+index/i.test(s)) { out.push("CREATE INDEX"); return; }
      out.push("OK");
    });
    return raw(out.join("\n") + "\n");
  }
  C["pg_isready"] = function (m, a, ctx) {
    var pg = m.postgres;
    return { stdout: (m.env.PGHOST || "localhost") + ":" + (m.env.PGPORT || "5432") + " - accepting connections\n", stderr: "", code: 0 };
  };
  C["pg_dump"] = function (m, a) {
    var g = getopt(a, { U: true, d: true, h: true, f: true, t: true, F: true });
    var db = g.opts.d || g.rest[g.rest.length - 1] || "postgres";
    var data = "--\n-- PostgreSQL database dump\n--\n\n-- Dumped from database version " + m.postgres.version + ".1\nSET statement_timeout = 0;\nSET client_encoding = 'UTF8';\n" +
      m.postgres.databases.map(function (x) { return "CREATE DATABASE " + (x === db ? x : x); }).join(";\n") + ";\n\n-- PostgreSQL database dump complete\n";
    if (g.opts.f) { try { m.fs.writeFile(g.opts.f, m.cwd, m.env, data); } catch (e) {} return raw(""); }
    return raw(data);
  };
  C["pg_dumpall"] = function (m, a) {
    return raw("--\n-- PostgreSQL database cluster dump\n--\nCREATE ROLE postgres;\n" + m.postgres.databases.map(function (d) { return "CREATE DATABASE " + d; }).join(";\n") + ";\n-- PostgreSQL database cluster dump complete\n");
  };
  C["pg_restore"] = function (m, a) { return raw("pg_restore: connecting to database for restore\npg_restore: creating TABLE public.users\npg_restore: finished\n"); };

  /* ======================= caddy ======================= */
  C.caddy = function (m, a) {
    var sub = a[0];
    var cfgArg = a.indexOf("--config");
    var cfg = cfgArg !== -1 ? a[cfgArg + 1] : (a.indexOf("--adapter") !== -1 ? null : null);
    if (sub === "version") return out("v" + m.caddy.version.replace(/^v/, ""));
    if (sub === "validate") {
      var cfile = m.fs.stat("/etc/caddy/Caddyfile", "/", m.env);
      if (!cfile) return fail("Error: caddyfile not found");
      return out("Valid configuration");
    }
    if (sub === "fmt") return raw("");
    if (sub === "run" || sub === "start") {
      var c = m.fs.stat("/etc/caddy/Caddyfile", "/", m.env);
      if (!c) return fail("Error: no Caddyfile found");
      m.caddy.running = true;
      m.services.caddy.active = true;
      m.env.CADDY_CONFIG = "/etc/caddy/Caddyfile";
      return raw("{\"level\":\"info\",\"msg\":\"using config from file\",\"file\":\"/etc/caddy/Caddyfile\"}\n{\"level\":\"info\",\"msg\":\"serving initial configuration\"}\n");
    }
    if (sub === "reload") return raw("{\"level\":\"info\",\"msg\":\"config reloaded\"}\n");
    if (sub === "stop") { m.caddy.running = false; m.services.caddy.active = false; return raw(""); }
    return fail("Usage: caddy <command> [--config <path>]");
  };

  /* ======================= load testing ======================= */
  function benchURL(a, spec) {
    var g = getopt(a, spec);
    return { opts: g.opts, url: g.rest[g.rest.length - 1] || "http://localhost/" };
  }
  C.ab = function (m, a) {
    var r = benchURL(a, { n: true, c: true, k: false, q: false });
    var n = parseInt(r.opts.n, 10) || 1000, c = parseInt(r.opts.c, 10) || 50;
    var rps = 850 + Math.round(Math.random() * 300);
    if (r.opts.q) return raw("This is ApacheBench, Version 2.3\nRequests per second:    " + rps + " [#/sec] (mean)\n");
    return raw("This is ApacheBench, Version 2.3 <$Revision: 1879490 $>\nCopyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/\nLicensed to The Apache Software Foundation, http://www.apache.org/\n\nBenchmarking " + r.url.replace(/^https?:\/\//, "").replace(/\/.*$/, "") + " (be patient).....done\n\n\nServer Software:        nginx/1.18.0\nServer Hostname:        " + r.url.replace(/^https?:\/\//, "").replace(/\/.*$/, "") + "\nServer Port:            80\n\nDocument Path:          /\nDocument Length:        612 bytes\n\nConcurrency Level:      " + c + "\nTime taken for tests:   " + (n / rps).toFixed(3) + " seconds\nComplete requests:      " + n + "\nFailed requests:        0\nTotal transferred:      " + (n * 832) + " bytes\nHTML transferred:       " + (n * 612) + " bytes\nRequests per second:    " + rps + " [#/sec] (mean)\nTime per request:       " + (1000 * c / rps).toFixed(3) + " [ms] (mean)\nTime per request:       " + (1000 / rps).toFixed(3) + " [ms] (mean, across all concurrent requests)\nTransfer rate:          " + (n * 832 / 1024 / (n / rps)).toFixed(2) + " [Kbytes/sec] received\n\nConnection Times (ms)\n              min  mean[+/-sd] median   max\nConnect:        0    0   0.1      0       1\nProcessing:     1    " + (1000 * c / rps).toFixed(0) + "  12.3     " + (1000 * c / rps).toFixed(0) + "     120\nWaiting:        1    " + (1000 * c / rps).toFixed(0) + "  12.1     " + (1000 * c / rps).toFixed(0) + "     119\nTotal:          1    " + (1000 * c / rps).toFixed(0) + "  12.4     " + (1000 * c / rps).toFixed(0) + "     121\n\nPercentage of the requests served within a certain time (ms)\n  50%    " + (1000 * c / rps).toFixed(0) + "\n  66%    " + (1000 * c / rps + 2).toFixed(0) + "\n  75%    " + (1000 * c / rps + 3).toFixed(0) + "\n  80%    " + (1000 * c / rps + 4).toFixed(0) + "\n  90%    " + (1000 * c / rps + 8).toFixed(0) + "\n  95%    " + (1000 * c / rps + 12).toFixed(0) + "\n  98%    " + (1000 * c / rps + 20).toFixed(0) + "\n  99%    " + (1000 * c / rps + 30).toFixed(0) + "\n 100%    " + (1000 * c / rps + 50).toFixed(0) + " (longest request)\n");
  };
  C.wrk = function (m, a) {
    var g = getopt(a, { t: true, c: true, d: true, "latency": false });
    return raw("Running 30s test @ " + (g.rest[0] || "http://localhost/" ) + "\n  " + (g.opts.t || "2") + " threads and " + (g.opts.c || "100") + " connections\n  Thread Stats   Avg      Stdev     Max   +/- Stdev\n    Latency     " + (10 + Math.random() * 20).toFixed(2) + "ms    " + (3 + Math.random() * 5).toFixed(2) + "ms  " + (60 + Math.random() * 60).toFixed(2) + "ms    " + (60 + Math.random() * 20).toFixed(0) + "%\n    Req/Sec     1.2k     180.5     2.1k     " + (60 + Math.random() * 20).toFixed(0) + "%\n  2 requests in 30.10s, 1.53MB read\nRequests/sec:  8500.30\nTransfer/sec:     52.09KB\n");
  };
  C.hey = function (m, a) {
    var g = getopt(a, { n: true, c: true, z: true, q: true });
    var n = g.opts.n || 200;
    return raw("Summary:\n  Total:\t" + (1.2 + Math.random()).toFixed(4) + " secs\n  Slowest:\t0.0821 secs\n  Fastest:\t0.0041 secs\n  Average:\t0.0120 secs\n  Requests/sec:\t" + (n / 1.5).toFixed(4) + "\n  Total data:\t" + (n * 612) + " bytes\n  Size/request:\t612 bytes\nResponse time histogram:\n  0.004 [1]\t|\n  0.012 [165]\t|■■■■■■■■■■■■■■■■■■■■■■■■■■■\n  0.019 [34]\t|■■■■■■\nStatus code distribution:\n  [200] " + n + " responses\n");
  };
  C.siege = function (m, a) {
    var g = getopt(a, { c: true, t: true, r: true, q: false });
    return raw("** SIEGE 4.0.7\n** Preparing " + (g.opts.c || 25) + " concurrent users for battle.\nTransactions:               " + (12000 + Math.round(Math.random() * 3000)) + " hits\nAvailability:               100.00 %\nElapsed time:               " + (g.opts.t || "30") + " secs\nData transferred:           8.68 MB\nResponse time:              0.05 secs\nTransaction rate:           450.20 trans/sec\nThroughput:                 0.29 MB/sec\nConcurrency:                " + (g.opts.c || 25) + ".00\nSuccessful transactions:   12840\nFailed transactions:           0\nLongest transaction:        1.20\nShortest transaction:       0.02\n");
  };

  /* ======================= system monitoring ======================= */
  C.sar = function (m, a) {
    if (a.indexOf("-n") !== -1) return raw("Linux 5.15.0-91-generic (ubuntu-lab) \t09/10/2026 \t_x86_64_ \t(2 CPU)\n\n10:30:01 AM  IFACE   rxpck/s   txpck/s    rxkB/s    txkB/s   rxcmp/s   txcmp/s  rxmcst/s\n10:30:02 AM   eth0      5.00      4.00      0.60      0.50      0.00      0.00      0.00\n");
    return raw("Linux 5.15.0-91-generic (ubuntu-lab) \t09/10/2026 \t_x86_64_ \t(2 CPU)\n\n10:30:01 AM     CPU     %user     %nice   %system   %iowait    %steal     %idle\n10:30:02 AM     all      1.20      0.00      0.40      0.10      0.00     98.30\n10:30:03 AM     all      1.00      0.00      0.30      0.05      0.00     98.65\n10:30:04 AM     all      1.50      0.00      0.50      0.20      0.00     97.80\nAverage:        all      1.23      0.00      0.40      0.12      0.00     98.25\n");
  };
  C.mpstat = function (m, a) {
    return raw("Linux 5.15.0-91-generic (ubuntu-lab) \t09/10/2026 \t_x86_64_\t(2 CPU)\n\n10:30:01 AM  CPU    %usr   %nice    %sys %iowait    %irq   %soft  %steal  %guest  %gnice   %idle\n10:30:01 AM  all    1.20    0.00    0.40    0.10    0.00    0.10    0.00    0.00    0.00   98.20\n10:30:01 AM    0    1.30    0.00    0.45    0.12    0.00    0.10    0.00    0.00    0.00   98.03\n10:30:01 AM    1    1.10    0.00    0.35    0.08    0.00    0.10    0.00    0.00    0.00   98.37\n");
  };
  C.pidstat = function (m, a) {
    return raw("Linux 5.15.0-91-generic (ubuntu-lab) \t09/10/2026 \t_x86_64_\t(2 CPU)\n\n10:30:01 AM   UID       PID    %usr %system  %guest   %wait    %CPU   CPU  Command\n10:30:02 AM  1000      3010    1.20    0.20    0.00    0.10    1.40     0  python3\n10:30:02 AM  www      2301    0.00    0.10    0.00    0.00    0.10     1  nginx\n");
  };
  C.smartctl = function (m, a) {
    return raw("smartctl 7.2 2020-12-30 r5155 [x86_64-linux-5.15.0-91-generic] (local build)\n=== START OF INFORMATION SECTION ===\nModel Family:     Virtual disk\nDevice Model:     Virtual Disk\nSerial Number:    VDISK-1234\nSMART overall-health self-assessment test result: PASSED\n\nSMART Attributes Data Structure revision number: 16\nID# ATTRIBUTE_NAME          FLAG     VALUE WORST THRESH TYPE      UPDATED  WHEN_FAILED RAW_VALUE\n  5 Reallocated_Sector_Ct   0x0032   100   100   000    Old_age   Always       -       0\n194 Temperature_Celsius     0x0022   035   045   000    Old_age   Always       -       35\n");
  };
  C.uptime_check = C.uptime;

  /* ======================= network diagnostics ======================= */
  C.tcpdump = function (m, a) {
    var iface = "eth0"; var ii = a.indexOf("-i"); if (ii !== -1) iface = a[ii + 1];
    if (a.indexOf("-D") !== -1) return raw("1.eth0\n2.lo\n3.docker0\n4.any (Pseudo-device that captures on all interfaces)\n");
    if (a.indexOf("-w") !== -1) return raw("tcpdump: listening on " + iface + ", link-type EN10MB (Ethernet), capture size 262144 bytes\n^C\n1 packet captured\n1 packet received by filter\n0 packets dropped by kernel\n");
    return raw("tcpdump: verbose output suppressed, use -v[v]... for full protocol decode\nlistening on " + iface + ", link-type EN10MB (Ethernet), snapshot length 262144 bytes\n10:30:01.123456 IP 10.0.2.2.51234 > ubuntu-lab.ssh: Flags [P.], seq 1:89, ack 1, win 501, length 88\n10:30:01.123789 IP ubuntu-lab.ssh > 10.0.2.2.51234: Flags [P.], seq 1:57, ack 89, length 56\n10:30:02.045123 IP 10.0.2.15.80 > 203.0.113.9.44321: Flags [S], seq 0, win 64240\n^C\n3 packets captured\n3 packets received by filter\n0 packets dropped by kernel\n");
  };
  C.nmap = function (m, a) {
    var g = getopt(a, { p: true, sT: false, sS: false, sV: false, A: false, O: false });
    var host = g.rest[g.rest.length - 1] || "localhost";
    var ports = g.opts.p ? String(g.opts.p) : "22,80,443";
    var rows = ports.split(",").map(function (p) {
      var svc = { "22": "ssh", "80": "http", "443": "https", "5432": "postgresql", "3306": "mysql", "8080": "http-proxy" }[p.trim()] || "unknown";
      var state = ["22", "80", "443", "5432"].indexOf(p.trim()) !== -1 ? "open" : "closed";
      return p.trim() + "/tcp  " + (state + "        ").slice(0, 11) + " " + svc;
    });
    return raw("Starting Nmap 7.80 ( https://nmap.org )\nNmap scan report for " + host + "\nHost is up (0.00012s latency).\nNot shown: 65530 closed ports\nPORT     STATE    SERVICE\n" + rows.join("\n") + "\n\nNmap done: 1 IP address (1 host up) scanned in 0.42 seconds\n");
  };
  C.nc = C.netcat = function (m, a) {
    var g = getopt(a, { z: false, v: false, l: false, p: true });
    var target = g.rest;
    if (target.length >= 2) {
      var host = target[0], port = target[1];
      var open = m.network.listeners.some(function (l) { return l.local.endsWith(":" + port); }) || ["22", "80", "443", "5432"].indexOf(String(port)) !== -1;
      if (open) return { stdout: (host + " [" + (m.hosts[host] || "127.0.0.1") + "] " + port + " (?) open\n"), stderr: "Connection to " + host + " " + port + " port [tcp/*] succeeded!\n", code: 0 };
      return { stdout: "", stderr: host + " [" + (m.hosts[host] || "127.0.0.1") + "] " + port + " (?) : Connection refused\n", code: 1 };
    }
    return raw("");
  };
  C.mtr = function (m, a) {
    var host = a.filter(function (x) { return x[0] !== "-"; })[0] || "1.1.1.1";
    var ip = m.hosts[host] || "93.184.216.34";
    return raw("Start: 2026-09-10T10:30:00+0000\nHOST: ubuntu-lab                  Loss%   Snt   Last   Avg  Best  Wrst StDev\n  1.|-- _gateway (10.0.2.2)          0.0%    10    0.3   0.3   0.2   0.5   0.1\n  2.|-- 10.0.0.1 (10.0.0.1)           0.0%    10    1.2   1.3   1.1   1.9   0.2\n  3.|-- " + host + " (" + ip + ")   0.0%    10   12.3  12.5  12.0  13.1   0.3\n");
  };
  C.ethtool = function (m, a) {
    var nic = a[a.length - 1] || "eth0";
    return raw("Settings for " + nic + ":\n\tSupported ports: [ TP ]\n\tSupported link modes:   1000baseT/Full\n\tSpeed: 1000Mb/s\n\tDuplex: Full\n\tPort: Twisted Pair\n\tAuto-negotiation: on\n\tLink detected: yes\n");
  };
  C.resolvectl = function (m, a) {
    if (a[0] === "status") return raw("Global\n       Protocols: +LLMNR +mDNS -DNSOverTLS DNSSEC=no/unsupported\nresolv.conf mode: stub\n\nLink 2 (eth0)\n    Current Scopes: DNS LLMNR/IPv4 LLMNR/IPv6\n         DNS Servers: 1.1.1.1 8.8.8.8\n");
    if (a[0] === "query") return raw((a[1] || "example.com") + ": 93.184.216.34                               -- link: eth0\n");
    return raw("resolvectl: missing command\n");
  };

  /* ======================= security ======================= */
  C["fail2ban-client"] = function (m, a) {
    if (a[0] === "status" && !a[1]) return raw("Status\n|- Number of jail:\t1\n`- Jail list:\tsshd\n");
    if (a[0] === "status" && a[1]) return raw("Status for the jail: " + a[1] + "\n|- Filter\n|  |- Currently failed:\t4\n|  `- Total failed:\t128\n`- Actions\n   |- Currently banned:\t3\n   `- Total banned:\t17\n   `- Banned IP list:\t203.0.113.9 198.51.100.7 192.0.2.44\n");
    if (a[0] === "set") return raw("IP " + a[a.length - 1] + " unbanned\n");
    if (a[0] === "reload") return raw("");
    return raw("");
  };
  C.lynis = function (m, a) {
    return raw("[ Lynis 3.0.9 ]\n\n[+] Initializing program\n----------------------------------------------\n  - Detecting OS...                                           [ DONE ]\n[+] System Tools\n  - Scanning available tools...\n[+] Boot and services\n  - Checking USBs...\n[+] Kernel Hardening\n  - Comparing sysctl values...\n[+] Authentication\n  - Checking PAM...\n[+] Software: firewalls\n  - Checking firewall configuration...                   " + (m.firewall.enabled ? "[ FOUND ]" : "[ NOT FOUND ]") + "\n[+] Hardening\n\n  Hardening index : 74 [##########          ]\n\n  Tests performed : 231\n  Plugins enabled : 1\n\n  Recommendations:\n  * Install a malware scanner [FILE-6310]\n  * Enable automatic updates [PKGS-7370]\n  * Consider hardening SSH configuration [SSH-7408]\n");
  };
  C["unattended-upgrades"] = function (m, a) {
    if (a.indexOf("--dry-run") !== -1 || a.indexOf("-d") !== -1) return raw("Checking for packages to upgrade...\nAll upgrades installed\n");
    return raw("");
  };

  /* ======================= backups ======================= */
  C.restic = function (m, a) {
    var repoI = Math.max(a.indexOf("-r"), a.indexOf("--repo"));
    var repo = repoI !== -1 ? a[repoI + 1] : (m.env.RESTIC_REPOSITORY || "/backups/restic");
    var rest = a.slice();
    var cmd = null;
    for (var i = 0; i < a.length; i++) {
      if (a[i] === "-r" || a[i] === "--repo") { i++; continue; }
      if (a[i][0] !== "-") { cmd = a[i]; rest = a.slice(i + 1); break; }
    }
    if (cmd === "init") { if (m.backups.resticRepos.indexOf(repo) === -1) m.backups.resticRepos.push(repo); return raw("created restic repository " + Math.random().toString(16).slice(2, 10) + " at " + repo + "\n"); }
    if (!m.backups.resticRepos.length) return fail("unable to open config file: stat " + repo + ": no such file or directory\nIs there a repository at the following location?\n" + repo);
    if (cmd === "backup") {
      var paths = a.filter(function (x) { return x[0] !== "-" && x !== cmd && a[a.indexOf(x) - 1] !== "-r" && a[a.indexOf(x) - 1] !== "--repo"; });
      var snap = Math.random().toString(16).slice(2, 10);
      m.backups.resticSnapshots.push({ id: snap, paths: paths.join(" ") || "/", time: "2026-09-10 10:30:00", host: m.hostname });
      return raw("repository " + Math.random().toString(16).slice(2, 10) + " opened\nFiles:         312 new,     0 changed,     0 unmodified\nAdded to the repository: 12.345 MiB (5.678 MiB stored)\n\nprocessed 312 files, 12.345 MiB in 0:01\nsnapshot " + snap + " saved\n");
    }
    if (cmd === "snapshots") {
      return raw("ID        Time                 Host        Tags        Paths\n------------------------------------------------------------------\n" + m.backups.resticSnapshots.map(function (s) { return s.id + "   " + s.time + "   " + s.host + "                " + s.paths; }).join("\n") + (m.backups.resticSnapshots.length ? "" : "no snapshots found") + "\n------------------------------------------------------------------\n" + m.backups.resticSnapshots.length + " snapshots\n");
    }
    if (cmd === "restore") return raw("restoring <Snapshot of [" + (m.backups.resticSnapshots[0] ? m.backups.resticSnapshots[0].paths : "/") + "]> to " + (a.indexOf("--target") !== -1 ? a[a.indexOf("--target") + 1] : "/tmp/restore") + "\n\nSummary: Restored 312 files/dirs (12.345 MiB) in 0:01\n");
    if (cmd === "forget") return raw("Applying Policy: keep the last 7 daily, 4 weekly snapshots\nkeep 6 snapshots:\n" + m.backups.resticSnapshots.map(function (s) { return "  " + s.time + " " + s.id + "   " + s.paths; }).join("\n") + "\n");
    if (cmd === "check") return raw("using temporary cache in /tmp/restic-check-cache\ncreate exclusive lock for repository\nno errors were found\n");
    return fail("command not found: " + (cmd || ""));
  };
  C.rclone = function (m, a) {
    var cmd = a[0], src = a[1], dst = a[2];
    if (cmd === "lsd" || cmd === "ls") return raw("          -1 2026-09-01 10:00:00        -1 backups\n          -1 2026-09-01 10:00:00        -1 logs\n");
    if (cmd === "copy" || cmd === "sync" || cmd === "sync") return raw("Transferred:    \t  12.345 MiB / 12.345 MiB, 100%, 1.234 MiB/s, ETA 0s\nChecks:                18 / 18, 100%\nTransferred:            3 / 3, 100%\nElapsed time:         1.2s\n");
    if (cmd === "check") return raw("No differences found\n");
    return raw("");
  };

  /* ======================= automation / IaC ======================= */
  C.ansible = function (m, a) {
    var g = getopt(a, { m: true, i: true, a: true, u: true });
    if (g.opts.m === "ping") return raw(m.ansible.inventory.map(function (h) { return h + " | SUCCESS => {\n    \"changed\": false,\n    \"ping\": \"pong\"\n}"; }).join("\n") + "\n");
    if (g.opts.m === "setup") return raw(m.ansible.inventory.map(function (h) { return h + " | SUCCESS => { \"ansible_facts\": { \"ansible_hostname\": \"" + h + "\", \"ansible_distribution\": \"Ubuntu\", \"ansible_memtotal_mb\": 1971 } }"; }).join("\n") + "\n");
    var cmd = g.opts.a || (a.filter(function (x) { return x[0] !== "-"; }).filter(function (x) { return x !== "all"; })[0]) || "uptime";
    return raw(m.ansible.inventory.map(function (h) { return h + " | CHANGED | rc=0 >>\n" + (cmd.indexOf("uptime") !== -1 ? " 10:30:00 up 2:30, 1 user, load average: 0.08, 0.03, 0.01" : "ok"); }).join("\n") + "\n");
  };
  C["ansible-playbook"] = function (m, a) {
    var g = getopt(a, { i: true, "check": false, "diff": false, tags: true });
    var play = a.filter(function (x) { return x[0] !== "-" && a[a.indexOf(x) - 1] !== "-i" && a[a.indexOf(x) - 1] !== "--tags"; })[0] || "site.yml";
    if (!m.fs.exists(play, m.cwd, m.env)) return fail("ERROR! the playbook '" + play + "' could not be found");
    m.ansible.lastPlay = play;
    if (g.opts.check) return raw("PLAY [" + play + "] ***\n\nTASK [Gathering Facts] ***\nok: [web1]\nok: [db1]\n\nPLAY RECAP ***\nweb1  : ok=1 changed=0 unreachable=0 failed=0 skipped=0\n");
    return raw("PLAY [" + play + "] ***\n\nTASK [Gathering Facts] ***\nok: [web1]\nok: [db1]\n\nTASK [common : install packages] ***\nchanged: [web1]\nchanged: [db1]\n\nTASK [common : deploy config] ***\nchanged: [web1]\nchanged: [db1]\n\nTASK [web : restart nginx] ***\nchanged: [web1]\n\nPLAY RECAP ***\nweb1  : ok=4 changed=3 unreachable=0 failed=0 skipped=0\n");
  };
  C.at = function (m, a, ctx) {
    if (a[0] === "-l" || a[0] === "q" || a[0] === "atq") return raw(m.at.map(function (j, i) { return (i + 1) + "\tWed Sep 10 11:30:00 2026 a " + m.user; }).join("\n") + (m.at.length ? "\n" : ""));
    if (a[0] === "-r" || a[0] === "rm" || a[0] === "atrm") { m.at.splice((+a[1] || 1) - 1, 1); return raw(""); }
    var when = a.join(" ").replace(/^-[a-zA-Z]+.*$/, "").trim() || "now + 1 hour";
    var cmd = (ctx.stdin || "").trim() || "job";
    m.at.push({ when: when, command: cmd, user: m.user });
    return raw("warning: commands will be executed using /bin/sh\njob " + m.at.length + " at Wed Sep 10 11:30:00 2026\n");
  };
  C["atq"] = function (m) { return C.at(m, ["q"], {}); };
  C["atrm"] = function (m, a) { return C.at(m, ["rm"].concat(a), {}); };
  C.logrotate = function (m, a) {
    var debug = a.indexOf("-d") !== -1 || a.indexOf("--debug") !== -1;
    var force = a.indexOf("-f") !== -1 || a.indexOf("--force") !== -1;
    if (debug) return raw("reading config file /etc/logrotate.conf\nReading state from file: /var/lib/logrotate/status\nConsidering log /var/log/syslog\n  Now: 2026-09-10 10:30\n  Last rotated at 2026-09-09 00:00\n  log does not need rotating (log has been rotated recently)\nConsidering log /var/log/nginx/access.log\n  log needs rotating\n  rotating log /var/log/nginx/access.log, log->rotateCount is 14\n  renaming /var/log/nginx/access.log to /var/log/nginx/access.log.1\n  creating new /var/log/nginx/access.log mode = 0644 uid = 33 gid = 33\n");
    return raw((force ? "forcing rotation\n" : "") + "");
  };
  C.sysctl = function (m, a) {
    var s = m.sysctl;
    if (!a.length || a[0] === "-a") return raw(Object.keys(s).map(function (k) { return k + " = " + s[k]; }).join("\n") + "\n");
    if (a[0] === "-p") return raw(Object.keys(s).map(function (k) { return k + " = " + s[k]; }).join("\n") + "\n");
    if (a[0] === "-w") {
      var assign = a.slice(1).join(" ");
      assign.split(/\s+/).forEach(function (kv) { var p = kv.split("="); if (p.length === 2) s[p[0]] = isNaN(Number(p[1])) ? p[1] : Number(p[1]); });
      return raw(a.slice(1).map(function (kv) { return kv.replace("=", " = "); }).join("\n") + "\n");
    }
    var outLines = a.filter(function (x) { return x[0] !== "-"; }).map(function (k) { return k + " = " + (s[k] != null ? s[k] : ""); });
    return raw(outLines.join("\n") + "\n");
  };
  C.fallocate = function (m, a) {
    var g = getopt(a, { l: true });
    var file = g.rest[0];
    if (!file) return fail("fallocate: no filename specified");
    var size = g.opts.l || "1G";
    try { m.fs.writeFile(file, m.cwd, m.env, "".padEnd(1024, "\0") + "<? swap file " + size + " ?>"); } catch (e) { return fail("fallocate: " + e.message); }
    return raw("");
  };
  C.mkswap = function (m, a) {
    var dev = a[a.length - 1];
    if (!m.fs.exists(dev, m.cwd, m.env)) return fail("mkswap: cannot open " + dev + ": No such file or directory");
    return raw("Setting up swapspace version 1, size = 2 GiB (2147479552 bytes)\nno label, UUID=" + Math.random().toString(16).slice(2, 10) + "-1234-5678\n");
  };

  /* ======================= secrets / security / observability / perf / ci ======================= */
  C.vault = function (m, a) {
    var sub = a[0], cmd = a[1];
    if (sub === "status") return raw("Key             Value\n---             -----\nSeal Type       shamir\nInitialized     true\nSealed          false\nVersion         1.15.4\nStorage Type    file\n");
    if (sub === "login") return raw("Success! You are now authenticated. The token information displayed below is already stored.\n");
    if (sub === "kv") {
      var path = a[2] || "";
      if (cmd === "put") { m.vault.secrets[path] = a.slice(3).join(" "); return raw("Success! Data written to: " + path + "\n"); }
      if (cmd === "get") {
        if (m.vault.secrets[path] === undefined) return fail("No value found at " + path);
        var rows = m.vault.secrets[path].split(" ").map(function (kv) { var x = kv.split("="); return (x[0] + "        ").slice(0, 10) + x.slice(1).join("="); });
        return raw("====== Secret Path ======\nsecret/data/" + path + "\n\n======= Data =======\nKey          Value\n---          -----\n" + rows.join("\n") + "\n");
      }
      if (cmd === "list" || cmd === "ls") return raw(Object.keys(m.vault.secrets).join("\n") + (Object.keys(m.vault.secrets).length ? "\n" : ""));
      if (cmd === "delete") { delete m.vault.secrets[path]; return raw("Success! Data deleted at: " + path + "\n"); }
    }
    return fail("Usage: vault <login|status|kv put|get|list|delete>");
  };
  C.auditctl = function (m, a) {
    if (a[0] === "-l" || a[0] === "--list" || a[0] === "-s") return raw(m.audit.map(function (r) { return "w " + r.path + " -p " + r.perms + " -k " + r.key; }).join("\n") + (m.audit.length ? "\n" : ""));
    if (a[0] === "-w") {
      var pi = a.indexOf("-p"), ki = a.indexOf("-k");
      m.audit.push({ path: a[1], perms: pi !== -1 ? a[pi + 1] : "wa", key: ki !== -1 ? a[ki + 1] : "key" });
      return raw("");
    }
    if (a[0] === "-D") { m.audit = []; return raw(""); }
    return raw("");
  };
  C.ausearch = function (m, a) {
    var ki = a.indexOf("-k"), key = ki !== -1 ? a[ki + 1] : "";
    return raw("----\ntime->Wed Sep 10 10:30:00 2026\ntype=SYSCALL msg=audit(1234567890.123:456): arch=c000003e syscall=257 success=yes exit=3 key=\"" + key + "\"\n  exe=\"/usr/bin/cat\"\n  comm=\"cat\"\n  uid=0 gid=0\n----\n");
  };
  C.aide = function (m, a) {
    if (a.join(" ").indexOf("--init") !== -1) { m.aide = { initialized: true }; return raw("Start timestamp: 2026-09-10 10:30:00 +0000 (AIDE 0.16.1)\nAIDE initialized database at /var/lib/aide/aide.db.new\nNumber of entries:\t31245\n"); }
    if (a.join(" ").indexOf("--check") !== -1) return raw("Start timestamp: 2026-09-10 10:30:00 +0000 (AIDE 0.16.1)\nAIDE found NO differences between database and filesystem. Looks okay!!\n");
    return raw("");
  };
  C.trivy = function (m, a) {
    if (a[0] === "image") {
      var img = a[1] || "nginx:latest";
      return raw(img + " (alpine 3.19.1)\n\nTotal: 2 (UNKNOWN: 0, LOW: 1, MEDIUM: 1, HIGH: 0, CRITICAL: 0)\n\n┌────────────┬────────────────┬──────────┬───────────────┬──────────────────┐\n│  Library   │ Vulnerability  │ Severity │ Fixed Version │ Title            │\n├────────────┼────────────────┼──────────┼───────────────┼──────────────────┤\n│ libcrypto3 │ CVE-2024-0001  │ MEDIUM   │ 3.1.4-r1      │ openssl issue    │\n│ libssl3    │ CVE-2024-0002  │ LOW      │ 3.1.4-r1      │ openssl issue    │\n└────────────┴────────────────┴──────────┴───────────────┴──────────────────┘\n");
    }
    if (a[0] === "fs") return raw("Total: 0 (UNKNOWN: 0, LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0)\n");
    return raw("");
  };
  C.promtool = function (m, a) {
    if (a[0] === "check" && a[1] === "config") {
      var f = a[a.length - 1], n = m.fs.stat(f, m.cwd, m.env);
      if (!n) return fail("Checking " + f + "\n  FAILED: " + f + ": no such file or directory");
      if (!/scrape_configs/.test(n.content)) return fail("Checking " + f + "\n  FAILED: yaml: field scrape_configs not found");
      m.monitoring.prometheusConfig = true;
      return raw("Checking " + f + "\n  SUCCESS: " + f + " is valid prometheus config file syntax\n");
    }
    if (a[0] === "check" && a[1] === "rules") {
      var f2 = a[a.length - 1], n2 = m.fs.stat(f2, m.cwd, m.env);
      if (!n2) return fail("Checking " + f2 + "\n  FAILED: no such file");
      if (!/alert:/.test(n2.content)) return fail("Checking " + f2 + "\n  FAILED: no alert rules found");
      m.monitoring.alertRules = true;
      return raw("Checking " + f2 + "\n  SUCCESS: " + f2 + " is valid rules file\n");
    }
    return raw("");
  };
  C.amtool = function (m, a) {
    if (a[0] === "check-config") {
      var f = a[a.length - 1], n = m.fs.stat(f, m.cwd, m.env);
      if (!n) return fail("unable to read " + f + ": no such file or directory");
      return raw("Checking '" + f + "'\nSUCCESS: config is valid\n");
    }
    if (a[0] === "alert" && a[1] === "add") return raw("Alert added\n");
    if (a[0] === "alert" && a[1] === "query") return raw("ID  Status  Alerts  Receiver\n");
    return raw("");
  };
  C["node_exporter"] = function (m, a) {
    if (m.monitoring.exporters.indexOf("node_exporter") === -1) m.monitoring.exporters.push("node_exporter");
    if (!m.network.listeners.some(function (l) { return l.local.endsWith(":9100"); })) m.network.listeners.push({ proto: "tcp", local: "0.0.0.0:9100", process: "node_exporter" });
    return raw('ts=2026-09-10T10:30:00.000Z caller=node_exporter.go:191 level=info msg="Starting node_exporter" version="1.7.0"\nts=2026-09-10T10:30:00.000Z caller=tls_config.go:313 level=info msg="Listening on" address=[::]:9100\n');
  };
  C.perf = function (m, a) {
    if (a[0] === "stat") {
      var cmd = a.filter(function (x) { return x[0] !== "-"; })[1] || "cmd";
      return raw("\n Performance counter stats for '" + cmd + "':\n\n          0.42 msec task-clock                #    0.880 CPUs utilized\n                0      context-switches          #    0.000 /sec\n                0      cpu-migrations            #    0.000 /sec\n              123      page-faults               #  292.857 K/sec\n        1,234,567      cycles                    #    2.939 GHz\n          987,654      instructions              #    0.80  insn per cycle\n          123,456      branches                  #  293.943 M/sec\n\n       0.000477317 seconds time elapsed\n");
    }
    if (a[0] === "record") { m.perf = { recording: true }; return raw("[ perf record: Captured and wrote 0.123 MB perf.data (42 samples) ]\n"); }
    if (a[0] === "report") return raw("# Samples: 42  of event 'cpu-clock'\n  12.34%  python3  [.] PyEval_EvalFrame\n   8.10%  nginx    [.] ngx_http_process_request\n   5.55%  [kernel] [k] tcp_sendmsg\n");
    if (a[0] === "top") return raw("Samples: 1K of event 'cpu-clock', 4000 Hz\n  15.20%  python3  [.] PyEval_EvalFrame\n");
    return raw("");
  };
  C.sysbench = function (m, a) {
    if (a[0] === "cpu") return raw("sysbench 1.0.20 (using system LuaJIT 2.1.0)\n\nRunning the test with following options:\nNumber of threads: 1\n\nDoing CPU performance benchmark\n\nPrime numbers limit: 10000\n\nInitializing worker threads...\n\nCPU speed:\n    events per second:  1234.56\n\nGeneral statistics:\n    total time:                          10.0000s\n    total number of events:              12345\n\nLatency (ms):\n         min:                                    0.78\n         avg:                                    0.81\n         max:                                    2.10\n        95th percentile:                        0.85\n");
    if (a[0] === "memory") return raw("sysbench 1.0.20\n\nDoing memory operations speed test\nMemory block size: 1K\n\nTotal operations: 5000000 (499999.99 per second)\n\n7123.45 MiB transferred (712.34 MiB/sec)\n");
    if (a[0] === "fileio") return raw("sysbench 1.0.20\n\nExtra file open flags: (none)\n128 files, 16MiB each\n\nFile operations:\n    reads/s:                      12345.67\n    writes/s:                     8234.56\n    fsyncs/s:                     2345.67\n\nThroughput:\n    read, MiB/s:                  482.25\n    written, MiB/s:               321.50\n");
    return raw("sysbench 1.0.20\n");
  };
  C.fio = function (m, a) {
    var g = getopt(a, { name: true, size: true, rw: true, bs: true, filename: true, iodepth: true, direct: true });
    return raw((g.opts.name || "job1") + ": (g=0): rw=" + (g.opts.rw || "read") + ", bs=" + (g.opts.bs || "4k") + ", ioengine=libaio, iodepth=" + (g.opts.iodepth || 16) + "\nfio-3.28\nStarting 1 process\n\nJobs: 1 (f=1): [" + (g.opts.rw || "read") + "] [100.0% done] [124.5MB/0KB/0KB /s] [31.8K/0/0 iops] [eta 00m:00s]\n  read: IOPS=31.8k, BW=124MiB/s (130MB/s)(100MiB/806msec)\n  clat percentiles (usec):\n     |  1.00th=[   40],  5.00th=[   45], 50.00th=[   55], 95.00th=[   75], 99.00th=[  110]\n  Disk stats (read/write):\n    sda: ios=25600/0, merge=0/0, ticks=1200/0, in_queue=1200, util=95.20%\n");
  };
  C.gh = function (m, a) {
    if (a[0] === "workflow" && a[1] === "run") { m.ci.runs.push({ workflow: a[2] || "deploy.yml", status: "in_progress", started: Date.now() }); return raw("✓ Created workflow_dispatch event for " + (a[2] || "deploy.yml") + "\n"); }
    if (a[0] === "run" && a[1] === "list") return raw("STATUS  TITLE           WORKFLOW    BRANCH  EVENT              ID\n✓       deploy          deploy.yml  main    push               1234\n" + (m.ci.runs.length ? "*       deploy          " + m.ci.runs[m.ci.runs.length - 1].workflow + "  main    workflow_dispatch  1235\n" : ""));
    if (a[0] === "run" && a[1] === "view") return raw("✓ deploy #42\nTriggered via workflow_dispatch\n\n✓ Set up job\n✓ Checkout code\n✓ Build image\n✓ Run tests\n✓ Deploy to production\n");
    if (a[0] === "pr" && a[1] === "create") return raw("https://github.com/example/app/pull/42\n");
    if (a[0] === "pr" && a[1] === "list") return raw("42\tHarden sshd config\tfeature/ssh\tOPEN\n41\tAdd monitoring\tfeature/obs\tMERGED\n");
    if (a[0] === "auth" && a[1] === "status") return raw("github.com\n  ✓ Logged in to github.com account deploy\n");
    return raw("");
  };

  /* ======================= dispatch ======================= */

  var Commands = {
    run: function (m, name, args, ctx) { return Commands._dispatch(m, [name].concat(args), ctx); },
    _dispatch: function (m, argv, ctx) {
      if (!argv.length) return raw("");
      var name = argv[0];
      var args = argv.slice(1);
      ctx = ctx || { stdin: "" };
      var fn = C[name];
      if (!fn) {
        if (name.indexOf("/") !== -1 || name === "." || name === "..") return fail("bash: " + name + ": Is a directory");
        return fail("bash: " + name + ": command not found", 127);
      }
      try { return fn(m, args, ctx); }
      catch (e) { return fail(name + ": " + e.message); }
    },
    table: C,
    canRead: canRead,
    canWrite: canWrite
  };

  if (typeof module !== "undefined" && module.exports) module.exports = Commands;
  global.Commands = Commands;
})(typeof window !== "undefined" ? window : globalThis);
