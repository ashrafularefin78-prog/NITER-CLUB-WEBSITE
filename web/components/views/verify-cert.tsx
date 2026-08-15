"use client";

import Link from "next/link";
import { useState } from "react";
import { useDb } from "@/lib/store";
import { certById } from "@/lib/events";
import { fmtDate, fmtDateTime } from "@/lib/utils";
import { PageHero, Skeleton } from "@/components/ui";
import { useToast } from "@/components/providers";

export default function VerifyCertView({ certId }: { certId: string }) {
  const db = useDb();
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  if (!db) return <VerifySkeleton />;
  const cert = certById(db, certId);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.toast("Verification link copied.", "ok");
    } catch {
      toast.toast("Couldn't copy — select the URL manually.", "err");
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Verification"
        title="🛡 Certificate verification"
        sub="Recruiters, faculty and anyone with this link can confirm a certificate is genuine — issued by the NITER Clubs Portal, not forged."
      />

      <div className="container-x py-10">
        {cert ? (
          <div className="mx-auto max-w-3xl">
            {/* status banner */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <p className="m-0 text-[15px] font-bold text-emerald-800 dark:text-emerald-300">
                ✓ VALID CERTIFICATE — issued by NITER Clubs Portal
              </p>
              <p className="m-0 mt-1 text-[12.5px] text-muted">
                Serial <code className="rounded bg-white/70 px-1.5 py-0.5 font-mono text-[12px] dark:bg-white/10">{cert.id}</code> · issued{" "}
                {fmtDateTime(cert.issuedAt)}
              </p>
            </div>

            {/* printable certificate */}
            <div className="cert-sheet mt-6">
              <div className="cert-frame">
                <div className="flex items-center justify-between gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/logo-niter.png" alt="NITER crest" className="h-16 w-16 rounded-full bg-white object-contain p-0.5" />
                  <div className="text-center">
                    <p className="cert-eyebrow">National Institute of Textile Engineering and Research</p>
                    <h1 className="cert-title">Certificate of Participation</h1>
                  </div>
                  <span className="text-4xl" aria-hidden="true">
                    🎓
                  </span>
                </div>
                <div className="cert-body">
                  <p className="cert-line">This is to certify that</p>
                  <p className="cert-name">{cert.name}</p>
                  <p className="cert-line">
                    participated in <b>{cert.eventTitle}</b>
                    {cert.studentId ? (
                      <>
                        {" "}
                        (Student ID: <span className="font-mono">{cert.studentId}</span>)
                      </>
                    ) : null}{" "}
                    organized by <b>{cert.clubName}</b> on {fmtDate(cert.eventDate)}.
                  </p>
                  <p className="cert-sub">Attendance was verified by digital check-in at the event.</p>
                </div>
                <div className="flex items-end justify-between gap-3">
                  <div className="cert-sign">
                    <div className="cert-sign-line" />
                    <p className="m-0 text-[11px] font-semibold text-muted">NITER Clubs Portal</p>
                  </div>
                  <p className="m-0 text-right font-mono text-[10.5px] text-muted">
                    Serial: {cert.id}
                    <br />
                    Verify: /verify/{cert.id}
                  </p>
                </div>
              </div>
            </div>

            <div className="print-hide mt-6 flex flex-wrap justify-center gap-3">
              <button className="btn btn-primary" onClick={() => window.print()}>
                🖨 Print / Save as PDF
              </button>
              <button className="btn btn-outline" onClick={copyLink}>
                {copied ? "✓ Copied" : "🔗 Copy verification link"}
              </button>
              <Link href="/events" className="btn btn-ghost no-underline">
                ← All events
              </Link>
            </div>
          </div>
        ) : (
          <div className="card mx-auto max-w-md p-8 text-center">
            <div className="text-6xl">🚫</div>
            <h1 className="mt-4 text-xl font-bold text-ink">Certificate not found</h1>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">
              The code <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono">{certId}</code> does not
              match any certificate issued by the NITER Clubs Portal. If you believe this is a mistake, contact
              the club that organized the event.
            </p>
            <Link href="/" className="btn btn-primary mt-5 no-underline">
              Go home
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

function VerifySkeleton() {
  return (
    <div className="container-x py-14">
      <Skeleton className="h-10 w-80" />
      <div className="mx-auto mt-8 max-w-3xl">
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}
