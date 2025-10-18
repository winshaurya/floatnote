# Desktop Notes

Desktop Notes is a frameless Electron overlay for pinning translucent sticky notes and checklists directly on top of every application. The controller stays compact—mirroring the legacy Cheating Daddy square—and each note floats as an always-on-top window you can long-press anywhere to reposition.

## Features
# Fnote — Floatable Notes, Minimal & Powerful 🚀

![Fnote hero](assets/hero.png)

Fnote is a tiny, private, local-first sticky-note overlay that sits above your desktop apps — translucency, color, and zero friction. Think of it as a Post‑it for the 21st century: instant, private, and always where you need it.

--------------------------------------------------------------------------------

## Quick start — run the app now (Windows PowerShell)

Clone, install, and run locally:

```powershell
# 1. Clone or make sure you're in the project folder
cd C:\path\to\fnote

# 2. Install dependencies
npm install

# 3. Run (development)
npm start

# 4. Build (package/makers are configured via Electron Forge)
npm run make
```

Notes:
- Use PowerShell (Windows) or your preferred shell on macOS/Linux (some commands vary).
- The app uses Electron; you may need to accept one-time prompts while installing native packages like better-sqlite3.

--------------------------------------------------------------------------------

## What is Fnote? — product in one sentence

Fnote is a lightweight, always-on-top, translucent sticky-note utility for desktop power users who want frictionless note capture and a platform for tiny, delightful widgets.

## Why Fnote — the opportunity

- People use notes continuously: quick reminders, code snippets, meeting times, and ephemeral ideas. Current ecosystems scatter notes across cloud apps and passive widgets; the occasional note needs to be right on top of your workflow.
- Fnote is local-first, fast, and private — no account required to start. That lowers friction and increases retention for people who want instant notes without signups.

--------------------------------------------------------------------------------

## Target market & sizing (concise pitch numbers)

- Addressable market: Desktop productivity users (knowledge workers, devs, designers) — estimated hundreds of millions globally.
- Sticky-note / quick-note product vertical: overlaps with desktop utilities and productivity tools. Conservatively, 5–10% adoption among active desktop users in target segments is a multi-million user outcome.
- Mobile & web note apps are saturated; there is a clear gap for a tiny, desktop-native, always-on overlay that respects privacy and performance.

Market opportunity is real: small utilities can scale rapidly when they nail user experience and platform integration (examples: Spectacle, Bartender, Magnet, Evernote’s sticky notes, Notion widgets).

--------------------------------------------------------------------------------

## Vision & roadmap (how Fnote becomes a platform)

Phase 1 — Minimal sticky notes (MVP) — DONE/IN-PROGRESS
- Frameless, translucent notes that float above other windows.
- Drag anywhere and resize, color, and set opacity.
- Per-note font choices and persistence.

Phase 2 — Widgets & extensions (next 3–9 months)
- Add a clock widget, timers, and quick-action widgets (clipboard, todo quick-add, calendar peek).
- Each widget is a tiny web component (HTML/CSS/JS) packaged and loaded into Fnote windows.
- Create a curated widget marketplace: developers can publish small paid/free widgets, and users can install them instantly.

Phase 3 — Distribution & scale (9–24 months)
- Desktop installers for Windows (.exe / Squirrel / NSIS) and macOS (.dmg), optional MSIX for Store distribution.
# Fnote

[![Electron](https://img.shields.io/badge/Electron-✔-blue)](https://www.electronjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-✔-green)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-✔-blueviolet)](https://www.sqlite.org/)
[![Electron Forge](https://img.shields.io/badge/Electron_Forge-✔-orange)](https://www.electronforge.io/)

Fnote is a lightweight, always-on-top sticky-note overlay for desktop use. The focus is on speed, privacy, and small web-based widgets that extend the core note functionality.

## Run (Windows PowerShell)

```powershell
cd C:\path\to\fnote
npm install
npm start
```

## What we build

- Frameless translucent notes that float above other apps
- Drag anywhere to move, resize freely, per-note color and opacity
- Local-first storage with SQLite (no account required)
- Extensible widget model (clock, timers, small utilities)

## Tech stack

- Electron + Node.js
- better-sqlite3 (SQLite)
- Electron Forge for packaging
- vitest for testing

## Roadmap

1. Stabilize core note UX and persistence
2. Add first widgets: clock, timer, clipboard quick-add
3. Widget sandbox and curated marketplace
4. Cross-platform packaging and distribution

## Packaging

```powershell
npm run make
```

## Contributing

Open an issue or PR. Maintain clean commits and include tests when possible.

## License

MIT
- Developer communities (dev tools bundles, VS Code extensions cross-promo).  
