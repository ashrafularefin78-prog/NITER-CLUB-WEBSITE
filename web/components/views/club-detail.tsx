"use client";

import Link from "next/link";
<<<<<<< HEAD
import { useEffect, useState } from "react";
=======
>>>>>>> 6ce30bfed78dc8524b7ef2d0974be9e8eeb7caf5
import { useDb, mutate } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { clubForms, clubNotices, isClosed, nextDeadline, relativeAgo, statusOf, uid } from "@/lib/utils";
import { studentIdError, studentVerifiedText, verifyStudentId } from "@/lib/students";
import { useToast } from "@/components/providers";
import { FormGrid, NoticeCard } from "@/components/cards";
import { Countdown } from "@/components/countdown";
import { EmptyState, PageHero, Skeleton } from "@/components/ui";
<<<<<<< HEAD
import type { PortalUser } from "@/lib/types";
=======
>>>>>>> 6ce30bfed78dc8524b7ef2d0974be9e8eeb7caf5

export default function ClubDetailView({ clubId }: { clubId: string }) {
  const db = useDb();
  const auth = useAuth();
  const toast = useToast();
  const club = db?.clubs.find((c) => c.id === clubId) ?? null;
<<<<<<< HEAD
  const [clubAdmin, setClubAdmin] = useState<PortalUser | null>(null);

  // Load the club's admin from the users collection
  useEffect(() => {
    if (!club) return;
    let cancelled = false;
    const loadAdmin = async () => {
      try {
        const { getCloudDb } = await import("@/lib/firebase");
        const { collection, getDocs, query, where } = await import("firebase/firestore");
        const dbref = getCloudDb();
        if (!dbref) return;
        const adminQuery = query(
          collection(dbref, "users"),
          where("role", "==", "admin"),
          where("clubs", "array-contains", club.id)
        );
        const snap = await getDocs(adminQuery);
        if (!cancelled && !snap.empty) {
          const doc = snap.docs[0];
          setClubAdmin({ ...doc.data(), uid: doc.id } as PortalUser);
        }
      } catch {
        // Silently fail — admin info is optional
      }
    };
    void loadAdmin();
    return () => { cancelled = true; };
  }, [club?.id]);
=======
>>>>>>> 6ce30bfed78dc8524b7ef2d0974be9e8eeb7caf5

  if (!db) return <ClubDetailSkeleton />;
  if (!club) return <ClubMissing />;

  const me = auth.cloud ? auth.user : null;
  const myMembership = me
    ? (db.memberships || []).find((m) => m.userId === me.uid && m.clubId === club.id)
    : null;

  const requestJoin = () => {
    if (!me) {
      toast.toast("Sign in to request membership.", "err");
      return;
    }
    if (myMembership) {
      toast.toast("You already have a request for this club.", "err");
      return;
    }
    const check = verifyStudentId(db, me.studentId || "");
    if (!check.ok) {
      toast.toast(
        check.reason === "missing"
          ? "Add your NITER student ID to your profile first (My Dashboard → profile), then request to join."
          : studentIdError(me.studentId || "", check.reason ?? "missing"),
        "err"
      );
      return;
    }
    toast.toast("✓ Student verified: " + studentVerifiedText(check.student), "ok");
    mutate((draft) => {
      draft.memberships.push({
        id: uid("m"),
        userId: me.uid,
        clubId: club.id,
        status: "pending",
        requestedAt: new Date().toISOString(),
        reviewedAt: "",
        reviewedBy: "",
        userName: me.name || me.email,
        userEmail: me.email,
        studentId: me.studentId || "",
      });
    });
    toast.toast("Join request sent to " + club.name + "!", "ok");
  };

  const notices = clubNotices(db, club.id);
  const forms = clubForms(db, club.id);
  // Match the membership application by title (falls back to the first form),
  // mirroring the legacy app — form ids are not predictable.
  const membership = forms.find((f) => /membership/i.test(f.title)) || forms[0] || null;
  const execs = club.executives.filter((e) => e.name);
  const clubNext = nextDeadline(forms);
  const clubOpen = forms.filter((f) => statusOf(f).key === "open").length;
  const clubSoon = forms.filter((f) => statusOf(f).key === "soon").length;
  const clubSubs = forms.reduce((sum, f) => sum + db.submissions.filter((s) => s.formId === f.id).length, 0);

  const facebookHref =
    club.facebook || `https://www.google.com/search?q=${encodeURIComponent(club.name + " facebook")}`;

  return (
    <>
      <PageHero eyebrow="Clubs" title={club.name} sub={club.tagline}>
        <span className="mt-4 inline-flex items-center gap-2 rounded-md border border-gold/50 bg-gold/15 px-3 py-1 text-[12px] font-bold uppercase tracking-[1.4px] text-gold">
          <span aria-hidden="true">{club.icon}</span>
          {club.panel ? "Panel " + club.panel : "New committee"}
        </span>
      </PageHero>
      <div className="container-x py-10">
      {/* breadcrumbs */}
      <nav aria-label="Breadcrumb" className="text-[13px] text-muted">
        <Link href="/" className="no-underline hover:underline">
          Home
        </Link>{" "}
        /{" "}
        <Link href="/clubs" className="no-underline hover:underline">
          Clubs
        </Link>{" "}
        / <span className="text-ink">{club.name}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">

          <section className="mt-6">
            <h2 className="m-0 text-[19px] font-bold text-ink">About the club</h2>
            <div className="card mt-3 p-5">
              <p className="m-0 text-[14.5px] leading-relaxed text-ink/90">{club.about}</p>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="m-0 text-[19px] font-bold text-ink">
              Notices <span className="text-muted">({notices.length})</span>
            </h2>
            <div className="mt-3 space-y-4">
              {notices.length ? (
                notices.map((n) => <NoticeCard key={n.id} notice={n} />)
              ) : (
                <EmptyState icon="📢">No notices posted yet.</EmptyState>
              )}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="m-0 text-[19px] font-bold text-ink">
              Forms <span className="text-muted">({forms.length})</span>
            </h2>
            <div className="mt-3">
              {forms.length ? (
                <FormGrid forms={forms} />
              ) : (
                <EmptyState icon="📝">No forms published yet.</EmptyState>
              )}
            </div>
          </section>
        </div>

        {/* sidebar */}
        <aside className="space-y-4">
          <div className="card p-5 text-center" id="join">
            <div className="text-5xl" aria-hidden="true">
              {club.icon}
            </div>
            <h3 className="m-0 mt-2 text-[16px] font-bold text-ink">Interested in joining?</h3>
            <p className="m-0 mt-1 text-[13px] text-muted">
              Apply through our membership form and our team will get back to you.
            </p>
            <div className="mt-3 space-y-2.5">
              {myMembership ? (
                <span
                  className={`inline-block w-full rounded-md px-3 py-2 text-[13px] font-bold ${
                    myMembership.status === "approved"
                      ? "bg-emerald-100 text-emerald-800"
                      : myMembership.status === "rejected"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {myMembership.status === "approved"
                    ? "✓ You're a member"
                    : myMembership.status === "rejected"
                      ? "✕ Request declined"
                      : "⏳ Join request pending"}
                </span>
              ) : me ? (
                <button className="btn btn-primary w-full" onClick={requestJoin}>
                  Request to join
                </button>
              ) : null}
              {membership ? (
                isClosed(membership) ? (
                  <button className="btn btn-outline w-full" disabled>
                    Applications closed
                  </button>
                ) : (
                  <Link href={`/form/${membership.id}`} className="btn btn-outline w-full no-underline">
                    Apply via form
                  </Link>
                )
              ) : null}
            </div>
          </div>

<<<<<<< HEAD
          {/* Club Admin */}
          {clubAdmin && (
            <div className="card p-5">
              <h3 className="m-0 text-[15px] font-bold text-ink">🔑 Club Admin</h3>
              <p className="m-0 mt-1 text-[12.5px] text-muted">
                This club is managed by:
              </p>
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-3">
                <span
                  aria-hidden="true"
                  className="inline-grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-navy to-blue-700 text-[14px] font-extrabold text-white"
                >
                  {initialsOf(clubAdmin.name || "?")}
                </span>
                <div className="min-w-0">
                  <span className="block truncate text-[14px] font-bold text-ink">
                    {clubAdmin.name || "Admin"}
                  </span>
                  <span className="block text-[12px] text-muted">
                    {clubAdmin.email}
                  </span>
                </div>
              </div>
              <p className="m-0 mt-2 text-[12px] text-muted">
                Contact the admin for club-related queries, membership issues or moderator requests.
              </p>
            </div>
          )}

=======
>>>>>>> 6ce30bfed78dc8524b7ef2d0974be9e8eeb7caf5
          <div className="card p-5">
            <h3 className="m-0 text-[15px] font-bold text-ink">📊 Forms status</h3>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <ClubStat value={clubOpen} label="open now" tone="text-ok" />
              <ClubStat value={clubSoon} label="opening soon" tone="text-crimson" />
              <ClubStat value={clubSubs} label="submissions" tone="text-navy dark:text-gold" />
            </div>
            {clubNext && (
              <div className="mt-3 border-t border-line pt-3 text-[13.5px] text-ink">
                {clubNext.key === "soon" ? "🚀 Opens in" : "⏳ Closes in"}: <b>{clubNext.form.title}</b>
                <div className="mt-1 text-[14.5px]">
                  <Countdown
                    start={clubNext.key === "soon" ? clubNext.form.openAt : null}
                    end={clubNext.key === "open" ? clubNext.form.deadline : null}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="card p-5">
            <h3 className="m-0 text-[15px] font-bold text-ink">📮 Complaint box</h3>
            <p className="m-0 mt-1 text-[13px] text-muted">
              Something wrong with this club’s events, forms or members? File a confidential complaint — the
              executives will review it.
            </p>
            <Link href={`/complaint/${club.id}`} className="btn btn-outline btn-sm mt-3 no-underline">
              File a complaint
            </Link>
          </div>

          <div className="card p-5">
            <h3 className="m-0 text-[15px] font-bold text-ink">Contact & info</h3>
            <dl className="m-0 mt-3 space-y-2.5 text-[13.5px]">
              <InfoRow k="Email" v={club.email || "—"} />
              <InfoRow k="Room" v={club.room || "—"} />
              <InfoRow k="Weekly" v={club.weekly || "—"} />
              <div className="flex justify-between gap-3">
                <dt className="shrink-0 font-semibold text-muted">Facebook</dt>
                <dd className="m-0 text-right">
                  <a
                    href={facebookHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-crimson no-underline hover:underline"
                  >
                    {club.facebook ? "Official page →" : "Find on Facebook →"}
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          <div className="card p-5">
            <h3 className="m-0 text-[15px] font-bold text-ink">
              Executive committee{club.panel ? ` · ${club.panel}` : ""}
            </h3>
            {execs.length ? (
              <>
                <ul className="m-0 mt-3 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
                  {execs.map((e, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2 px-3 py-2"
                    >
                      {e.photo ? (
                        <img
                          src={e.photo}
                          alt={e.name}
                          loading="lazy"
                          onError={(ev) => ((ev.target as HTMLImageElement).style.display = "none")}
                          className="h-10 w-10 shrink-0 rounded-full object-cover"
                        />
                      ) : null}
                      <span
                        aria-hidden="true"
                        className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold to-amber-400 text-[13px] font-extrabold text-navy"
                      >
                        {initialsOf(e.name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-bold text-ink">{e.name}</span>
                        <span className="block text-[11.5px] font-semibold text-muted">{e.role}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                {club.committeeHistory?.length ? (
                  <div className="mt-3 border-t border-dashed border-line pt-2">
                    <p className="m-0 text-[11.5px] font-semibold text-muted">🕒 Committee edit history</p>
                    <ul className="m-0 mt-1 list-none space-y-1 p-0">
                      {club.committeeHistory.slice(0, 3).map((h, i) => (
                        <li key={i} className="text-[11.5px] text-muted">
                          <b className="font-bold text-ink">{h.by || "a club moderator"}</b>{" "}
                          {h.summary || "updated the committee"} · {relativeAgo(h.at)}
                        </li>
                      ))}
                    </ul>
                    {club.committeeHistory.length > 3 ? (
                      <p className="m-0 mt-1 text-[11px] text-muted">
                        …and {club.committeeHistory.length - 3} earlier edit
                        {club.committeeHistory.length - 3 === 1 ? "" : "s"}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="m-0 mt-3 text-[11.5px] text-muted">
                    Compiled from official club Facebook pages & NITER sources. Verify with the club for the
                    latest panel.
                  </p>
                )}
              </>
            ) : (
              <p className="m-0 mt-2 text-[13px] text-muted">
                Committee panel not listed yet — check the club’s Facebook page for the latest updates.
              </p>
            )}
          </div>
        </aside>
      </div>
      </div>
    </>
  );
}

function ClubStat({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div>
      <div className={`text-[22px] font-extrabold leading-none ${tone}`}>{value}</div>
      <div className="mt-1 text-[11.5px] leading-tight text-muted">{label}</div>
    </div>
  );
}

function InfoRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 font-semibold text-muted">{k}</dt>
      <dd className="m-0 text-right text-ink">{v}</dd>
    </div>
  );
}

function ClubMissing() {
  return (
    <div className="container-x py-16 text-center">
      <div className="text-5xl">🤔</div>
      <h1 className="mt-3 text-xl font-bold text-ink">Club not found</h1>
      <p className="text-muted">This club doesn’t exist or was removed.</p>
      <Link href="/clubs" className="btn btn-primary mt-4 no-underline">
        Browse all clubs
      </Link>
    </div>
  );
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return ((parts[0][0] || "") + (parts[parts.length - 1][0] || "")).toUpperCase();
}

function ClubDetailSkeleton() {
  return (
    <div className="container-x py-10">
      <Skeleton className="h-5 w-48" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-40" />
        </div>
      </div>
    </div>
  );
}
