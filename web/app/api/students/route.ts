import { NextResponse } from "next/server";
import { Client, Databases, Query } from "node-appwrite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATABASE_ID = "niter_club";
const COLLECTION_ID = "students";
const PAGE_SIZE = 100;

interface AppwriteStudentDoc {
  studentId?: string;
  name?: string;
  sl?: number;
  merit?: number;
  department?: string;
  session?: string;
  section?: string;
}

/**
 * GET /api/students
 *
 * Serves the live student roster from the Appwrite `students` collection —
 * the same backend provisioned and seeded by `appwrite/setup-appwrite.mjs`
 * and `appwrite/seed-students.mjs`. Server-side only: the Appwrite API key
 * lives in the environment (web/.env.local) and never reaches the browser.
 *
 * Environment:
 *   APPWRITE_ENDPOINT     e.g. https://sgp.cloud.appwrite.io/v1
 *   APPWRITE_PROJECT_ID
 *   APPWRITE_API_KEY      server key with databases.read
 *
 * When Appwrite isn't configured the route returns `{ ok: false, disabled:
 * true }` and the client falls back to its bundled roster.
 */
export async function GET() {
  const endpoint = process.env.APPWRITE_ENDPOINT || "";
  const projectId = process.env.APPWRITE_PROJECT_ID || "";
  const apiKey = process.env.APPWRITE_API_KEY || "";

  if (!endpoint || !projectId || !apiKey) {
    return NextResponse.json({ ok: false, disabled: true });
  }

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  try {
    const students: Record<string, unknown>[] = [];
    let cursorId: string | undefined;
    for (;;) {
      const queries = [Query.limit(PAGE_SIZE)];
      if (cursorId) queries.push(Query.cursorAfter(cursorId));
      const page = await databases.listDocuments({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID,
        queries,
      });
      const docs = page.documents as unknown as (Record<string, unknown> & { $id: string })[];
      students.push(...docs);
      if (students.length >= page.total || !docs.length) break;
      cursorId = docs[docs.length - 1].$id;
    }

    const roster = students
      .map((d) => {
        const doc = d as unknown as AppwriteStudentDoc;
        return {
          id: doc.studentId || "",
          name: doc.name || "",
          sl: typeof doc.sl === "number" ? doc.sl : 0,
          merit: typeof doc.merit === "number" ? doc.merit : 0,
          department: doc.department || undefined,
          session: doc.session || undefined,
          section: doc.section || undefined,
        };
      })
      .filter((s) => s.id)
      .sort((a, b) => a.sl - b.sl);

    return NextResponse.json({ ok: true, students: roster, total: roster.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
