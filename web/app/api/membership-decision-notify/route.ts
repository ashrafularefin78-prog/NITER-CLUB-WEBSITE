import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface MembershipDecisionNotifyBody {
  studentEmail?: string;
  studentName?: string;
  clubName?: string;
  status?: "approved" | "rejected";
  reviewerName?: string;
}

/**
 * POST /api/membership-decision-notify
 *
 * Emails the student when their membership request is approved or rejected.
 *
 * Configure via env vars:
 *
 *   MEMBERSHIP_DECISION_EMAIL_NOTIFY      "off" disables sending entirely
 *   MEMBERSHIP_DECISION_EMAIL_PROVIDER    "formsubmit" (default) | "off"
 *   MEMBERSHIP_DECISION_EMAIL_SUBJECT     subject prefix (default "[NITER Clubs]")
 */
export async function POST(req: Request) {
  let body: MembershipDecisionNotifyBody;
  try {
    body = (await req.json()) as MembershipDecisionNotifyBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400 });
  }

  const studentEmail = body.studentEmail || "";
  const enabled = process.env.MEMBERSHIP_DECISION_EMAIL_NOTIFY !== "off";
  if (!enabled || !studentEmail) {
    return NextResponse.json({
      ok: true,
      sent: 0,
      skipped: enabled ? "no student email" : "disabled",
    });
  }

  const provider = process.env.MEMBERSHIP_DECISION_EMAIL_PROVIDER || "formsubmit";
  const prefix = process.env.MEMBERSHIP_DECISION_EMAIL_SUBJECT || "[NITER Clubs]";
  const isApproved = body.status === "approved";
  const subject = `${prefix} Membership ${isApproved ? "Approved" : "Rejected"} — ${body.clubName || "a club"}`;
  const text = isApproved
    ? `Congratulations! Your membership request for ${body.clubName || "the club"} has been approved.\n\n` +
      `You are now a member of ${body.clubName || "the club"}. Welcome aboard!\n\n` +
      `Reviewed by: ${body.reviewerName || "Club admin"}\n\n` +
      `You can now access the club portal and participate in club activities.`
    : `We regret to inform you that your membership request for ${body.clubName || "the club"} has been rejected.\n\n` +
      `Reviewed by: ${body.reviewerName || "Club admin"}\n\n` +
      `If you have any questions, please contact the club administration.`;

  try {
    if (provider === "formsubmit") {
      const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(studentEmail)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: subject,
          name: body.studentName || studentEmail,
          message: text,
          _template: "table",
        }),
      });
      if (res.ok) {
        return NextResponse.json({ ok: true, sent: 1 });
      }
      return NextResponse.json({ ok: true, sent: 0, failed: 1, failures: [`HTTP ${res.status}`] });
    }
    return NextResponse.json({ ok: true, sent: 0, failed: 1, failures: [`provider '${provider}' not configured`] });
  } catch (e) {
    return NextResponse.json({ ok: true, sent: 0, failed: 1, failures: [e instanceof Error ? e.message : "network error"] });
  }
}
