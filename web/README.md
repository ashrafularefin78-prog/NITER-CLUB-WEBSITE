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

**Appwrite** (optional, server-side only): the student directory is backed by
the live Appwrite `students` collection via `GET /api/students` when these
env vars are set in `.env.local` (values live in `../appwrite/.env`):

- `APPWRITE_ENDPOINT` — e.g. `https://sgp.cloud.appwrite.io/v1`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY` — server key with `databases.read` (never sent to the browser)

The route paginates the collection, maps it to the app's `Student` shape and
sorts by `sl`. If Appwrite is unconfigured or unreachable the directory
silently falls back to the bundled roster, so the page always works offline.

**Writes — student data & form fill-ups** mirror into Appwrite on the same
three env vars, always best-effort (the local/Firestore save is primary; a
slow or offline Appwrite never blocks the student):

- `POST /api/submissions` — saves a club form fill-up to the `submissions`
  collection (idempotent per form + submitter email; photo data-URLs are
dropped and the payload is capped). Called by this app after every submit
and by the static main site (`index.html`) when its `DATA_API.origin` is set.
- `POST /api/users` — upserts a student account into the `users` collection
  (name, email, student ID, department, role; **never** passwords). Called on
  sign-up/sign-in in both apps.

Both routes are CORS-open so the static `index.html` can call them from
another origin. Seed existing forms/submissions with `npm run seed:site` in
`../appwrite/`.

## Committee-edit email notifications

When a moderator or admin saves a committee, the app emails the club's
moderators (admins + that club's executives) via `POST /api/committee-notify`,
naming who edited it and what changed. The route sends through **FormSubmit**
by default (free, zero-config; the first email to each address asks the owner
to confirm it). Configure on the server:

- `COMMITTEE_EMAIL_NOTIFY` — `"off"` disables sending
- `COMMITTEE_EMAIL_PROVIDER` — `"formsubmit"` (default) or `"off"`
- `COMMITTEE_EMAIL_SUBJECT` — subject prefix (default `[NITER Clubs]`)

Moderator emails come from the `users` collection cached in `db.__users`
(populated in cloud mode); in demo mode there are no users, so the save shows
an in-app note instead. Swap providers by extending the `provider` branch in
`app/api/committee-notify/route.ts`.

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
