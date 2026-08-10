# Appwrite — MCP server config & provisioning script

Two things live in this folder:

| File | Purpose |
|---|---|
| `setup-appwrite.mjs` | **Provisioning script** — connects to your Appwrite instance with the Node.js SDK and creates the database, collections, attributes, indexes and storage buckets required by `document/02-TRD.md`. |
| `mcp.json` / `mcp.cloud.json` | **MCP server configs** — connect Claude Desktop, Cursor, VS Code, Claude Code, etc. to the official [Appwrite MCP server](https://github.com/appwrite/mcp) so an AI assistant can inspect and operate this backend directly. |
| `package.json` | Node deps (`node-appwrite` SDK + `dotenv`). |
| `.env.example` | Template for connection settings. Copy to `.env` and fill in. |

---

## 1. Prerequisites

- **Node.js 18+** (LTS 20+ recommended)
- An Appwrite instance — **Appwrite Cloud** or a **self-hosted** install
- An Appwrite **project** (create it in the Console)
- A server-side **API key** with at least these scopes:
  - `databases.read`, `databases.write`
  - `storage.read`, `storage.write`

  For the MCP server to also manage users, add `users.read` (and `users.write` if you want the assistant to create users).

---

## 2. Run the provisioning script

```bash
cd appwrite
cp .env.example .env        # then edit .env with your values
npm install
npm run setup:dry-run       # optional: preview what will be created
npm run setup               # create everything
```

`.env` example:

```dotenv
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1   # self-hosted: http://localhost:9501/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key
APPWRITE_SELF_SIGNED=false                       # "true" only for self-hosted TLS with self-signed certs
```

**The script is idempotent** — it lists what already exists and only creates what's missing, so it's safe to re-run any time (e.g. after adding a new attribute to the schema below).

---

## 3. What the script creates

### Database

`niter_club` (name: "NITER Club")

### Collections, attributes & indexes

Appwrite auto-provisions the system attributes `$id`, `$createdAt`, `$updatedAt` and `$permissions`, so the TRD fields `User.createdAt` and `EventRegistration.registeredAt` map to the built-in `$createdAt`.

| Collection | Attributes (per TRD §4) | Indexes |
|---|---|---|
| `users` | name, email, passwordHash, studentId, department, role `enum(member, executive, admin)`, status `enum(pending, approved, rejected, active, deactivated)` | **unique** email, **unique** studentId, key(role), key(status, role) |
| `events` | title, description, startsAt (datetime), venue, bannerUrl, capacity (int), registrationDeadline (datetime), status `enum(draft, published, cancelled)` | key(status), key(startsAt ↑), key(status, startsAt ↑) |
| `event_registrations` | userId, eventId | **unique**(userId, eventId) — stops duplicate registrations, key(userId), key(eventId) |
| `applications` | userId, reason, status `enum(pending, approved, rejected)`, reviewedAt, reviewedBy | key(status), key(userId) |
| `notices` | title, body, attachmentUrl, pinned (bool), createdBy | key(pinned), key($createdAt ↓), key(pinned, $createdAt ↓) |
| `albums` | title, eventId | key(eventId) |
| `photos` | url, albumId | key(albumId) |
| `executives` | userId, position, displayOrder (int), term | key(displayOrder ↑), key(term), key(term, displayOrder ↑) |

### Storage buckets

| Bucket | Purpose | Max file size | Allowed extensions | Access |
|---|---|---|---|---|
| `event-banners` | Event banner images (TRD `bannerUrl`) | 5 MB | jpg, jpeg, png, webp | public read |
| `gallery-photos` | Gallery uploads (TRD `Photo.url`) | 10 MB | jpg, jpeg, png, webp, gif | public read |
| `notice-attachments` | Notice attachments (TRD `attachmentUrl`) | 5 MB | pdf, jpg, jpeg, png, webp, doc, docx | public read |

Buckets are **publicly readable** (visitors must be able to see banners, photos and attachments without logging in) but **not publicly writable** — uploads go through your server API key, matching the TRD's signed-upload flow.

> **Note on collections:** collections are created with **no public permissions** (server-side only). This matches the TRD architecture, where the Express backend owns all reads/writes via its API key and roles are enforced server-side. If you later wire the Appwrite Web SDK directly into the React frontend, add `read("any")` on the public collections (events, notices, albums, photos, executives).

---

## 4. Connect the MCP server

The official [Appwrite MCP server](https://github.com/appwrite/mcp) exposes Appwrite's API (databases, storage, users, etc.) as tools your AI client can call. Pick the variant that matches your setup:

### Option A — Appwrite Cloud (hosted, browser OAuth)

No keys needed — your client opens a browser and you approve scopes.

- **Claude Code**
  ```bash
  claude mcp add --transport http appwrite https://mcp.appwrite.io/
  ```
- **Claude Desktop** → Settings → Connectors → **Add custom connector** → paste `https://mcp.appwrite.io/`. (On plans without connectors, add the stdio bridge to your config: `{"mcpServers":{"appwrite":{"command":"npx","args":["-y","mcp-remote","https://mcp.appwrite.io/"]}}}`.)
- **Cursor** — copy `mcp.cloud.json` to `.cursor/mcp.json`
- **VS Code (GitHub Copilot)** — `.vscode/mcp.json`:
  ```json
  { "servers": { "appwrite": { "type": "http", "url": "https://mcp.appwrite.io/" } } }
  ```

### Option B — Self-hosted Appwrite (API key, stdio)

For **your own Appwrite instance**. Requires [`uv`](https://docs.astral.sh/uv/) (run `curl -LsSf https://astral.sh/uv/install.sh | sh`). The server runs locally via `uvx mcp-server-appwrite` and authenticates with a project API key.

- **Claude Code**
  ```bash
  claude mcp add appwrite \
    --env APPWRITE_PROJECT_ID=your-project-id \
    --env APPWRITE_API_KEY=your-api-key \
    --env APPWRITE_ENDPOINT=https://your-appwrite-domain.com/v1 \
    -- uvx mcp-server-appwrite
  ```
- **Claude Desktop / Cursor / Windsurf** — copy `mcp.json` to your client's MCP config and replace the placeholders:
  ```json
  {
    "mcpServers": {
      "appwrite": {
        "command": "uvx",
        "args": ["mcp-server-appwrite"],
        "env": {
          "APPWRITE_ENDPOINT": "https://your-appwrite-domain.com/v1",
          "APPWRITE_PROJECT_ID": "your-project-id",
          "APPWRITE_API_KEY": "your-api-key"
        }
      }
    }
  }
  ```
- **VS Code (GitHub Copilot)** — `.vscode/mcp.json`:
  ```json
  {
    "servers": {
      "appwrite": { "type": "stdio", "command": "uvx", "args": ["mcp-server-appwrite"], "env": { "APPWRITE_ENDPOINT": "https://your-appwrite-domain.com/v1", "APPWRITE_PROJECT_ID": "your-project-id", "APPWRITE_API_KEY": "your-api-key" } }
    }
  }
  ```

> `APPWRITE_ENDPOINT` must be the **API base** (`.../v1`), e.g. `http://localhost:9501/v1` for a local Docker instance, not the Console URL.

> ⚠️ The `mcp.json` / `mcp.cloud.json` files are **templates** with placeholders. When you copy them into your client's config (e.g. `~/.cursor/mcp.json`), fill in your real project ID and API key there — but never commit real keys into this repository; they live only in your local client config and `.env` (gitignored).

---

## 5. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `Missing environment variable(s): ...` | `.env` not filled in — copy `.env.example` and complete it. |
| `Appwrite error 401` | API key invalid or expired — create a new one in Console → Project → API Keys. |
| `Appwrite error 403` | API key missing scopes — add `databases.*` and `storage.*`. |
| `Appwrite error 404` | Wrong project ID, or endpoint not the `/v1` base URL. |
| MCP client shows reconnect error (e.g. Cursor `-32000`) | The stdio server exited before handshake — usually bad credentials or a missing scope. Run the `uvx mcp-server-appwrite` command in a terminal with the same env vars to see the real error. |

---

## 6. Next steps

- **Seed content** (first admin user, sample events/notices) — ask your AI assistant via the connected MCP server, or add a `seed-appwrite.mjs`.
- **Build the backend** (Express + `node-appwrite`) against the schema above.
- If you want the frontend to talk to Appwrite directly, revisit the collection permissions note in §3.
