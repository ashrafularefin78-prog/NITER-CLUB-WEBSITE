import { NextResponse } from "next/server";

export const runtime = "nodejs";

type AdminRecipient = { email: string; name?: string };

interface ModeratorNotifyBody {
  clubId?: string;
  clubName?: string;
  requesterName?: string;
  requesterEmail?: string;
  studentId?: string;
  adminEmails?: AdminRecipient[];
  url?: string;
}

/**
 * POST /api/moderator-notify
 *
 * Emails the club admin(s) whenever a student requests to become a club
 * moderator. Uses the same FormSubmit provider as committee-notify.
 *
 * Configure via env vars:
 *
 *   MODERATOR_EMAIL_NOTIFY      "off" disables sending entirely
 *   MODERATOR_EMAIL_PROVIDER    "formsubmit" (default) | "off"
 *   MODERATOR_EMAIL_SUBJECT     subject prefix (default "[NITER Clubs]")
 */
export async function POST(req: Request) {
  let body: ModeratorNotifyBody;
  try {
    body = (await req.json()) as ModeratorNotifyBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400 });
  }

  const recipients = Array.isArray(body.adminEmails)
    ? body.adminEmails.filter((r) => r && r.email)
    : [];
  const enabled = process.env.MODERATOR_EMAIL_NOTIFY !== "off";
  if (!enabled || !recipients.length) {
    return NextResponse.json({
      ok: true,
      sent: 0,
      skipped: enabled ? "no recipients" : "disabled",
    });
  }

  const provider = process.env.MODERATOR_EMAIL_PROVIDER || "formsubmit";
  const prefix = process.env.MODERATOR_EMAIL_SUBJECT || "[NITER Clubs]";
  const subject = `${prefix} New moderator request — ${body.clubName || "a club"}`;
  const text =
    `A student has requested to become a club moderator.\n\n` +
    `Club: ${body.clubName || body.clubId || "Unknown"}\n` +
    `Student: ${body.requesterName || "Unknown"} (${body.requesterEmail || ""})\n` +
    `Student ID: ${body.studentId || "Not provided"}\n\n` +
    `To approve or reject this request, go to:\n` +
    `${body.url || "(portal URL)"}\n\n` +
    `Log in as admin → Portal → Settings → Moderator requests`;

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
