# Plan Implementation — NITER Clubs Portal

**Source plan:** `plan/plan.pdf` + `plan/IMG_20260813_204318_920.jpg` (sketch)
**Implemented:** August 14, 2026
**Where:** the single-file app `index.html`, plus `firebase/firestore.rules`.

---

## Approach (the "better plan")

The sketch/PDF proposes a 5-phase build. The existing `index.html` portal
already had visitor browsing, a member portal with notices / forms /
submissions / complaints, email+password auth backed by Firebase, a role model
(admin / executive / member), and Firestore sync. The plan's genuinely new
capabilities were the gaps, and all of them were implemented directly in
`index.html` — no new codebase, no separate app:

1. **Memberships junction table** (user_id ↔ club_id, status Pending/Approved)
   with a Request-to-Join flow — did not exist.
2. **Events** posted by club managers, surfaced on general users' feeds — did
   not exist (forms were used as a stand-in).
3. **General User Dashboard** (my clubs, pending requests, event feed, profile)
   — did not exist (general users hit a dead end at the portal).

> Note: an earlier draft of this file claimed the plan was implemented in the
> Next.js app under `web/` (and mirrored into `index.html`). That was not the
> case — none of those `web/` files or routes existed. The plan is implemented
> in `index.html` only; the `web/` Next.js app was left untouched.

## Phase-by-phase status

### Phase 1 — Authentication & RBAC ✅
- Visitor browsing of public content: existing (`#/`, `#/notices`, `#/clubs`,
  `#/club/[id]`).
- Registration gateway: existing email/password sign-up; **now captures the
  NITER student ID** (`index.html` → `loginCard` signup mode,
  `portalLoginSubmit`, `bootstrapUser`, `loadProfile`).
- Role assignment middleware: existing (`member` = General, `executive` = Club
  Manager, `admin` = Platform Admin — same mapping as the plan's Roles table).
  Server-side enforcement in `firebase/firestore.rules`.

### Phase 2 — Database schema ✅
- Users: `users/{uid}` now carries `studentId` in addition to name/email/role/clubs.
- Clubs: existing `clubs` collection.
- Roles: existing `role` field (admin / executive / member).
- **Memberships (junction): new `memberships` collection**: `userId`, `clubId`,
  `status` (`pending` / `approved` / `rejected`), `requestedAt`, `reviewedAt`,
  `reviewedBy`, plus a snapshot of `userName` / `userEmail` / `studentId` so
  club staff can review requests without reading the private users collection.
- New **`events` collection**: clubId, title, description, startsAt, venue,
  capacity, createdBy, createdAt.
- Seed data: 7 sample events (dates auto-rebased to stay fresh);
  `memberships` seeds empty.

### Phase 3 — Dashboards ✅
- **General User Dashboard** — new `#/dashboard` route (`viewDashboard` in
  `index.html`): profile editing (name + student ID), my clubs (approved
  memberships), pending join requests (with cancel), rejected requests, and a
  personalized upcoming-events feed (your clubs' events first). Header shows a
  "My Dashboard" nav link when signed in.
- **Club Dashboard (Management)** — the portal gains two tabs: **🤝 Membership
  requests** (approve / reject pending joins, reviewed history) and
  **📅 Events** (create / edit / delete). Existing tabs cover notices, forms,
  submissions, complaints.
- **Admin Dashboard** — existing Settings tab: create clubs, assign roles
  (admin → executive → member) and manage any club.

### Phase 4 — Core functionality ✅
- **Club discovery & join** — the club detail page shows a **Request to Join**
  button for signed-in students with pending / member / rejected states
  (`joinPanelHTML`, `request-join` / `cancel-membership` actions); visitors
  keep the classic membership-form apply flow.
- **Event management** — club managers post events from the portal
  (`portalEvents`, `event-form`); events appear on the club page
  ("Upcoming events"), on the home page feed ("📅 Upcoming events") and in every
  student's dashboard.
- **Profile management** — edit name + NITER student ID from `#/dashboard`
  (`saveProfileForm`); password reset already existed.

### Phase 5 — Testing & deployment ✅ / ▶
- **RBAC hardening:** `firebase/firestore.rules` updated — membership reads are
  limited to the requester or the club's staff/admins; requests can only be
  created by the requester with `status == 'pending'` (no self-approval); a
  student may delete their own still-pending request (cancel); review is
  staff/admin only; `events` are public-read, staff/admin-write; users may
  self-update only `name` + `studentId`.
- **Checks:** all `index.html` script blocks parse (`node` syntax check); all
  routes smoke-tested in-browser (home, notices, clubs, club pages, form,
  complaint, IT desk, dashboard, portal, not-found).
- **Hosting:** deploy the rules with
  `cd firebase && firebase deploy --only firestore:rules`. The rules deploy is
  required before memberships/events can be written to a live project.

## Files changed

| File | Change |
|---|---|
| `index.html` | All of Phase 1–5: `memberships` + `events` collections (seed, normalize, cloud sync with per-user + per-managed-club membership queries), Request-to-Join on club pages, upcoming-events feeds (home / club / dashboard), portal tabs (🤝 Membership requests, 📅 Events), `#/dashboard` route with profile editing, student-ID capture at signup, event/membership/profile actions, styles |
| `firebase/firestore.rules` | `memberships` + `events` rules; `studentId` self-edit allowed |
| `plan/IMPLEMENTATION.md` | Corrected to describe the actual implementation (in `index.html`, not `web/`) |

## Verified in-browser

- Home page "📅 Upcoming events" feed renders all 7 seeded events with dates,
  venues and capacities.
- Club page shows the join panel (visitor → apply form) and an "Upcoming
  events" section.
- Portal (offline demo session): both new tabs render; an event was created,
  persisted, and deleted; membership tab shows its empty state.
- `#/dashboard` shows the sign-in gate when logged out; "My Dashboard" nav link
  is hidden until signed in.
- Cloud signup card shows the NITER student ID field in "Create account" mode.
- All routes render without JS errors; all inline script blocks parse.

## Notes / follow-ups

- The signed-in flows (Request-to-Join → club staff approve → dashboard feed)
  were implemented and syntax-checked but not exercised end-to-end, because
  that requires creating an account on the live Firebase project — verify with
  a real sign-in once the rules are deployed.
- Deploying `firestore.rules` is required before membership requests and new
  events can be written to a live Firebase project.
- The offline demo mode (no Firebase) can't exercise request-to-join because
  there is no user identity; it needs email/password sign-in.
- The `web/` Next.js app has NOT been updated — the plan currently lives only
  in the single-file `index.html`.
