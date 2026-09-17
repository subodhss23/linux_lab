/* ============================================================================
 * app.js — UI controller: terminal, curriculum navigation, grading, XP.
 * ==========================================================================*/
(function () {
  "use strict";
  if (window.__LM_BOOTED__) return;
  window.__LM_BOOTED__ = true;

  var state = {
    machine: null,
    shell: null,
    current: null,           // { module, lesson }
    progress: null,
    lastInput: Date.now(),
    totalTasks: 0
  };

  var STORE_KEY = "linuxmastery.progress.v2";
  var STORE_KEY_V1 = "linuxmastery.progress.v1";

  function defaultProgress() {
    return { xp: 0, lessons: {}, activeSeconds: 0, totalCommands: 0, createdAt: Date.now() };
  }

  /* ---------------- persistence ---------------- */
  function loadProgress() {
    var local = null, v1 = null;
    try { local = JSON.parse(localStorage.getItem(STORE_KEY) || "null"); } catch (e) {}
    try { v1 = JSON.parse(localStorage.getItem(STORE_KEY_V1) || "null"); } catch (e) {}
    // migrate v1 -> v2 once (totalCommands starts at 0)
    if (!local && v1) {
      local = { xp: v1.xp || 0, lessons: v1.lessons || {}, activeSeconds: v1.activeSeconds || 0, totalCommands: 0 };
    }
    return fetch("/api/progress").then(function (r) { return r.ok ? r.json() : null; }).then(function (server) {
      var p = server && server.xp != null ? server : local;
      state.progress = Object.assign(defaultProgress(), p || {});
      state.progress.lessons = state.progress.lessons || {};
    }).catch(function () {
      state.progress = Object.assign(defaultProgress(), local || {});
      state.progress.lessons = state.progress.lessons || {};
    });
  }

  var saveTimer = null;
  function saveProgress() {
    var data = state.progress;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) {}
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      fetch("/api/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).catch(function () {});
    }, 800);
  }

  /* ---------------- theme ---------------- */
  var THEME_KEY = "linuxmastery.theme";
  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  }
  function themeIcon(t) {
    return t === "light"
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  }
  function refreshThemeButton() {
    var btn = document.getElementById("btn-theme");
    if (!btn) return;
    var t = currentTheme();
    btn.innerHTML = themeIcon(t);
    btn.dataset.icon = t;
    btn.setAttribute("aria-label", "Switch to " + (t === "light" ? "dark" : "light") + " theme");
    btn.title = "Switch to " + (t === "light" ? "dark" : "light") + " theme (Ctrl+Shift+D)";
  }
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
    refreshThemeButton();
  }
  function toggleTheme() {
    var next = currentTheme() === "light" ? "dark" : "light";
    applyTheme(next);
    toast("Switched to " + next + " theme");
  }

  /* ---------------- terminal ---------------- */
  var $out, $cmd, $prompt, $term, $termTitle;

  function print(text, cls) {
    if (text == null) return;
    var div = document.createElement("div");
    div.className = "line " + (cls || "");
    div.textContent = text.replace(/\n$/, "");
    $out.appendChild(div);
    scrollBottom();
  }
  function printHTML(html, cls) {
    var div = document.createElement("div");
    div.className = "line " + (cls || "");
    div.innerHTML = html;
    $out.appendChild(div);
    scrollBottom();
  }
  function println() { print(""); }
  function scrollBottom() { $term.scrollTop = $term.scrollHeight; }

  function promptParts() {
    var p = state.shell.prompt();
    var m = /^([^:]+):(.*)([$#])\s?$/.exec(p);
    if (!m) return { user: p, path: "", sym: "" };
    return { user: m[1], path: m[2], sym: m[3] };
  }
  function promptHTML() {
    var parts = promptParts();
    return '<span class="p-user">' + escapeHTML(parts.user) + ":</span>" +
      '<span class="p-path">' + escapeHTML(parts.path) + "</span>" +
      '<span class="p-sym">' + escapeHTML(parts.sym) + " </span>";
  }

  function setPrompt() {
    $prompt.innerHTML = promptHTML();
    var m = state.shell.current();
    var home = (m.env && m.env.HOME) || "/root";
    var short = m.cwd && m.cwd.indexOf(home) === 0 ? "~" + m.cwd.slice(home.length) : m.cwd;
    $termTitle.textContent = m.user + "@" + m.hostname + ": " + (short || "/");
    updateBlockCursor();
  }

  function echoCommand(line) {
    printHTML(promptHTML() + '<span class="cmdline">' + escapeHTML(line) + "</span>");
  }
  function escapeHTML(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }

  function printTiming(ms) {
    var div = document.createElement("div");
    div.className = "line timing";
    div.textContent = "· " + ms + "ms";
    $out.appendChild(div);
    scrollBottom();
  }

  /* block cursor: blinking ▊ that tracks the input caret (mono math) */
  var $cursor = null, _charW = 8.7, _cursorRaf = 0;
  function measureCharW() {
    try {
      var cs = window.getComputedStyle($cmd);
      var probe = document.createElement("span");
      probe.style.cssText = "position:absolute;visibility:hidden;white-space:pre;font-family:" + cs.fontFamily + ";font-size:" + cs.fontSize + ";font-weight:" + cs.fontWeight;
      probe.textContent = "0123456789";
      document.body.appendChild(probe);
      _charW = probe.getBoundingClientRect().width / 10 || 8.7;
      probe.remove();
    } catch (e) {}
  }
  function updateBlockCursor() {
    if (!$cursor || !$cmd || !$prompt) return;
    if (document.activeElement !== $cmd) { $cursor.classList.add("cursor-hidden"); return; }
    $cursor.classList.remove("cursor-hidden");
    var caret = 0;
    try { caret = $cmd.selectionStart == null ? $cmd.value.length : $cmd.selectionStart; } catch (e) {}
    var inputLeft = $cmd.offsetLeft || 0;
    var left = inputLeft + (caret * _charW) - ($cmd.scrollLeft || 0);
    $cursor.style.left = Math.max(inputLeft, left) + "px";
  }
  function scheduleCursor() {
    cancelAnimationFrame(_cursorRaf);
    _cursorRaf = requestAnimationFrame(updateBlockCursor);
  }

  function lastLoginStamp() {
    var d = new Date();
    var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    function p2(n) { return (n < 10 ? "0" : "") + n; }
    return days[d.getUTCDay()] + " " + mon[d.getUTCMonth()] + " " + d.getUTCDate() + " " +
      p2(d.getUTCHours()) + ":" + p2(d.getUTCMinutes()) + ":" + p2(d.getUTCSeconds()) + " UTC " + d.getUTCFullYear();
  }
  function printBoot() {
    var boots = [
      "Started Daily apt download activities.",
      "Started OpenBSD Secure Shell server.",
      "Started System Logging Service.",
      "Reached target Multi-User System.",
      "Reached target Graphical Interface."
    ];
    boots.forEach(function (msg) {
      printHTML('<span class="boot-ok">[  OK  ]</span> <span class="boot-msg">' + escapeHTML(msg) + "</span>");
    });
    printHTML('<span class="boot-login">Last login: ' + escapeHTML(lastLoginStamp()) + " from 10.0.2.2 on pts/0</span>");
  }

  /* command milestone: every 100 lifetime commands, a quote to keep pushing */
  var MILESTONE_QUOTES = [
    { q: "Talk is cheap. Show me the code.", by: "Linus Torvalds" },
    { q: "Unix is simple. It just takes a genius to understand its simplicity.", by: "Dennis Ritchie" },
    { q: "The only way to learn a new programming language is by writing programs in it.", by: "Dennis Ritchie" },
    { q: "Simplicity is the soul of efficiency.", by: "Austin Freeman" },
    { q: "First, solve the problem. Then, write the code.", by: "John Johnson" },
    { q: "The terminal doesn't care about your intentions — only your commands.", by: "lab fortune" },
    { q: "Small, sharp tools piped together beat one giant tool.", by: "Unix philosophy" },
    { q: "You don't have to be great to start, but you have to start to be great.", by: "Zig Ziglar" },
    { q: "99 little bugs in the code, 99 little bugs… take one down, patch it around.", by: "lab fortune" },
    { q: "rm -rf takes a second to type and a career to regret. Backups first.", by: "lab fortune" },
    { q: "Read the error. It is literally telling you what is wrong.", by: "lab fortune" },
    { q: "Automation applied to an efficient operation magnifies the efficiency.", by: "Bill Gates" },
    { q: "The best way to predict the future is to invent it — then deploy it.", by: "Alan Kay, paraphrased" },
    { q: "Weekends are for restores you tested on weekdays.", by: "lab fortune" },
    { q: "Logs are the diary your machine keeps when you're not watching.", by: "lab fortune" },
    { q: "Permissions are not bureaucracy — they are the immune system.", by: "lab fortune" }
  ];
  var MILESTONE_RANKS = ["Terminal Regular", "Pipe Fitter", "Permission Pro", "Process Hunter", "Service Wrangler", "Network Scout", "Container Captain", "Ship-It Engineer", "On-Call Hero", "Root Wizard"];
  function maybeMilestone() {
    var n = state.progress.totalCommands || 0;
    if (n <= 0 || n % 100 !== 0) return;
    var step = Math.floor(n / 100);
    var rank = MILESTONE_RANKS[Math.min(step - 1, MILESTONE_RANKS.length - 1)];
    var pick = MILESTONE_QUOTES[Math.floor(Math.random() * MILESTONE_QUOTES.length)];
    var next = n + 100;
    printHTML('<span class="milestone">★ ' + n + " COMMANDS — " + escapeHTML(rank) + "</span>");
    printHTML('<span class="milestone-quote">“' + escapeHTML(pick.q) + "” — " + escapeHTML(pick.by) + "</span>");
    printHTML('<span class="milestone-sub">Next surprise at ' + next + " · keep pushing.</span>");
    toast("★ " + n + " commands — " + rank + "!");
  }

  function runCommand(line) {
    line = line.replace(/\s+$/, "");
    if (line === "") { echoCommand(""); return; }
    echoCommand(line);
    state.lastInput = Date.now();
    // Total Commands: every non-empty Enter counts, right or wrong, pass or fail.
    state.progress.totalCommands = (state.progress.totalCommands || 0) + 1;
    var t0 = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
    var res;
    try { res = state.shell.exec(line); }
    catch (e) {
      saveProgress(); renderStats();
      print("bash: internal error: " + e.message, "err");
      return;
    }

    if (res.clear) { $out.innerHTML = ""; setPrompt(); saveProgress(); renderStats(); maybeMilestone(); return; }

    if (res.output) {
      // color stderr-ish lines? We keep it simple: print as one block
      var text = res.output.replace(/\n$/, "");
      if (text) print(text, res.code !== 0 && text ? "" : "");
    }

    if (res.ssh) {
      var banner = state.shell.enterRemote(res.ssh);
      print(banner, "sys");
    }
    if (res.exit) {
      if (state.shell.sessions.length) {
        state.shell.leaveRemote();
        print("logout\nConnection to " + (state.shell.current().hostname) + " closed.", "sys");
      } else {
        print("logout", "sys");
      }
    }

    var t1 = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
    var dt = Math.max(1, Math.round(t1 - t0));
    printTiming(dt);

    setPrompt();
    gradeCurrent(line, res);
    saveProgress();
    renderStats();
    maybeMilestone();
  }

  function bindTerminal() {
    $cmd.addEventListener("keydown", function (e) {
      state.lastInput = Date.now();
      if (e.ctrlKey && (e.key === "l" || e.key === "L")) { e.preventDefault(); $out.innerHTML = ""; return; }
      if (e.ctrlKey && (e.key === "c" || e.key === "C")) { e.preventDefault(); echoCommand($cmd.value + "^C"); $cmd.value = ""; scheduleCursor(); return; }
      if (e.ctrlKey || e.metaKey || e.altKey) return; // global shortcuts own these
      if (e.key === "Enter") {
        var line = $cmd.value;
        $cmd.value = "";
        state.histIndex = state.shell.m.history.length;
        runCommand(line);
        scheduleCursor();
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        var m = state.shell.m;
        if (state.histIndex == null) state.histIndex = m.history.length;
        if (state.histIndex > 0) state.histIndex--;
        $cmd.value = m.history[state.histIndex] || "";
        moveCaretEnd($cmd);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        var mm = state.shell.m;
        if (state.histIndex == null) state.histIndex = mm.history.length;
        if (state.histIndex < mm.history.length - 1) { state.histIndex++; $cmd.value = mm.history[state.histIndex] || ""; }
        else { state.histIndex = mm.history.length; $cmd.value = ""; }
        moveCaretEnd($cmd);
      } else if (e.key === "Tab") {
        e.preventDefault();
        complete($cmd);
      }
      scheduleCursor();
    });
    $cmd.addEventListener("input", scheduleCursor);
    $cmd.addEventListener("keyup", scheduleCursor);
    $cmd.addEventListener("click", scheduleCursor);
    $cmd.addEventListener("focus", function () { measureCharW(); updateBlockCursor(); });
    $cmd.addEventListener("blur", function () { if ($cursor) $cursor.classList.add("cursor-hidden"); });
    document.addEventListener("selectionchange", function () {
      if (document.activeElement === $cmd) scheduleCursor();
    });
    $term.addEventListener("click", function () { $cmd.focus(); });
  }
  function moveCaretEnd(el) { setTimeout(function () { el.selectionStart = el.selectionEnd = el.value.length; scheduleCursor(); }, 0); }

  function complete(input) {
    var value = input.value;
    var parts = value.split(" ");
    var last = parts[parts.length - 1];
    var m = state.shell.current();
    var completions = [];
    if (parts.length === 1) {
      var cmds = Object.keys(Commands.table).filter(function (c) { return c.charAt(0) !== "-"; });
      completions = cmds.filter(function (c) { return c.indexOf(last) === 0; });
    }
    // path completion
    var slash = last.lastIndexOf("/");
    var dirPart = slash >= 0 ? last.slice(0, slash + 1) : "";
    var namePart = slash >= 0 ? last.slice(slash + 1) : last;
    var dirAbs = m.fs.resolve(dirPart || ".", m.cwd, m.env);
    var dirNode = m.fs.stat(dirAbs, "/", m.env);
    if (dirNode && dirNode.type === "dir") {
      Object.keys(dirNode.children).forEach(function (name) {
        if (name.indexOf(namePart) === 0) {
          var suffix = dirNode.children[name].type === "dir" ? "/" : " ";
          completions.push(dirPart + name + suffix);
        }
      });
    }
    if (completions.length === 1) {
      parts[parts.length - 1] = completions[0];
      input.value = parts.join(" ");
      moveCaretEnd(input);
    } else if (completions.length > 1) {
      printHTML(promptHTML() + '<span class="cmdline">' + escapeHTML(value) + "</span>");
      print(completions.join("   "), "sys");
    }
  }

  /* ---------------- grading ---------------- */
  function lessonProgress(id) {
    if (!state.progress.lessons[id]) state.progress.lessons[id] = { done: false, hint: false, sol: false, attempted: false };
    if (state.progress.lessons[id].attempted == null) state.progress.lessons[id].attempted = false;
    return state.progress.lessons[id];
  }

  function gradeCurrent(cmd, res) {
    if (!state.current) return;
    var lesson = state.current.lesson;
    var lp = lessonProgress(lesson.id);
    if (lp.done) return;
    var env = { fs: state.machine.fs, m: state.machine, cmd: cmd, result: res, history: state.machine.history };
    var result;
    try { result = lesson.task.check(env); } catch (e) { result = { ok: false, reason: "check error: " + e.message }; }
    if (result === true) result = { ok: true };
    if (result && result.ok) {
      completeLesson(lesson, lp);
    } else if (result && result.reason) {
      if (!lp.attempted) { lp.attempted = true; saveProgress(); }
      var led = document.querySelector(".task-led");
      if (led && led.dataset.state !== "done") led.dataset.state = "tried";
      setTaskFeedback(result.reason, false);
    }
  }

  function spawnXpFloater(gained) {
    var task = document.querySelector(".task");
    if (!task) return;
    var el = document.createElement("div");
    el.className = "xp-floater";
    el.textContent = "+" + gained + " XP";
    task.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 650);
  }

  function completeLesson(lesson, lp) {
    lp.done = true;
    var gained = 10;
    if (lp.hint) gained -= 4;
    if (lp.sol) gained -= 6;
    gained = Math.max(2, gained);
    state.progress.xp += gained;
    saveProgress();
    renderStats(true);
    renderModules();
    renderLesson();
    spawnXpFloater(gained);
    print("✔ Task complete: " + lesson.title + "  (+" + gained + " XP)", "taskok");
    toast("Task complete! +" + gained + " XP");
  }

  function setTaskFeedback(msg, good) {
    var el = document.getElementById("task-feedback");
    if (!el) return;
    el.textContent = (good ? "✔ " : "✗ ") + msg;
    el.className = "task-feedback " + (good ? "ok" : "bad");
  }

  /* ---------------- stats + modules ---------------- */
  function levelFor(xp) { return Math.floor(Math.sqrt(xp / 50)) + 1; }
  function xpForLevel(l) { return Math.pow(l - 1, 2) * 50; }

  /* mono glyph for sidebar: 01..30 for modules, R1..R9 for reviews */
  function moduleGlyph(mod) {
    var idx = CURRICULUM.indexOf(mod);
    if (mod.id && mod.id.charAt(0) === "r") {
      var n = parseInt(mod.id.slice(1), 10);
      return "R" + (isNaN(n) ? (idx + 1) : n);
    }
    var num = idx + 1;
    return (num < 10 ? "0" : "") + num;
  }

  function renderStats(tick) {
    var xp = state.progress.xp;
    var lvl = levelFor(xp);
    var cur = xpForLevel(lvl), next = xpForLevel(lvl + 1);
    var pct = Math.max(0, Math.min(100, ((xp - cur) / (next - cur)) * 100));
    var lvlEl = document.getElementById("stat-level");
    var xpEl = document.getElementById("stat-xp");
    if (lvlEl) lvlEl.textContent = (lvl < 10 ? "0" : "") + lvl;
    if (xpEl) {
      xpEl.textContent = xp;
      if (tick) {
        xpEl.classList.add("tick");
        setTimeout(function () { xpEl.classList.remove("tick"); }, 650);
      }
    }
    var xpbar = document.getElementById("stat-xpbar");
    if (xpbar) xpbar.style.width = pct + "%";
    var done = Object.keys(state.progress.lessons).filter(function (k) { return state.progress.lessons[k].done; }).length;
    document.getElementById("stat-done").textContent = done + "/" + state.totalTasks;
    var cmdsEl = document.getElementById("stat-cmds");
    if (cmdsEl) cmdsEl.textContent = state.progress.totalCommands || 0;
    var overall = state.totalTasks ? Math.round((done / state.totalTasks) * 100) : 0;
    document.getElementById("overall-fill").style.width = overall + "%";
    document.getElementById("overall-text").textContent = done + " / " + state.totalTasks + " tasks";
  }

  function renderTime() {
    var s = state.progress.activeSeconds || 0;
    var h = String(Math.floor(s / 3600)).padStart(2, "0");
    var mnt = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    var sec = String(s % 60).padStart(2, "0");
    document.getElementById("stat-time").textContent = h + ":" + mnt + ":" + sec;
  }

  function moduleStats(mod) {
    var total = mod.lessons.length, done = 0;
    mod.lessons.forEach(function (l) { if (state.progress.lessons[l.id] && state.progress.lessons[l.id].done) done++; });
    return { total: total, done: done, pct: total ? done / total : 0 };
  }

  function renderModules(filter) {
    var host = document.getElementById("modules");
    host.innerHTML = "";
    filter = (filter || "").toLowerCase();
    CURRICULUM.forEach(function (mod) {
      var ms = moduleStats(mod);
      var lessonsText = mod.lessons.map(function (l) { return l.title; }).join(" ").toLowerCase();
      if (filter && mod.title.toLowerCase().indexOf(filter) === -1 && lessonsText.indexOf(filter) === -1) return;

      var div = document.createElement("div");
      div.className = "module" + (state.current && state.current.module.id === mod.id ? " active" : "");
      var c = 2 * Math.PI * 13;
      var off = c * (1 - ms.pct);
      div.innerHTML =
        '<div class="module-head">' +
          '<div class="module-icon">' + escapeHTML(moduleGlyph(mod)) + '</div>' +
          '<div class="module-info"><div class="module-title">' + escapeHTML(mod.title) + '</div>' +
          '<div class="module-meta">' + mod.lessons.length + ' lessons · ' + mod.hours + 'h</div></div>' +
          '<svg class="ring" viewBox="0 0 32 32"><circle class="bg" cx="16" cy="16" r="13"></circle>' +
          '<circle class="fg" cx="16" cy="16" r="13" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"></circle>' +
          '<text x="16" y="19" text-anchor="middle">' + Math.round(ms.pct * 100) + '%</text></svg>' +
        '</div><div class="lessons"></div>';
      var head = div.querySelector(".module-head");
      head.addEventListener("click", function () {
        var wasActive = div.classList.contains("active");
        document.querySelectorAll(".module").forEach(function (x) { x.classList.remove("active"); });
        if (!wasActive) { div.classList.add("active"); }
        else { div.classList.add("active"); }
      });
      var lessonsHost = div.querySelector(".lessons");
      mod.lessons.forEach(function (lesson) {
        var lp = lessonProgress(lesson.id);
        var isNav = ui.navMode && state.flat[ui.navIndex] && state.flat[ui.navIndex].lesson.id === lesson.id;
        var item = document.createElement("div");
        item.className = "lesson-item" + (lp.done ? " done" : "") + (state.current && state.current.lesson.id === lesson.id ? " current" : "") + (isNav ? " nav-cursor" : "");
        item.innerHTML = '<span class="lesson-check">' + (lp.done ? "✔" : "○") + "</span>" +
          "<span>" + lesson.title + "</span>" + '<span class="lesson-hours">' + (lesson.minutes || "") + "</span>";
        item.addEventListener("click", function () { selectLesson(mod, lesson); setNavMode(false); });
        lessonsHost.appendChild(item);
      });
      host.appendChild(div);
    });
  }

  /* ---------------- lesson panel ---------------- */
  function selectLesson(mod, lesson) {
    state.current = { module: mod, lesson: lesson };
    renderModules(document.getElementById("lesson-search").value);
    renderLesson();
    document.querySelectorAll(".module").forEach(function (x) { x.classList.remove("active"); });
    renderModules(document.getElementById("lesson-search").value);
    var mods = document.querySelectorAll(".module");
    // expand the active module
    Array.prototype.forEach.call(mods, function (el) {
      var title = el.querySelector(".module-title").textContent;
      if (title === mod.title) el.classList.add("active");
    });
    $cmd.focus();
  }

  function renderLesson() {
    if (!state.current) return;
    var mod = state.current.module, lesson = state.current.lesson;
    var lp = lessonProgress(lesson.id);
    document.getElementById("lesson-empty").classList.add("hidden");
    var host = document.getElementById("lesson-content");
    host.classList.remove("hidden");

    var examplesHtml = lesson.examples.map(function (ex, i) {
      return '<div class="example" data-i="' + i + '"><code>' + escapeHTML(ex.cmd) + "</code><span>" + escapeHTML(ex.desc) + "</span></div>";
    }).join("");

    var ledState = lp.done ? "done" : (lp.attempted ? "tried" : "todo");
    var taskHtml =
      '<div class="task ' + (lp.done ? "completed" : "") + '">' +
        '<div class="task-head"><span class="task-led" data-state="' + ledState + '"></span><span class="task-badge">Task</span>' +
        '<span class="task-status ' + (lp.done ? "ok" : "") + '">' + (lp.done ? "✔ Completed" : "Not done") + "</span></div>" +
        '<div class="task-prompt">' + escapeHTML(lesson.task.prompt) + "</div>" +
        '<div id="task-feedback" class="task-feedback"></div>' +
        (lp.done ? "" :
          '<div class="task-actions">' +
          '<button class="btn" id="btn-hint">Hint</button>' +
          '<button class="btn" id="btn-solution">Show solution</button>' +
          "</div>" +
          '<div id="hint-box" class="solution-box" style="display:none">' + escapeHTML(lesson.task.hint) + "</div>" +
          '<div id="solution-box" class="solution-box" style="display:none">' + escapeHTML(lesson.task.solution) + "</div>"
        ) +
      "</div>" +
      '<div class="next-row"><button class="btn" id="btn-next">Next lesson →</button></div>';

    host.innerHTML =
      '<div class="crumb"><span class="crumb-glyph">' + escapeHTML(moduleGlyph(mod)) + "</span>" + escapeHTML(mod.title) + "</div>" +
      '<h2 class="lesson-title">' + lesson.title + "</h2>" +
      '<div class="objective">◆ ' + escapeHTML(lesson.objective) + "</div>" +
      '<div class="theory">' + formatTheory(lesson.theory) + "</div>" +
      '<div class="section-label">Examples (click to use)</div>' +
      '<div class="examples">' + examplesHtml + "</div>" +
      '<div class="section-label">Your task</div>' +
      taskHtml;

    host.querySelectorAll(".example").forEach(function (el) {
      el.addEventListener("click", function () {
        $cmd.value = lesson.examples[+el.getAttribute("data-i")].cmd;
        $cmd.focus();
        moveCaretEnd($cmd);
      });
    });
    var hintBtn = document.getElementById("btn-hint");
    if (hintBtn) hintBtn.addEventListener("click", function () {
      lp.hint = true; saveProgress();
      document.getElementById("hint-box").style.display = "block";
      hintBtn.disabled = true;
    });
    var solBtn = document.getElementById("btn-solution");
    if (solBtn) solBtn.addEventListener("click", function () {
      lp.sol = true; saveProgress();
      document.getElementById("solution-box").style.display = "block";
      solBtn.disabled = true;
    });
    document.getElementById("btn-next").addEventListener("click", nextLesson);
  }

  function formatTheory(text) {
    var escaped = escapeHTML(text);
    escaped = escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    escaped = escaped.replace(/`([^`]+)`/g, "<code>$1</code>");
    return escaped;
  }

  function nextLesson() {
    var mod = state.current.module, lesson = state.current.lesson;
    var li = mod.lessons.indexOf(lesson);
    if (li < mod.lessons.length - 1) return selectLesson(mod, mod.lessons[li + 1]);
    var mi = CURRICULUM.indexOf(mod);
    if (mi < CURRICULUM.length - 1) return selectLesson(CURRICULUM[mi + 1], CURRICULUM[mi + 1].lessons[0]);
  }

  function prevLesson() {
    var mod = state.current.module, lesson = state.current.lesson;
    var li = mod.lessons.indexOf(lesson);
    if (li > 0) return selectLesson(mod, mod.lessons[li - 1]);
    var mi = CURRICULUM.indexOf(mod);
    if (mi > 0) { var pm = CURRICULUM[mi - 1]; return selectLesson(pm, pm.lessons[pm.lessons.length - 1]); }
  }

  /* ---------------- toast ---------------- */
  var toastTimer;
  function toast(msg) {
    var t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.add("hidden"); }, 2600);
  }

  /* ============================ keyboard engine ============================ */
  var $overlay, $palette, $paletteInput, $paletteList, $help, $modeIndicator, $statusHint;
  var ui = { navMode: false, navIndex: 0, paletteOpen: false, helpOpen: false };

  function buildFlat() {
    state.flat = [];
    CURRICULUM.forEach(function (mod) {
      mod.lessons.forEach(function (lesson) { state.flat.push({ module: mod, lesson: lesson }); });
    });
  }
  function flatIndexOfCurrent() {
    if (!state.current) return 0;
    for (var i = 0; i < state.flat.length; i++) if (state.flat[i].lesson.id === state.current.lesson.id) return i;
    return 0;
  }
  function setModeIndicator(text, nav) {
    $modeIndicator.textContent = text;
  }
  function setStatusHint(html) { $statusHint.innerHTML = html; }

  function refreshNav() {
    if (!ui.navMode) return;
    var mod = state.flat[ui.navIndex].module;
    state.current = { module: mod, lesson: state.flat[ui.navIndex].lesson };
    renderModules(document.getElementById("lesson-search").value);
    renderLesson();
    var el = document.querySelector(".lesson-item.nav-cursor");
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
  }
  function setNavMode(on) {
    ui.navMode = !!on;
    document.body.classList.toggle("nav-mode", ui.navMode);
    if (ui.navMode) {
      ui.navIndex = flatIndexOfCurrent();
      closeOverlay();
      $cmd.blur();
      setModeIndicator("NAV", true);
      setStatusHint('h/j/k/l or arrows move · Enter open · 1-9 load example · i or Esc back to terminal · ? help');
      refreshNav();
    } else {
      setModeIndicator("TERMINAL", false);
      setStatusHint('Type a command. Press <span class="key">Esc</span> for navigation mode.');
      $cmd.focus();
      renderModules(document.getElementById("lesson-search").value);
    }
  }
  function moveNav(delta) {
    ui.navIndex = Math.max(0, Math.min(state.flat.length - 1, ui.navIndex + delta));
    refreshNav();
  }
  function moveModule(dir) {
    var cur = state.flat[ui.navIndex].module;
    var mi = CURRICULUM.indexOf(cur);
    var target = CURRICULUM[mi + dir];
    if (!target) return;
    for (var i = 0; i < state.flat.length; i++) {
      if (state.flat[i].module === target) { ui.navIndex = i; break; }
    }
    refreshNav();
  }
  function openNavSelection() {
    var item = state.flat[ui.navIndex];
    selectLesson(item.module, item.lesson);
    setNavMode(false);
  }
  function loadExample(n) {
    var lesson = state.current && state.current.lesson;
    if (!lesson || !lesson.examples[n - 1]) return;
    setNavMode(false);
    $cmd.value = lesson.examples[n - 1].cmd;
    $cmd.focus();
    moveCaretEnd($cmd);
  }
  function revealHint() {
    var b = document.getElementById("btn-hint");
    if (b && !b.disabled) { b.click(); toast("Hint revealed"); }
    else toast("No hint available for this task");
  }
  function revealSolution() {
    var b = document.getElementById("btn-solution");
    if (b && !b.disabled) { b.click(); toast("Solution revealed"); }
    else toast("No solution available for this task");
  }

  /* ---------------- overlay: palette + help ---------------- */
  function closeOverlay() {
    ui.paletteOpen = false; ui.helpOpen = false;
    $overlay.classList.add("hidden");
    $palette.classList.add("hidden");
    $help.classList.add("hidden");
    if (!ui.navMode) $cmd.focus();
  }
  function openHelp() {
    ui.paletteOpen = false; ui.helpOpen = true;
    $overlay.classList.remove("hidden");
    $palette.classList.add("hidden");
    $help.classList.remove("hidden");
    setStatusHint('Press <span class="key">Esc</span> to close help.');
  }
  function paletteItems() {
    var items = [
      { kind: "action", icon: "→", title: "Next lesson", action: nextLesson },
      { kind: "action", icon: "←", title: "Previous lesson", action: prevLesson },
      { kind: "action", icon: "?", title: "Show hint for current task", action: revealHint },
      { kind: "action", icon: "#", title: "Show solution for current task", action: revealSolution },
      { kind: "action", icon: "01", title: "Navigation mode", action: function () { closeOverlay(); setNavMode(true); } },
      { kind: "action", icon: "◐", title: "Toggle light / dark theme", action: toggleTheme },
      { kind: "action", icon: "⎋", title: "Log out", action: function () { logout(); } },
      { kind: "action", icon: "↻", title: "Reset machine (factory: clears all incl. Total cmds)", action: function () { resetMachineFactory(); } },
      { kind: "action", icon: "×", title: "Reset progress (keeps Total cmds)", action: function () { resetProgress(); } },
      { kind: "action", icon: "λ", title: "Browse pro tips (" + (window.TIPS ? window.TIPS.length : 0) + ")", action: function () { closeOverlay(); window.openTips && window.openTips(); } },
      { kind: "action", icon: "~", title: "Random pro tip", action: function () { closeOverlay(); window.openRandomTip && window.openRandomTip(); } },
      { kind: "action", icon: "?", title: "Keyboard shortcuts", action: openHelp }
    ];
    CURRICULUM.forEach(function (mod) {
      var glyph = moduleGlyph(mod);
      mod.lessons.forEach(function (lesson) {
        items.push({
          kind: "lesson", icon: glyph, title: lesson.title, sub: mod.title,
          module: mod, lesson: lesson,
          action: function () { closeOverlay(); selectLesson(mod, lesson); }
        });
      });
    });
    return items;
  }
  function openPalette() {
    ui.paletteOpen = true; ui.helpOpen = false;
    $overlay.classList.remove("hidden");
    $help.classList.add("hidden");
    $palette.classList.remove("hidden");
    $paletteInput.value = "";
    renderPalette("");
    $paletteInput.focus();
    setStatusHint('Type to filter · <span class="key">↑</span>/<span class="key">↓</span> move · <span class="key">Enter</span> open · <span class="key">Esc</span> close');
  }
  function setPaletteHint(isDefaultNextLesson) {
    var el = document.querySelector(".palette-hint");
    if (!el) return;
    el.textContent = isDefaultNextLesson
      ? "Enter runs: Next lesson · ↑↓ move · Esc close"
      : "↑↓ move · Enter open · Esc close";
  }
  function renderPalette(filter) {
    var term = (filter || "").toLowerCase().trim();
    var all = paletteItems();
    state.paletteItems = all.filter(function (it) {
      if (!term) return true;
      var hay = (it.title + " " + (it.sub || "") + " " + (it.kind || "")).toLowerCase();
      return term.split(/\s+/).every(function (t) { return hay.indexOf(t) !== -1; });
    }).slice(0, 200);
    if (state.paletteItems.length === 0) {
      $paletteList.innerHTML = '<div class="palette-empty">No matches for “' + escapeHTML(filter) + '”</div>';
      state.paletteIndex = 0;
      setPaletteHint(false);
      return;
    }
    state.paletteIndex = 0;
    setPaletteHint(!term);
    $paletteList.innerHTML = state.paletteItems.map(function (it, i) {
      return '<div class="palette-item' + (i === 0 ? " active is-default" : "") + '" data-i="' + i + '">' +
        '<span class="pi-icon">' + escapeHTML(it.icon) + '</span>' +
        '<span class="pi-title">' + escapeHTML(it.title) + "</span>" +
        (it.sub ? '<span class="pi-sub">' + escapeHTML(it.sub) + "</span>" : "") +
        '<span class="pi-kind">' + it.kind + "</span></div>";
    }).join("");
    Array.prototype.forEach.call($paletteList.querySelectorAll(".palette-item"), function (el) {
      el.addEventListener("mouseenter", function () { setPaletteIndex(+el.getAttribute("data-i")); });
      el.addEventListener("click", function () { state.paletteIndex = +el.getAttribute("data-i"); paletteRun(); });
    });
  }
  function setPaletteIndex(i) {
    state.paletteIndex = i;
    Array.prototype.forEach.call($paletteList.querySelectorAll(".palette-item"), function (el, idx) {
      el.classList.toggle("active", idx === i);
    });
    var active = $paletteList.querySelector(".palette-item.active");
    if (active && active.scrollIntoView) active.scrollIntoView({ block: "nearest" });
  }
  function paletteMove(d) {
    if (!state.paletteItems.length) return;
    var i = (state.paletteIndex + d + state.paletteItems.length) % state.paletteItems.length;
    setPaletteIndex(i);
  }
  function paletteRun() {
    var it = state.paletteItems[state.paletteIndex];
    if (!it) return;
    var action = it.action;
    closeOverlay();
    action();
  }

  /* ---------------- global key handling ---------------- */
  function onGlobalKey(e) {
    var k = e.key;
    var cmdMod = e.ctrlKey || e.metaKey;
    if (window.__LM_OVERLAY__) return; // tips (or another overlay) owns the keyboard

    // palette
    if (ui.paletteOpen) {
      if (k === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); closeOverlay(); return; }
      if (k === "ArrowDown") { e.preventDefault(); e.stopImmediatePropagation(); paletteMove(1); return; }
      if (k === "ArrowUp") { e.preventDefault(); e.stopImmediatePropagation(); paletteMove(-1); return; }
      if (k === "Enter") { e.preventDefault(); e.stopImmediatePropagation(); paletteRun(); return; }
      return; // allow typing into the palette input
    }
    // help
    if (ui.helpOpen) {
      if (k === "Escape" || k === "Enter" || k === "?" || k === "F1") { e.preventDefault(); closeOverlay(); return; }
      return;
    }

    // global accelerators
    if (cmdMod && e.shiftKey && (k === "d" || k === "D")) { e.preventDefault(); toggleTheme(); return; }
    if (cmdMod && (k === "t" || k === "T")) { e.preventDefault(); window.openTips && window.openTips(); return; }
    if (cmdMod && (k === "k" || k === "K")) { e.preventDefault(); openPalette(); return; }
    if (cmdMod && k === "Enter") { e.preventDefault(); nextLesson(); return; }
    if (cmdMod && (k === "h" || k === "H")) { e.preventDefault(); revealHint(); return; }
    if (cmdMod && (k === "g" || k === "G")) { e.preventDefault(); revealSolution(); return; }
    if (e.altKey && k === "ArrowDown") { e.preventDefault(); nextLesson(); return; }
    if (e.altKey && k === "ArrowUp") { e.preventDefault(); prevLesson(); return; }
    if (k === "F1") { e.preventDefault(); openHelp(); return; }
    if (k === "?" && !ui.navMode && document.activeElement === $cmd && $cmd.value === "") { e.preventDefault(); openHelp(); return; }

    // navigation mode
    if (ui.navMode) {
      if (k === "j" || k === "ArrowDown") { e.preventDefault(); moveNav(1); return; }
      if (k === "k" || k === "ArrowUp") { e.preventDefault(); moveNav(-1); return; }
      if (k === "h" || k === "ArrowLeft") { e.preventDefault(); moveModule(-1); return; }
      if (k === "l" || k === "ArrowRight") { e.preventDefault(); moveModule(1); return; }
      if (k === "g" || k === "Home") { e.preventDefault(); ui.navIndex = 0; refreshNav(); return; }
      if (k === "G" || k === "End") { e.preventDefault(); ui.navIndex = state.flat.length - 1; refreshNav(); return; }
      if (k === "Enter") { e.preventDefault(); openNavSelection(); return; }
      if (k === "Escape" || k === "i" || k === "q") { e.preventDefault(); setNavMode(false); return; }
      if (k === "?") { e.preventDefault(); openHelp(); return; }
      if (/^[1-9]$/.test(k)) { e.preventDefault(); loadExample(parseInt(k, 10)); return; }
      return;
    }

    // Escape enters navigation mode from the terminal
    if (k === "Escape" && document.activeElement === $cmd) { e.preventDefault(); setNavMode(true); return; }

    // auto-refocus: any printable keystroke returns focus to the terminal
    var tag = (document.activeElement && document.activeElement.tagName) || "";
    if (tag !== "INPUT" && tag !== "TEXTAREA" && k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      $cmd.focus();
      $cmd.value += k;
      moveCaretEnd($cmd);
    }
  }

  /* ============================ keyboard engine ============================ */

  /* ---------------- machine reset (v2 semantics) ---------------- */
  function resetMachine() {
    state.machine = Machine.createMachine();
    state.shell.reset(state.machine);
    $out.innerHTML = "";
    printBoot();
    print(welcomeText(), "sys");
    setPrompt();
    toast("Machine reset to a clean Ubuntu server");
  }

  function logout() {
    // Wait for the cookie-clearing POST before leaving: navigating instantly
    // can abort it and leave the session alive.
    var done = false;
    function go() { if (!done) { done = true; window.location.href = "/"; } }
    try {
      fetch("/api/logout", { method: "POST", keepalive: true }).then(go, go);
      setTimeout(go, 1500);
    } catch (e) { go(); }
  }

  // Factory reset: machine + EVERYTHING including Total cmds (palette/double-confirm path).
  function resetMachineFactory() {
    var typed = window.prompt("Factory reset? This clears EVERYTHING including Total cmds. Type RESET to confirm.");
    if (typed !== "RESET") { toast("Machine reset cancelled"); return; }
    state.machine = Machine.createMachine();
    state.shell.reset(state.machine);
    state.progress = defaultProgress();
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    $out.innerHTML = "";
    printBoot();
    print(welcomeText(), "sys");
    setPrompt();
    saveProgress(); renderStats(); renderModules(); renderLesson();
    toast("Machine factory-reset — everything cleared");
  }

  function resetProgress() {
    if (!confirm("Erase XP, completed tasks and study time? Lifetime Total cmds is kept.")) return;
    var keep = state.progress.totalCommands || 0;
    state.progress = defaultProgress();
    state.progress.totalCommands = keep;
    saveProgress(); renderStats(); renderModules(); renderLesson();
    toast("Progress reset — lifetime commands kept (" + keep + ")");
  }

  function welcomeText() {
    return [
      "Linux Mastery — simulated Ubuntu Server 22.04",
      "Logged in as sam@ubuntu-lab. Type `help` for commands.",
      "This is a SAFE simulation: nothing on your real computer changes.",
      ""
    ].join("\n");
  }

  /* ---------------- init ---------------- */
  function countTasks() {
    var n = 0;
    CURRICULUM.forEach(function (m) { n += m.lessons.length; });
    return n;
  }

  function init() {
    $out = document.getElementById("output");
    $cmd = document.getElementById("cmd");
    $prompt = document.getElementById("prompt");
    $cursor = document.getElementById("block-cursor");
    $term = document.getElementById("terminal");
    $termTitle = document.getElementById("term-title");
    $overlay = document.getElementById("overlay");
    $palette = document.getElementById("palette");
    $paletteInput = document.getElementById("palette-input");
    $paletteList = document.getElementById("palette-list");
    $help = document.getElementById("help");
    $modeIndicator = document.getElementById("mode-indicator");
    $statusHint = document.getElementById("status-hint");
    state.totalTasks = countTasks();
    buildFlat();

    state.machine = Machine.createMachine();
    state.shell = new Shell(state.machine);
    state.histIndex = state.machine.history.length;

    bindTerminal();
    refreshThemeButton();
    measureCharW();
    window.addEventListener("resize", measureCharW);

    document.addEventListener("keydown", onGlobalKey, true);
    $paletteInput.addEventListener("input", function () { renderPalette($paletteInput.value); });
    $overlay.addEventListener("mousedown", function (e) { if (e.target === $overlay) closeOverlay(); });

    document.getElementById("btn-theme").addEventListener("click", toggleTheme);
    var tipsBtn = document.getElementById("btn-tips");
    if (tipsBtn) tipsBtn.addEventListener("click", function () { window.openTips && window.openTips(); });
    window.__lmToast = toast;

    document.getElementById("btn-reset-machine").addEventListener("click", function () {
      resetMachineFactory();
    });
    document.getElementById("btn-reset-progress").addEventListener("click", resetProgress);
    var logoutBtn = document.getElementById("btn-logout");
    if (logoutBtn) logoutBtn.addEventListener("click", logout);
    var searchEl = document.getElementById("lesson-search");
    searchEl.addEventListener("input", function (e) {
      renderModules(e.target.value);
    });
    // Esc in search: clear filter, stay keyboard-driven, back to terminal.
    searchEl.addEventListener("keydown", function (e) {
      e.stopPropagation();
      if (e.key === "Escape") {
        e.preventDefault();
        searchEl.value = "";
        renderModules("");
        document.getElementById("cmd").focus();
      }
    });

    loadProgress().then(function () {
      renderStats(); renderTime(); renderModules();
      printBoot();
      print(welcomeText(), "sys");
      setPrompt();
      selectLesson(CURRICULUM[0], CURRICULUM[0].lessons[0]);
      $cmd.focus();
      updateBlockCursor();
      var deep = (location.hash || "").replace("#", "");
      if (deep === "palette") openPalette();
      else if (deep === "help") openHelp();
      else if (deep === "tips") window.openTips && window.openTips();
      else if (deep === "tips-random") window.openRandomTip && window.openRandomTip();
    });

    setInterval(function () {
      if (document.hidden) return;
      if (Date.now() - state.lastInput > 120000) return; // idle 2 min
      state.progress.activeSeconds = (state.progress.activeSeconds || 0) + 1;
      if (state.progress.activeSeconds % 10 === 0) saveProgress();
      renderTime();
    }, 1000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
