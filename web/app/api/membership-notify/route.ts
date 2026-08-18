import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Recipient = { email: string; name?: string };

interface MembershipNotifyBody {
  clubId?: string;
  clubName?: string;
  studentName?: string;
  studentEmail?: string;
  studentId?: string;
  formTitle?: string;
  recipients?: Recipient[];
  url?: string;
}

/**
 * POST /api/membership-notify
 *
 * Emails the club's admin and moderators when a student submits a membership
 * form. Uses the same FormSubmit provider as other notification endpoints.
 *
 * Configure via env vars:
 *
 *   MEMBERSHIP_EMAIL_NOTIFY      "off" disables sending entirely
 *   MEMBERSHIP_EMAIL_PROVIDER    "formsubmit" (default) | "off"
 *   MEMBERSHIP_EMAIL_SUBJECT     subject prefix (default "[NITER Clubs]")
 */
export async function POST(req: Request) {
  let body: MembershipNotifyBody;
  try {
    body = (await req.json()) as MembershipNotifyBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400 });
  }

  const recipients = Array.isArray(body.recipients)
    ? body.recipients.filter((r) => r && r.email)
    : [];
  const enabled = process.env.MEMBERSHIP_EMAIL_NOTIFY !== "off";
  if (!enabled || !recipients.length) {
    return NextResponse.json({
      ok: true,
      sent: 0,
      skipped: enabled ? "no recipients" : "disabled",
    });
  }

  const provider = process.env.MEMBERSHIP_EMAIL_PROVIDER || "formsubmit";
  const prefix = process.env.MEMBERSHIP_EMAIL_SUBJECT || "[NITER Clubs]";
  const subject = `${prefix} New membership request — ${body.clubName || "a club"}`;
  const text =
    `A student has submitted a membership form for your club.\n\n` +
    `Club: ${body.clubName || body.clubId || "Unknown"}\n` +
    `Form: ${body.formTitle || "Membership Form"}\n` +
    `Student: ${body.studentName || "Unknown"} (${body.studentEmail || ""})\n` +
    `Student ID: ${body.studentId || "Not provided"}\n\n` +
    `To approve or reject this request, go to:\n` +
    `${body.url || "(portal URL)"}\n\n` +
    `Log in → Portal → Memberships tab`;

  let sent = 0;
  const failures: string[] = [];
  for (const r of recipients) {
    try {
      if (provider === "formsubmit") {
        const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(r.email)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            _subject: subject,
            name: r.name || r.email,
            message: text,
            _template: "table",
          }),
        });
        if (res.ok) sent++;
        else failures.push(`${r.email} (HTTP ${res.status})`);
      } else {
        failures.push(`${r.email} (provider '${provider}' not configured)`);
      }
    } catch (e) {
      failures.push(`${r.email} (${e instanceof Error ? e.message : "network error"})`);
    }
  }

  return NextResponse.json({ ok: true, sent, failed: failures.length, failures });
}
