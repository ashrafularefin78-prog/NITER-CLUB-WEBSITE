import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Recipient = { email: string; name?: string };

interface NotifyBody {
  clubName?: string;
  editor?: string;
  summary?: string;
  url?: string;
  to?: Recipient[];
}

/**
 * POST /api/committee-notify
 *
 * Emails the club's moderators whenever the committee is saved, naming the
 * editor and what changed. No mail infrastructure is bundled with the project,
 * so the default provider is FormSubmit's AJAX endpoint — free, zero-config
 * and CORS-enabled (the first email to each address asks the owner to confirm
 * it). Configure via env vars on the server:
 *
 *   COMMITTEE_EMAIL_NOTIFY      "off" disables sending entirely
 *   COMMITTEE_EMAIL_PROVIDER    "formsubmit" (default) | "off"
 *   COMMITTEE_EMAIL_SUBJECT     subject prefix (default "[NITER Clubs]")
 *
 * To use another provider (Resend, SendGrid, SMTP…), extend the `provider`
 * branch below — the body already carries everything a template needs.
 */
export async function POST(req: Request) {
  let body: NotifyBody;
  try {
    body = (await req.json()) as NotifyBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400 });
  }

  const recipients = Array.isArray(body.to) ? body.to.filter((r) => r && r.email) : [];
  const enabled = process.env.COMMITTEE_EMAIL_NOTIFY !== "off";
  if (!enabled || !recipients.length) {
    return NextResponse.json({
      ok: true,
      sent: 0,
      skipped: enabled ? "no recipients" : "disabled",
    });
  }

  const provider = process.env.COMMITTEE_EMAIL_PROVIDER || "formsubmit";
  const prefix = process.env.COMMITTEE_EMAIL_SUBJECT || "[NITER Clubs]";
  const subject = `${prefix} Committee updated — ${body.clubName || "a club"}`;
  const text =
    `The executive committee for ${body.clubName || "your club"} was just updated.\n\n` +
    `Edited by: ${body.editor || "a club moderator"}\n` +
    `What changed: ${body.summary || "the committee"}\n\n` +
    `View it: ${body.url || ""}`;

  let sent = 0;
  const failures: string[] = [];
  for (const r of recipients) {
    try {
      if (provider === "formsubmit") {
        const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(r.email)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ _subject: subject, name: r.name || r.email, message: text, _template: "table" }),
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
