// The application shell markup. Injected once, then driven imperatively by
// the vanilla engine in public/js/shell-base.js (1/4: layout + metrics + keyboard).
export const MARKUP = `
<div id="app">
  <header class="topbar">
    <div class="brand">
      <span class="logo" aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#lm-grad)" stroke="rgba(126,231,135,.35)" stroke-width="1"/>
          <path d="M12 14.5l5.5 5.5-5.5 5.5" stroke="#7ee787" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M21 26h7" stroke="#7ee787" stroke-width="2.6" stroke-linecap="round"/>
          <defs>
            <linearGradient id="lm-grad" x1="1" y1="1" x2="39" y2="39" gradientUnits="userSpaceOnUse">
              <stop stop-color="#1c2330"/><stop offset="1" stop-color="#0b0d12"/>
            </linearGradient>
          </defs>
        </svg>
      </span>
      <div>
        <div class="brand-title">Linux Mastery</div>
        <div class="brand-sub">Intermediate &amp; advanced Linux, by doing</div>
      </div>
    </div>
    <div class="stats mono-readout" aria-label="Progress metrics">
      <span class="mstat">LVL <b id="stat-level">01</b></span><span class="msep" aria-hidden="true">·</span>
      <span class="mstat">XP <b id="stat-xp">0</b></span><span class="msep" aria-hidden="true">·</span>
      <span class="mstat">DONE <b id="stat-done">0/0</b></span><span class="msep" aria-hidden="true">·</span>
      <span class="mstat">T+ <b id="stat-time">00:00:00</b></span><span class="msep" aria-hidden="true">·</span>
      <span class="mstat">CMD <b id="stat-cmds" title="Lifetime commands entered, right or wrong">0</b></span>
      <div class="xpbar"><div id="stat-xpbar" class="xpbar-fill"></div></div>
    </div>
    <div class="actions">
      <button id="btn-tips" class="btn ghost" title="Browse pro tips (Ctrl+T)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.4.3.6.8.6 1.2h6c0-.4.2-.9.6-1.2A6 6 0 0 0 12 3z"/></svg>
        Pro tips
      </button>
      <button id="btn-theme" class="btn ghost icon" title="Toggle light / dark theme (Ctrl+Shift+D)" aria-label="Toggle light or dark theme"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg></button>
      <button id="btn-reset-machine" class="btn ghost" title="Factory reset: restores the machine AND clears everything including Total cmds">Reset machine</button>
      <button id="btn-reset-progress" class="btn ghost" title="Erase XP and completed tasks (keeps lifetime Total cmds)">Reset progress</button>
      <button id="btn-logout" class="btn ghost" title="Sign out of the lab">Logout</button>
    </div>
  </header>

  <nav class="mobile-tabs" aria-label="Sections">
    <button type="button" class="mobile-tab" data-view="modules">Modules</button>
    <button type="button" class="mobile-tab active" data-view="terminal" aria-selected="true">Terminal</button>
    <button type="button" class="mobile-tab" data-view="guide">Guide</button>
    <button type="button" class="mobile-tab" data-action="help" title="Keyboard shortcuts">Keys</button>
  </nav>

  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-head">
        <input id="lesson-search" class="search" type="search" placeholder="Search modules & tasks…" />
        <div class="overall">
          <div class="overall-label">Curriculum progress</div>
          <div class="overall-track"><div id="overall-fill" class="overall-fill"></div></div>
          <div id="overall-text" class="overall-text">0 / 0 tasks</div>
        </div>
      </div>
      <nav id="modules" class="modules"></nav>
      <div id="tip-teaser" class="tip-teaser"></div>
    </aside>

    <main class="terminal-wrap">
      <div class="term-titlebar">
        <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>
        <span id="term-title" class="term-title">sam@ubuntu-lab: ~</span>
        <span class="term-badge">simulated</span>
      </div>
      <div id="terminal" class="terminal">
        <div id="output" class="output"></div>
        <div id="promptline" class="promptline">
          <span id="prompt" class="prompt"></span>
          <span class="cmd-wrap"><input id="cmd" class="cmd" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" /><span id="block-cursor" aria-hidden="true">▊</span></span>
        </div>
      </div>
      <div class="term-hint">
        <span class="key">Esc</span> navigate ·
        <span class="key">Ctrl</span>+<span class="key">K</span> jump ·
        <span class="key">Ctrl</span>+<span class="key">T</span> tips ·
        <span class="key">Alt</span>+<span class="key">↑</span>/<span class="key">↓</span> lesson ·
        <span class="key">Ctrl</span>+<span class="key">H</span> hint ·
        <span class="key">Ctrl</span>+<span class="key">G</span> solution
      </div>
    </main>

    <aside class="lesson-panel">
      <div id="lesson-empty" class="lesson-empty">
        <h2>Welcome</h2>
        <p>Fully keyboard-driven: press <span class="key">Esc</span> for navigation mode, <span class="key">Ctrl</span>+<span class="key">K</span> to jump to any lesson, or <span class="key">Ctrl</span>+<span class="key">T</span> for pro tips.</p>
        <ul>
          <li>30 modules · 4 acts · Drill Bank boss fights</li>
          <li>Auto-graded, hands-on tasks</li>
          <li>Pro tips from senior engineers</li>
        </ul>
      </div>
      <div id="lesson-content" class="lesson-content hidden"></div>
    </aside>
  </div>

  <footer class="statusbar">
    <span id="mode-indicator" class="mode-badge">TERMINAL</span>
    <span id="status-hint" class="status-hint">Type a command. Press <span class="key">Esc</span> for navigation mode.</span>
    <span class="status-right">mouse-free · <span class="key">Ctrl</span>+<span class="key">T</span> tips</span>
  </footer>
</div>

<div id="overlay" class="overlay hidden">
  <div class="overlay-card">
    <div id="palette" class="palette hidden">
      <div class="palette-head">
        <span class="palette-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m13 3 4 8-4 8"/><path d="M5 3v8h8"/></svg></span>
        <input id="palette-input" class="palette-input" type="text" placeholder="Jump to a lesson, or run an action…" autocomplete="off" spellcheck="false" />
        <span class="palette-hint">↑↓ move · Enter open · Esc close</span>
      </div>
      <div id="palette-list" class="palette-list"></div>
    </div>
    <div id="help" class="help hidden">
      <h2>Keyboard shortcuts</h2>
      <div class="help-grid">
        <div><span class="key">Esc</span></div><div>Enter navigation mode (vim keys: h j k l, g/G)</div>
        <div><span class="key">Ctrl</span>+<span class="key">K</span></div><div>Command palette — jump to any module, lesson or action (default: Next lesson)</div>
        <div><span class="key">Ctrl</span>+<span class="key">T</span></div><div>Pro tips — high-leverage tricks (default: random tip)</div>
        <div><span class="key">Alt</span>+<span class="key">↓</span> / <span class="key">Alt</span>+<span class="key">↑</span></div><div>Next / previous lesson</div>
        <div><span class="key">Ctrl</span>+<span class="key">H</span></div><div>Reveal a hint for the current task</div>
        <div><span class="key">Ctrl</span>+<span class="key">G</span></div><div>Reveal the solution for the current task</div>
        <div><span class="key">Ctrl</span>+<span class="key">Shift</span>+<span class="key">D</span></div><div>Toggle light / dark theme</div>
        <div><span class="key">Ctrl</span>+<span class="key">Enter</span></div><div>Go to the next lesson</div>
        <div><span class="key">Ctrl</span>+<span class="key">L</span></div><div>Clear the terminal</div>
        <div><span class="key">Ctrl</span>+<span class="key">C</span></div><div>Cancel the current input</div>
        <div><span class="key">↑</span> / <span class="key">↓</span></div><div>Command history (in the terminal)</div>
        <div><span class="key">Tab</span></div><div>Autocomplete commands and paths</div>
        <div><span class="key">?</span></div><div>Show this help (when the input is empty)</div>
      </div>
      <div class="help-foot">Press <span class="key">Esc</span> or <span class="key">Enter</span> to close.</div>
    </div>
  </div>
</div>

<div id="toast" class="toast hidden"></div>
`;
