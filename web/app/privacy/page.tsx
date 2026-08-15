import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui";

export const metadata: Metadata = {
  title: "Privacy & Data Transparency",
  description:
    "How the NITER Clubs Portal collects, stores and protects student data — and what you can see of it.",
};

const SECTIONS: { icon: string; title: string; body: string }[] = [
  {
    icon: "🗂",
    title: "What we collect",
    body: "Your name, email and NITER student ID (when you sign in or RSVP), form submissions, club membership requests, event attendance and certificates. Nothing is collected from your device beyond what you type in.",
  },
  {
    icon: "🔐",
    title: "Where it lives",
    body: "Data is stored in Firebase (Cloud Firestore + Auth) under the institute's own project. A copy is cached in your browser so the portal works offline and feels instant; it syncs whenever you're online.",
  },
  {
    icon: "👀",
    title: "Who can see what",
    body: "Notices, events, clubs and certificates are public by design — certificates exist so recruiters can verify them. Q&A posts are public too, but you can post anonymously and your email is never shown on the board. Admins and executives moderate the board — they can pin helpful questions, hide spam or abusive answers, and issue warnings to repeat offenders (warnings are visible only to staff). Form submissions, complaints and memberships are visible only to the club's executives and admins. Your profile is visible only to you and admins.",
  },
  {
    icon: "🛡",
    title: "Security model",
    body: "Every read and write is gated by Firestore security rules (admin / club-executive / student scopes). Login attempts are rate-limited, and every sensitive action — sign-ins, submissions, reviews, check-ins, certificate issues — is written to an admin-only audit log with anomaly flags for suspicious patterns like repeated failed logins.",
  },
  {
    icon: "⏳",
    title: "Retention & correction",
    body: "The audit log is capped and pruned automatically. You can update your name and student ID from My Dashboard at any time; contact the club admin to have data removed.",
  },
  {
    icon: "📬",
    title: "Contact",
    body: "For privacy questions, reach the portal admin through the IT helpdesk — Report an issue → Website / Portal.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Trust"
        title="🔎 Privacy & data transparency"
        sub="Most student portals treat your data as an afterthought. Here is exactly what we store, why, who can see it, and what we log — no fine print."
      />
      <div className="container-x py-12">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => (
            <div key={s.title} className="card p-6">
              <div className="text-3xl" aria-hidden="true">
                {s.icon}
              </div>
              <h2 className="m-0 mt-3 text-[16px] font-bold text-ink">{s.title}</h2>
              <p className="m-0 mt-2 text-[13.5px] leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="panel mt-8 p-6">
          <h2 className="m-0 text-[16px] font-bold text-ink">🕵️ The audit log, in plain words</h2>
          <p className="m-0 mt-2 text-[13.5px] leading-relaxed text-muted">
            A tamper-evident, append-only record (admins only) keeps track of <b className="text-ink">who did what,
            when</b>: failed and successful logins, form submissions, complaint filings, membership approvals, event
            creation, check-ins and certificate issuance. The panel surfaces{" "}
            <b className="text-ink">anomaly flags</b> automatically — for example five failed logins for the same
            account within fifteen minutes is flagged as a possible brute-force attempt. This is the same trail that
            backs the leaderboard: every XP point traces back to a logged action.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/leaderboard" className="btn btn-outline btn-sm no-underline">
              See the leaderboard →
            </Link>
            <Link href="/events" className="btn btn-outline btn-sm no-underline">
              RSVP to an event →
            </Link>
            <Link href="/it-support" className="btn btn-ghost btn-sm no-underline">
              Report a privacy concern
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
