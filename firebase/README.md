# Firebase backend for the NITER Clubs Portal

This folder contains the Firebase backend configuration for the portal.
The site itself is a single static `index.html` that talks to Firebase directly
(no server required) — **Firestore** for data, **Firebase Auth** for accounts and
**Firebase Storage** for uploaded photos.

## 1 · Console setup (one-time, ~3 minutes)

Open https://console.firebase.google.com and select the **niter-club-website** project.

| Service | Where | What to do |
| --- | --- | --- |
| **Firestore** | Build → Firestore Database → Create database | Choose **Native mode** and a region (e.g. `asia-south1` or `us-central1`) |
| **Authentication** | Build → Authentication → Get started → Sign-in method | Enable the **Email/Password** provider |
| **Storage** | Build → Storage → Get started | Create the default bucket |
| **Web app** | ⚙ Project settings → Your apps → Add app → **Web (</>)** | Register a web app, then copy the config snippet |

> The **apiKey** in that snippet is public by design (it ships inside every web
> app). Security comes from the rules in this folder, not from hiding the key.

## 2 · Add the config to the site

The `FB_CONFIG` block in `index.html` (search for `FB_CONFIG`) already holds the
live project values from the console's web-app config snippet:

```js
var FB_CONFIG = {
  apiKey: "AIzaSyB5WPb6bsO9qXSccBHK-mva6gj64YPQ-BE",
  authDomain: "niter-club-website.firebaseapp.com",
  projectId: "niter-club-website",
  storageBucket: "niter-club-website.firebasestorage.app",
  messagingSenderId: "385847201496",
  appId: "1:385847201496:web:bacbdc3e681c31d7a6d1ad",
  measurementId: "G-51ERK1LMZP"
};
```

> Note the `storageBucket` uses the newer `.firebasestorage.app` domain, not
> `.appspot.com`. If you ever switch projects, paste the whole snippet again.

If `FB_CONFIG.apiKey` is empty the site keeps running in **offline demo mode**
(localStorage + the demo member code `niter2025`), so you can develop without
the backend.

## 3 · Deploy the security rules

The rules are what make the backend safe to expose publicly. Deploy them once
(and after any edit):

```bash
cd firebase
npm i -g firebase-tools        # once
firebase login                # once — opens a browser to authenticate
firebase deploy --only firestore:rules,storage
```

`firebase.json` and `.firebaserc` already point at these rule files and the
correct project, so `firebase deploy` from this folder just works.

## 4 · First account = admin

- The **first** email/password account created on the site automatically becomes
  the **admin** (it also writes a `meta/bootstrap` marker, so this can only
  happen once — see `firestore.rules`).
- Admins can promote other users to **executive** and choose which clubs each
  executive manages, from the portal → Settings → **Members & roles**.
- Executives manage the clubs they are assigned to (notices, forms,
  submissions, complaints).

## 5 · Data model (Firestore collections)

| Collection | Document | Who reads | Who writes |
| --- | --- | --- | --- |
| `clubs` | one doc per club (`computer-club`, …) | everyone | admins; executives of that club |
| `notices` | one doc per notice | everyone | admins / executives of the club |
| `forms` | one doc per form | everyone | admins / executives of the club |
| `submissions` | one doc per application | club staff | anyone (public application forms) |
| `complaints` | one doc per complaint | club staff | anyone (filing) |
| `users/{uid}` | profile + `role` (`admin`/`executive`/`member`) + `clubs[]` | self / staff | self (name only), admins (roles) |
| `meta/bootstrap` | first-admin marker | everyone | created once |

Photo fields on forms are compressed client-side and uploaded to Firebase
Storage under `submission-photos/` (signed-in users under their own uid
folder, public visitors under `guest/`); the submission stores the public URL.

## 6 · Seed data

The demo clubs, notices and forms live in the site's `index.html` seed data.
After the first admin signs in: portal → Settings → Cloud → **Load sample data
to cloud** to publish them to Firestore (only the missing docs are added, so it
is safe to press repeatedly).

## 7 · Committee-edit email notifications

When a moderator or admin saves a committee, the club page records the edit and
the site emails the club's moderators (admins + that club's executives), naming
who edited it and what changed. No mail server is bundled, so the default
provider is **FormSubmit** (`https://formsubmit.co/ajax/<email>`) — free,
zero-config and CORS-enabled; the first email to each address asks the owner to
confirm it.

The static site config lives in the `EMAIL_NOTIFY` global in `index.html`:

- `enabled` — set `false` to turn notifications off entirely
- `provider` — `"formsubmit"` (default) or `"off"`
- `formsubmitEndpoint` / `subjectPrefix` — tweak the endpoint and subject

Moderator emails come from the `users` collection. Firestore rules only let an
**admin** read other users, so an executive editor's save falls back to an
in-app note instead of an email — that's by design, not a bug. To use a
different provider (EmailJS, SMTP, Resend…), extend `sendCommitteeEmail()` in
`index.html` the same way the Next.js app's `/api/committee-notify` route does.

## 8 · Going live

The site is a static file, so you can host it anywhere — Firebase Hosting,
GitHub Pages, Netlify, or even keep opening `index.html` locally (the SDK works
from `file://`). To host on Firebase:

```bash
cd firebase
firebase init hosting        # point "public" at the project root (one level up)
firebase deploy --only hosting
```

## 9 · Local development — Storage CORS

Uploading photos or ad media from a **local dev server** (e.g.
`http://localhost:3210`) can fail with a CORS preflight error even though the
same upload works from the deployed origin. That is a Firebase **Storage
bucket** configuration issue, not an app bug — the app handles it gracefully
by keeping a downscaled data URL instead of the upload, so submissions still
succeed.

To allow localhost origins (plus your deployed origin, if it isn't already
listed), run the Google Cloud CLI from this folder's project:

```bash
cd firebase
npx gsutil cors set storage-cors.json gs://niter-club-website.firebasestorage.app
```

with a `storage-cors.json` such as:

```json
[
  {
    "origin": ["http://localhost:3000", "http://localhost:3210", "https://your-deployed-origin"],
    "method": ["GET", "PUT", "POST", "DELETE"],
    "maxAgeSeconds": 3600
  }
]
```

Afterwards, refresh the page — uploads (submission photos, ad media,
committee portraits) will go straight to Storage.
