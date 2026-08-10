# NITER Clubs Portal — Next.js frontend

A modern, industry-standard rewrite of the NITER Clubs Portal. The legacy site is
the static `index.html` at the repo root; this `web/` folder is the Next.js
version.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** with the NITER brand tokens and a `data-theme` dark mode
- **Firebase** (modular SDK) — Firestore for data, Auth for accounts, Storage
  for photo uploads. When Firebase isn't reachable the app runs fully offline
  on the seeded demo dataset (same behaviour as the legacy app).

## Getting started

```bash
cd web
npm install
npm run dev        # http://localhost:3000
```

Scripts: `build`, `start`, `typecheck`, `lint` (ESLint 9), `lint:fix`,
`format` / `format:check` (Prettier). CI (`.github/workflows/ci.yml`) runs
typecheck, lint, format check and build on every push.

## Realtime sync

Public collections (`clubs`, `notices`, `forms`) and the site config are
subscribed via Firestore `onSnapshot` — other devices' edits appear live.
Restricted collections (`submissions`, `complaints`) subscribe per the signed-in
user's read scope and re-subscribe when auth changes. Local edits still push via
the debounced diff-sync, and a snapshot never overwrites a collection that holds
un-pushed local changes.

## Environment

Firebase config defaults to the live `niter-club-website` project (public by
design — security lives in the Firestore rules under `../firebase/`). To point
at your own project, copy `.env.example` to `.env.local` and fill in the values.

## Architecture

```
app/
  layout.tsx          Root layout — fonts, metadata, providers, theme no-flash script
  page.tsx            Home (hero, live stats, next deadline, activity)
  notices|clubs|portal|it-support|it-desk/page.tsx
  club/[id]/          Club detail (metadata from seed, live body)
  form/[id]/          Form filling (validation, payment TrxID, photo upload, exports)
  complaint/[clubId]/ Complaint box
  loading.tsx error.tsx not-found.tsx robots.ts sitemap.ts
components/
  layout.tsx          Header / footer / nav / theme toggle
  providers.tsx       Theme + toast providers
  cards.tsx           Club / notice / form cards, reaction bar
  countdown.tsx       Live clock, countdowns, relative time
  ui.tsx              Skeleton, empty state, section head, spinner
  views/              One client view per page
lib/
  types.ts            Domain model
  seed.ts + seed.json Canned demo data, dates rebased to today
  normalize.ts        Tolerant parsing of stored data + standard fields
  store.ts            Client data store: localStorage persistence, React
                      subscription, cross-tab sync, Firestore hydrate/push
  firebase.ts         Modular Firebase client (env-configurable)
  auth.tsx            Member-code + email/password auth, session, read scope
  utils.ts            Date formatting, form status, helpers
```

## Data model

Everything the site shows lives in one `Database` object
(`clubs`, `notices`, `forms`, `submissions`, `complaints`, `config`):

1. **Load** — read `localStorage` (`niter-clubs-db-v8`), or seed the demo data
   with dates rebased to today.
2. **React** — `useDb()` subscribes to the store via `useSyncExternalStore`.
3. **Mutate** — `mutate(fn)` applies a change, persists, and schedules a push.
4. **Sync** — after first load the store hydrates from Firestore (respecting
   the signed-in user's read scope) and pushes local changes back; a 30s poll
   and `storage` events keep multiple tabs/devices roughly in sync.

The first Firebase account created becomes the portal **admin**; admins promote
others to club executives from *Portal → Settings → Members & roles*.

## Demo login

With Firebase configured the portal uses email/password sign-in. Without it
(offline demo mode) use the member code **`niter2025`**.
