#!/usr/bin/env node
/**
 * seed-students.mjs
 * -----------------
 * Imports the official student roster into the Appwrite `students`
 * collection — the reference list used to verify student IDs.
 *
 * The roster is NOT duplicated here: it is loaded from
 * `../web/lib/seed.json` (the same single source of truth the website
 * uses), so any roster update in the web app is picked up automatically.
 *
 * The collection is provisioned by setup-appwrite.mjs; run `npm run setup`
 * first if it doesn't exist yet.
 *
 * The script is IDEMPOTENT: it queries by studentId and skips rows that
 * are already present, so re-running is safe and only imports what's
 * missing.
 *
 * Usage:
 *   cd appwrite
 *   npm run seed:students          # import
 *   npm run seed:students:dry-run  # preview without writing
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
const COLLECTION_ID = "students";

/* Full roster from the web app's seed data (single source of truth).
   ID format: CS (dept) + 26 (batch year) + 07 (NITER dept code for CSE) +
   roll number, e.g. CS-2607001. Textile rows use TE + their own codes. */
const ROSTER_PATH = new URL("../web/lib/seed.json", import.meta.url);
const ROSTER = JSON.parse(readFileSync(ROSTER_PATH, "utf8")).students || [];

const STUDENTS = ROSTER.map((s) => ({
  sl: s.sl,
  merit: s.merit,
  id: s.id,
  name: s.name,
  department: s.department || "CSE",
  session: s.session || "2025-2026",
  section: s.section || "",
}));

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

async function main() {
  if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
    console.error(red("Missing Appwrite config — copy .env.example to .env and fill it in."));
    process.exit(1);
  }

  // Make sure the collection exists (provision with `npm run setup`).
  try {
    await databases.getCollection(DATABASE_ID, COLLECTION_ID);
  } catch (err) {
    console.error(
      red(`Collection "${COLLECTION_ID}" not found in database "${DATABASE_ID}".`) +
        "\n  Run `npm run setup` first to provision it, then retry."
    );
    process.exit(1);
  }

  console.log(dim(`Roster: ${STUDENTS.length} students from ${ROSTER_PATH.pathname.split("/").slice(-2).join("/")}`));

  let created = 0;
  let skipped = 0;

  for (const st of STUDENTS) {
    const existing = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal("studentId", st.id),
    ], 1);

    if (existing.total > 0) {
      skipped++;
      console.log(`  ${yellow("skip")}  ${st.id} (already present)`);
      continue;
    }

    if (DRY_RUN) {
      console.log(`  ${dim("dry-run")}  would create ${st.id} — ${st.name}`);
      created++;
      continue;
    }

    await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
      name: st.name,
      studentId: st.id,
      merit: st.merit,
      sl: st.sl,
      department: st.department,
      session: st.session,
      ...(st.section ? { section: st.section } : {}),
    });
    created++;
  }

  console.log(
    `\nDone: ${green(created + " created")}, ${yellow(skipped + " already present")} (${STUDENTS.length} total).` +
      (DRY_RUN ? "  Dry run — nothing was written." : "")
  );
}

main().catch((err) => {
  console.error(red("Seed failed: " + (err instanceof Error ? err.message : String(err))));
  process.exit(1);
});
