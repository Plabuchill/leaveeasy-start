# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

LeaveEasy is a teaching prototype for **ADT-RAISE Non-Degree Batch 2, Module 2** — a student works through it over weeks 6–9 of the course, incrementally connecting a static leave-request web app to Firebase. `leaveeasy-spec.md` is the authoritative spec: it defines the screens, the Firestore data model, the weekly scope, and — critically — contains an explicit instruction that **AI assistants must implement only what is written in that document for the current week, never add unspecified features, and never do a future week's work early** (see its sections 8 and 9). Always check `leaveeasy-spec.md` before changing data shapes, adding screens, or implementing auth/rules/CRUD — and check which week's work is actually in scope before doing it.

There is no build step and no framework: plain HTML, CSS, and vanilla JS, one `.html` file per screen.

## Commands

- Run the dev server: `npm run dev` (runs `serve -l 3000 .`)
- Or use the Claude Code browser preview, which is configured in `.claude/launch.json` to run `npx serve -l 5500 .`
- Seed sample data into Firestore (one-off, run manually after Firestore is created and its rules allow writes): `node scripts/seed-firestore.mjs`

There is no lint, test, or build command — none exist in this project.

## Architecture

**Multi-page, no bundler.** Each screen is its own `.html` file (`index.html`, `leave-requests.html`, `new-leave-request.html`, `leave-request-detail.html`, `leave-types.html`) that loads shared scripts plus one page-specific script via `<script defer>` (or `type="module"` where Firestore is used). There is no shared router or SPA shell — navigation is plain `<a href>` links, and the shared nav bar is injected client-side by `js/nav.js` into a `<div id="nav">` present on every page.

**Shared scripts loaded on every page:**
- `js/util.js` — global helper functions (`esc`, `ป้ายสถานะ`, `เวลาตอนนี้`, `ค่าจากURL`), not modules; relied on as bare globals by every page script, including the one page that's now a `type="module"` script.
- `js/nav.js` — renders the nav bar and exposes `showConfigWarning()`.

**Data layer is mid-migration (by design, not an inconsistency):**
- `js/data.js` defines `window.LEAVE_DATA` (fake in-memory seed data matching the Firestore schema exactly). `new-leave-request.html`, `leave-request-detail.html`, and `leave-types.html` still read/write only this in-memory data plus `sessionStorage` — per the spec's weekly scope, these haven't been migrated to Firestore yet.
- `leave-requests.html` / `js/leave-requests.js` is the one screen migrated to Firestore so far: it's loaded with `type="module"` and reads live from the `leaveRequests` collection via `js/firebase-config.js`, then merges in anything pending in `sessionStorage` (submitted via `new-leave-request.html`, which still hasn't been wired to write to Firestore).
- `js/firebase-config.js` initializes Firebase and exports `db` (Firestore), importing the SDK straight from the `gstatic.com` CDN as ES modules (pinned version, currently 10.12.2) — this only works in the browser, not in Node, and only on pages loaded with `type="module"`.
- `scripts/seed-firestore.mjs` is a separate, Node-only one-off seeder using the `firebase` npm package (the CDN import path in `js/firebase-config.js` can't be used from Node). It mirrors the sample data in spec section 7 exactly, including the `approvals` subcollection nested under each `leaveRequests` document.

**Firestore shape** (see `leaveeasy-spec.md` section 5 for the full field-by-field reference): top-level collections `users`, `leaveTypes`, `leaveRequests`; `leaveRequests` documents have a nested `approvals` subcollection. Foreign keys are denormalized — e.g. a leave request stores both `requesterId` and a duplicated `requesterName` — because Firestore has no JOIN. Field name casing must match exactly across the codebase (`status` vs `Status` are different fields).

**Security rules are currently wide open** (`allow read, write: if true`) as a deliberate, temporary week-6 state — the spec schedules per-role rules for week 8. Don't tighten or restructure rules without checking which week's work is in scope.

**Thai identifiers are intentional.** Variable, function, and DOM-id names throughout the JS files are Thai (e.g. `ใบลาทั้งหมด`, `แสดงตาราง`, `กล่องใบลา`) — this is a deliberate teaching choice, not a mistake. Match the existing style when editing these files rather than switching to English.
