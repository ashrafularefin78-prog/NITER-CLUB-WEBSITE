import { NextResponse } from "next/server";
import { Client, Databases, ID, Query } from "node-appwrite";
import { CORS_HEADERS, handlePreflight } from "@/lib/api-cors";

export const runtime = "nodejs";

const DATABASE_ID = "niter_club";
const COLLECTION_ID = "users";

interface UserBody {
  email?: string;
  name?: string;
  studentId?: string;
  department?: string;
  role?: string;
  clubs?: string[];
}

/** Derive the department label from a student ID prefix, e.g. CS → CSE. */
function deptFromId(studentId: string): string {
  const m = /^([A-Za-z]{1,5})/.exec(studentId || "");
  const code = m ? m[1].toUpperCase() : "";
  if (code === "TE") return "Textile Engineering (TE)";
  if (code === "CS" || code === "CSE") return "Computer Science & Engineering (CSE)";
  return "";
}

/**
 * POST /api/users
 *
 * Upserts a student account into the Appwrite `users` collection — the
 * cross-platform registry mirror of the site's own accounts (Firebase /
 * localStorage). Called on sign-up and sign-in; the site's real auth stays
 * where it is, Appwrite just records who is who (name, email, student ID,
 * department, role).
 *
 * Idempotent by email. Never stores passwords — passwordHash stays empty.
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

  let body: UserBody;
  try {
    body = (await req.json()) as UserBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400, headers: CORS_HEADERS });
  }

  const email = String(body.email || "").trim().toLowerCase();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "a valid email is required" }, { status: 400, headers: CORS_HEADERS });
  }

  const studentId = String(body.studentId || "").trim();
  const payload: Record<string, unknown> = {
    name: String(body.name || email).slice(0, 255),
    email,
    // The site's real auth stays Firebase/local — Appwrite is a registry only,
    // so the required passwordHash column gets an empty placeholder.
    passwordHash: "",
    role: body.role === "executive" || body.role === "admin" ? body.role : "member",
    department: String(body.department || deptFromId(studentId) || "").slice(0, 128),
    // The Appwrite column is required + unique — always send it. Every site
    // account has a student ID (the forms enforce it); the empty default is
    // only for registry rows that somehow lack one.
    studentId: studentId.slice(0, 64),
  };

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  try {
    const match = await databases.listDocuments({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID,
      queries: [Query.equal("email", email), Query.limit(1)],
    });

    let id: string;
    if (match.documents.length) {
      const existing = match.documents[0];
      await databases.updateDocument(DATABASE_ID, COLLECTION_ID, existing.$id, payload);
      id = existing.$id;
    } else {
      const created = await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), payload);
      id = created.$id;
    }

    return NextResponse.json({ ok: true, id }, { headers: CORS_HEADERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 502, headers: CORS_HEADERS });
  }
}
