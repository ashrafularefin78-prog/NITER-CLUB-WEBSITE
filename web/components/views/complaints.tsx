"use client";

import Link from "next/link";
import { useState } from "react";
import type { Complaint, ComplaintStatus } from "@/lib/types";
import { uid } from "@/lib/utils";
import { mutate, useDb } from "@/lib/store";
import { logAudit } from "@/lib/audit";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/providers";
import { EmptyState, LiveBadge, Skeleton } from "@/components/ui";
import { RelativeTime } from "@/components/countdown";
import { AnimatedCheck } from "@/components/animated-check";

const CLUB_CATEGORIES = [
  "Event / Notice issue",
  "Membership / Form issue",
  "Conduct of members",
  "Suggestion",
  "Other",
];
const IT_CATEGORIES = [
  "WiFi / Internet",
  "Computer lab",
  "Email / Portal",
  "Hardware / Equipment",
  "Software / Access",
  "Other",
];

export function statusLabel(s: ComplaintStatus): string {
  return s === "in-progress" ? "In progress" : s === "resolved" ? "Resolved" : "Open";
}

const STATUS_TONE: Record<ComplaintStatus, string> = {
  open: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  "in-progress": "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
};

export function ComplaintView({ clubId, isIt = false }: { clubId?: string; isIt?: boolean }) {
  const db = useDb();
  const toast = useToast();
  const [done, setDone] = useState(false);
  const club = !isIt ? (db?.clubs.find((c) => c.id === clubId) ?? null) : null;

  if (!db) return <ComplaintSkeleton />;
  if (!isIt && !club)
    return (
      <div className="container-x py-16 text-center">
        <div className="text-5xl">🤔</div>
        <h1 className="mt-3 text-xl font-bold text-ink">Club not found</h1>
        <Link href="/clubs" className="btn btn-primary mt-4 no-underline">
          Browse all clubs
        </Link>
      </div>
    );

  const title = isIt ? "🖥 IT Complaint Box" : "📮 File a complaint";
  const pageTitle = isIt ? "IT Complaint Box" : `Complaint Box — ${club!.name}`;
  const desc = isIt
    ? "Report campus IT issues — WiFi, computer labs, portal problems, hardware and more. The IT team will look into it."
    : "Something wrong with this club’s events, forms or members? Tell us — your complaint stays confidential and the club executives will review it.";
  const categories = isIt ? IT_CATEGORIES : CLUB_CATEGORIES;

  if (done) {
    const back = isIt ? (
      <>
        <Link href="/it-desk" className="btn btn-outline no-underline">
          🖥 IT Helpdesk
        </Link>{" "}
        <Link href="/" className="btn btn-primary no-underline">
          Go home
        </Link>
      </>
    ) : (
      <>
        <Link href={`/club/${club!.id}`} className="btn btn-outline no-underline">
          Back to {club!.name}
        </Link>{" "}
        <Link href="/" className="btn btn-primary no-underline">
          Go home
        </Link>
      </>
    );
    return (
      <div className="container-x py-14 text-center">
        <div className="anim-pop-in card mx-auto max-w-md p-8">
          <AnimatedCheck />
          <h1
            className="anim-fade-up display-md mt-4 text-ink"
            style={{ animationDelay: "0.5s" }}
          >
            Complaint submitted!
          </h1>
          <p
            className="anim-fade-up mx-auto max-w-md text-[14px] text-muted"
            style={{ animationDelay: "0.65s" }}
          >
            Thank you. {isIt ? "The IT team" : club!.name} will review it and reply as soon as possible.
            {isIt && " You can track and manage it from the IT Helpdesk."}
          </p>
          <div
            className="anim-fade-up mt-6 flex flex-wrap justify-center gap-3"
            style={{ animationDelay: "0.8s" }}
          >
            {back}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x py-10">
      <nav aria-label="Breadcrumb" className="text-[13px] text-muted">
        <Link href="/" className="no-underline hover:underline">
          Home
        </Link>{" "}
        /{" "}
        {isIt ? (
          <span className="text-ink">IT Complaint Box</span>
        ) : (
          <>
            <Link href={`/club/${club!.id}`} className="no-underline hover:underline">
              {club!.name}
            </Link>{" "}
            / <span className="text-ink">Complaint</span>
          </>
        )}
      </nav>

      <div className="mt-6 max-w-2xl">
        <h1 className="display-md m-0 text-ink">{title}</h1>
        <p className="mt-2 text-[14px] text-muted">{desc}</p>

        <div className="card mt-6 overflow-hidden">
          <div className="border-b border-line p-6">
            <h2 className="m-0 text-[18px] font-bold text-ink">{pageTitle}</h2>
            <p className="m-0 mt-1 text-[13px] text-muted">
              Your details are optional — complaints can be filed anonymously.
            </p>
          </div>
          <form
            className="space-y-5 p-6"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              const f = e.currentTarget;
              const subject = (f.cfTitle.value as string).trim();
              const body = (f.cfBody.value as string).trim();
              if (!subject || !body) {
                toast.toast("Please fill in the subject and details.", "err");
                return;
              }
              const submittedBy = (f.cfName.value as string).trim();
              mutate((db) => {
                db.complaints.unshift({
                  id: uid("c"),
                  clubId: isIt ? "it" : clubId!,
                  title: subject,
                  body,
                  category: f.cfCategory.value || "Other",
                  submittedBy,
                  contact: (f.cfContact.value as string).trim(),
                  status: "open",
                  reply: "",
                  createdAt: new Date().toISOString(),
                  resolvedAt: "",
                } as Complaint);
              });
              logAudit(
                "complaint",
                `Complaint filed: ${subject}`,
                "info",
                isIt ? "IT Helpdesk" : club!.name,
                submittedBy || "anonymous"
              );
              setDone(true);
              toast.toast("Complaint submitted!", "ok");
            }}
          >
            <div>
              <label className="label" htmlFor="cf-category">
                Category
              </label>
              <select id="cf-category" name="cfCategory" className="select" defaultValue="">
                <option value="">— Select —</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="cf-title">
                Subject <span className="text-crimson">*</span>
              </label>
              <input
                id="cf-title"
                name="cfTitle"
                className="input"
                placeholder="e.g. WiFi keeps disconnecting in the library"
              />
            </div>
            <div>
              <label className="label" htmlFor="cf-body">
                Details <span className="text-crimson">*</span>
              </label>
              <textarea
                id="cf-body"
                name="cfBody"
                className="textarea"
                placeholder="Describe the issue — when it started, where, how often…"
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="cf-name">
                  Your name (optional)
                </label>
                <input id="cf-name" name="cfName" className="input" placeholder="Anonymous" />
              </div>
              <div>
                <label className="label" htmlFor="cf-contact">
                  Contact (optional)
                </label>
                <input id="cf-contact" name="cfContact" className="input" placeholder="Email or phone" />
              </div>
            </div>
            <div className="pt-2">
              <button type="submit" className="btn btn-primary w-full">
                Submit complaint
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ---------------- IT Helpdesk ---------------- */
export function ItDeskView() {
  const db = useDb();
  const auth = useAuth();
  const toast = useToast();

  if (!db) return <ComplaintSkeleton />;

  // Access is restricted to the admin and users the admin has granted the
  // "it-staff" role (cloud mode). Offline demo mode has no roles, so any
  // visitor may preview the desk there.
  const canManage = auth.cloud
    ? !!auth.user && (auth.user.role === "admin" || auth.user.role === "it-staff")
    : true;
  if (!canManage) {
    return (
      <div className="container-x py-16">
        <div className="card mx-auto max-w-md p-8 text-center">
          <div className="text-5xl">🛠</div>
          <h1 className="mt-3 text-xl font-bold text-ink">Restricted area</h1>
          <p className="mt-1 text-[14px] text-muted">
            The IT Helpdesk is visible only to the site admin and users the admin has given permission.{" "}
            <Link href="/it-support" className="font-semibold text-navy no-underline hover:underline">
              Report a website issue →
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const list = db.complaints
    .filter((c) => c.clubId === "it")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const open = list.filter((c) => c.status !== "resolved").length;

  return (
    <div className="container-x py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display-md m-0 text-ink">🖥 IT Helpdesk</h1>
          <p className="mt-1 text-[14px] text-muted">
            Student-reported IT issues across campus — WiFi, labs, portal and equipment.
          </p>
        </div>
        <LiveBadge>{open} open</LiveBadge>
      </div>

      <div className="mt-6 space-y-4">
        {list.length ? (
          list.map((c) => (
            <ComplaintManageCard key={c.id} clubId="it" complaint={c} onToast={toast.toast} />
          ))
        ) : (
          <EmptyState icon="🖥">No IT complaints yet.</EmptyState>
        )}
      </div>
    </div>
  );
}

export function ComplaintManageCard({
  clubId,
  complaint,
  onToast,
}: {
  clubId: string;
  complaint: Complaint;
  onToast: (m: string, k?: "" | "ok" | "err") => void;
}) {
  const [reply, setReply] = useState(complaint.reply);
  const canManage = complaint.clubId === clubId;
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="m-0 text-[16px] font-bold text-ink">{complaint.title}</h3>
        <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold ${STATUS_TONE[complaint.status]}`}>
          {statusLabel(complaint.status)}
        </span>
      </div>
      <p className="m-0 mt-1.5 text-[12.5px] text-muted">
        🗓 <RelativeTime ts={complaint.createdAt} /> · by {complaint.submittedBy || "Anonymous"}
        {complaint.contact ? ` · ${complaint.contact}` : ""}
      </p>
      <p className="m-0 mt-2.5 text-[14px] text-ink/90">{complaint.body}</p>
      {complaint.reply && (
        <div className="mt-2.5 rounded-lg border border-line bg-surface-2/60 p-3 text-[13.5px] text-ink">
          💬 {complaint.reply}
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          className="select !w-auto !max-w-[150px] !py-1.5 text-[13px]"
          value={complaint.status}
          aria-label="Status"
          onChange={(e) => {
            if (!canManage) return;
            const s = e.target.value as ComplaintStatus;
            mutate((db) => {
              const c = db.complaints.find((x) => x.id === complaint.id);
              if (c) {
                c.status = s;
                c.resolvedAt = s === "resolved" ? new Date().toISOString() : "";
              }
            });
            onToast(`Status updated to ${statusLabel(s)}.`, "ok");
          }}
        >
          {(["open", "in-progress", "resolved"] as ComplaintStatus[]).map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
        <input
          type="text"
          className="input grow !py-1.5 text-[13px]"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Reply to the complainant…"
          aria-label="Reply"
        />
        <button
          className="btn btn-outline btn-sm"
          onClick={() => {
            if (!canManage) return;
            mutate((db) => {
              const c = db.complaints.find((x) => x.id === complaint.id);
              if (c) c.reply = reply.trim();
            });
            onToast("Reply saved.", "ok");
          }}
        >
          Save reply
        </button>
      </div>
    </div>
  );
}

function ComplaintSkeleton() {
  return (
    <div className="container-x py-10">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-6 space-y-4">
        <Skeleton className="h-64 max-w-2xl" />
      </div>
    </div>
  );
}
