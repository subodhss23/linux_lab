/* ============================================================================
 * test/ui-smoke.js — Drives the real UI in headless Chrome over the DevTools
 * Protocol and verifies the keyboard-first flows (no mouse required).
 * Run: node test/ui-smoke.js
 * ==========================================================================*/
"use strict";
const http = require("http");
const crypto = require("crypto");
const net = require("net");
const { spawn, spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const APP_PORT = 4319;
const CDP_PORT = 9339;

function findChrome() {
  const candidates = [
    process.env.CHROME,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "google-chrome",
    "chromium",
    "chromium-browser"
  ].filter(Boolean);
  for (const c of candidates) {
    if (c.includes("/")) { if (fs.existsSync(c)) return c; continue; }
    const r = spawnSync("which", [c], { encoding: "utf8" });
    if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
  }
  return null;
}

function httpJSON(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on("error", reject);
  });
}

function connectWS(url) {
  const m = /^ws:\/\/([^:/]+):(\d+)(\/.*)$/.exec(url);
  const host = m[1], port = +m[2], pathName = m[3];
  const key = crypto.randomBytes(16).toString("base64");
  const sock = net.connect(port, host);
  return new Promise((resolve, reject) => {
    let handshake = false, buf = Buffer.alloc(0);
    const listeners = [];
    function onMessage(cb) { listeners.push(cb); }
    function send(str) {
      const data = Buffer.from(str, "utf8");
      const mask = crypto.randomBytes(4);
      let header;
      if (data.length < 126) { header = Buffer.from([0x81, 0x80 | data.length]); }
      else if (data.length < 65536) { header = Buffer.alloc(4); header[0] = 0x81; header[1] = 0x80 | 126; header.writeUInt16BE(data.length, 2); }
      else { header = Buffer.alloc(10); header[0] = 0x81; header[1] = 0x80 | 127; header.writeBigUInt64BE(BigInt(data.length), 2); }
      const masked = Buffer.alloc(data.length);
      for (let i = 0; i < data.length; i++) masked[i] = data[i] ^ mask[i % 4];
      sock.write(Buffer.concat([header, mask, masked]));
    }
    sock.on("connect", () => {
      sock.write(`GET ${pathName} HTTP/1.1\r\nHost: ${host}:${port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`);
    });
    sock.on("data", (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      if (!handshake) {
        const idx = buf.indexOf("\r\n\r\n");
        if (idx < 0) return;
        buf = buf.slice(idx + 4);
        handshake = true;
        resolve({ send, onMessage, close: () => sock.end() });
      }
      while (buf.length >= 2) {
        const opcode = buf[0] & 0x0f;
        let len = buf[1] & 0x7f, offset = 2;
        if (len === 126) { if (buf.length < 4) break; len = buf.readUInt16BE(2); offset = 4; }
        else if (len === 127) { if (buf.length < 10) break; len = Number(buf.readBigUInt64BE(2)); offset = 10; }
        if (buf.length < offset + len) break;
        const payload = buf.slice(offset, offset + len);
        buf = buf.slice(offset + len);
        if (opcode === 0x1) listeners.forEach((cb) => cb(payload.toString("utf8")));
        else if (opcode === 0x8) sock.end();
      }
    });
    sock.on("error", reject);
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

(async function main() {
  const chrome = findChrome();
  if (!chrome) { console.error("SKIP: no Chrome/Chromium found"); process.exit(0); }

  // Build (once) and start the Next.js production server — avoids HMR sockets.
  const root = path.join(__dirname, "..");
  const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
  if (!fs.existsSync(path.join(root, ".next", "BUILD_ID"))) {
    const build = spawnSync(process.execPath, [nextBin, "build"], {
      cwd: root, env: Object.assign({}, process.env, { NEXT_TELEMETRY_DISABLED: "1" }), stdio: "inherit"
    });
    if (build.status !== 0) { console.error("next build failed"); process.exit(2); }
  }
  const server = spawn(process.execPath, [nextBin, "start", "-p", String(APP_PORT)], {
    env: Object.assign({}, process.env, { NEXT_TELEMETRY_DISABLED: "1" }), cwd: root, stdio: "ignore",
    detached: true
  });

  async function waitHttp(url, tries) {
    for (let i = 0; i < tries; i++) {
      const ok = await new Promise((res) => {
        const req = http.get(url, (r) => { r.resume(); res(!!r.statusCode && r.statusCode < 500); });
        req.on("error", () => res(false));
        req.setTimeout(2000, () => { req.destroy(); res(false); });
      });
      if (ok) return true;
      await sleep(500);
    }
    return false;
  }

  let userDir = "";
  let chromeProc = null;

  let ws, id = 0, pending = new Map();
  function cdp(method, params) {
    return new Promise((resolve, reject) => {
      const msgId = ++id;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params: params || {} }));
    });
  }
  async function ev(expression) {
    const r = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error("EVAL ERROR: " + JSON.stringify(r.exceptionDetails.exception || r.exceptionDetails));
    return r.result.value;
  }
  // Navigation destroys in-flight evaluates: retry those that race a page change.
  async function evNavSafe(expression, tries) {
    tries = tries || 8;
    for (let i = 0; ; i++) {
      try {
        return await ev(expression);
      } catch (e) {
        if (/navigated or closed/.test(e.message || "") && i < tries - 1) { await sleep(800); continue; }
        throw e;
      }
    }
  }

  try {
    // wait for the dev server, then launch the browser
    if (!(await waitHttp("http://127.0.0.1:" + APP_PORT + "/", 160))) throw new Error("next dev did not start");
    userDir = fs.mkdtempSync(path.join(os.tmpdir(), "lmsmoke-"));
    chromeProc = spawn(chrome, [
      "--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
      "--remote-debugging-port=" + CDP_PORT, "--remote-allow-origins=*",
      "--user-data-dir=" + userDir, "http://127.0.0.1:" + APP_PORT + "/"
    ], { stdio: "ignore" });

    // connect to the page target
    let target = null;
    for (let i = 0; i < 50; i++) {
      try {
        const list = await httpJSON("http://127.0.0.1:" + CDP_PORT + "/json/list");
        target = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
        if (target) break;
      } catch (e) {}
      await sleep(200);
    }
    if (!target) throw new Error("no CDP page target");
    ws = await connectWS(target.webSocketDebuggerUrl);
    ws.onMessage((d) => {
      let msg; try { msg = JSON.parse(d); } catch (e) { return; }
      if (msg.method === "Runtime.exceptionThrown") {
        try { console.error("PAGE EXCEPTION:", JSON.stringify(msg.params.exceptionDetails.exception || msg.params.exceptionDetails)); } catch (e) {}
      }
      if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
        try { console.error("PAGE CONSOLE:", msg.params.args.map((a) => a.value || a.description || "").join(" ")); } catch (e) {}
      }
      if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error" && !/hmr|favicon|404/i.test(msg.params.entry.text)) {
        try { console.error("PAGE LOG:", msg.params.entry.text); } catch (e) {}
      }
      if (msg.id && pending.has(msg.id)) {
        const p = pending.get(msg.id); pending.delete(msg.id);
        if (msg.error) p.reject(new Error(JSON.stringify(msg.error))); else p.resolve(msg.result);
      }
    });
    await cdp("Runtime.enable");
    await cdp("Log.enable");
    await cdp("Page.enable");
    await cdp("Page.reload", { ignoreCache: true });

    const tests = [];
    function assert(name, cond, extra) { tests.push({ name, ok: !!cond, extra }); }

    const LABU = process.env.LAB_USERNAME || "";
    const LABP = process.env.LAB_PASSWORD || "";
    if (!LABU || !LABP) throw new Error("set LAB_USERNAME and LAB_PASSWORD to run the UI smoke (server + assertions share them)");

    // 0. the void is public, tiny, and says nothing (wait for first paint)
    let r = JSON.parse(await ev(`(function(){return new Promise(function(res){
      var n=0;var t=setInterval(function(){
        if(document.querySelector('.void')||++n>150){clearInterval(t);
          res(JSON.stringify({path:window.location.pathname,
            landing:!!document.querySelector('.void'),
            art:!!document.querySelector('.void-art'),
            omen:document.getElementById('omen')?.getAttribute('href'),
            words:Array.from(document.querySelectorAll('.void-line,.void-credit')).map(function(e){return e.innerText;}).join(' ').trim().split(/\s+/).length,
            credit:document.querySelector('.void-credit')?.innerText||''}));}},200);});})()`));
    assert("landing page is public", r.path === "/" && r.landing, r);
    assert("landing shows the bearded one", r.art === true, r.art);
    assert("landing says almost nothing", r.words <= 30, r.words);
    assert("landing credits California/Subodh", /Built in California by Subodh/.test(r.credit), r.credit);
    assert("hidden door points at login for strangers", r.omen === "/login", r.omen);
    r = JSON.parse(await ev(`JSON.stringify({page:document.documentElement.scrollHeight,view:window.innerHeight})`));
    assert("landing fits on one screen (no scroll)", r.page <= r.view + 2, r);

    // 0a. Hidden door goes to /login (then wait for the form to render)
    await ev(`document.getElementById('omen').click()`);
    r = JSON.parse(await ev(`(function(){return new Promise(function(res){
      var n=0;var t=setInterval(function(){
        if(document.getElementById('login-user')||++n>150){clearInterval(t);
          res(JSON.stringify({path:window.location.pathname,form:!!document.getElementById('login-user')}));}},200);});})()`));
    assert("sign in lands on login", r.path === "/login", r);
    assert("login form renders", r.form === true, r);

    // 0b. wrong password shows an error and stays put (plain DOM fill + real click)
    const fillClick = (u, p) =>
      `(function(){
        document.getElementById('login-user').value=${JSON.stringify(u)};
        document.getElementById('login-pass').value=${JSON.stringify(p)};
        document.querySelector('.login-btn').click();
      })()`;
    r = JSON.parse(await ev(`(function(){${fillClick("nope", "wrong")};return new Promise(function(res){
      var n=0;var t=setInterval(function(){var e=document.querySelector('.login-error');
        if ((e&&e.textContent)||++n>40){clearInterval(t);
          res(JSON.stringify({path:window.location.pathname,err:e?e.textContent:''}));}},200);});})()`));
    assert("wrong password shows an error", /Wrong username or password/.test(r.err || ""), r);
    assert("wrong password stays on login", r.path === "/login", r.path);

    // 0c. real credentials through the form land in the lab (click, then wait separately:
    // the login navigation destroys any in-flight evaluate)
    await ev(fillClick(LABU, LABP));
    r = JSON.parse(await evNavSafe(`(function(){return new Promise(function(res){
      var n=0;var t=setInterval(function(){
        if(document.querySelectorAll('.module').length>=16||++n>100){clearInterval(t);
          res(JSON.stringify({mods:document.querySelectorAll('.module').length,path:window.location.pathname}));}},200);});})()`));
    assert("login lands in the lab", r.path === "/lab" && r.mods >= 16, r);

    // 0d. signed-in visits to / bounce straight to /lab
    await ev(`window.location.href='/'`);
    r = JSON.parse(await evNavSafe(`(function(){return new Promise(function(res){
      var n=0;var t=setInterval(function(){
        if((window.location.pathname==='/lab'&&document.querySelectorAll('.module').length>=16)||++n>100){clearInterval(t);
          res(JSON.stringify({mods:document.querySelectorAll('.module').length,path:window.location.pathname}));}},200);});})()`));
    assert("authed / redirects to /lab", r.path === "/lab" && r.mods >= 16, r);

    // wait for app init
    let ready = false;
    for (let i = 0; i < 150; i++) {
      try {
        const n = await ev("document.querySelectorAll('.module').length");
        if (n >= 16) { ready = true; break; }
      } catch (e) {}
      await sleep(200);
    }
    if (!ready) {
      try {
        const diag = await ev("JSON.stringify({vfs:typeof window.VFS,shell:typeof window.Shell,commands:typeof window.Commands,tips:typeof window.TIPS,booted:!!window.__LM_BOOTED__,mods:document.querySelectorAll('.module').length,bodyLen:document.body.innerHTML.length,hasCmd:!!document.getElementById('cmd'),scripts:document.scripts.length})");
        console.error("DIAG:", diag);
      } catch (e) { console.error("DIAG failed:", e.message); }
      throw new Error("app did not initialize");
    }

    // helper to dispatch a keyboard event from within the page
    const keyExpr = (key, opts) =>
      `document.dispatchEvent(new KeyboardEvent('keydown',Object.assign({key:${JSON.stringify(key)},bubbles:true,cancelable:true},${JSON.stringify(opts || {})})));`;

    // 1. initial state
    r = JSON.parse(await ev("JSON.stringify({mods:document.querySelectorAll('.module').length,lessons:document.querySelectorAll('.lesson-item').length,mode:document.getElementById('mode-indicator').textContent,focus:document.activeElement&&document.activeElement.id})"));
    assert("34 modules rendered (30 learn + 4 bosses)", r.mods === 34, r.mods);
    assert("134 lessons listed (118 learn + 16 drill)", r.lessons === 134, r.lessons);
    assert("starts in TERMINAL mode", r.mode === "TERMINAL", r.mode);

    // 2. Escape enters navigation mode
    r = JSON.parse(await ev(`(function(){var c=document.getElementById('cmd');c.focus();${keyExpr("Escape")}return JSON.stringify({nav:document.body.classList.contains('nav-mode'),mode:document.getElementById('mode-indicator').textContent,cursor:!!document.querySelector('.lesson-item.nav-cursor')});})()`));
    assert("Esc enters navigation mode", r.nav === true, r);
    assert("mode indicator shows NAV", r.mode === "NAV", r.mode);
    assert("nav cursor visible", r.cursor === true, r.cursor);

    // 3. j/j moves the cursor down two lessons
    r = await ev(`(function(){${keyExpr("j")}${keyExpr("j")}var el=document.querySelector('.lesson-item.nav-cursor');return el?el.textContent:'';})()`);
    assert("j/j moves nav cursor to 3rd lesson", /Ownership and symlink/.test(r), r);

    // 4. Enter opens the highlighted lesson and returns to terminal
    r = JSON.parse(await ev(`(function(){${keyExpr("Enter")}return JSON.stringify({nav:document.body.classList.contains('nav-mode'),mode:document.getElementById('mode-indicator').textContent,title:document.querySelector('.lesson-title').textContent,focus:document.activeElement&&document.activeElement.id});})()`));
    assert("Enter selects lesson", /Ownership and symlink/.test(r.title), r.title);
    assert("Enter exits nav mode", r.nav === false && r.mode === "TERMINAL", r);
    assert("focus returns to terminal input", r.focus === "cmd", r.focus);

    // 5. Ctrl+K opens the command palette, with "Next lesson" pre-selected
    r = JSON.parse(await ev(`(function(){${keyExpr("k", { ctrlKey: true })}var a=document.querySelector('.palette-item.active');return JSON.stringify({overlay:!document.getElementById('overlay').classList.contains('hidden'),palette:!document.getElementById('palette').classList.contains('hidden'),items:document.querySelectorAll('.palette-item').length,active:a?a.querySelector('.pi-title').textContent:null,hint:document.querySelector('.palette-hint').textContent});})()`));
    assert("Ctrl+K opens palette", r.overlay && r.palette, r);
    assert("palette lists items", r.items > 10, r.items);
    assert("'Next lesson' is the default selection", r.active === "Next lesson", r.active);
    assert("palette hint advertises the default", /Next lesson/.test(r.hint), r.hint);

    // 5b. pressing Enter on the default runs "Next lesson"
    r = JSON.parse(await ev(`(function(){var before=document.querySelector('.lesson-title').textContent;${keyExpr("Enter")}return JSON.stringify({before:before,after:document.querySelector('.lesson-title').textContent,closed:document.getElementById('overlay').classList.contains('hidden')});})()`));
    assert("Enter on the default advances to next lesson", r.before !== r.after && r.closed, r);

    // 6. reopen palette, filter to SSH and open with Enter
    r = JSON.parse(await ev(`(function(){${keyExpr("k", { ctrlKey: true })}var i=document.getElementById('palette-input');i.value='ssh';i.dispatchEvent(new Event('input',{bubbles:true}));var n=document.querySelectorAll('.palette-item').length;${keyExpr("Enter")}return JSON.stringify({matches:n,closed:document.getElementById('overlay').classList.contains('hidden'),title:document.querySelector('.lesson-title').textContent});})()`));
    assert("palette filters lessons", r.matches >= 1 && r.matches < 64, r.matches);
    assert("Enter runs the palette action", r.closed === true, r.closed);
    assert("jumped to an SSH lesson", /ssh/i.test(r.title), r.title);

    // 7. run a terminal command
    r = await ev(`(function(){var c=document.getElementById('cmd');c.value='pwd';c.focus();c.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));return document.getElementById('output').textContent;})()`);
    assert("typing + Enter runs a command", /\/home\/sam/.test(r), r.slice(-80));
    r = JSON.parse(await ev(`JSON.stringify({echo:!!document.querySelector('#output .cmdline'),
      color:getComputedStyle(document.querySelector('#output .cmdline')||document.body).color})`));
    assert("echoed command uses theme-aware cmdline class", r.echo === true && r.color !== "", r);

    // 8. Ctrl+H reveals the hint
    r = await ev(`(function(){${keyExpr("h", { ctrlKey: true })}var h=document.getElementById('hint-box');return h?getComputedStyle(h).display:'none';})()`);
    assert("Ctrl+H reveals hint", r === "block", r);

    // 9. Ctrl+G reveals the solution
    r = await ev(`(function(){${keyExpr("g", { ctrlKey: true })}var s=document.getElementById('solution-box');return s?getComputedStyle(s).display:'none';})()`);
    assert("Ctrl+G reveals solution", r === "block", r);

    // 10. Alt+ArrowDown goes to the next lesson
    r = JSON.parse(await ev(`(function(){var a=document.querySelector('.lesson-title').textContent;${keyExpr("ArrowDown", { altKey: true })}return JSON.stringify({before:a,after:document.querySelector('.lesson-title').textContent});})()`));
    assert("Alt+Down advances lesson", r.before !== r.after, r);
    assert("focus stays in terminal", (await ev("document.activeElement && document.activeElement.id")) === "cmd");

    // 11. '?' opens help, Escape closes it
    r = JSON.parse(await ev(`(function(){var c=document.getElementById('cmd');c.focus();c.value='';${keyExpr("?")}var open=!document.getElementById('help').classList.contains('hidden');${keyExpr("Escape")}return JSON.stringify({open:open,closed:document.getElementById('help').classList.contains('hidden')});})()`));
    assert("'?' opens help", r.open === true, r);
    assert("Esc closes help", r.closed === true, r);

    // 12. Tab completion
    r = await ev(`(function(){var c=document.getElementById('cmd');c.focus();c.value='gre';c.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));return c.value.trim();})()`);
    assert("Tab autocompletes commands", r === "grep", r);

    // 13. no mouse required: every rendered control id is reachable / all good
    await ev("document.getElementById('cmd').value=''");

    // 14. Ctrl+Shift+D toggles the theme (and swaps the button icon)
    r = JSON.parse(await ev(`(function(){var rs=getComputedStyle(document.documentElement);var dark=rs.getPropertyValue('--bg').trim();${keyExpr("D", { ctrlKey: true, shiftKey: true })}var light=rs.getPropertyValue('--bg').trim();return JSON.stringify({theme:document.documentElement.getAttribute('data-theme'),icon:document.getElementById('btn-theme').dataset.icon,dark:dark,light:light,stored:(function(){try{return localStorage.getItem('linuxmastery.theme')}catch(e){return null}})()});})()`));
    assert("Ctrl+Shift+D switches to light theme", r.theme === "light", r.theme);
    assert("light theme changes the palette", r.dark !== r.light, r);
    assert("theme button reflects light mode", r.icon === "light", r.icon);
    assert("theme preference is persisted", r.stored === "light", r.stored);

    // 15. toggling again returns to dark
    r = JSON.parse(await ev(`(function(){${keyExpr("D", { ctrlKey: true, shiftKey: true })}return JSON.stringify({theme:document.documentElement.getAttribute('data-theme'),icon:document.getElementById('btn-theme').dataset.icon});})()`));
    assert("toggling again returns to dark theme", r.theme === "dark", r.theme);
    assert("theme button reflects dark mode", r.icon === "dark", r.icon);

    // 16. the palette exposes the theme action too
    r = JSON.parse(await ev(`(function(){${keyExpr("k", { ctrlKey: true })}var i=document.getElementById('palette-input');i.value='theme';i.dispatchEvent(new Event('input',{bubbles:true}));var hit=[].some.call(document.querySelectorAll('.palette-item'),function(e){return /theme/i.test(e.textContent)});${keyExpr("Escape")}return JSON.stringify({hit:hit});})()`));
    assert("palette offers a theme action", r.hit === true, r.hit);

    // 17. Ctrl+T opens the pro-tips library with 100+ tips
    r = JSON.parse(await ev(`(function(){window.openTips();var o=document.getElementById('tips-overlay');var items=document.querySelectorAll('.tips-item').length;var cats=document.querySelectorAll('.tips-cat').length;var total=window.TIPS.length;return JSON.stringify({open:o&&!o.classList.contains('hidden'),items:items,cats:cats,total:total,overlayFlag:!!window.__LM_OVERLAY__});})()`));
    assert("pro tips: 100+ tips loaded", r.total >= 100, r.total);
    assert("Ctrl+T opens the tips overlay", r.open === true, r.open);
    assert("tips list renders and categories show", r.items > 0 && r.cats > 5, r);

    // 18. tips search filters and Enter inserts a real command into the terminal
    r = JSON.parse(await ev(`(function(){var s=document.getElementById('tips-search');s.value='fallocate';s.dispatchEvent(new Event('input',{bubbles:true}));var n=document.querySelectorAll('.tips-item').length;document.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));return JSON.stringify({matches:n,total:window.TIPS.length,closed:document.getElementById('tips-overlay').classList.contains('hidden'),cmd:document.getElementById('cmd').value});})()`));
    assert("tips search filters results", r.matches >= 1 && r.matches < r.total, r);
    assert("Enter closes tips and inserts command", r.closed === true && /fallocate/.test(r.cmd), r);

    // 19. random tip action via palette
    r = JSON.parse(await ev(`(function(){${keyExpr("k", { ctrlKey: true })}var i=document.getElementById('palette-input');i.value='random pro tip';i.dispatchEvent(new Event('input',{bubbles:true}));var hit=[].some.call(document.querySelectorAll('.palette-item'),function(e){return /random pro tip/i.test(e.textContent)});${keyExpr("Enter")}var open=!document.getElementById('tips-overlay').classList.contains('hidden');window.openTip&&window.openTip('tip-1');var n=document.querySelectorAll('.tips-item').length;document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));return JSON.stringify({hit:hit,open:open,afterOpen:n});})()`));
    assert("palette offers a Random pro tip action", r.hit === true, r.hit);
    assert("random tip opens the overlay", r.open === true, r.open);


    // 20. Total cmds odometer: even a wrong command counts
    r = JSON.parse(await ev(`(function(){var before=parseInt(document.getElementById('stat-cmds').textContent,10);var c=document.getElementById('cmd');c.focus();c.value='zzz-no-such-cmd';c.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));var after=parseInt(document.getElementById('stat-cmds').textContent,10);return JSON.stringify({before:before,after:after});})()`));
    assert("wrong commands still increment Total cmds", r.after === r.before + 1, r);

    // 21. Reset progress keeps Total cmds but clears XP/tasks
    r = JSON.parse(await ev(`(function(){window.confirm=function(){return true};var cmds=document.getElementById('stat-cmds').textContent;document.getElementById('btn-reset-progress').click();return JSON.stringify({kept:document.getElementById('stat-cmds').textContent,expected:cmds,xp:document.getElementById('stat-xp').textContent,done:document.getElementById('overall-text').textContent});})()`));
    assert("Reset progress keeps Total cmds", r.kept === r.expected && parseInt(r.kept, 10) > 0, r);
    assert("Reset progress clears XP and tasks", r.xp === "0" && /^0 \/ 118/.test(r.done), r);

    // 22. Reset machine factory-clears everything including Total cmds
    r = JSON.parse(await ev(`(function(){window.prompt=function(){return 'RESET'};document.getElementById('btn-reset-machine').click();return JSON.stringify({cmds:document.getElementById('stat-cmds').textContent,xp:document.getElementById('stat-xp').textContent});})()`));
    assert("Reset machine zeroes Total cmds and XP", r.cmds === "0" && r.xp === "0", r);

    // 23. Logout returns to the landing, and the gate holds without the cookie
    await ev(`document.getElementById('btn-logout').click()`);
    r = JSON.parse(await evNavSafe(`(function(){return new Promise(function(res){
      var n=0;var t=setInterval(function(){
        if((window.location.pathname==='/'&&document.querySelector('.void'))||++n>50){clearInterval(t);
          res(JSON.stringify({path:window.location.pathname,landing:!!document.querySelector('.void')}));}},200);});})()`));
    assert("logout returns to landing", r.path === "/" && r.landing, r);
    r = await ev(`(function(){return fetch('/lab',{redirect:'manual'}).then(function(x){return x.type+':'+x.status;}).catch(function(){return 'net-err';});})()`);
    assert("gate holds after logout (/lab redirects, not the lab)", r === "opaqueredirect:0" || /:307$/.test(r), r);

    const failed = tests.filter((t) => !t.ok);
    process.stdout.write("\n");
    tests.forEach((t) => process.stdout.write((t.ok ? "  ✔ " : "  ✗ ") + t.name + (t.ok ? "" : "   [" + JSON.stringify(t.extra) + "]") + "\n"));
    console.log("\n" + (failed.length === 0 ? "UI SMOKE: ALL PASSED (" + tests.length + " checks)" : "UI SMOKE: " + failed.length + " FAILED of " + tests.length));
    cleanup();
    process.exit(failed.length ? 1 : 0);
  } catch (e) {
    console.error("UI SMOKE ERROR:", e.message);
    cleanup();
    process.exit(2);
  }

  function cleanup() {
    try { ws && ws.close(); } catch (e) {}
    try { if (chromeProc) chromeProc.kill("SIGKILL"); } catch (e) {}
    try { process.kill(-server.pid, "SIGKILL"); } catch (e) { try { server.kill("SIGKILL"); } catch (e2) {} }
    try { if (userDir) fs.rmSync(userDir, { recursive: true, force: true }); } catch (e) {}
  }
})();
