# Fnote

Fnote is a tiny, private, local-first sticky-note overlay that sits above your desktop apps — translucency, color, and zero friction. Think of it as a Post‑it for the 21st century: instant, private, and always where you need it.

--------------------------------------------------------------------------------

## Quick start

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

## What is Fnote? | product in one sentence

Fnote is a lightweight, always-on-top, translucent sticky-note utility for desktop power users who want frictionless note capture and a platform for tiny, delightful widgets.

## Why Fnote | the opportunity

- People use notes continuously: quick reminders, code snippets, meeting times, and ephemeral ideas. Current ecosystems scatter notes across cloud apps and passive widgets; the occasional note needs to be right on top of your workflow.
- Fnote is local-first, fast, and private — no account required to start. That lowers friction and increases retention for people who want instant notes without signups.

--------------------------------------------------------------------------------

## Target market & sizing 

- Addressable market: Desktop productivity users (knowledge workers, devs, designers) — estimated hundreds of millions globally.
- Sticky-note / quick-note product vertical: overlaps with desktop utilities and productivity tools. Conservatively, 5–10% adoption among active desktop users in target segments is a multi-million user outcome.
- Mobile & web note apps are saturated; there is a clear gap for a tiny, desktop-native, always-on overlay that respects privacy and performance.

Market opportunity is real: small utilities can scale rapidly when they nail user experience and platform integration (examples: Spectacle, Bartender, Magnet, Evernote’s sticky notes, Notion widgets).

--------------------------------------------------------------------------------

## Vision (how Fnote becomes a platform)

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
- Native app store presence and partnerships for OEM installs (optional).
- Freemium model: base features free, premium widget marketplace access, syncing (opt-in), and cloud backup.

Long-term: billions of users is an ambitious goal — we scale by specializing in discovery (widget marketplace), zero-friction onboarding, and integrations with platforms (Slack snippets, calendar previews, etc.).

--------------------------------------------------------------------------------

## Next Idea

1. Clock widget
  - Implement clock as a self-contained renderer window using existing note UI.
  - Clock has configurable styles, timezones, and alarm hooks.
2. Widget architecture
  - Each widget is a small web package (HTML + JS + CSS) with a restricted API surface exposed by preload scripts.
  - A widget sandbox ensures no arbitrary Node access; only allowed APIs: storage, small IPC hooks (send event, open note, set alarm).
  - Widgets are discovered via a curated marketplace and installed to the user's profile folder.

3. Marketplace flow
  - Developer portal (simple): package widget zip with a manifest (name, author, version, permissions).
  - Users browse inside Fnote UI, preview widgets, and click Install (downloads packaged widget and stores locally).
  - Monetization: revenue share for paid widgets; free widgets grow the ecosystem.

--------------------------------------------------------------------------------------------------------


## Model

- Freemium: core notes are free; premium subscription unlocks cloud sync and marketplace perks.  
- Marketplace: paid widgets with revenue share to creators.  
- Partnerships: bundle Fnote with productivity suites or OEMs for distribution.

Acquisition channels:
- Developer communities (dev tools bundles, VS Code extensions cross-promo).  
- Productivity blogs & creators.  
- Paid ads & referral programs for early adopters.

--------------------------------------------------------------------------------

## Growth & scaling to billions of users

1. Nail retention: Make the core experience indestructible — fast startup, tiny memory, privacy-first.  
2. Network effects via widgets: a thriving marketplace increases stickiness and virality.  
3. Cross-platform presence + OEM deals: partner with manufacturers and software distributors.  

Billions is aspirational — but focusing on a small, high-value core feature set and building a platform around it is the proven way utilities scale.

-------------------------------------------------------------------------------------------

## Contributors & license

This repo is maintained by `winshaurya`. If you want to contribute, open an issue or a pull request and we’ll review it.

--------------------------------------------------------------------------------

