"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Executive, Form, FormField, Membership, Notice, PortalUser, Submission } from "@/lib/types";
import {
  clubById,
  clubForms,
  clubNotices,
  fmtDate,
  fmtDateTime,
  formById,
  isOpen,
  relativeAgo,
  statusOf,
  uid,
} from "@/lib/utils";
import { mutate, pushSampleToCloud, resetDb, setUsers, useDb } from "@/lib/store";
import { authErrorMessage, useAuth } from "@/lib/auth";
import { getCloudAuth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useToast } from "@/components/providers";
import { Countdown, RelativeTime } from "@/components/countdown";
import { EmptyState, GoogleButton, OrDivider, Skeleton } from "@/components/ui";
import { ComplaintManageCard } from "@/components/views/complaints";

type Tab = "notices" | "forms" | "submissions" | "complaints" | "memberships" | "settings";

export default function PortalView() {
  const db = useDb();
  const auth = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("notices");
  const [editingNotice, setEditingNotice] = useState<Notice | "new" | null>(null);
  const [analyticsFormId, setAnalyticsFormId] = useState<string | null>(null);
  const [subFormId, setSubFormId] = useState<string | null>(null);

  const allowedClubIds = useMemo(() => {
    if (!db || !auth.user) return [] as string[];
    if (auth.user.role === "admin") return db.clubs.map((c) => c.id);
    return (auth.user.clubs ?? []).slice();
  }, [db, auth.user]);

  if (!db) return <PortalSkeleton />;

  /* ---------- not signed in ---------- */
  if (!auth.session || !clubById(db, auth.session.clubId)) {
    if (!auth.cloud) return <DemoLogin />;
    if (auth.loading) return <PortalSkeleton />;
    if (!auth.user) return <CloudLogin />;
    if (!allowedClubIds.length)
      return (
        <div className="container-x py-16">
          <div className="card mx-auto max-w-md p-8 text-center">
            <div className="text-5xl">⏳</div>
            <h1 className="mt-3 text-xl font-bold text-ink">Welcome, {auth.user.name || auth.user.email}!</h1>
            <p className="mt-1 text-[14px] text-muted">
              Your account is not linked to any club yet. An admin needs to assign you a club role from the
              portal settings.
            </p>
            <button className="btn btn-outline mt-5" onClick={auth.signOut}>
              Sign out
            </button>
          </div>
        </div>
      );
    return <ClubPicker clubs={db.clubs.filter((c) => allowedClubIds.includes(c.id))} />;
  }

  const club = clubById(db, auth.session.clubId)!;
  const counts: Record<Tab, number> = {
    notices: clubNotices(db, club.id).length,
    forms: clubForms(db, club.id).length,
    submissions: db.submissions.filter((s) => formById(db, s.formId)?.clubId === club.id).length,
    complaints: db.complaints.filter((c) => c.clubId === club.id).length,
    memberships: (db.memberships || []).filter((m) => m.clubId === club.id).length,
    settings: 0,
  };

  return (
    <>
      {/* portal hero */}{" "}
      <div className="border-b border-hairline bg-canvas">
        <div className="container-x flex flex-wrap items-center justify-between gap-4 py-10">
          <div className="flex items-center gap-4">
            <span className="text-4xl" aria-hidden="true">
              {club.icon}
            </span>
            <div>
              <h1 className="display-md m-0 text-ink">Club dashboard</h1>
              <p className="m-0 text-[13.5px] text-muted">Posting as {club.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {auth.user && (
              <span className="hidden rounded-full border border-hairline bg-surface-card px-3.5 py-1.5 text-[12.5px] font-medium sm:inline">
                {auth.user.email}
              </span>
            )}
            <button className="btn btn-outline btn-sm" onClick={() => {
              auth.signOut();
              toast.toast("Signed out.", "ok");
            }}>
              Log out →
            </button>
          </div>
        </div>
      </div>
      <div className="container-x py-8">
        <div className="tabs" role="tablist" aria-label="Dashboard sections">
          {(["notices", "forms", "submissions", "complaints", "memberships", "settings"] as Tab[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className={`tab ${tab === t ? "active" : ""}`}
              onClick={() => {
                setTab(t);
                setEditingNotice(null);
                setAnalyticsFormId(null);
                setSubFormId(null);
              }}
            >
              {TAB_LABELS[t]}
              {counts[t] ? (
                <span className="ml-1.5 rounded-full bg-crimson/10 px-2 py-0.5 text-[11px] font-bold text-crimson">
                  {counts[t]}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div key={tab} className="anim-fade-up min-h-[400px]">
          {tab === "notices" && (
            <NoticesTab clubId={club.id} editing={editingNotice} setEditing={setEditingNotice} />
          )}
          {tab === "forms" && (
            <FormsTab
              clubId={club.id}
              analyticsFormId={analyticsFormId}
              setAnalyticsFormId={setAnalyticsFormId}
            />
          )}
          {tab === "submissions" && (
            <SubmissionsTab clubId={club.id} subFormId={subFormId} setSubFormId={setSubFormId} />
          )}
          {tab === "complaints" && <ComplaintsTab clubId={club.id} />}
          {tab === "memberships" && <MembershipsTab clubId={club.id} />}
          {tab === "settings" && (
            <SettingsTab clubId={club.id} isAdmin={auth.user?.role === "admin"} />
          )}
        </div>
      </div>
    </>
  );
}

const TAB_LABELS: Record<Tab, string> = {
  notices: "📢 Notices",
  forms: "📝 Forms",
  submissions: "📥 Submissions",
  complaints: "📮 Complaints",
  memberships: "🤝 Memberships",
  settings: "⚙️ Settings",
};

/* ================= Logins ================= */

function DemoLogin() {
  const db = useDb();
  const auth = useAuth();
  const toast = useToast();
  const [clubId, setClubId] = useState("");
  const [code, setCode] = useState("");
  if (!db) return null;
  return (
    <div className="container-x py-16">
      <div className="card mx-auto max-w-md p-8 text-center anim-pop-in">
        <div className="anim-float text-5xl">🔐</div>
        <h1 className="mt-3 text-xl font-bold text-ink">Club member portal</h1>
        <p className="mt-1 text-[13.5px] text-muted">
          Post notices and publish forms for your club. Select your club and enter the member code.
        </p>
        <form
          className="mt-6 space-y-4 text-left"
          onSubmit={async (e) => {
            e.preventDefault();
            const err = await auth.loginWithCode(clubId, code);
            if (err) toast.toast(err, "err");
            else toast.toast(`Welcome, ${clubById(db, clubId)?.name ?? ""}!`, "ok");
          }}
        >
          <div>
            <label className="label" htmlFor="login-club">
              Your club
            </label>
            <select
              id="login-club"
              className="select"
              value={clubId}
              onChange={(e) => setClubId(e.target.value)}
            >
              {db.clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="login-code">
              Member code
            </label>
            <input
              id="login-code"
              type="password"
              className="input"
              placeholder="Enter member code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <p className="hint mt-1">
              Demo code: <b>niter2025</b>
            </p>
          </div>
          <button type="submit" className="btn btn-primary w-full">
            Sign in
          </button>
        </form>
        <div className="mt-5 rounded-xl border border-line bg-surface-2/60 p-3 text-left text-[12.5px] text-muted">
          💡 Offline demo mode — no Firebase config yet. Set up Firebase to go live with real accounts and a
          shared database.
        </div>
      </div>
    </div>
  );
}

function CloudLogin() {
  const auth = useAuth();
  const toast = useToast();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [gBusy, setGBusy] = useState(false);
  const [resetting, setResetting] = useState(false);

  const googleSignIn = async () => {
    if (gBusy) return;
    setGBusy(true);
    const err = await auth.loginWithGoogle();
    setGBusy(false);
    if (err) toast.toast(err, "err");
    else toast.toast("Signed in with Google!", "ok");
  };

  const resetPassword = async () => {
    const auth = getCloudAuth();
    if (!auth) {
      toast.toast("Cloud sign-in is not active — use the demo member code instead.", "err");
      return;
    }
    const addr = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(addr)) {
      toast.toast("Enter your email address first.", "err");
      return;
    }
    setResetting(true);
    try {
      await sendPasswordResetEmail(auth, addr);
      toast.toast("Password reset email sent — check your inbox.", "ok");
    } catch (err) {
      toast.toast(authErrorMessage(err), "err");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="container-x py-16">
      <div className="card mx-auto max-w-md p-8 text-center anim-pop-in">
        <div className="anim-float text-5xl">🔐</div>
        <h1 className="mt-3 text-xl font-bold text-ink">Club member portal</h1>
        <p className="mt-1 text-[13.5px] text-muted">
          Sign in to manage your club — notices, forms, submissions and complaints.
        </p>
        <div className="mt-6 space-y-4 text-left">
          <GoogleButton onClick={googleSignIn} busy={gBusy} />
          <OrDivider />
        </div>
        <form
          className="space-y-4 text-left"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const err = await auth.loginEmail(email, pass, mode, name);
            setBusy(false);
            if (err) toast.toast(err, "err");
            else toast.toast("Welcome!", "ok");
          }}
        >
          <div>
            <label className="label" htmlFor="login-mode">
              Mode
            </label>
            <select
              id="login-mode"
              className="select"
              value={mode}
              onChange={(e) => setMode(e.target.value as "signin" | "signup")}
            >
              <option value="signin">Sign in</option>
              <option value="signup">Create account</option>
            </select>
          </div>
          {mode === "signup" && (
            <div>
              <label className="label" htmlFor="login-name">
                Full name
              </label>
              <input
                id="login-name"
                className="input"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              className="input"
              placeholder="you@niter.edu.bd"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="login-pass">
              Password
            </label>
            <input
              id="login-pass"
              type="password"
              className="input"
              placeholder="At least 6 characters"
              autoComplete="current-password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
            <div className="mt-1.5 flex justify-end">
              <button type="button" className="link-btn" onClick={resetPassword} disabled={resetting}>
                {resetting ? "Sending…" : "Forgot password?"}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={busy}>
            {busy ? (
              <>
                <span
                  className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  aria-hidden="true"
                />
                Working…
              </>
            ) : (
              "Continue"
            )}
          </button>
        </form>
        <div className="mt-5 rounded-xl border border-line bg-surface-2/60 p-3 text-left text-[12.5px] text-muted">
          💡 The first account created becomes the <b>admin</b>. Admins promote others to club executives from
          portal → Settings → Members &amp; roles.
        </div>
      </div>
    </div>
  );
}

function ClubPicker({ clubs }: { clubs: { id: string; icon: string; name: string }[] }) {
  const auth = useAuth();
  const toast = useToast();
  const [clubId, setClubId] = useState(clubs[0]?.id ?? "");
  return (
    <div className="container-x py-16">
      <div className="card mx-auto max-w-md p-8 text-center anim-pop-in">
        <div className="anim-float text-5xl">🏠</div>
        <h1 className="mt-3 text-xl font-bold text-ink">Manage a club</h1>
        <p className="mt-1 text-[13.5px] text-muted">
          Signed in as <b>{auth.user?.email}</b> · {auth.user?.role}
        </p>
        <form
          className="mt-6 space-y-4 text-left"
          onSubmit={(e) => {
            e.preventDefault();
            if (!clubId) return;
            auth.setClubSession(clubId);
            toast.toast("Dashboard opened.", "ok");
          }}
        >
          <div>
            <label className="label" htmlFor="pick-club">
              Club
            </label>
            <select
              id="pick-club"
              className="select"
              value={clubId}
              onChange={(e) => setClubId(e.target.value)}
            >
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary w-full">
            Open dashboard
          </button>
        </form>
        <button className="btn btn-ghost btn-sm mt-3" onClick={auth.signOut}>
          Sign out
        </button>
      </div>
    </div>
  );
}

/* ================= Notices tab ================= */

function NoticesTab({
  clubId,
  editing,
  setEditing,
}: {
  clubId: string;
  editing: Notice | "new" | null;
  setEditing: (n: Notice | "new" | null) => void;
}) {
  const db = useDb()!;
  const toast = useToast();
  const list = clubNotices(db, clubId);

  if (editing !== null) {
    const isEdit = editing !== "new";
    return (
      <div className="panel">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="m-0 text-[18px] font-bold text-ink">
            {isEdit ? "Edit notice" : "Post a new notice"}
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>
            ← Cancel
          </button>
        </div>
        <NoticeForm
          clubId={clubId}
          initial={isEdit ? (editing as Notice) : null}
          onSaved={() => {
            setEditing(null);
            toast.toast(isEdit ? "Notice updated." : "Notice published.", "ok");
          }}
        />
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-[18px] font-bold text-ink">Notices</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing("new")}>
          + Post notice
        </button>
      </div>
      {list.length ? (
        <div className="space-y-3">
          {list.map((n) => (
            <div key={n.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="m-0 text-[15px] font-bold text-ink">
                  {n.pinned && <span className="pin-badge">📌 PINNED</span>}
                  {n.title}
                </h3>
                <span className="text-[12.5px] text-muted">{fmtDate(n.date)}</span>
              </div>
              <p className="m-0 mt-1.5 text-[13.5px] text-ink/85">{n.body}</p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {n.formId && formById(db, n.formId) && <span className="pill club">📝 linked form</span>}
                <button className="btn btn-outline btn-sm" onClick={() => setEditing(n)}>
                  Edit
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    if (!confirm("Delete this notice?")) return;
                    mutate((d) => {
                      d.notices = d.notices.filter((x) => x.id !== n.id);
                    });
                    toast.toast("Notice deleted.", "ok");
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon="📢">No notices yet. Post your first one!</EmptyState>
      )}
    </div>
  );
}

function NoticeForm({
  clubId,
  initial,
  onSaved,
}: {
  clubId: string;
  initial: Notice | null;
  onSaved: () => void;
}) {
  const db = useDb()!;
  const toast = useToast();
  const forms = clubForms(db, clubId);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [formId, setFormId] = useState(initial?.formId ?? "");
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [pinned, setPinned] = useState(initial?.pinned ?? false);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim() || !body.trim()) {
          toast.toast("Title and body are required.", "err");
          return;
        }
        mutate((d) => {
          if (initial) {
            const n = d.notices.find((x) => x.id === initial.id);
            if (n)
              Object.assign(n, {
                title: title.trim(),
                body: body.trim(),
                formId: formId || undefined,
                date,
                pinned,
              });
          } else {
            d.notices.push({
              id: uid("n"),
              clubId,
              title: title.trim(),
              body: body.trim(),
              createdAt: new Date().toISOString(),
              date,
              reactions: {},
              pinned,
              formId: formId || undefined,
            });
          }
        });
        onSaved();
      }}
    >
      <div>
        <label className="label" htmlFor="nf-title">
          Notice title <span className="text-crimson">*</span>
        </label>
        <input
          id="nf-title"
          className="input"
          placeholder="e.g. CodeStorm 2025 — Registration Open"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div>
        <label className="label" htmlFor="nf-body">
          Notice body <span className="text-crimson">*</span>
        </label>
        <textarea
          id="nf-body"
          className="textarea"
          placeholder="Write the full notice here…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="nf-form">
            Attach a form (optional)
          </label>
          <select id="nf-form" className="select" value={formId} onChange={(e) => setFormId(e.target.value)}>
            <option value="">— None —</option>
            {forms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="nf-date">
            Posting date
          </label>
          <input
            id="nf-date"
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-[14px] font-semibold text-ink">
        <input
          type="checkbox"
          checked={pinned}
          onChange={(e) => setPinned(e.target.checked)}
          className="h-4 w-4 accent-crimson"
        />
        📌 Pin this notice to the top
      </label>
      <button type="submit" className="btn btn-primary">
        {initial ? "Save changes" : "Publish notice"}
      </button>
    </form>
  );
}

/* ================= Forms tab ================= */

function FormsTab({
  clubId,
  analyticsFormId,
  setAnalyticsFormId,
}: {
  clubId: string;
  analyticsFormId: string | null;
  setAnalyticsFormId: (id: string | null) => void;
}) {
  const db = useDb()!;
  const toast = useToast();
  const list = clubForms(db, clubId);
  const [builder, setBuilder] = useState<{
    formId?: string;
    title: string;
    description: string;
    openAt: string;
    deadline: string;
    fields: FormField[];
  } | null>(null);

  if (analyticsFormId) {
    const f = formById(db, analyticsFormId);
    if (!f || f.clubId !== clubId) {
      setAnalyticsFormId(null);
      return null;
    }
    return <AnalyticsPanel form={f} onBack={() => setAnalyticsFormId(null)} />;
  }

  if (builder) {
    return (
      <FormBuilder
        clubId={clubId}
        initial={builder}
        onCancel={() => setBuilder(null)}
        onSaved={() => {
          setBuilder(null);
          toast.toast(builder.formId ? "Form updated." : "Form published.", "ok");
        }}
      />
    );
  }

  const open = list.filter(isOpen).length;
  const soon = list.filter((f) => statusOf(f).key === "soon").length;
  const closed = list.filter((f) => statusOf(f).key === "closed").length;
  const subs = list.reduce((sum, f) => sum + db.submissions.filter((s) => s.formId === f.id).length, 0);

  return (
    <div className="panel">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-[18px] font-bold text-ink">Forms</h2>
        <button
          className="btn btn-primary btn-sm"
          onClick={() =>
            setBuilder({
              title: "",
              description: "",
              openAt: "",
              deadline: "",
              fields: [],
            })
          }
        >
          + Create form
        </button>
      </div>
      {list.length ? (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat value={open} label="open now" />
            <MiniStat value={soon} label="opening soon" />
            <MiniStat value={closed} label="closed" />
            <MiniStat value={subs} label="submissions" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {list.map((f) => {
              const st = statusOf(f);
              const fsubs = db.submissions.filter((s) => s.formId === f.id).length;
              return (
                <div key={f.id} className="card p-4">
                  <h3 className="m-0 text-[15px] font-bold text-ink">{f.title}</h3>
                  {f.description && <p className="m-0 mt-1 text-[13px] text-muted">{f.description}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="pill">{f.fields.length} fields</span>
                    {st.key === "closed" ? (
                      <span className="pill deadline">Closed</span>
                    ) : st.key === "soon" ? (
                      <Countdown start={f.openAt} />
                    ) : (
                      <Countdown end={f.deadline} />
                    )}
                    <span className="pill">{fsubs} filled</span>
                  </div>
                  {f.deadline && (
                    <p className="m-0 mt-2 text-[12px] text-muted">Closes {fmtDateTime(f.deadline)}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/form/${f.id}`} className="btn btn-outline btn-sm no-underline">
                      Preview
                    </Link>
                    <button className="btn btn-outline btn-sm" onClick={() => setAnalyticsFormId(f.id)}>
                      📊 Analytics
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() =>
                        setBuilder({
                          formId: f.id,
                          title: f.title,
                          description: f.description ?? "",
                          openAt: f.openAt ?? "",
                          deadline: f.deadline ?? "",
                          fields: f.fields.map((x) => ({
                            ...x,
                            options: x.options ? [...x.options] : undefined,
                          })),
                        })
                      }
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => {
                        if (!confirm("Delete this form and its submissions?")) return;
                        mutate((d) => {
                          d.forms = d.forms.filter((x) => x.id !== f.id);
                          d.submissions = d.submissions.filter((s) => s.formId !== f.id);
                        });
                        toast.toast("Form deleted.", "ok");
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <EmptyState icon="📝">No forms yet. Create a membership or event form for your club.</EmptyState>
      )}
    </div>
  );
}

/* ================= Form builder ================= */

const BUILDER_TYPES: [FormField["type"], string][] = [
  ["text", "Short text"],
  ["textarea", "Long text (paragraph)"],
  ["email", "Email"],
  ["phone", "Phone number"],
  ["number", "Number"],
  ["date", "Date"],
  ["select", "Dropdown list"],
  ["radio", "Multiple choice"],
  ["photo", "Picture upload"],
  ["payment", "Payment method (bKash/Nagad/Rocket)"],
];

function FormBuilder({
  clubId,
  initial,
  onCancel,
  onSaved,
}: {
  clubId: string;
  initial: {
    formId?: string;
    title: string;
    description: string;
    openAt: string;
    deadline: string;
    fields: FormField[];
  };
  onCancel: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [draft, setDraft] = useState(initial);
  const isEdit = !!draft.formId;

  const setField = (i: number, patch: Partial<FormField>) =>
    setDraft((d) => ({ ...d, fields: d.fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)) }));

  return (
    <div className="panel">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="m-0 text-[18px] font-bold text-ink">{isEdit ? "Edit form" : "Create a new form"}</h2>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>
          ← Cancel
        </button>
      </div>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.title.trim()) {
            toast.toast("Form title is required.", "err");
            return;
          }
          const fields = draft.fields.filter((f) => f.label.trim());
          if (!fields.length) {
            toast.toast("Add at least one field with a label.", "err");
            return;
          }
          mutate((d) => {
            const clean: Form = {
              id: isEdit ? draft.formId! : uid("f"),
              clubId,
              title: draft.title.trim(),
              description: draft.description.trim(),
              openAt: draft.openAt || "",
              deadline: draft.deadline || "",
              fields: fields.map((f) => ({
                id: f.id || uid("fl"),
                label: f.label.trim(),
                type: f.type,
                required: f.required,
                placeholder: f.placeholder?.trim() || undefined,
                options: f.options?.length ? f.options : undefined,
              })),
            };
            const idx = d.forms.findIndex((x) => x.id === clean.id);
            if (idx >= 0) d.forms[idx] = clean;
            else d.forms.push(clean);
          });
          onSaved();
        }}
      >
        <div>
          <label className="label" htmlFor="bf-title">
            Form title <span className="text-crimson">*</span>
          </label>
          <input
            id="bf-title"
            className="input"
            placeholder="e.g. NITER Computer Club Membership Form"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          />
        </div>
        <div>
          <label className="label" htmlFor="bf-desc">
            Description
          </label>
          <textarea
            id="bf-desc"
            className="textarea"
            placeholder="Explain what this form is for…"
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="bf-openat">
              Opens at (optional)
            </label>
            <input
              id="bf-openat"
              type="datetime-local"
              className="input"
              value={draft.openAt}
              onChange={(e) => setDraft((d) => ({ ...d, openAt: e.target.value }))}
            />
            <p className="hint mt-1">Leave empty to accept responses immediately.</p>
          </div>
          <div>
            <label className="label" htmlFor="bf-deadline">
              Closes at
            </label>
            <input
              id="bf-deadline"
              type="datetime-local"
              className="input"
              value={draft.deadline}
              onChange={(e) => setDraft((d) => ({ ...d, deadline: e.target.value }))}
            />
            <p className="hint mt-1">Students see a live countdown to this time.</p>
          </div>
        </div>

        <h3 className="m-0 pt-2 text-[15px] font-bold text-ink">Fields</h3>
        <div className="space-y-3">
          {draft.fields.map((f, i) => (
            <div key={i} className="rounded-xl border border-line bg-surface-2/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[13px] font-bold text-muted">☰ Field {i + 1}</span>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => setDraft((d) => ({ ...d, fields: d.fields.filter((_, idx) => idx !== i) }))}
                >
                  ✕ Remove
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor={`bf-label-${i}`}>
                    Field label <span className="text-crimson">*</span>
                  </label>
                  <input
                    id={`bf-label-${i}`}
                    className="input"
                    placeholder="e.g. Full Name"
                    value={f.label}
                    onChange={(e) => setField(i, { label: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label" htmlFor={`bf-type-${i}`}>
                    Field type
                  </label>
                  <select
                    id={`bf-type-${i}`}
                    className="select"
                    value={f.type}
                    onChange={(e) => {
                      const type = e.target.value as FormField["type"];
                      setField(i, { type, options: type === "payment" ? undefined : f.options });
                    }}
                  >
                    {BUILDER_TYPES.map(([t, label]) => (
                      <option key={t} value={t}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                <div>
                  <label className="label" htmlFor={`bf-ph-${i}`}>
                    Placeholder / hint (optional)
                  </label>
                  <input
                    id={`bf-ph-${i}`}
                    className="input"
                    value={f.placeholder ?? ""}
                    onChange={(e) => setField(i, { placeholder: e.target.value })}
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex cursor-pointer items-center gap-2 text-[13.5px] font-semibold text-ink">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-crimson"
                      checked={f.required}
                      onChange={(e) => setField(i, { required: e.target.checked })}
                    />
                    Required?
                  </label>
                </div>
              </div>
              {(f.type === "select" || f.type === "radio" || f.type === "payment") && (
                <div className="mt-3">
                  <label className="label" htmlFor={`bf-opts-${i}`}>
                    Options (comma separated)
                  </label>
                  <input
                    id={`bf-opts-${i}`}
                    className="input"
                    value={(f.options ?? []).join(", ")}
                    placeholder="Option 1, Option 2, Option 3"
                    onChange={(e) =>
                      setField(i, {
                        options: e.target.value
                          .split(",")
                          .map((o) => o.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() =>
              setDraft((d) => ({
                ...d,
                fields: [
                  ...d.fields,
                  { id: uid("fl"), label: "", type: "text", required: false, placeholder: "" },
                ],
              }))
            }
          >
            + Add field
          </button>
        </div>
        <div>
          <button type="submit" className="btn btn-primary">
            {isEdit ? "Save changes" : "Publish form"}
          </button>
        </div>
      </form>
    </div>
  );
}

function MiniStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/50 p-3 text-center">
      <div className="text-[20px] font-extrabold text-ink">{value}</div>
      <div className="text-[11.5px] text-muted">{label}</div>
    </div>
  );
}

function AnalyticsPanel({ form, onBack }: { form: Form; onBack: () => void }) {
  const db = useDb()!;
  const subs = db.submissions.filter((s) => s.formId === form.id);

  // last-7-days bars
  const dayMap = new Map<string, number>();
  subs.forEach((s) => {
    const k = new Date(s.submittedAt).toDateString();
    dayMap.set(k, (dayMap.get(k) ?? 0) + 1);
  });
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count: dayMap.get(d.toDateString()) ?? 0,
    });
  }
  const maxDay = Math.max(1, ...days.map((x) => x.count));

  const optionFields = form.fields.filter(
    (fl) => fl.type === "select" || fl.type === "radio" || fl.type === "payment"
  );

  return (
    <div className="panel">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-[18px] font-bold text-ink">📊 {form.title}</h2>
        <button className="btn btn-outline btn-sm" onClick={onBack}>
          ← Back to forms
        </button>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="pill club">
          {subs.length} response{subs.length === 1 ? "" : "s"}
        </span>
        {form.deadline && (
          <span className="pill">
            Closes <Countdown end={form.deadline} />
          </span>
        )}
      </div>
      {subs.length ? (
        <>
          <h3 className="m-0 text-[15px] font-bold text-ink">Submissions — last 7 days</h3>
          <div className="mt-3 flex h-[72px] items-end gap-3">
            {days.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-crimson/80"
                  style={{ height: Math.max(3, Math.round((d.count / maxDay) * 54)) }}
                />
                <div className="text-[10.5px] text-muted">{d.label}</div>
                <div className="text-[11px] font-bold text-ink">{d.count}</div>
              </div>
            ))}
          </div>
          {optionFields.map((fl) => {
            const counts = new Map((fl.options ?? []).map((o) => [o, 0]));
            subs.forEach((s) => {
              const v = s.data[fl.id];
              if (v && counts.has(v)) counts.set(v, (counts.get(v) ?? 0) + 1);
            });
            const max = Math.max(1, ...counts.values());
            return (
              <div key={fl.id} className="mt-5">
                <h3 className="m-0 text-[14px] font-bold text-ink">{fl.label}</h3>
                <div className="mt-2 space-y-1.5">
                  {[...counts.entries()].map(([k, c]) => (
                    <div key={k} className="flex items-center gap-2 text-[13px]">
                      <span className="w-40 truncate text-muted" title={k}>
                        {k}
                      </span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full bg-crimson/70"
                          style={{ width: `${Math.max(3, Math.round((c / max) * 100))}%` }}
                        />
                      </div>
                      <span className="w-6 text-right font-bold text-ink">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      ) : (
        <EmptyState icon="📊">No submissions yet — share your form link to get responses.</EmptyState>
      )}
    </div>
  );
}

/* ================= Submissions tab ================= */

function SubmissionsTab({
  clubId,
  subFormId,
  setSubFormId,
}: {
  clubId: string;
  subFormId: string | null;
  setSubFormId: (id: string | null) => void;
}) {
  const db = useDb()!;
  const auth = useAuth();
  const toast = useToast();
  const forms = clubForms(db, clubId);

  const activeForm = subFormId ? formById(db, subFormId) : null;
  const subs = activeForm ? db.submissions.filter((s) => s.formId === activeForm.id) : [];

  const setReview = (s: Submission, status: "approved" | "rejected") => {
    const target = db.submissions.find((x) => x.id === s.id);
    if (!target || target.clubId !== clubId) {
      toast.toast("Only this club's moderator can review its applications.", "err");
      return;
    }
    mutate((draft) => {
      const t = draft.submissions.find((x) => x.id === s.id);
      if (!t) return;
      t.reviewStatus = status;
      t.reviewedAt = new Date().toISOString();
      t.reviewedBy = auth.user?.name || auth.user?.email || "";
    });
    toast.toast(status === "approved" ? "Application approved." : "Application rejected.", "ok");
  };

  const reviewCell = (s: Submission) => {
    if (s.reviewStatus === "approved")
      return (
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
          ✓ Approved
        </span>
      );
    if (s.reviewStatus === "rejected")
      return (
        <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-700">
          ✕ Rejected
        </span>
      );
    return (
      <div className="flex gap-1.5">
        <button className="btn btn-outline btn-sm" onClick={() => setReview(s, "approved")}>
          ✓ Approve
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => setReview(s, "rejected")}>
          ✕ Reject
        </button>
      </div>
    );
  };

  if (forms.length === 0)
    return (
      <div className="panel">
        <EmptyState icon="📥">No forms yet — create one to start collecting submissions.</EmptyState>
      </div>
    );

  return (
    <div className="panel">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-[18px] font-bold text-ink">Submissions</h2>
        {activeForm && subs.length > 0 && (
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              exportSubmissionsCsv(activeForm, subs);
              toast.toast("CSV downloaded.", "ok");
            }}
          >
            ⬇ Export CSV
          </button>
        )}
      </div>
      <div className="mb-4">
        <label className="label" htmlFor="sub-form">
          Form
        </label>
        <select
          id="sub-form"
          className="select max-w-md"
          value={subFormId ?? ""}
          onChange={(e) => setSubFormId(e.target.value || null)}
        >
          <option value="">— Select a form —</option>
          {forms.map((f) => (
            <option key={f.id} value={f.id}>
              {f.title}
            </option>
          ))}
        </select>
      </div>
      {!activeForm ? (
        <EmptyState icon="👆">Pick a form above to view its submissions.</EmptyState>
      ) : subs.length === 0 ? (
        <EmptyState icon="📥">No submissions for this form yet.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Submitted</th>
                {activeForm.fields.map((fl) => (
                  <th key={fl.id}>
                    {fl.label}
                    {fl.type === "payment" ? " / Trx" : ""}
                  </th>
                ))}
                <th>Review</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td className="whitespace-nowrap">
                    <RelativeTime ts={s.submittedAt} />
                  </td>
                  {activeForm.fields.map((fl) => {
                    const v = s.data[fl.id];
                    if (fl.type === "photo")
                      return (
                        <td key={fl.id}>
                          {v ? (
                            <a
                              href={v}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-crimson no-underline hover:underline"
                            >
                              Photo
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                      );
                    return (
                      <td key={fl.id}>
                        {v || "—"}
                        {fl.type === "payment" && s.data["trx_" + fl.id]
                          ? ` (${s.data["trx_" + fl.id]})`
                          : ""}
                      </td>
                    );
                  })}
                  <td className="whitespace-nowrap">{reviewCell(s)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function exportSubmissionsCsv(form: Form, subs: Submission[]) {
  const headers = form.fields
    .map((fl) => [fl.label, ...(fl.type === "payment" ? ["Transaction No"] : [])])
    .flat();
  const rows: string[][] = [["Submitted At", ...headers]];
  subs.forEach((s) => {
    rows.push([
      s.submittedAt,
      ...form.fields
        .map((fl) => {
          const v = s.data[fl.id] || "";
          if (fl.type === "photo" && v) return ["[Photo attached]"];
          const out = [v];
          if (fl.type === "payment") out.push(s.data["trx_" + fl.id] || "");
          return out;
        })
        .flat(),
    ]);
  });
  const csv = rows
    .map((r) =>
      r
        .map((v) => {
          v = String(v ?? "");
          return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
        })
        .join(",")
    )
    .join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = form.title.replace(/[^\w\- ]+/g, "").trim() + "-submissions.csv";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 300);
}

/* ================= Complaints tab ================= */

function ComplaintsTab({ clubId }: { clubId: string }) {
  const db = useDb()!;
  const toast = useToast();
  const list = db.complaints
    .filter((c) => c.clubId === clubId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div className="panel">
      <h2 className="m-0 mb-1 text-[18px] font-bold text-ink">Complaints</h2>
      <p className="m-0 mb-4 text-[13px] text-muted">
        Complaints submitted by students about this club — reply and update the status to resolve them.
      </p>
      {list.length ? (
        <div className="space-y-3">
          {list.map((c) => (
            <ComplaintManageCard key={c.id} clubId={clubId} complaint={c} onToast={toast.toast} />
          ))}
        </div>
      ) : (
        <EmptyState icon="📮">No complaints yet. Great job!</EmptyState>
      )}
    </div>
  );
}

/* ================= Memberships tab ================= */

function MembershipsTab({ clubId }: { clubId: string }) {
  const db = useDb()!;
  const auth = useAuth();
  const toast = useToast();
  const list = (db.memberships || [])
    .filter((m) => m.clubId === clubId)
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));

  const setStatus = (m: Membership, status: "approved" | "rejected") => {
    const target = (db.memberships || []).find((x) => x.id === m.id);
    if (!target || target.clubId !== clubId) {
      toast.toast("Only this club's moderator can review join requests.", "err");
      return;
    }
    mutate((draft) => {
      const t = draft.memberships.find((x) => x.id === m.id);
      if (!t) return;
      t.status = status;
      t.reviewedAt = new Date().toISOString();
      t.reviewedBy = auth.user?.name || auth.user?.email || "";
    });
    toast.toast(status === "approved" ? "Membership approved!" : "Membership rejected.", "ok");
  };

  const pill = (m: Membership) => {
    if (m.status === "approved") return "bg-emerald-100 text-emerald-800";
    if (m.status === "rejected") return "bg-rose-100 text-rose-700";
    return "bg-amber-100 text-amber-800";
  };

  return (
    <div className="panel">
      <h2 className="m-0 mb-1 text-[18px] font-bold text-ink">Memberships</h2>
      <p className="m-0 mb-4 text-[13px] text-muted">
        Students who requested to join this club — approve or reject their requests.
      </p>
      {list.length ? (
        <div className="space-y-3">
          {list.map((m) => (
            <div key={m.id} className="rounded-xl border border-line p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[14.5px] font-bold text-ink">{m.userName || m.userEmail}</div>
                  <div className="text-[12.5px] text-muted">
                    {m.userEmail}
                    {m.studentId ? ` · 🎓 ${m.studentId}` : ""} · {relativeAgo(m.requestedAt)}
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${pill(m)}`}>
                  {m.status === "approved"
                    ? "✓ Member"
                    : m.status === "rejected"
                      ? "✕ Rejected"
                      : "⏳ Pending"}
                </span>
              </div>
              {m.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <button className="btn btn-primary btn-sm" onClick={() => setStatus(m, "approved")}>
                    ✓ Approve
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => setStatus(m, "rejected")}>
                    ✕ Reject
                  </button>
                </div>
              )}
              {m.status !== "pending" && m.reviewedBy && (
                <p className="mb-0 mt-2 text-[12px] text-muted">
                  Reviewed by {m.reviewedBy}
                  {m.reviewedAt ? ` · ${relativeAgo(m.reviewedAt)}` : ""}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon="🤝">No membership requests for this club yet.</EmptyState>
      )}
    </div>
  );
}

/* ================= Settings tab ================= */

/* ================= Committee editor =================
   Lets the club's moderator (and the admin) update the committee shown on
   the club page — roles change, members change, photos change. Reached from
   the portal Settings tab, which only opens for clubs the user manages. */
type DraftExec = { role: string; name: string; photo: string };

function CommitteeEditor({ clubId }: { clubId: string }) {
  const db = useDb()!;
  const toast = useToast();
  const auth = useAuth();
  const [rows, setRows] = useState<DraftExec[]>(() =>
    (db.clubs.find((c) => c.id === clubId)?.executives ?? []).map((e) => ({
      role: e.role || "",
      name: e.name || "",
      photo: e.photo || "",
    }))
  );

  const setRow = (i: number, patch: Partial<DraftExec>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const onPhotoFile = (i: number, file: File | undefined) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) return toast.toast("Please choose an image file (JPG/PNG).", "err");
    if (file.size > 8 * 1024 * 1024) return toast.toast("That image is too large — pick one under 8 MB.", "err");
    const reader = new FileReader();
    reader.onload = () => setRow(i, { photo: String(reader.result || "") });
    reader.readAsDataURL(file);
  };

  const save = () => {
    const clean = rows
      .map((r) => ({
        role: (r.role || "").trim(),
        name: (r.name || "").trim(),
        photo: (r.photo || "").trim(),
      }))
      .filter((r) => r.role || r.name);
    let summary = "";
    let clubName = "";
    mutate((draft) => {
      const club = draft.clubs.find((c) => c.id === clubId);
      if (!club) return;
      clubName = club.name;
      const next = clean.map((r) => ({ role: r.role || "Member", name: r.name, photo: r.photo }));
      const prev = club.executives;
      const changed = JSON.stringify(prev) !== JSON.stringify(next);
      club.executives = next;
      // Log every committee save (who, when, what changed) for the club-page history.
      if (changed) {
        const by = auth.user?.name || auth.user?.email || "a club moderator";
        if (!Array.isArray(club.committeeHistory)) club.committeeHistory = [];
        summary = committeeChangeSummary(prev, next);
        club.committeeHistory.unshift({
          by,
          at: new Date().toISOString(),
          summary,
        });
      }
    });
    toast.toast("Committee saved — the club page is updated.", "ok");
    // Email the club's moderators about the change (resolved from the users cache).
    if (summary) notifyCommitteeEdit(clubName, summary);
  };

  /* Email the club's moderators (admins + that club's executives) about the edit.
     Cloud mode populates db.__users; demo mode has none, so we fall back to a toast. */
  const notifyCommitteeEdit = (name: string, change: string) => {
    const by = auth.user?.name || auth.user?.email || "a club moderator";
    const mods: { email: string; name?: string }[] = [];
    (db.__users || []).forEach((u) => {
      if (!u?.email) return;
      if (u.role === "admin" || (u.role === "executive" && (u.clubs || []).includes(clubId))) {
        mods.push({ email: u.email, name: u.name || u.email });
      }
    });
    if (!mods.length) {
      toast.toast("Committee saved — no moderator emails on file to notify (admins can add them in Members & roles).");
      return;
    }
    fetch("/api/committee-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clubName: name,
        editor: by,
        summary: change,
        url: `${window.location.origin}/club/${encodeURIComponent(clubId)}`,
        to: mods,
      }),
    })
      .then((r) => r.json().catch(() => null))
      .then((res) => {
        if (res && res.sent) {
          toast.toast(`Committee saved — emailed ${res.sent} moderator${res.sent === 1 ? "" : "s"}.`, "ok");
        } else {
          toast.toast(`Committee saved — notification could not be sent (${res?.skipped || "unknown error"}).`, "err");
        }
      })
      .catch(() => toast.toast("Committee saved — notification could not be sent.", "err"));
  };

  return (
    <div className="panel lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-[18px] font-bold text-ink">👥 Committee &amp; photos</h2>
        <button className="btn btn-outline btn-sm" onClick={() => setRows((p) => [...p, { role: "", name: "", photo: "" }])}>
          + Add member
        </button>
      </div>
      <p className="m-0 mt-1 text-[13px] text-muted">
        The committee shown on your club page — role, name and photo (upload an image or paste a URL). Roles
        change, members change; save to publish.
      </p>
      <div className="mt-4 space-y-2.5">
        {rows.map((r, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface-2 p-2.5">
            <span className="inline-grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-gold to-amber-400 text-[12px] font-extrabold text-navy">
              {r.photo ? (
                <img src={r.photo} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                initialsOf(r.name || "?")
              )}
            </span>
            <input
              className="input !w-[130px]"
              placeholder="Role"
              value={r.role}
              onChange={(e) => setRow(i, { role: e.target.value })}
              aria-label="Role"
            />
            <input
              className="input grow"
              placeholder="Full name"
              value={r.name}
              onChange={(e) => setRow(i, { name: e.target.value })}
              aria-label="Full name"
            />
            <input
              className="input !max-w-[210px] grow"
              placeholder="Photo URL"
              value={r.photo.startsWith("data:") ? "(uploaded image)" : r.photo}
              onChange={(e) => setRow(i, { photo: e.target.value })}
              aria-label="Photo URL"
            />
            <label className="btn btn-outline btn-sm mb-0 cursor-pointer">
              📁
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPhotoFile(i, e.target.files?.[0])}
              />
            </label>
            <button className="btn btn-danger btn-sm" onClick={() => setRows((p) => p.filter((_, idx) => idx !== i))}>
              ✕
            </button>
          </div>
        ))}
        {!rows.length && <p className="m-0 text-[13px] text-muted">No members yet — add the first one.</p>}
      </div>
      <button className="btn btn-primary mt-4" onClick={save}>
        Save committee
      </button>
    </div>
  );
}

function committeeChangeSummary(prev: Executive[], next: { role: string; name: string; photo: string }[]): string {
  const key = (r: { name?: string }) => (r.name || "").trim().toLowerCase();
  const prevMap = new Map<string, Executive>();
  const nextMap = new Map<string, { role: string; name: string; photo: string }>();
  prev.forEach((r) => r.name && prevMap.set(key(r), r));
  next.forEach((r) => r.name && nextMap.set(key(r), r));
  let added = 0;
  let removed = 0;
  let updated = 0;
  next.forEach((r) => {
    if (!r.name) return;
    const p = prevMap.get(key(r));
    if (!p) {
      added++;
      return;
    }
    if ((p.role || "") !== (r.role || "") || (p.photo || "") !== (r.photo || "")) updated++;
  });
  prev.forEach((r) => r.name && !nextMap.has(key(r)) && removed++);
  const parts: string[] = [];
  if (added) parts.push(`added ${added}`);
  if (removed) parts.push(`removed ${removed}`);
  if (updated) parts.push(`updated ${updated}`);
  return parts.length ? parts.join(", ") : "reordered the panel";
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return ((parts[0][0] || "") + (parts[parts.length - 1][0] || "")).toUpperCase();
}

function SettingsTab({ clubId, isAdmin }: { clubId: string; isAdmin: boolean }) {
  const db = useDb()!;
  const toast = useToast();
  const [users, setUsersState] = useState<PortalUser[] | null>(null);

  const loadUsers = async () => {
    const { getCloudDb } = await import("@/lib/firebase");
    const { collection, getDocs } = await import("firebase/firestore");
    const dbref = getCloudDb();
    if (!dbref) return;
    try {
      const snap = await getDocs(collection(dbref, "users"));
      const list: PortalUser[] = [];
      snap.forEach((ds) => {
        const d = ds.data() as PortalUser;
        list.push({ ...d, uid: ds.id });
      });
      setUsers(list);
      setUsersState(list);
    } catch {
      toast.toast("Members list needs admin access.", "err");
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <CommitteeEditor clubId={clubId} />

      <div className="panel">
        <h2 className="m-0 text-[18px] font-bold text-ink">Data</h2>
        <div className="mt-4 flex flex-col gap-2.5">
          <button
            className="btn btn-outline btn-sm w-fit"
            onClick={() => {
              const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "niter-clubs-backup.json";
              document.body.appendChild(a);
              a.click();
              setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }, 300);
              toast.toast("Backup downloaded.", "ok");
            }}
          >
            ⬇ Download backup (JSON)
          </button>
          <button
            className="btn btn-outline btn-sm w-fit"
            onClick={() => {
              if (
                !confirm(
                  "Reset the LOCAL copy of the site data to the demo dataset? (Cloud data is untouched.)"
                )
              )
                return;
              resetDb();
              toast.toast("Demo data restored.", "ok");
            }}
          >
            ↺ Reset to demo data
          </button>
        </div>
      </div>

      <div className="panel">
        <h2 className="m-0 text-[18px] font-bold text-ink">Cloud sync</h2>
        <p className="m-0 mt-1 text-[13px] text-muted">
          When Firebase is configured, local edits sync to Firestore automatically. Use these to manage the
          shared database.
        </p>
        <div className="mt-4 flex flex-col gap-2.5">
          <button
            className="btn btn-outline btn-sm w-fit"
            onClick={async () => {
              const res = await pushSampleToCloud();
              if (res.ok) toast.toast("Sample data published to the cloud.", "ok");
              else
                toast.toast("Could not publish: " + ((res.err as Error)?.message ?? "unknown error"), "err");
            }}
          >
            ☁ Publish sample data to cloud
          </button>
        </div>
      </div>

      {isAdmin && (
        <div className="panel lg:col-span-2">
          <h2 className="m-0 text-[18px] font-bold text-ink">Members &amp; roles</h2>
          <p className="m-0 mt-1 text-[13px] text-muted">
            Promote members to executives and pick which clubs they manage. Grant <b>IT Staff</b> to let
            someone run the IT Helpdesk.
          </p>
          <div className="mt-3">
            <button className="btn btn-outline btn-sm" onClick={() => void loadUsers()}>
              Load members
            </button>
          </div>
          {users && (
            <div className="mt-4 space-y-3">
              {users.map((u) => (
                <MemberRow key={u.uid} user={u} clubs={db.clubs} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MemberRow({
  user,
  clubs,
}: {
  user: PortalUser;
  clubs: { id: string; icon: string; name: string }[];
}) {
  const toast = useToast();
  const [role, setRole] = useState(user.role);
  const [selectedClubs, setSelectedClubs] = useState<string[]>(user.clubs ?? []);
  return (
    <div className="rounded-xl border border-line p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[14px] font-bold text-ink">{user.name || user.email}</div>
          <div className="text-[12.5px] text-muted">{user.email}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="select !w-auto !py-1.5 text-[13px]"
            value={role}
            onChange={(e) => setRole(e.target.value as PortalUser["role"])}
          >
            <option value="admin">Admin</option>
            <option value="executive">Executive</option>
            <option value="it-staff">IT Staff</option>
            <option value="member">Member</option>
          </select>
          <button
            className="btn btn-outline btn-sm"
            onClick={async () => {
              const { getCloudDb } = await import("@/lib/firebase");
              const { doc, updateDoc } = await import("firebase/firestore");
              const dbref = getCloudDb();
              if (!dbref) return;
              try {
                await updateDoc(doc(dbref, "users", user.uid), { role, clubs: selectedClubs });
                toast.toast("Role updated.", "ok");
              } catch (err) {
                toast.toast("Could not update role: " + (err as Error).message, "err");
              }
            }}
          >
            Save
          </button>
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {clubs.map((c) => {
          const on = selectedClubs.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              onClick={() =>
                setSelectedClubs((prev) => (on ? prev.filter((x) => x !== c.id) : [...prev, c.id]))
              }
              className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition ${
                on ? "bg-crimson text-white" : "border border-line text-muted hover:border-crimson"
              }`}
            >
              {c.icon} {c.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PortalSkeleton() {
  return (
    <div className="container-x py-16">
      <div className="card mx-auto max-w-md p-8">
        <Skeleton className="mx-auto h-16 w-16 rounded-full" />
        <Skeleton className="mx-auto mt-4 h-6 w-48" />
        <Skeleton className="mt-6 h-10" />
        <Skeleton className="mt-3 h-10" />
        <Skeleton className="mt-3 h-10" />
      </div>
    </div>
  );
}
