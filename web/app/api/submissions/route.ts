import { NextResponse } from "next/server";
import { Client, Databases, ID, Query } from "node-appwrite";
import { CORS_HEADERS, handlePreflight } from "@/lib/api-cors";

export const runtime = "nodejs";

const DATABASE_ID = "niter_club";
const COLLECTION_ID = "submissions";
const MAX_DATA = 15000;

interface SubmissionBody {
  formId?: string;
  clubId?: string;
  data?: Record<string, string>;
  submitterName?: string;
  submitterEmail?: string;
  submitterStudentId?: string;
  userId?: string;
  submittedAt?: string;
  id?: string;
}

/**
 * POST /api/submissions
 *
 * Saves a club form fill-up to the Appwrite `submissions` collection — the
 * mirror of the site's local save. Called by both this app and the static
 * main site (index.html) after the local save succeeds, so a slow or offline
 * Appwrite never blocks the student.
 *
 * Idempotent per (formId, submitterEmail): an existing row is updated with
 * the latest answers instead of duplicating. Photo data-URLs are dropped
 * (they don't belong in a text mirror; photos stay with the local/Firestore
 * copy) and the payload is capped.
 *
 * Environment: APPWRITE_ENDPOINT / APPWRITE_PROJECT_ID / APPWRITE_API_KEY
 * (server-only). Returns `{ ok: false, disabled: true }` when unconfigured.
 */
export async function POST(req: Request) {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  const endpoint = process.env.APPWRITE_ENDPOINT || "";
  const projectId = process.env.APPWRITE_PROJECT_ID || "";
  const apiKey = process.env.APPWRITE_API_KEY || "";
  if (!endpoint || !projectId || !apiKey) {
    return NextResponse.json({ ok: false, disabled: true }, { headers: CORS_HEADERS });
  }

  let body: SubmissionBody;
  try {
    body = (await req.json()) as SubmissionBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400, headers: CORS_HEADERS });
  }

  const formId = String(body.formId || "").trim();
  const clubId = String(body.clubId || "").trim();
  if (!formId || !clubId) {
    return NextResponse.json({ ok: false, error: "formId and clubId are required" }, { status: 400, headers: CORS_HEADERS });
  }

  // Drop photo data-URLs and oversized values, then cap the serialized size.
  const data: Record<string, string> = {};
  for (const [k, v] of Object.entries(body.data ?? {})) {
    const val = String(v ?? "");
    if (!val) continue;
    if (val.startsWith("data:")) continue; // photo data-URL — keep only the local copy
    data[k] = val.slice(0, 2000);
  }
  let dataJson = JSON.stringify(data);
  if (dataJson.length > MAX_DATA) dataJson = dataJson.slice(0, MAX_DATA);

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  try {
    const email = String(body.submitterEmail || "").trim().toLowerCase();
    const match = email
      ? await databases.listDocuments({
          databaseId: DATABASE_ID,
          collectionId: COLLECTION_ID,
          queries: [Query.equal("formId", formId), Query.equal("submitterEmail", email), Query.limit(1)],
        })
      : null;

    const payload: Record<string, unknown> = {
      formId,
      clubId,
      data: dataJson,
      submittedAt: body.submittedAt || new Date().toISOString(),
    };
    if (body.submitterName) payload.submitterName = body.submitterName.slice(0, 255);
    if (email) payload.submitterEmail = email;
    if (body.submitterStudentId) payload.submitterStudentId = body.submitterStudentId.slice(0, 64);
    if (body.userId) payload.userId = body.userId.slice(0, 255);

    let docId: string;
    if (match && match.documents.length) {
      const existing = match.documents[0];
      await databases.updateDocument(DATABASE_ID, COLLECTION_ID, existing.$id, payload);
      docId = existing.$id;
    } else {
      const created = await databases.createDocument(DATABASE_ID, COLLECTION_ID, body.id || ID.unique(), payload);
      docId = created.$id;
    }

    return NextResponse.json({ ok: true, id: docId }, { headers: CORS_HEADERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 502, headers: CORS_HEADERS });
  }
}
