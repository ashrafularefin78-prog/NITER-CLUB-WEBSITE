"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useDb } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { getCloudDb } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { clubById, formById, fmtDate, relativeAgo } from "@/lib/utils";
import { studentIdError, studentVerifiedText, verifyStudentId, type StudentCheck } from "@/lib/students";
import { useToast } from "@/components/providers";
import { EmptyState, GoogleButton, OrDivider, PageHero, Skeleton } from "@/components/ui";
import CampusBanner, { campusPhoto } from "@/components/campus-banner";
import type { Membership, ReviewStatus } from "@/lib/types";

const STUDENT_ACCOUNTS_KEY = "niter-student-accounts";
const STUDENT_SESSION_KEY = "niter-student-session";

interface DemoAccount {
  name: string;
  studentId: string;
  pass: string;
}

type UserLike = { uid: string; email: string; name: string; studentId?: string; role?: string };

function loadAccounts(): Record<string, DemoAccount> {
  try {
    return JSON.parse(localStorage.getItem(STUDENT_ACCOUNTS_KEY) || "{}") as Record<string, DemoAccount>;
  } catch {
    return {};
  }
}

function saveAccounts(acc: Record<string, DemoAccount>) {
  try {
    localStorage.setItem(STUDENT_ACCOUNTS_KEY, JSON.stringify(acc));
  } catch {
    /* ignore */
  }
}

function loadDemoSession(): string {
  try {
    return localStorage.getItem(STUDENT_SESSION_KEY) || "";
  } catch {
    return "";
  }
}

function saveDemoSession(email: string) {
  try {
    if (email) localStorage.setItem(STUDENT_SESSION_KEY, email);
    else localStorage.removeItem(STUDENT_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return ((parts[0][0] || "") + (parts[parts.length - 1][0] || "")).toUpperCase();
}

function statusPill(status: string): string {
  if (status === "approved") return "bg-emerald-100 text-emerald-800";
  if (status === "rejected") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-800";
}

function reviewPill(r: ReviewStatus): string {
  if (r === "approved") return "bg-emerald-100 text-emerald-800";
  if (r === "rejected") return "bg-rose-100 text-rose-700";
  return "bg-sky-100 text-sky-800";
}

export default function DashboardView() {
  const db = useDb();
  const auth = useAuth();
  const [demoUser, setDemoUser] = useState<UserLike | null>(() => {
    const email = loadDemoSession();
    if (!email) return null;
    const acc = loadAccounts()[email];
    return acc ? { uid: "local-" + email, email, name: acc.name, studentId: acc.studentId, role: "member" } : null;
  });
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [form, setForm] = useState({ name: "", studentId: "", email: "", pass: "" });

  const user: UserLike | null = auth.cloud ? auth.user : demoUser;

  // Roll a fresh campus photo whenever a sign-in completes (null → user). A
  // restored session on page load is not a new login, so no new roll.
  const prevUserRef = useRef<UserLike | null>(user);
  if (prevUserRef.current !== user) {
    if (!prevUserRef.current && user) campusPhoto(true);
    prevUserRef.current = user;
  }

  if (!db) return <DashboardSkeleton />;

  if (!user) {
    return (
      <DashboardLogin
        mode={mode}
        setMode={setMode}
        form={form}
        setForm={setForm}
        cloud={auth.cloud}
        onDemoSignIn={(u) => {
          setDemoUser(u);
          saveDemoSession(u.email);
        }}
        onGoogleSignIn={auth.loginWithGoogle}
        onCloudEmail={auth.loginEmail}
        verify={(id) => verifyStudentId(db, id)}
      />
    );
  }

  return (
    <DashboardHome
      dbUser={user}
      cloud={auth.cloud}
      onSignOut={() => {
        if (auth.cloud) auth.signOut();
        else {
          setDemoUser(null);
          saveDemoSession("");
        }
      }}
    />
  );
}

/* ---------------- login / create-account card ---------------- */

function DashboardLogin({
  mode,
  setMode,
  form,
  setForm,
  cloud,
  onDemoSignIn,
  onGoogleSignIn,
  onCloudEmail,
  verify,
}: {
  mode: "signin" | "signup";
  setMode: (m: "signin" | "signup") => void;
  form: { name: string; studentId: string; email: string; pass: string };
  setForm: (f: { name: string; studentId: string; email: string; pass: string }) => void;
  cloud: boolean;
  onDemoSignIn: (u: UserLike) => void;
  onGoogleSignIn: () => Promise<string | null>;
  onCloudEmail: (email: string, pass: string, mode: "signin" | "signup", name: string) => Promise<string | null>;
  verify: (id: string) => StudentCheck;
}) {
  const toast = useToast();
  const [gBusy, setGBusy] = useState(false);
  const [eBusy, setEBusy] = useState(false);

  const submit = async () => {
    const email = form.email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast.toast("Enter a valid email address.", "err");
    if (form.pass.length < 6) return toast.toast("Password must be at least 6 characters.", "err");
    if (cloud) {
      if (mode === "signup") {
        if (!form.name.trim()) return toast.toast("Enter your name.", "err");
        const check = verify(form.studentId);
        if (!check.ok) return toast.toast(studentIdError(form.studentId, check.reason), "err");
        toast.toast("✓ Student verified: " + studentVerifiedText(check.student), "ok");
      }
      setEBusy(true);
      const err = await onCloudEmail(email, form.pass, mode, form.name.trim());
      setEBusy(false);
      if (err) toast.toast(err, "err");
      return;
    }
    if (mode === "signup") {
      if (!form.name.trim()) return toast.toast("Enter your name.", "err");
      const check = verify(form.studentId);
      if (!check.ok) return toast.toast(studentIdError(form.studentId, check.reason), "err");
      toast.toast("✓ Student verified: " + studentVerifiedText(check.student), "ok");
      const acc = loadAccounts();
      if (acc[email]) return toast.toast("That email is already registered — sign in instead.", "err");
      acc[email] = { name: form.name.trim(), studentId: form.studentId.trim(), pass: form.pass };
      saveAccounts(acc);
      onDemoSignIn({ uid: "local-" + email, email, name: form.name.trim(), studentId: form.studentId.trim(), role: "member" });
      toast.toast("Account created — welcome!", "ok");
      return;
    }
    const acc = loadAccounts();
    const a = acc[email];
    if (!a || a.pass !== form.pass) return toast.toast("Incorrect email or password.", "err");
    onDemoSignIn({ uid: "local-" + email, email, name: a.name, studentId: a.studentId, role: "member" });
    toast.toast("Welcome back!", "ok");
  };

  const googleSignIn = async () => {
    setGBusy(true);
    const err = await onGoogleSignIn();
    setGBusy(false);
    if (err) toast.toast(err, "err");
  };

  return (
    <>
      <PageHero eyebrow="Students" title="🎓 Student sign in" sub="Filled a club form? Sign in — your applications, memberships and events appear here." />
      <div className="container-x py-10">
        <div className="card mx-auto max-w-[430px] p-8">
          <div className="mb-5 text-center">
            <div className="text-5xl" aria-hidden="true">
              🎓
            </div>
            <h1 className="mb-1 mt-2 text-[21px] font-bold text-ink">My Dashboard</h1>
            <p className="m-0 text-[13.5px] text-muted">
              {cloud
                ? "Sign in with your club account to continue."
                : "Demo mode — create a local account or sign in."}
            </p>
          </div>
          <div className="mb-4 grid grid-cols-2 rounded-lg border border-hairline p-1 text-[13.5px] font-semibold">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-md px-3 py-1.5 transition ${
                  mode === m ? "bg-navy text-white" : "text-muted hover:text-ink"
                }`}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>
          {cloud && (
            <>
              <GoogleButton onClick={googleSignIn} busy={gBusy} />
              <OrDivider />
            </>
          )}
          {mode === "signup" && (
            <div className="mb-3 grid gap-3 anim-fade-up">
              <input className="input" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Full name" />
              <input className="input" placeholder="NITER student ID (e.g. CS-2607001)" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} aria-label="NITER student ID" />
            </div>
          )}
          <div className="mb-3 grid gap-3">
            <input className="input" type="email" placeholder="you@niter.edu.bd" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-label="Email" />
            <input className="input" type="password" placeholder="At least 6 characters" value={form.pass} onChange={(e) => setForm({ ...form, pass: e.target.value })} aria-label="Password" />
          </div>
          <button className="btn btn-primary w-full" onClick={submit} disabled={eBusy || gBusy}>
            {eBusy
              ? "Working…"
              : mode === "signin"
                ? "Sign in"
                : "Create my student login"}
          </button>
          <p className="mb-0 mt-4 text-center text-[12.5px] text-muted">
            Student ID format: <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[11.5px]">CS-2607001</code>{" "}
            (CS = CSE · 26 = batch · 07 = dept code · 001 = roll)
          </p>
        </div>
      </div>
    </>
  );
}

/* ---------------- signed-in dashboard ---------------- */

function DashboardHome({
  dbUser,
  cloud,
  onSignOut,
}: {
  dbUser: UserLike;
  cloud: boolean;
  onSignOut: () => void;
}) {
  const db = useDb()!;
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [pf, setPf] = useState({ name: dbUser.name || "", studentId: dbUser.studentId || "" });

  const memberships: Membership[] = useMemo(
    () =>
      (db.memberships || []).filter(
        (m) => m.userId === dbUser.uid || m.userEmail === dbUser.email
      ),
    [db.memberships, dbUser.uid, dbUser.email]
  );

  const mySubs = useMemo(
    () =>
      (db.submissions || []).filter(
        (s) => (s.userId && s.userId === dbUser.uid) || (s.submitterEmail && s.submitterEmail === dbUser.email)
      ),
    [db.submissions, dbUser.uid, dbUser.email]
  );

  const approved = memberships.filter((m) => m.status === "approved");
  const myClubIds = approved.map((m) => m.clubId);
  const upcoming = useMemo(
    () =>
      (db.events || [])
        .filter((ev) => new Date(ev.startsAt).getTime() >= Date.now() - 86400000)
        .sort((a, b) => (a.startsAt || "").localeCompare(b.startsAt || ""))
        .slice(0, 6),
    [db.events]
  );

  const saveProfile = () => {
    if (!pf.name.trim()) return toast.toast("Your name is required.", "err");
    if (!pf.studentId.trim()) return toast.toast("Your NITER student ID is required.", "err");
    const check = verifyStudentId(db, pf.studentId);
    if (!check.ok) return toast.toast(studentIdError(pf.studentId, check.reason ?? "missing"), "err");
    toast.toast("✓ Student verified: " + studentVerifiedText(check.student), "ok");
    pf.name = pf.name.trim();
    pf.studentId = pf.studentId.trim();
    // Persist for cloud users via the users doc; demo users via localStorage.
    if (cloud) {
      const fdb = getCloudDb();
      if (fdb) {
        updateDoc(doc(fdb, "users", dbUser.uid), { name: pf.name, studentId: pf.studentId }).catch(() => undefined);
      }
    } else {
      const acc = loadAccounts();
      if (acc[dbUser.email]) {
        acc[dbUser.email].name = pf.name;
        acc[dbUser.email].studentId = pf.studentId;
        saveAccounts(acc);
      }
    }
    dbUser.name = pf.name;
    dbUser.studentId = pf.studentId;
    setEditing(false);
    toast.toast("Profile updated.", "ok");
  };

  return (
    <>
      <PageHero eyebrow="Home / My Dashboard" title="My Dashboard" sub="Your applications, clubs, join requests and event feed — in one place.">
        <div className="mt-4 flex items-center gap-3">
          <span className="inline-grid h-11 w-11 place-items-center rounded-full bg-gold text-[15px] font-extrabold text-navy">
            {initialsOf(dbUser.name || dbUser.email)}
          </span>
          <div>
            <div className="text-[15px] font-bold text-white">{dbUser.name || dbUser.email}</div>
            <div className="text-[12px] text-white/70">Member</div>
          </div>
          <button className="btn btn-outline btn-sm ml-auto border-white/30 text-white hover:bg-white/10" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </PageHero>
      <div className="container-x py-8">
        <CampusBanner />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_330px]">
          <div className="min-w-0 space-y-6">
            {/* applications & memberships */}
            <section className="card p-5">
              <h2 className="m-0 text-[18px] font-bold text-ink">
                📋 My applications &amp; memberships{" "}
                <span className="text-[13px] font-medium text-muted">({mySubs.length + memberships.length})</span>
              </h2>
              <div className="mt-4 space-y-5">
                <AppSection
                  title="📝 Applications"
                  hint="Forms you filled"
                  items={mySubs.map((s) => {
                    const f = formById(db, s.formId);
                    const c = clubById(db, s.clubId || (f && f.clubId) || "");
                    return {
                      key: s.id,
                      pill: reviewPill(s.reviewStatus || ""),
                      pillLabel:
                        s.reviewStatus === "approved"
                          ? "✓ Approved"
                          : s.reviewStatus === "rejected"
                            ? "✕ Rejected"
                            : "⏳ Under review",
                      title: f ? f.title : "Application",
                      meta: (c ? c.icon + " " + c.name : "") + " · " + relativeAgo(s.submittedAt),
                      extra: s.reviewStatus && s.reviewedBy ? `Reviewed by ${s.reviewedBy}` : "",
                      link: f ? { href: `/form/${f.id}`, label: "View form" } : null,
                    };
                  })}
                />
                <AppSection
                  title="🤝 Join requests"
                  hint="Request-to-join status"
                  items={memberships
                    .filter((m) => m.status !== "approved")
                    .map((m) => {
                      const c = clubById(db, m.clubId);
                      return {
                        key: m.id,
                        pill: statusPill(m.status),
                        pillLabel:
                          m.status === "approved"
                            ? "✓ Member"
                            : m.status === "rejected"
                              ? "✕ Declined"
                              : "⏳ Pending approval",
                        title: c ? c.icon + " " + c.name : "Club",
                        meta: "🤝 Join request · " + relativeAgo(m.requestedAt),
                        extra: m.status === "rejected" && m.reviewedAt ? "Reviewed " + relativeAgo(m.reviewedAt) : "",
                        link: c ? { href: `/club/${c.id}`, label: "View club →" } : null,
                      };
                    })}
                />
                <AppSection
                  title="🎓 Memberships"
                  hint="Clubs you've joined"
                  items={approved.map((m) => {
                    const c = clubById(db, m.clubId);
                    return {
                      key: m.id,
                      pill: statusPill("approved"),
                      pillLabel: "✓ Member",
                      title: c ? c.icon + " " + c.name : "Club",
                      meta: "Member since " + (m.reviewedAt ? fmtDate(m.reviewedAt) : relativeAgo(m.requestedAt)),
                      link: c ? { href: `/club/${c.id}`, label: "Club page →" } : null,
                    };
                  })}
                />
              </div>
            </section>

            {/* upcoming events */}
            <section className="card p-5">
              <h2 className="m-0 text-[18px] font-bold text-ink">🗓 Upcoming events</h2>
              <div className="mt-4 space-y-3">
                {upcoming.length ? (
                  upcoming.map((ev) => {
                    const c = clubById(db, ev.clubId);
                    return (
                      <div key={ev.id} className="flex items-center gap-3 rounded-lg border border-hairline p-3">
                        <span className="text-2xl" aria-hidden="true">
                          {c ? c.icon : "📅"}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[14.5px] font-semibold text-ink">{ev.title}</div>
                          <div className="text-[12.5px] text-muted">
                            {fmtDate(ev.startsAt)} · {ev.venue || (c ? c.name : "")}
                          </div>
                        </div>
                        {myClubIds.includes(ev.clubId) && (
                          <span className="ml-auto rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-bold text-gold">
                            My club
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <EmptyState icon="🗓">No upcoming events yet.</EmptyState>
                )}
              </div>
            </section>
          </div>

          {/* profile side panel */}
          <aside className="space-y-4">
            <div className="card p-5">
              <h2 className="m-0 text-[16px] font-bold text-ink">👤 Profile</h2>
              {!editing ? (
                <div className="mt-3 text-[13.5px]">
                  <p className="mb-1 text-muted">Name</p>
                  <p className="m-0 font-semibold text-ink">{dbUser.name || "—"}</p>
                  <p className="mb-1 mt-3 text-muted">Student ID</p>
                  <p className="m-0 font-mono text-[13px] font-semibold text-ink">{dbUser.studentId || "—"}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>
                      Edit profile
                    </button>
                    <Link
                      href={`/student/${encodeURIComponent(dbUser.email || dbUser.uid)}`}
                      className="btn btn-ghost btn-sm no-underline"
                    >
                      View public profile →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-3 grid gap-3">
                  <input className="input" placeholder="Full name" value={pf.name} onChange={(e) => setPf({ ...pf, name: e.target.value })} aria-label="Full name" />
                  <input className="input" placeholder="NITER student ID (e.g. CS-2607001)" value={pf.studentId} onChange={(e) => setPf({ ...pf, studentId: e.target.value })} aria-label="NITER student ID" />
                  <div className="flex gap-2">
                    <button className="btn btn-primary btn-sm" onClick={saveProfile}>
                      Save
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => { setPf({ name: dbUser.name, studentId: dbUser.studentId || "" }); setEditing(false); }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="card p-5">
              <h2 className="m-0 text-[16px] font-bold text-ink">⭐ My clubs</h2>
              <div className="mt-3 space-y-2">
                {approved.length ? (
                  approved.map((m) => {
                    const c = clubById(db, m.clubId);
                    return c ? (
                      <Link key={m.id} href={`/club/${c.id}`} className="flex items-center gap-2 rounded-lg border border-hairline p-2.5 no-underline hover:bg-surface-2/60">
                        <span aria-hidden="true">{c.icon}</span>
                        <span className="text-[13.5px] font-semibold text-ink">{c.name}</span>
                      </Link>
                    ) : null;
                  })
                ) : (
                  <p className="m-0 text-[13px] text-muted">Not a member of any club yet.</p>
                )}
              </div>
            </div>

            <div className="card p-5">
              <h2 className="m-0 text-[16px] font-bold text-ink">🔎 Explore</h2>
              <div className="mt-3 grid gap-2 text-[13.5px]">
                <Link href="/students" className="no-underline hover:underline">🎓 Student directory</Link>
                <Link href="/clubs" className="no-underline hover:underline">🏛 All clubs</Link>
                <Link href="/it-support" className="no-underline hover:underline">🖥 Report a website issue</Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function AppSection({
  title,
  hint,
  items,
}: {
  title: string;
  hint: string;
  items: {
    key: string;
    pill: string;
    pillLabel: string;
    title: string;
    meta: string;
    extra?: string;
    link: { href: string; label: string } | null;
  }[];
}) {
  if (!items.length) return null;
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="m-0 text-[13.5px] font-bold text-navy">{title}</h3>
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-bold text-muted">{items.length}</span>
        <span className="text-[11.5px] text-muted">{hint}</span>
      </div>
      <div className="space-y-2.5">
        {items.map((it) => (
          <div key={it.key} className="rounded-lg border border-hairline p-3.5">
            <div className="flex items-start justify-between gap-3">
              <h4 className="m-0 text-[14.5px] font-semibold text-ink">{it.title}</h4>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${it.pill}`}>{it.pillLabel}</span>
            </div>
            <p className="mb-0 mt-1 text-[12.5px] text-muted">
              {it.meta}
              {it.extra ? ` · ${it.extra}` : ""}
            </p>
            {it.link && (
              <Link href={it.link.href} className="mt-2 inline-block text-[12.5px] font-semibold no-underline hover:underline">
                {it.link.label}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="container-x py-16">
      <Skeleton className="h-10 w-72" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_330px]">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );
}
