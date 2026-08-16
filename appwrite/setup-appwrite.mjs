#!/usr/bin/env node
/**
 * setup-appwrite.mjs
 * ------------------
 * Provisions the Appwrite backend for the NITER Club website.
 *
 * Based on the data model and storage requirements in document/02-TRD.md:
 *   - one database ("niter_club")
 *   - eight collections with attributes and indexes (users, events,
 *     event_registrations, applications, notices, albums, photos, executives)
 *   - three storage buckets (event-banners, gallery-photos, notice-attachments)
 *
 * The script is IDEMPOTENT: it inspects what already exists and only creates
 * what is missing, so it is safe to re-run.
 *
 * Usage:
 *   cp .env.example .env      # fill in APPWRITE_ENDPOINT/PROJECT_ID/API_KEY
 *   npm install
 *   npm run setup             # or: node setup-appwrite.mjs
 *   npm run setup:dry-run     # preview without making any changes
 */

import "dotenv/config";
import {
  Client,
  Databases,
  Storage,
  Permission,
  Role,
  DatabasesIndexType,
  OrderBy,
  AppwriteException,
} from "node-appwrite";

/* ------------------------------------------------------------------ */
/*  Configuration                                                      */
/* ------------------------------------------------------------------ */

const {
  APPWRITE_ENDPOINT = "",
  APPWRITE_PROJECT_ID = "",
  APPWRITE_API_KEY = "",
  APPWRITE_SELF_SIGNED = "false",
} = process.env;

const DRY_RUN = process.argv.includes("--dry-run");

const DATABASE_ID = "niter_club";
const DATABASE_NAME = "NITER Club";

const MB = 1024 * 1024;

/* ------------------------------------------------------------------ */
/*  Schema — derived from 02-TRD.md §4 (Data Model) and §5 (storage)   */
/* ------------------------------------------------------------------ */

// Attribute shorthand helpers
const s = (key, size, required = true, def = undefined) => ({ type: "string", key, size, required, default: def });
const i = (key, required = true, def = undefined) => ({ type: "integer", key, required, default: def });
const b = (key, required = true, def = undefined) => ({ type: "boolean", key, required, default: def });
const d = (key, required = true, def = undefined) => ({ type: "datetime", key, required, default: def });
const e = (key, elements, required = true, def = undefined) => ({ type: "enum", key, elements, required, default: def });

// Index shorthand helper
const idx = (key, attributes, type = DatabasesIndexType.Key, orders = undefined) => ({ key, attributes, type, orders });

/**
 * Collection definitions.
 *
 * Appwrite auto-provisions the system attributes $id, $createdAt, $updatedAt
 * and $permissions, so TRD fields like User.createdAt and
 * EventRegistration.registeredAt map to the built-in $createdAt.
 */
const COLLECTIONS = [
  {
    id: "users",
    name: "Users",
    attributes: [
      s("name", 255),
      s("email", 255),
      s("passwordHash", 255),
      s("studentId", 64),
      s("department", 128),
      // Appwrite disallows defaults on required attributes, so defaults
      // imply optional (non-required) — the default is applied on create
      // when the field is omitted.
      e("role", ["member", "executive", "admin"], false, "member"),
      e("status", ["pending", "approved", "rejected", "active", "deactivated"], false, "pending"),
    ],
    indexes: [
      idx("u_email", ["email"], DatabasesIndexType.Unique),
      idx("u_studentId", ["studentId"], DatabasesIndexType.Unique),
      idx("i_role", ["role"]),
      idx("i_status_role", ["status", "role"]),
    ],
  },
  {
    id: "students",
    name: "Students",
    // Official student directory (name + student ID + merit rank) — the
    // reference list used to verify student IDs. Rows are imported by
    // seed-students.mjs. department/session defaults imply optional fields.
    attributes: [
      s("name", 255),
      s("studentId", 64),
      i("merit", false),
      i("sl", false),
      s("department", 128, false, "CSE"),
      s("session", 64, false, "2025-2026"),
      s("section", 16, false),
    ],
    indexes: [
      idx("u_studentId", ["studentId"], DatabasesIndexType.Unique),
      idx("i_merit", ["merit"]),
    ],
  },
  {
    id: "events",
    name: "Events",
    attributes: [
      s("title", 255),
      s("description", 4096),
      d("startsAt"),
      s("venue", 255),
      s("bannerUrl", 2048, false),
      i("capacity", false, 0),
      d("registrationDeadline", false),
      e("status", ["draft", "published", "cancelled"], false, "draft"),
    ],
    indexes: [
      idx("i_status", ["status"]),
      idx("i_startsAt", ["startsAt"], DatabasesIndexType.Key, [OrderBy.Asc]),
      // "Upcoming/past events" = status filter + startsAt range/order
      idx("i_status_startsAt", ["status", "startsAt"], DatabasesIndexType.Key, [OrderBy.Asc, OrderBy.Asc]),
    ],
  },
  {
    id: "event_registrations",
    name: "Event Registrations",
    attributes: [
      s("userId", 255),
      s("eventId", 255),
    ],
    indexes: [
      idx("u_user_event", ["userId", "eventId"], DatabasesIndexType.Unique),
      idx("i_userId", ["userId"]),
      idx("i_eventId", ["eventId"]),
    ],
  },
  {
    id: "applications",
    name: "Applications",
    attributes: [
      s("userId", 255),
      s("reason", 2048),
      e("status", ["pending", "approved", "rejected"], false, "pending"),
      d("reviewedAt", false),
      s("reviewedBy", 255, false),
    ],
    indexes: [
      idx("i_status", ["status"]),
      idx("i_userId", ["userId"]),
    ],
  },
  {
    id: "forms",
    name: "Forms",
    // Club forms (membership/join forms etc.). `fields` holds the field
    // definitions as a JSON string, so the schema stays stable when forms
    // add or remove questions.
    attributes: [
      s("clubId", 64),
      s("title", 255),
      s("description", 4096, false),
      d("openAt", false),
      d("deadline", false),
      s("fields", 16384, false),
    ],
    indexes: [
      idx("i_clubId", ["clubId"]),
      idx("i_clubId_title", ["clubId", "title"]),
    ],
  },
  {
    id: "submissions",
    name: "Submissions",
    // One document per form fill-up. `data` holds the answers as a JSON
    // string; `reviewStatus` lets club moderators approve/reject later.
    attributes: [
      s("formId", 64),
      s("clubId", 64),
      s("submitterName", 255, false),
      s("submitterEmail", 255, false),
      s("submitterStudentId", 64, false),
      s("userId", 255, false),
      s("data", 16384),
      e("reviewStatus", ["pending", "approved", "rejected"], false, "pending"),
      d("reviewedAt", false),
      d("submittedAt", false),
    ],
    indexes: [
      idx("i_formId", ["formId"]),
      idx("i_clubId", ["clubId"]),
      idx("i_email", ["submitterEmail"]),
    ],
  },
  {
    id: "notices",
    name: "Notices",
    attributes: [
      s("title", 255),
      s("body", 16384),
      s("attachmentUrl", 2048, false),
      b("pinned", false, false),
      s("createdBy", 255, false),
    ],
    indexes: [
      idx("i_pinned", ["pinned"]),
      idx("i_createdAt", ["$createdAt"], DatabasesIndexType.Key, [OrderBy.Desc]),
      // "Pinned notices first" = pinned filter + createdAt order
      idx("i_pinned_createdAt", ["pinned", "$createdAt"], DatabasesIndexType.Key, [OrderBy.Asc, OrderBy.Desc]),
    ],
  },
  {
    id: "albums",
    name: "Albums",
    attributes: [
      s("title", 255),
      s("eventId", 255, false),
    ],
    indexes: [
      idx("i_eventId", ["eventId"]),
    ],
  },
  {
    id: "photos",
    name: "Photos",
    attributes: [
      s("url", 2048),
      s("albumId", 255),
    ],
    indexes: [
      idx("i_albumId", ["albumId"]),
    ],
  },
  {
    id: "executives",
    name: "Executives",
    attributes: [
      s("userId", 255, false),
      s("position", 128),
      i("displayOrder", false, 0),
      s("term", 64, false),
    ],
    indexes: [
      idx("i_displayOrder", ["displayOrder"], DatabasesIndexType.Key, [OrderBy.Asc]),
      idx("i_term", ["term"]),
      // "Current panel" = term filter + displayOrder order
      idx("i_term_displayOrder", ["term", "displayOrder"], DatabasesIndexType.Key, [OrderBy.Asc, OrderBy.Asc]),
    ],
  },
];

/**
 * Storage buckets.
 *
 * All content stored here is public by design (event banners, gallery
 * photos, notice attachments are shown to unauthenticated visitors, see
 * TRD §5 public endpoints), so each bucket grants read("any"). Writes are
 * only possible with the server API key — no write permission is granted
 * to unauthenticated roles.
 */
const BUCKETS = [
  {
    id: "event-banners",
    name: "Event Banners",
    maxSize: 5 * MB,
    extensions: ["jpg", "jpeg", "png", "webp"],
  },
  {
    id: "gallery-photos",
    name: "Gallery Photos",
    maxSize: 10 * MB,
    extensions: ["jpg", "jpeg", "png", "webp", "gif"],
  },
  {
    id: "notice-attachments",
    name: "Notice Attachments",
    maxSize: 5 * MB,
    extensions: ["pdf", "jpg", "jpeg", "png", "webp", "doc", "docx"],
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function describeError(err) {
  const hints = {
    401: "API key is invalid or expired — create a new one in Console → Project → API Keys.",
    403: "API key is missing required scopes — it needs at least databases.* and storage.*.",
    404: "Project not found — check APPWRITE_PROJECT_ID and that APPWRITE_ENDPOINT points to the /v1 API base.",
  };
  if (err && typeof err.code === "number") {
    const hint = hints[err.code] ? ` — ${hints[err.code]}` : "";
    return `Appwrite error ${err.code}: ${err.message}${hint}`;
  }
  return err instanceof Error ? err.message : String(err);
}

/** Create a single attribute via the matching SDK call. */
function createAttribute(databases, collectionId, attr) {
  switch (attr.type) {
    case "string":
      return databases.createStringAttribute(DATABASE_ID, collectionId, attr.key, attr.size, attr.required, attr.default);
    case "integer":
      return databases.createIntegerAttribute(DATABASE_ID, collectionId, attr.key, attr.required, undefined, undefined, attr.default);
    case "boolean":
      return databases.createBooleanAttribute(DATABASE_ID, collectionId, attr.key, attr.required, attr.default);
    case "datetime":
      return databases.createDatetimeAttribute(DATABASE_ID, collectionId, attr.key, attr.required, attr.default);
    case "enum":
      return databases.createEnumAttribute(DATABASE_ID, collectionId, attr.key, attr.elements, attr.required, attr.default);
    default:
      throw new Error(`Unknown attribute type "${attr.type}" for key "${attr.key}"`);
  }
}

/**
 * Appwrite creates attributes asynchronously; an index created before the
 * attribute is fully "available" will fail. Poll until it settles.
 */
async function waitForAttribute(databases, collectionId, key, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const attr = await databases.getAttribute(DATABASE_ID, collectionId, key);
      if (attr.status === "available") return;
      if (attr.status === "failed" || attr.status === "stuck") {
        throw new Error(`Attribute "${key}" on "${collectionId}" entered status "${attr.status}"`);
      }
    } catch (err) {
      // Keep polling only while the attribute is not yet visible (404).
      // Any other error (401/403/500/...) is real — surface it immediately.
      if (!(err instanceof AppwriteException) || err.code !== 404) throw err;
    }
    await sleep(1000);
  }
  throw new Error(`Timed out waiting for attribute "${key}" on "${collectionId}"`);
}

/* ------------------------------------------------------------------ */
/*  Provisioning steps                                                 */
/* ------------------------------------------------------------------ */

async function ensureDatabase(databases) {
  try {
    await databases.get(DATABASE_ID);
    console.log(`  ${yellow("exists")}  database "${DATABASE_NAME}" (${DATABASE_ID})`);
    return;
  } catch (err) {
    if (err.code !== 404) throw err;
  }

  if (DRY_RUN) {
    console.log(`  ${dim("dry-run")}  would create database "${DATABASE_NAME}" (${DATABASE_ID})`);
    return;
  }

  await databases.create(DATABASE_ID, DATABASE_NAME);
  console.log(`  ${green("created")}  database "${DATABASE_NAME}" (${DATABASE_ID})`);

  // Give the new database a moment to become usable on slower instances.
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      await databases.get(DATABASE_ID);
      return;
    } catch {
      await sleep(500);
    }
  }
}

async function ensureCollections(databases) {
  const list = await databases.listCollections(DATABASE_ID);
  const existing = new Set(list.collections.map((c) => c.$id));

  for (const collection of COLLECTIONS) {
    console.log(`\n${bold(collection.name)}  (${collection.id})`);

    if (existing.has(collection.id)) {
      console.log(`  ${yellow("exists")}  collection`);
    } else if (DRY_RUN) {
      console.log(`  ${dim("dry-run")}  would create collection`);
    } else {
      await databases.createCollection(DATABASE_ID, collection.id, collection.name, [], true, true);
      console.log(`  ${green("created")}  collection`);
    }

    await ensureAttributes(databases, collection);
    await ensureIndexes(databases, collection);
  }
}

async function ensureAttributes(databases, collection) {
  let existing = new Set();
  try {
    const list = await databases.listAttributes(DATABASE_ID, collection.id);
    existing = new Set(list.attributes.map((a) => a.key));
  } catch (err) {
    // A brand-new collection (e.g. dry-run on a collection that doesn't
    // exist yet) reports 404 — treat it as "nothing exists".
    if (!(err instanceof AppwriteException) || err.code !== 404) throw err;
  }

  for (const attr of collection.attributes) {
    if (existing.has(attr.key)) {
      console.log(`  ${dim("exists")}  attribute ${attr.key} (${attr.type})`);
      continue;
    }
    if (DRY_RUN) {
      console.log(`  ${dim("dry-run")}  would create attribute ${attr.key} (${attr.type})`);
      continue;
    }
    await createAttribute(databases, collection.id, attr);
    await waitForAttribute(databases, collection.id, attr.key);
    console.log(`  ${green("created")}  attribute ${attr.key} (${attr.type})`);
  }
}

async function ensureIndexes(databases, collection) {
  let existing = new Set();
  try {
    const list = await databases.listIndexes(DATABASE_ID, collection.id);
    existing = new Set(list.indexes.map((x) => x.key));
  } catch (err) {
    if (!(err instanceof AppwriteException) || err.code !== 404) throw err;
  }

  for (const index of collection.indexes) {
    if (existing.has(index.key)) {
      console.log(`  ${dim("exists")}  index ${index.key} ${index.type}(${index.attributes.join(", ")})`);
      continue;
    }
    if (DRY_RUN) {
      console.log(`  ${dim("dry-run")}  would create index ${index.key} ${index.type}(${index.attributes.join(", ")})`);
      continue;
    }
    await databases.createIndex(DATABASE_ID, collection.id, index.key, index.type, index.attributes, index.orders);
    console.log(`  ${green("created")}  index ${index.key} ${index.type}(${index.attributes.join(", ")})`);
  }
}

async function ensureBuckets(storage) {
  const list = await storage.listBuckets();
  const existing = new Set(list.buckets.map((bucket) => bucket.$id));

  for (const bucket of BUCKETS) {
    if (existing.has(bucket.id)) {
      console.log(`  ${yellow("exists")}  bucket "${bucket.name}" (${bucket.id})`);
      continue;
    }
    if (DRY_RUN) {
      console.log(`  ${dim("dry-run")}  would create bucket "${bucket.name}" (${bucket.id})`);
      continue;
    }
    try {
      await storage.createBucket(
        bucket.id,
        bucket.name,
        [Permission.read(Role.any())], // public read; writes stay server-side only
        false,                          // fileSecurity — bucket-level permissions apply to all files
        true,                           // enabled
        bucket.maxSize,
        bucket.extensions,
      );
      console.log(`  ${green("created")}  bucket "${bucket.name}" (${bucket.id})`);
    } catch (err) {
      // Free plans cap the number of buckets (usually 1). Don't abort the
      // whole run — report it and move on; the DB schema is unaffected.
      if (err && err.code === 403 && /bucket/i.test(err.message || "")) {
        console.log(`  ${yellow("skipped")}  bucket "${bucket.name}" (${bucket.id}) — plan bucket limit reached`);
        console.log(dim(`    ${err.message} — upgrade the plan or consolidate buckets in BUCKETS.`));
        continue;
      }
      throw err;
    }
  }
  console.log(dim("\nNote: on plans with a 1-bucket limit, uploads for events/galleries/notices"));
  console.log(dim("can share a single bucket — see the BUCKETS array at the top of this script."));
}

/* ------------------------------------------------------------------ */
/*  Entry point                                                        */
/* ------------------------------------------------------------------ */

async function main() {
  console.log(bold("\nNITER Club — Appwrite provisioning"));
  console.log(dim(`Target: ${APPWRITE_ENDPOINT || "(unset)"} | Project: ${APPWRITE_PROJECT_ID || "(unset)"}`));
  if (DRY_RUN) console.log(yellow("Dry run — no changes will be made.\n"));

  const missing = [];
  if (!APPWRITE_ENDPOINT) missing.push("APPWRITE_ENDPOINT");
  if (!APPWRITE_PROJECT_ID) missing.push("APPWRITE_PROJECT_ID");
  if (!APPWRITE_API_KEY) missing.push("APPWRITE_API_KEY");
  if (missing.length > 0) {
    console.error(red(`Missing environment variable(s): ${missing.join(", ")}`));
    console.error(red('Copy ".env.example" to ".env", fill in the values, then re-run.'));
    process.exit(1);
  }

  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);
  if (APPWRITE_SELF_SIGNED === "true") client.setSelfSigned(true);

  const databases = new Databases(client);
  const storage = new Storage(client);

  // Validate credentials and scopes before touching anything.
  try {
    await databases.list();
  } catch (err) {
    console.error(red("Could not reach Appwrite with the given credentials:"));
    console.error(red(`  ${describeError(err)}`));
    process.exit(1);
  }
  console.log(green("✔ Connected to Appwrite.\n"));

  console.log(bold("Database"));
  await ensureDatabase(databases);

  console.log(bold("\nCollections, attributes & indexes"));
  await ensureCollections(databases);

  console.log(bold("\nStorage buckets"));
  await ensureBuckets(storage);

  console.log(`\n${green("✔ Done.")}${DRY_RUN ? " (dry run — nothing was changed)" : ""}`);
  if (!DRY_RUN) {
    console.log(dim("Verify in the Appwrite Console → Database and Storage, or use the connected MCP server."));
  }
}

main().catch((err) => {
  console.error(red("\n✖ Setup failed:"));
  console.error(red(`  ${describeError(err)}`));
  process.exit(1);
});
