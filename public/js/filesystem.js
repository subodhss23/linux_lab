/* ============================================================================
 * filesystem.js — Virtual inode filesystem for the Linux Mastery simulator.
 * Works in the browser (window.VFS) and in Node (module.exports).
 * ==========================================================================*/
(function (global) {
  "use strict";

  var DIR = "dir", FILE = "file", LINK = "symlink";

  function now() { return Date.now(); }

  function VFS() {
    this.root = this._node("", DIR, { owner: "root", group: "root", mode: 0o755 });
    this.root.children = Object.create(null);
  }

  VFS.prototype._node = function (name, type, opts) {
    opts = opts || {};
    var n = {
      name: name,
      type: type,
      owner: opts.owner || "root",
      group: opts.group || "root",
      mode: opts.mode == null ? (type === DIR ? 0o755 : 0o644) : opts.mode,
      mtime: opts.mtime || now()
    };
    if (type === DIR) n.children = Object.create(null);
    if (type === FILE) n.content = opts.content || "";
    if (type === LINK) n.target = opts.target || "";
    if (opts.size != null) n.content = opts.content || "";
    return n;
  };

  /* -------- path helpers -------- */
  VFS.prototype.expandTilde = function (path, env) {
    env = env || {};
    if (path === "~") return env.HOME || "/root";
    if (path.indexOf("~/") === 0) return (env.HOME || "/root") + path.slice(1);
    var m = /^~([A-Za-z0-9_-]+)(\/.*)?$/.exec(path);
    if (m) return "/home/" + m[1] + (m[2] || "");
    return path;
  };

  VFS.prototype.normalize = function (path) {
    var parts = String(path).split("/");
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (p === "" || p === ".") continue;
      if (p === "..") { out.pop(); continue; }
      out.push(p);
    }
    return "/" + out.join("/");
  };

  VFS.prototype.resolve = function (path, cwd, env) {
    path = this.expandTilde(String(path), env);
    var abs = path.charAt(0) === "/" ? path : (cwd || "/") + "/" + path;
    return this.normalize(abs);
  };

  VFS.prototype.basename = function (p) {
    p = this.normalize(p);
    if (p === "/") return "/";
    return p.slice(p.lastIndexOf("/") + 1);
  };

  VFS.prototype.dirname = function (p) {
    p = this.normalize(p);
    if (p === "/") return "/";
    var i = p.lastIndexOf("/");
    return i <= 0 ? "/" : p.slice(0, i);
  };

  VFS.prototype.join = function (a, b) {
    return this.normalize((a === "/" ? "" : a) + "/" + b);
  };

  /* -------- traversal (follows symlinks) -------- */
  VFS.prototype.get = function (path, cwd, env) {
    var abs = this.resolve(path, cwd, env);
    return { node: this._walk(abs, true, 0), abs: abs };
  };

  VFS.prototype._walk = function (abs, follow, depth) {
    if (depth > 40) return null;
    if (abs === "/") return this.root;
    var parts = abs.split("/").filter(Boolean);
    var cur = this.root, self = this;
    for (var i = 0; i < parts.length; i++) {
      if (!cur || cur.type !== DIR || !cur.children[parts[i]]) return null;
      cur = cur.children[parts[i]];
      if (cur.type === LINK && (follow || i < parts.length - 1)) {
        var target = cur.target.charAt(0) === "/"
          ? cur.target
          : self.join(self.dirname(self.resolve("/" + parts.slice(0, i + 1).join("/"), "/", {})), cur.target);
        var rest = parts.slice(i + 1).join("/");
        return self._walk(self.normalize(target + (rest ? "/" + rest : "")), follow, depth + 1);
      }
    }
    return cur;
  };

  VFS.prototype.exists = function (path, cwd, env, type) {
    var n = this.get(path, cwd, env).node;
    if (!n) return false;
    if (type && n.type !== type) return false;
    return true;
  };

  VFS.prototype.stat = function (path, cwd, env) {
    return this.get(path, cwd, env).node;
  };

  // lstat: like stat but does NOT follow a trailing symlink.
  VFS.prototype.lstat = function (path, cwd, env) {
    var abs = this.resolve(path, cwd, env);
    if (abs === "/") return this.root;
    var parent = this._walk(this.dirname(abs), true, 0);
    if (!parent || !parent.children[this.basename(abs)]) return null;
    return parent.children[this.basename(abs)];
  };

  VFS.prototype.parentOf = function (abs) {
    return this.dirname(abs) === "/" ? this.root : this._walk(this.dirname(abs), true, 0);
  };

  /* -------- creation -------- */
  VFS.prototype.mkdir = function (path, cwd, env, recursive) {
    var abs = this.resolve(path, cwd, env);
    var parts = abs.split("/").filter(Boolean);
    var cur = this.root, self = this;
    for (var i = 0; i < parts.length; i++) {
      var name = parts[i];
      if (!cur.children[name]) {
        if (i !== parts.length - 1 && !recursive) {
          throw new Error("cannot create directory '" + path + "': No such file or directory");
        }
        cur.children[name] = self._node(name, DIR);
        cur.mtime = now();
      } else {
        var child = cur.children[name];
        if (child.type === LINK) {
          var t = self._walk(self.resolve(child.target.charAt(0) === "/" ? child.target : self.join(self.resolve("/" + parts.slice(0, i + 1).join("/"), "/", {}), child.target), "/", {}), true, 0);
          child = t || child;
        }
        if (child.type !== DIR) {
          if (i === parts.length - 1) throw new Error("cannot create directory '" + path + "': File exists");
          throw new Error("cannot create directory '" + path + "': Not a directory");
        }
      }
      cur = cur.children[name].type === DIR ? cur.children[name] : cur;
    }
    return this._walk(abs, true, 0);
  };

  VFS.prototype.writeFile = function (path, cwd, env, content, append) {
    var abs = this.resolve(path, cwd, env);
    var existing = this._walk(abs, false, 0);
    if (existing) {
      if (existing.type === DIR) throw new Error("cannot write to '" + path + "': Is a directory");
      existing.content = append ? existing.content + content : content;
      existing.mtime = now();
      return existing;
    }
    var parent = this.parentOf(abs);
    if (!parent || parent.type !== DIR) throw new Error("cannot create '" + path + "': No such file or directory");
    var node = this._node(this.basename(abs), FILE, { content: content, owner: "root", group: "root", mode: 0o644 });
    parent.children[node.name] = node;
    parent.mtime = now();
    return node;
  };

  VFS.prototype.readFile = function (path, cwd, env) {
    var n = this.get(path, cwd, env).node;
    if (!n) throw new Error("cannot open '" + path + "': No such file or directory");
    if (n.type === DIR) throw new Error("cannot read '" + path + "': Is a directory");
    return n.content || "";
  };

  VFS.prototype.rm = function (path, cwd, env, opts) {
    opts = opts || {};
    var abs = this.resolve(path, cwd, env);
    if (abs === "/") throw new Error("cannot remove '/': Device or resource busy");
    var parent = this.parentOf(abs);
    var name = this.basename(abs);
    if (!parent || !parent.children[name]) throw new Error("cannot remove '" + path + "': No such file or directory");
    var node = parent.children[name];
    if (node.type === DIR && !opts.recursive) throw new Error("cannot remove '" + path + "': Is a directory");
    delete parent.children[name];
    parent.mtime = now();
    return true;
  };

  VFS.prototype.copy = function (src, dst, cwd, env, opts) {
    opts = opts || {};
    var sn = this.get(src, cwd, env).node;
    if (!sn) throw new Error("cannot stat '" + src + "': No such file or directory");
    if (sn.type === DIR && !opts.recursive) throw new Error("cannot copy '" + src + "': Is a directory (use -r)");
    var dabs = this.resolve(dst, cwd, env);
    var dnode = this._walk(dabs, false, 0);
    if (dnode && dnode.type === DIR) {
      dabs = this.join(dabs, sn.name);
      dnode = this._walk(dabs, false, 0);
    }
    if (opts.noClobber && dnode) return false;
    if (dnode) { this.removeAbs(dabs); }
    var parent = this.parentOf(dabs);
    if (!parent) throw new Error("cannot create '" + dst + "': No such file or directory");
    parent.children[this.basename(dabs)] = this._clone(sn, this.basename(dabs));
    parent.mtime = now();
    return true;
  };

  VFS.prototype._clone = function (node, name) {
    var c = this._node(name || node.name, node.type, {
      owner: node.owner, group: node.group, mode: node.mode,
      content: node.content, target: node.target, mtime: node.mtime
    });
    if (node.type === DIR) {
      for (var k in node.children) c.children[k] = this._clone(node.children[k], k);
    }
    return c;
  };

  VFS.prototype.removeAbs = function (abs) {
    var parent = this.parentOf(abs);
    if (parent) delete parent.children[this.basename(abs)];
  };

  VFS.prototype.move = function (src, dst, cwd, env) {
    var sn = this.get(src, cwd, env).node;
    if (!sn) throw new Error("cannot stat '" + src + "': No such file or directory");
    var dabs = this.resolve(dst, cwd, env);
    var dnode = this._walk(dabs, false, 0);
    if (dnode && dnode.type === DIR) dabs = this.join(dabs, sn.name);
    var parent = this.parentOf(dabs);
    if (!parent || parent.type !== DIR) throw new Error("cannot move '" + src + "': No such file or directory");
    var clone = this._clone(sn, this.basename(dabs));
    parent.children[this.basename(dabs)] = clone;
    this.removeAbs(this.resolve(src, cwd, env));
    return true;
  };

  VFS.prototype.chmod = function (path, cwd, env, mode) {
    var n = this.get(path, cwd, env).node;
    if (!n) throw new Error("cannot access '" + path + "': No such file or directory");
    n.mode = mode & 0o7777;
    n.mtime = now();
    return n;
  };

  VFS.prototype.chown = function (path, cwd, env, owner, group) {
    var n = this.get(path, cwd, env).node;
    if (!n) throw new Error("cannot access '" + path + "': No such file or directory");
    if (owner) n.owner = owner;
    if (group) n.group = group;
    return n;
  };

  VFS.prototype.touch = function (path, cwd, env) {
    var abs = this.resolve(path, cwd, env);
    var n = this._walk(abs, false, 0);
    if (n) { n.mtime = now(); return n; }
    return this.writeFile(path, cwd, env, "");
  };

  VFS.prototype.symlink = function (target, linkPath, cwd, env) {
    var abs = this.resolve(linkPath, cwd, env);
    var parent = this.parentOf(abs);
    if (!parent) throw new Error("failed to create symbolic link '" + linkPath + "': No such file or directory");
    var node = this._node(this.basename(abs), LINK, { target: target });
    parent.children[node.name] = node;
    return node;
  };

  /* -------- listing -------- */
  VFS.prototype.list = function (path, cwd, env) {
    var n = this.get(path, cwd, env).node;
    if (!n) throw new Error("cannot access '" + path + "': No such file or directory");
    if (n.type !== DIR) return [n];
    var out = [];
    for (var k in n.children) out.push(n.children[k]);
    return out;
  };

  /* -------- formatting -------- */
  VFS.prototype.typeChar = function (n) {
    return n.type === DIR ? "d" : n.type === LINK ? "l" : "-";
  };

  VFS.prototype.modeString = function (n) {
    var s = this.typeChar(n);
    var bits = n.mode;
    var map = [
      [0o400, "r"], [0o200, "w"], [0o100, "x"],
      [0o040, "r"], [0o020, "w"], [0o010, "x"],
      [0o004, "r"], [0o002, "w"], [0o001, "x"]
    ];
    for (var i = 0; i < map.length; i++) s += (bits & map[i][0]) ? map[i][1] : "-";
    if (bits & 0o4000) s = s.slice(0, 3) + "s" + s.slice(4);
    if (bits & 0o2000) s = s.slice(0, 6) + "s" + s.slice(7);
    if (bits & 0o1000) s = s.slice(0, 9) + ((bits & 0o001) ? "t" : "T");
    return s;
  };

  VFS.prototype.sizeOf = function (n) {
    if (n.type === DIR) return 4096;
    if (n.type === LINK) return (n.target || "").length;
    return (n.content || "").length;
  };

  VFS.prototype.serialize = function () {
    function ser(n) {
      var o = { n: n.name, t: n.type, o: n.owner, g: n.group, m: n.mode, ts: n.mtime };
      if (n.type === FILE) o.c = n.content;
      if (n.type === LINK) o.l = n.target;
      if (n.type === DIR) { o.d = {}; for (var k in n.children) o.d[k] = ser(n.children[k]); }
      return o;
    }
    return { root: ser(this.root) };
  };

  VFS.deserialize = function (data) {
    var fs = new VFS();
    function des(o, isRoot) {
      var n = fs._node(isRoot ? "" : o.n, o.t, { owner: o.o, group: o.g, mode: o.m, mtime: o.ts, content: o.c, target: o.l });
      if (o.t === DIR) for (var k in o.d) n.children[k] = des(o.d[k], false);
      return n;
    }
    fs.root = des(data.root, true);
    if (!fs.root.children) fs.root.children = Object.create(null);
    return fs;
  };

  VFS.build = function (spec) {
    var fs = new VFS();
    (function walk(dirNode, obj) {
      for (var key in obj) {
        if (key.charAt(0) === "_") continue;
        var val = obj[key];
        if (val && typeof val === "object" && val._type !== "file" && !Array.isArray(val) && val.content === undefined && val.target === undefined) {
          var d = fs._node(key, DIR, { owner: (val._owner) || "root", group: (val._group) || "root", mode: val._mode == null ? 0o755 : val._mode });
          dirNode.children[key] = d;
          walk(d, val);
        } else if (val && val.target !== undefined) {
          dirNode.children[key] = fs._node(key, LINK, { target: val.target, owner: val._owner || "root", group: val._group || "root" });
        } else if (val && typeof val === "object" && val.content !== undefined) {
          dirNode.children[key] = fs._node(key, FILE, { content: val.content, owner: val._owner || "root", group: val._group || "root", mode: val._mode == null ? 0o644 : val._mode });
        } else {
          dirNode.children[key] = fs._node(key, FILE, { content: String(val) });
        }
      }
    })(fs.root, spec);
    return fs;
  };

  VFS.type = { DIR: DIR, FILE: FILE, LINK: LINK };

  if (typeof module !== "undefined" && module.exports) module.exports = VFS;
  global.VFS = VFS;
})(typeof window !== "undefined" ? window : globalThis);
