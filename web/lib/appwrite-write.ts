"use client";

import type { Submission } from "./types";

/**
 * Best-effort mirrors of site writes to the Appwrite backend. The local /
 * Firestore save is always primary — these fire-and-forget calls never block
 * the UI and swallow every failure (offline, server down, Appwrite disabled).
 */

export async function mirrorSubmission(sub: Submission): Promise<void> {
  try {
    await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: sub.id,
        formId: sub.formId,
        clubId: sub.clubId,
        data: sub.data,
        submittedAt: sub.submittedAt,
        submitterName: sub.submitterName,
        submitterEmail: sub.submitterEmail,
        submitterStudentId: sub.submitterStudentId,
        userId: sub.userId,
      }),
    });
  } catch {
    /* mirror is optional */
  }
}

export async function mirrorUser(user: {
  email: string;
  name?: string;
  studentId?: string;
  role?: string;
}): Promise<void> {
  try {
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        name: user.name,
        studentId: user.studentId,
        role: user.role,
      }),
    });
  } catch {
    /* mirror is optional */
  }
}
