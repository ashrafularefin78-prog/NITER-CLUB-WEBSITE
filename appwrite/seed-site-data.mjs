#!/usr/bin/env node
/**
 * seed-site-data.mjs
 * ------------------
 * Imports the website's club forms and their submissions into the Appwrite
 * backend — the same collections the live API routes write to
 * (`/api/forms`-style writes happen via `/api/submissions`). Data comes from
 * `../web/lib/seed.json` (single source of truth), so re-running just syncs
 * what's missing.
 *
 * Prerequisite: `npm run setup` (provisions the `forms` + `submissions`
 * collections).
 *
 * Usage:
 *   cd appwrite
 *   npm run seed:site           # import what's missing (idempotent)
 *   npm run seed:site:dry-run   # preview without writing
 */

import "dotenv/config";
import { readFileSync } from "node:fs";
import { Client, Databases, ID, Query } from "node-appwrite";

const {
  APPWRITE_ENDPOINT = "",
  APPWRITE_PROJECT_ID = "",
  APPWRITE_API_KEY = "",
  APPWRITE_SELF_SIGNED = "false",
} = process.env;

const DRY_RUN = process.argv.includes("--dry-run");

const DATABASE_ID = "niter_club";

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY)
  .setSelfSigned(APPWRITE_SELF_SIGNED === "true");

const databases = new Databases(client);

const SEED = JSON.parse(readFileSync(new URL("../web/lib/seed.json", import.meta.url), "utf8"));
const FORMS = SEED.forms || [];
const SUBMISSIONS = SEED.submissions || [];

async function main() {
  if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
    console.error(red("Missing Appwrite config — copy .env.example to .env and fill it in."));
    process.exit(1);
  }

  /* ---------------- forms ---------------- */
  console.log(boldLine("Forms"));
  let formsCreated = 0;
  let formsSkipped = 0;
  for (const f of FORMS) {
    const existing = await databases.listDocuments({
      databaseId: DATABASE_ID,
      collectionId: "forms",
      queries: [Query.equal("clubId", f.clubId), Query.equal("title", f.title), Query.limit(1)],
    });
    if (existing.documents.length) {
      formsSkipped++;
      console.log(`  ${yellow("skip")}  ${f.clubId} — ${f.title}`);
      continue;
    }
    if (DRY_RUN) {
      console.log(`  ${dim("dry-run")}  would create form ${f.clubId} — ${f.title}`);
      formsCreated++;
      continue;
    }
    await databases.createDocument(DATABASE_ID, "forms", f.id || ID.unique(), {
      clubId: f.clubId,
      title: f.title,
      description: f.description || "",
      openAt: f.openAt || "",
      deadline: f.deadline || "",
      fields: JSON.stringify(f.fields || []),
    });
    formsCreated++;
    console.log(`  ${green("create")}  ${f.clubId} — ${f.title}`);
  }

  /* ---------------- submissions ---------------- */
  console.log(boldLine("Submissions"));
  let subsCreated = 0;
  let subsSkipped = 0;
  for (const s of SUBMISSIONS) {
    const email = String(s.submitterEmail || "").trim().toLowerCase();
    // Idempotent by the submission's own id (the site generates stable ids).
    if (s.id) {
      try {
        await databases.getDocument(DATABASE_ID, "submissions", s.id);
        subsSkipped++;
        console.log(`  ${yellow("skip")}  ${s.formId} (${email || "anonymous"}) — already present`);
        continue;
      } catch (err) {
        if (!err || err.code !== 404) throw err;
      }
    }
    if (DRY_RUN) {
      console.log(`  ${dim("dry-run")}  would create submission ${s.formId} (${email || "anonymous"})`);
      subsCreated++;
      continue;
    }
    const data = {};
    for (const [k, v] of Object.entries(s.data || {})) {
      if (String(v).startsWith("data:")) continue; // drop photo data-URLs
      data[k] = v;
    }
    await databases.createDocument(DATABASE_ID, "submissions", s.id || ID.unique(), {
      formId: s.formId,
      clubId: s.clubId || "",
      data: JSON.stringify(data),
      submittedAt: s.submittedAt || "",
      submitterName: s.submitterName || "",
      submitterEmail: email,
      submitterStudentId: s.submitterStudentId || "",
      userId: s.userId || "",
    });
    subsCreated++;
    console.log(`  ${green("create")}  ${s.formId} (${email || "anonymous"})`);
  }

  console.log(
    `\nDone: ${green("forms " + formsCreated + " created / " + formsSkipped + " existing")}, ` +
      `${green("submissions " + subsCreated + " created / " + subsSkipped + " existing")}.` +
      (DRY_RUN ? "  Dry run — nothing was written." : "")
  );
}

function boldLine(t) {
  return `\n\x1b[1m${t}\x1b[0m`;
}

main().catch((err) => {
  console.error(red("Seed failed: " + (err instanceof Error ? err.message : String(err))));
  process.exit(1);
});
