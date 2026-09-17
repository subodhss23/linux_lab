# Linux Mastery

A keyboard-first, in-browser Ubuntu lab. Learn intermediate and advanced Linux by doing: 39 modules (30 + 9 reviews), 300 hands-on labs, auto-graded tasks, and pro tips — all in a simulated terminal. Nothing on your real machine changes.

## Features

- Simulated Ubuntu Server 22.04 terminal (filesystem, pipes, redirects, `sudo`, `ssh`, `docker`, `systemd`, networking, and more)
- 300 auto-graded tasks with hints, solutions, XP, levels, and progress tracking
- Fully keyboard-driven: navigation mode, command palette (`Ctrl+K`), pro tips (`Ctrl+T`)
- Dark-first phosphor-terminal UI with light paper fallback
- Single-login gate (one shared username/password) + per-browser progress

## Stack

Next.js 16 + React 19. The simulator engine is vanilla JS under `public/js/` (filesystem, machine state, shell, curriculum), driven imperatively from `components/Simulator.tsx`.

## Quickstart

```bash
npm install
cp .env.example .env   # put YOUR username/password in .env (never commit it)
npm run dev            # http://localhost:3000
```

Production:

```bash
npm run build && npm start
```

## Auth

Set `LAB_USERNAME` and `LAB_PASSWORD` in `.env` locally. On Vercel: Project → Settings → Environment Variables → add the same two → redeploy. Progress lives in each browser's `localStorage`; `/api/progress` is an optional no-op sync.

## Scripts

- `npm run dev` — local dev server
- `npm run build` / `npm start` — production build / serve
- `npm test` — simulator + all 300 lesson solutions auto-solved (89 checks)
- `npm run test:ui` — headless-Chrome smoke test

## Structure

- `app/` — routes (`/`, `/login`, `/lab`), API (`login`, `logout`, `progress`), global CSS
- `components/Simulator.tsx` — mounts the lab shell
- `lib/markup.ts` — lab shell markup
- `public/js/` — simulator engine + curriculum + tips
- `test/` — Node harness (`run.js`) + UI smoke test
