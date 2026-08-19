"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useDb } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { clubById, fmtDate, relativeAgo } from "@/lib/utils";
import { studentDeptLabel, studentSessionOf, verifyStudentId } from "@/lib/students";
import { EmptyState, PageHero, Skeleton } from "@/components/ui";
import CampusBanner from "@/components/campus-banner";
import type { Database, Membership, Submission } from "@/lib/types";

interface ProfileStudent {
  key: string;
  name: string;
  studentId: string;
  email: string;
  memberships: Membership[];
  submissions: Submission[];
}

type UserLike = { uid: string; email: string; name: string; studentId?: string; role?: string };

const STUDENT_ACCOUNTS_KEY = "niter-student-accounts";

function loadAccounts(): Record<string, { name: string; studentId: string; pass: string }> {
  try {
    return JSON.parse(localStorage.getItem(STUDENT_ACCOUNTS_KEY) || "{}") as Record<
      string,
      { name: string; studentId: string; pass: string }
    >;
  } catch {
    return {};
  }
}

/* Resolve a public profile for <key> — the student's email or userId. Mirrors
   the legacy app: memberships/submissions first, then offline demo accounts,
   then the signed-in user's own session (so a fresh student can always open
   their own profile). Returns null when nothing matches. */
function resolveStudent(db: Database, me: UserLike | null, rawKey: string): ProfileStudent | null {
  const k = decodeURIComponent(rawKey || "").toLowerCase();
  const ms = (db.memberships || []).filter(
    (m) => (m.userId || "").toLowerCase() === k || (m.userEmail || "").toLowerCase() === k
  );
  const subs = (db.submissions || []).filter(
    (s) => (s.userId || "").toLowerCase() === k || (s.submitterEmail || "").toLowerCase() === k
  );
  if (ms.length || subs.length) {
    const mem = ms[0];
    const sub = subs[0];
    return {
      key: k,
      name: mem?.userName || sub?.submitterName || "",
      studentId: mem?.studentId || sub?.submitterStudentId || "",
      email: mem?.userEmail || sub?.submitterEmail || "",
      memberships: ms,
      submissions: subs,
    };
  }
  const acc = loadAccounts();
  const emailKey = k.startsWith("local-") ? k.slice(6) : k;
  const accRec = acc[emailKey];
  if (accRec) {
    return { key: k, name: accRec.name || "", studentId: accRec.studentId || "", email: emailKey, memberships: [], submissions: [] };
  }
  // Directory roster fallback — a student ID (e.g. CS-2607001) in the URL
  // resolves straight to the roster entry, so every directory row can link to
  // a working profile even before the student has memberships or submissions.
  const normKey = k.replace(/[^a-z0-9]/g, "").toUpperCase();
  if (/^[A-Z]{1,5}\d{5,8}$/.test(normKey)) {
    const hit = (db.students || []).find((st) => st.id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() === normKey);
    if (hit) {
      return { key: k, name: hit.name || "", studentId: hit.id, email: "", memberships: [], submissions: [] };
    }
  }
  if (
    me &&
    ((me.email || "").toLowerCase() === k ||
      (me.uid || "").toLowerCase() === k ||
      (me.studentId || "").toLowerCase() === k)
  ) {
    return {
      key: k,
      name: me.name || "",
      studentId: me.studentId || "",
      email: me.email || "",
      memberships: (db.memberships || []).filter((m) => m.userId === me.uid || m.userEmail === me.email),
      submissions: (db.submissions || []).filter(
        (s) => (s.userId && s.userId === me.uid) || (s.submitterEmail && s.submitterEmail === me.email)
      ),
    };
  }
  return null;
}

function statusPill(status: string): string {
  if (status === "approved") return "bg-emerald-100 text-emerald-800";
  if (status === "rejected") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-800";
}

function reviewPill(r?: string): string {
  if (r === "approved") return "bg-emerald-100 text-emerald-800";
  if (r === "rejected") return "bg-rose-100 text-rose-700";
  return "bg-sky-100 text-sky-800";
}

function ProfileSkeleton() {
  return (
    <div className="container-x py-10">
      <Skeleton className="h-40 rounded-2xl" />
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}

function StudentMissing() {
  const auth = useAuth();
  const canBrowse = !auth.loading && auth.user?.role === "admin";
  return (
    <div className="container-x py-16 text-center">
      <div className="text-6xl">🧑‍🎓</div>
      <h1 className="mt-3 text-2xl font-extrabold text-ink">Student not found</h1>
      <p className="mx-auto mt-2 max-w-md text-[14px] text-muted">
        We couldn’t find a public profile for that student — they may not have joined a club or filled a form yet.
      </p>
      <div className="mt-5 flex justify-center gap-3">
        {canBrowse && (
          <Link href="/students" className="btn btn-outline no-underline">
            Browse the student directory
          </Link>
        )}
        <Link href="/" className="btn btn-primary no-underline">
          Go home
        </Link>
      </div>
    </div>
  );
}

export default function StudentProfileView({ studentKey }: { studentKey: string }) {
  const db = useDb();
  const auth = useAuth();

  const profile = useMemo(
    () => (db ? resolveStudent(db, auth.cloud ? auth.user : null, studentKey) : null),
    [db, auth.cloud, auth.user, studentKey]
  );

  const isMe = useMemo(() => {
    if (!auth.user || !profile) return false;
    const k = profile.key;
    return (
      (auth.user.email || "").toLowerCase() === k || (auth.user.uid || "").toLowerCase() === k
    );
  }, [auth.user, profile]);

  if (!db) return <ProfileSkeleton />;
  if (!profile) return <StudentMissing />;

  const s = profile;
  const approved = s.memberships.filter((m) => m.status === "approved");
  const pending = s.memberships.filter((m) => m.status === "pending");
  const check = s.studentId ? verifyStudentId(db, s.studentId) : null;
  const roster = check?.ok ? check.student : null;
  const session = roster ? studentSessionOf(roster) : "";
  const chips = roster
    ? [
        { icon: "🏛", label: studentDeptLabel(roster) },
        session ? { icon: "📅", label: `Session ${session}` } : null,
        roster.section ? { icon: "🗂", label: `Section ${roster.section}` } : null,
      ].filter((c): c is { icon: string; label: string } => !!c)
    : [];

  return (
    <>
      <PageHero eyebrow="NITER · Student profile" title={s.name || "NITER Student"}>
        <p className="m-0 mt-2 flex flex-wrap items-center gap-x-2 text-[14px] text-white/80">
          {s.studentId ? <span>🎓 {s.studentId}</span> : <span>NITER student</span>}
          {s.email ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{s.email}</span>
            </>
          ) : null}
          {isMe ? (
            <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-[12px] font-bold text-gold">this is you</span>
          ) : null}
        </p>
        {chips.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {chips.map((c) => (
              <span
                key={c.label}
                className="rounded-md border border-gold/40 bg-gold/15 px-3 py-1 text-[12.5px] font-semibold text-gold"
              >
                {c.icon} {c.label}
              </span>
            ))}
          </div>
        ) : null}
        {/* Role & Club badges */}
        {s.role && s.role !== "member" && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span
              className={`rounded-md px-3 py-1 text-[12.5px] font-bold ${
                s.role === "admin"
                  ? "border border-red-400 bg-red-100 text-red-800"
                  : s.role === "executive"
                    ? "border border-blue-400 bg-blue-100 text-blue-800"
                    : "border border-purple-400 bg-purple-100 text-purple-800"
              }`}
            >
              {s.role === "admin" ? "🔑 Club Admin" : s.role === "executive" ? "🛡️ Club Executive/Moderator" : `👤 ${s.role}`}
            </span>
            {(s.clubs || []).length > 0 && s.clubs!.map((clubId) => {
              const club = clubById(db, clubId);
              return club ? (
                <Link
                  key={clubId}
                  href={`/club/${club.id}`}
                  className="no-underline"
                >
                  <span className="rounded-md border border-gold/40 bg-gold/15 px-3 py-1 text-[12.5px] font-semibold text-gold hover:bg-gold/25 transition">
                    {club.icon} {club.name}
                  </span>
                </Link>
              ) : null;
            })}
          </div>
        )}

      </PageHero>

      <div className="container-x py-10">
        <CampusBanner />
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-5 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-line bg-surface p-4 text-center">
                <p className="m-0 text-2xl font-extrabold text-ink">{approved.length}</p>
                <p className="m-0 text-[12px] font-semibold text-muted">clubs joined</p>
              </div>
              <div className="rounded-xl border border-line bg-surface p-4 text-center">
                <p className="m-0 text-2xl font-extrabold text-ink">{pending.length}</p>
                <p className="m-0 text-[12px] font-semibold text-muted">pending requests</p>
              </div>
              <div className="rounded-xl border border-line bg-surface p-4 text-center">
                <p className="m-0 text-2xl font-extrabold text-ink">{s.submissions.length}</p>
                <p className="m-0 text-[12px] font-semibold text-muted">applications</p>
              </div>
            </div>

            <div className="card p-5">
              <h2 className="m-0 text-[18px] font-bold text-ink">🎓 Clubs &amp; memberships</h2>
              <p className="mb-4 mt-1 text-[13px] text-muted">
                {s.name || "This student"}&rsquo;s clubs across NITER.
              </p>
              {s.memberships.length ? (
                <ul className="m-0 list-none space-y-2.5 p-0">
                  {s.memberships.map((m) => {
                    const club = clubById(db, m.clubId);
                    return (
                      <li key={m.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy text-lg text-white">
                          {club?.icon || "🎓"}
                        </span>
                        <span className="min-w-0 grow">
                          <span className="block truncate text-[14px] font-bold text-ink">{club?.name || "Club"}</span>
                          <span className="block text-[12px] text-muted">
                            {m.status === "approved"
                              ? `Member since ${m.reviewedAt ? fmtDate(m.reviewedAt) : "—"}`
                              : m.status === "rejected"
                                ? `Request declined${m.reviewedAt ? " · " + relativeAgo(m.reviewedAt) : ""}`
                                : `Requested ${m.requestedAt ? relativeAgo(m.requestedAt) : "—"}`}
                          </span>
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold ${statusPill(m.status)}`}>
                          {m.status === "approved" ? "✓ Member" : m.status === "rejected" ? "✕ Declined" : "⏳ Pending"}
                        </span>
                        {club ? (
                          <Link href={`/club/${club.id}`} className="btn btn-ghost btn-sm no-underline">
                            View club →
                          </Link>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState icon="🎓">No club memberships yet.</EmptyState>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="m-0 text-[18px] font-bold text-ink">📋 Applications</h2>
              {s.submissions.length ? (
                <ul className="m-0 mt-4 list-none space-y-2.5 p-0">
                  {s.submissions.map((sub) => {
                    const form = (db.forms || []).find((f) => f.id === sub.formId);
                    const club = sub.clubId ? clubById(db, sub.clubId) : null;
                    return (
                      <li key={sub.id} className="rounded-xl border border-line bg-surface-2 px-4 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[13.5px] font-bold text-ink">{form?.title || "Application"}</span>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${reviewPill(sub.reviewStatus)}`}>
                            {sub.reviewStatus === "approved" ? "✓ Approved" : sub.reviewStatus === "rejected" ? "✕ Rejected" : "⏳ Under review"}
                          </span>
                        </div>
                        <p className="mb-2 mt-1 text-[12px] text-muted">
                          {club ? `${club.icon} ${club.name} · ` : ""}
                          {sub.submittedAt ? relativeAgo(sub.submittedAt) : ""}
                        </p>
                        {form ? (
                          <Link href={`/form/${form.id}`} className="btn btn-outline btn-sm no-underline">
                            View form
                          </Link>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState icon="📋">No applications yet.</EmptyState>
              )}
            </div>

            {isMe ? (
              <div className="card border-gold/40 bg-gold/5 p-5">
                <h3 className="m-0 text-[15px] font-bold text-ink">This is your public profile</h3>
                <p className="mb-3 mt-1 text-[13px] text-muted">
                  What visitors see when they open your profile. Edit your details from your dashboard.
                </p>
                <Link href="/dashboard" className="btn btn-primary btn-block no-underline">
                  Open my dashboard →
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
