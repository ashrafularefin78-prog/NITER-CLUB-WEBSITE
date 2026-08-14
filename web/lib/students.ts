import type { Database, Student } from "./types";

export interface ParsedStudentId {
  dept: string;
  batch: string;
  deptCode: string;
  roll: string;
}

export type StudentCheck =
  | { ok: true; student: Student }
  | { ok: false; reason: "missing" | "format" | "notfound" };

/**
 * Break a student ID into its parts — <dept> <batch> <deptCode> <roll>, e.g.
 * CS-2607001 → CS (CSE), 26 (batch year), 07 (NITER dept code for CSE), 001
 * (department roll number). Returns null when structurally invalid.
 * Separators (dashes/spaces) are ignored.
 */
export function parseStudentId(id: string | null | undefined): ParsedStudentId | null {
  if (!id) return null;
  const norm = String(id).trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  const m = norm.match(/^([A-Z]{1,5})(\d{2})(\d{2})(\d{1,4})$/);
  if (!m) return null;
  return { dept: m[1], batch: m[2], deptCode: m[3], roll: m[4] };
}

function normId(id: string): string {
  return String(id).trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Verify a student ID against the official CSE 2025-2026 roster. */
export function verifyStudentId(db: Database, id: string | null | undefined): StudentCheck {
  if (!id) return { ok: false, reason: "missing" };
  const norm = normId(id);
  if (!parseStudentId(norm)) return { ok: false, reason: "format" };
  const hit = (db.students || []).find((s) => normId(s.id) === norm);
  return hit ? { ok: true, student: hit } : { ok: false, reason: "notfound" };
}

/** Friendly explanation for a failed student-ID check. */
export function studentIdError(sid: string, reason: "missing" | "format" | "notfound"): string {
  if (reason === "format") {
    return "That doesn\u2019t look like a NITER student ID. Format: <Dept><Batch><DeptCode><Roll> — e.g. CS-2607001 (CS = CSE, 26 = batch year, 07 = NITER CSE dept code, 001 = department roll).";
  }
  if (reason === "notfound") {
    return `Student ID \u201c${sid}\u201d was not found in the CSE 2025-2026 student directory. Double-check it (format like CS-2607001) or contact the club.`;
  }
  return "Enter your NITER student ID — it must match the student directory.";
}

/* Session lookup by <DEPT><BATCH> — from the source lists: CS-25xx → 2024–2025
   (CSE Sec A list), CS-26xx → 2025–2026 (official CSE 2025-2026 roster),
   TE-26xx → 2026–2027 (Textile sections list). */
const SESSION_BY_KEY: Record<string, string> = {
  CS25: "2024–2025",
  CS26: "2025–2026",
  TE26: "2026–2027",
};

/** Confirmation text for a successfully verified student ID — name, department,
 *  session (which batch they belong to) and section, e.g.
 *  "RUFAIDA TASNIM HOQ ADIBA · Textile Engineering · Session 2026–2027 · Sec A". */
export function studentVerifiedText(s: Student): string {
  const m = String(s?.id || "").toUpperCase().replace(/[^A-Z0-9]/g, "").match(/^([A-Z]{1,5})(\d{2})/);
  const key = m ? m[1] + m[2] : "";
  const dept = m ? (m[1] === "TE" ? "Textile Engineering" : "Computer Science & Engineering") : s?.department || "";
  const session = SESSION_BY_KEY[key] || (m ? `20${m[2]}–20${Number(m[2]) + 1}` : s?.session || "");
  const bits = [s?.name || "", dept];
  if (session) bits.push(`Session ${session}`);
  if (s?.section) bits.push(`Sec ${s.section}`);
  return bits.filter(Boolean).join(" · ");
}
