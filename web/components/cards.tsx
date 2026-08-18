"use client";

<<<<<<< HEAD
import { useState, useEffect } from "react";
=======
import { useState } from "react";
>>>>>>> 6ce30bfed78dc8524b7ef2d0974be9e8eeb7caf5
import Link from "next/link";
import type { Club, Form, Notice } from "@/lib/types";
import { clubById, fmtDate, formById, formSubs, statusOf } from "@/lib/utils";
import { mutate, useDb } from "@/lib/store";
import { Countdown } from "@/components/countdown";
import { fmtDateTime } from "@/lib/utils";

/* ---------------- Club card ---------------- */
export function ClubCard({ club }: { club: Club }) {
  return (
    <Link href={`/club/${club.id}`} className="club-card no-underline">
      <div
        className="grid h-11 w-11 place-items-center rounded-xl text-[22px]"
        style={{ background: club.color, boxShadow: "inset 0 -8px 16px rgba(0,0,0,.14)" }}
      >
        <span aria-hidden="true">{club.icon}</span>
      </div>
      <h3 className="m-0 text-[16px] font-bold text-ink">{club.name}</h3>
      <p className="m-0 text-[13px] text-muted">{club.tagline}</p>
    </Link>
  );
}

export function ClubGrid({ clubs }: { clubs: Club[] }) {
  return (
    <div className="club-grid">
      {clubs.map((c) => (
        <ClubCard key={c.id} club={c} />
      ))}
    </div>
  );
}

/* ---------------- Notice card + reactions ---------------- */
function isReacted(notice: Notice, emoji: string): boolean {
  try {
    return sessionStorage.getItem(`react-${notice.id}-${emoji}`) === "1";
  } catch {
    return false;
  }
}

function ReactionBar({ notice }: { notice: Notice }) {
  const keys = Object.keys(notice.reactions || {});
  const [pops, setPops] = useState<Record<string, boolean>>({});
  if (!keys.length) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-2" aria-label="Reactions">
      {keys.map((em) => {
        const active = isReacted(notice, em);
        return (
          <button
            key={em}
            type="button"
            aria-pressed={active}
            onClick={() => {
              setPops((p) => ({ ...p, [em]: false }));
              requestAnimationFrame(() => setPops((p) => ({ ...p, [em]: true })));
              toggleReaction(notice, em);
            }}
            onAnimationEnd={() => setPops((p) => ({ ...p, [em]: false }))}
            className={`react-btn ${active ? "on" : ""} ${pops[em] ? "react-pop" : ""}`}
          >
            <span aria-hidden="true">{em}</span> {notice.reactions[em]}
          </button>
        );
      })}
    </div>
  );
}

function toggleReaction(notice: Notice, emoji: string) {
  const key = `react-${notice.id}-${emoji}`;
  let added = false;
  try {
    added = sessionStorage.getItem(key) === "1";
  } catch {
    /* ignore */
  }
  mutate((db) => {
    const n = db.notices.find((x) => x.id === notice.id);
    if (!n) return;
    n.reactions = n.reactions || {};
    n.reactions[emoji] = (n.reactions[emoji] || 0) + (added ? -1 : 1);
    if ((n.reactions[emoji] || 0) <= 0) delete n.reactions[emoji];
  });
  try {
    sessionStorage.setItem(key, added ? "0" : "1");
  } catch {
    /* ignore */
  }
}

export function NoticeCard({ notice, showClub = false }: { notice: Notice; showClub?: boolean }) {
  const db = useDb();
  const club = db ? clubById(db, notice.clubId) : null;
  const form = notice.formId && db ? formById(db, notice.formId) : null;
<<<<<<< HEAD
  const [expanded, setExpanded] = useState(false);
  const [viewed, setViewed] = useState(false);

  // Track view count on mount
  useEffect(() => {
    if (!viewed && notice.id) {
      setViewed(true);
      // Increment view count (best-effort)
      try {
        const { getCloudDb } = await import("@/lib/firebase");
        const { doc, updateDoc, increment } = await import("firebase/firestore");
        const dbref = getCloudDb();
        if (dbref) {
          updateDoc(doc(dbref, "notices", notice.id), { viewCount: increment(1) }).catch(() => {});
        }
      } catch {}
    }
  }, [notice.id]);

  // Category config
  const categoryConfig: Record<string, { icon: string; label: string; color: string }> = {
    general: { icon: "📢", label: "General", color: "bg-slate-100 text-slate-700" },
    event: { icon: "📅", label: "Event", color: "bg-blue-100 text-blue-700" },
    meeting: { icon: "🤝", label: "Meeting", color: "bg-purple-100 text-purple-700" },
    workshop: { icon: "🔧", label: "Workshop", color: "bg-amber-100 text-amber-700" },
    competition: { icon: "🏆", label: "Competition", color: "bg-emerald-100 text-emerald-700" },
    announcement: { icon: "📣", label: "Announcement", color: "bg-indigo-100 text-indigo-700" },
    urgent: { icon: "🚨", label: "Urgent", color: "bg-red-100 text-red-700" },
    other: { icon: "📋", label: "Other", color: "bg-gray-100 text-gray-700" },
  };

  const priorityConfig: Record<string, { icon: string; label: string; color: string }> = {
    low: { icon: "", label: "", color: "" },
    normal: { icon: "", label: "", color: "" },
    high: { icon: "⬆️", label: "High Priority", color: "bg-amber-100 text-amber-700 border border-amber-200" },
    urgent: { icon: "🚨", label: "Urgent", color: "bg-red-100 text-red-700 border border-red-200" },
  };

  const cat = notice.category ? categoryConfig[notice.category] : null;
  const pri = notice.priority && notice.priority !== "low" && notice.priority !== "normal" ? priorityConfig[notice.priority] : null;

  // Truncate body for long notices
  const bodyLines = (notice.body || "").split("\n");
  const isLong = bodyLines.length > 4 || notice.body.length > 300;
  const displayBody = expanded || !isLong ? notice.body : notice.body.slice(0, 300) + "...";

  return (
    <article className={`notice-card ${notice.priority === "urgent" ? "border-l-4 border-l-red-500" : ""}`}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="m-0 text-[16px] font-bold text-ink">
            {notice.pinned && <span className="pin-badge">📌 PINNED</span>}
            {notice.priority === "urgent" && <span className="mr-1.5 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600 uppercase">Urgent</span>}
            {notice.title}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {cat && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cat.color}`}>
                {cat.icon} {cat.label}
              </span>
            )}
            {pri && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${pri.color}`}>
                {pri.icon} {pri.label}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="shrink-0 text-[12.5px] text-muted">
            🗓 {fmtDate(notice.date)}
          </span>
          {notice.createdAt && (
            <span className="shrink-0 text-[11px] text-muted">
              {timeAgo(notice.createdAt)}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <p className="m-0 mt-3 whitespace-pre-line text-[14px] text-ink/85 leading-relaxed">
        {displayBody}
      </p>
      {isLong && (
        <button
          className="mt-1 text-[12.5px] font-semibold text-crimson hover:underline"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}

      {/* Event Details */}
      {(notice.eventDate || notice.venue) && (
        <div className="mt-3 rounded-lg bg-surface-2/60 p-3">
          {notice.eventDate && (
            <div className="flex items-center gap-2 text-[13px] text-ink">
              <span>📅</span>
              <span className="font-semibold">Date & Time:</span>
              <span>{fmtDate(notice.eventDate)}{notice.eventEndDate ? ` — ${fmtDate(notice.eventEndDate)}` : ""}</span>
            </div>
          )}
          {notice.venue && (
            <div className="mt-1 flex items-center gap-2 text-[13px] text-ink">
              <span>📍</span>
              <span className="font-semibold">Venue:</span>
              <span>{notice.venue}</span>
            </div>
          )}
        </div>
      )}

      {/* Contact Info */}
      {(notice.contactPerson || notice.contactEmail || notice.contactPhone) && (
        <div className="mt-3 rounded-lg border border-line p-3">
          <p className="m-0 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Contact</p>
          <div className="flex flex-wrap items-center gap-3 text-[13px] text-ink">
            {notice.contactPerson && (
              <span className="flex items-center gap-1">
                <span>👤</span> {notice.contactPerson}
              </span>
            )}
            {notice.contactEmail && (
              <a href={`mailto:${notice.contactEmail}`} className="flex items-center gap-1 text-crimson no-underline hover:underline">
                <span>📧</span> {notice.contactEmail}
              </a>
            )}
            {notice.contactPhone && (
              <a href={`tel:${notice.contactPhone}`} className="flex items-center gap-1 text-crimson no-underline hover:underline">
                <span>📱</span> {notice.contactPhone}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Footer: Club, Form, External Link, View Count, Share */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {showClub && club && (
            <span className="pill club">
              <span aria-hidden="true">{club.icon}</span> {club.name}
            </span>
          )}
          {form && (
            <Link href={`/form/${form.id}`} className="btn btn-primary btn-sm no-underline">
              📝 Fill the form
            </Link>
          )}
          {notice.externalUrl && (
            <a
              href={notice.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm no-underline"
            >
              🔗 {notice.externalUrlLabel || "Open link"}
            </a>
          )}
        </div>
        <div className="flex items-center gap-3 text-[12px] text-muted">
          {notice.viewCount !== undefined && notice.viewCount > 0 && (
            <span className="flex items-center gap-1">
              👁 {notice.viewCount} view{notice.viewCount === 1 ? "" : "s"}
            </span>
          )}
          {notice.authorName && (
            <span className="flex items-center gap-1">
              ✍️ {notice.authorName}
            </span>
          )}
          <button
            className="flex items-center gap-1 hover:text-crimson transition"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: notice.title, text: notice.body.slice(0, 200), url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert("Link copied!");
              }
            }}
          >
            📤 Share
          </button>
        </div>
      </div>

=======
  return (
    <article className="notice-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="m-0 text-[16px] font-bold text-ink">
          {notice.pinned && <span className="pin-badge">📌 PINNED</span>}
          {notice.title}
        </h3>
        <span className="shrink-0 text-[12.5px] text-muted">
          🗓 {fmtDate(notice.date)}
          {notice.createdAt ? ` · ${timeAgo(notice.createdAt)}` : ""}
        </span>
      </div>
      <p className="m-0 whitespace-pre-line text-[14px] text-ink/85">{notice.body}</p>
      <div className="flex flex-wrap items-center gap-2">
        {showClub && club && (
          <span className="pill club">
            <span aria-hidden="true">{club.icon}</span> {club.name}
          </span>
        )}
        {form && (
          <Link href={`/form/${form.id}`} className="btn btn-primary btn-sm no-underline">
            📝 Fill the form
          </Link>
        )}
      </div>
>>>>>>> 6ce30bfed78dc8524b7ef2d0974be9e8eeb7caf5
      <ReactionBar notice={notice} />
    </article>
  );
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 3600000) return "just now";
  if (diff < 86400000) return Math.floor(diff / 3600000) + "h ago";
  if (diff < 7 * 86400000) return Math.floor(diff / 86400000) + "d ago";
  return new Date(ts).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/* ---------------- Form card ---------------- */
export function FormCard({ form }: { form: Form }) {
  const db = useDb();
  const st = statusOf(form);
  const subs = db ? formSubs(db, form.id).length : 0;
  const club = db ? clubById(db, form.clubId) : null;

  const statusPill =
    st.key === "closed" ? (
      <span className="pill deadline">Closed</span>
    ) : st.key === "soon" ? (
      <Countdown start={form.openAt} />
    ) : (
      <Countdown end={form.deadline} />
    );

  const btn =
    st.key === "closed" ? (
      <button className="btn btn-outline btn-sm" disabled>
        Closed
      </button>
    ) : st.key === "soon" ? (
      <Link href={`/form/${form.id}`} className="btn btn-outline btn-sm no-underline">
        Opens {fmtDateTime(form.openAt)}
      </Link>
    ) : (
      <Link href={`/form/${form.id}`} className="btn btn-primary btn-sm no-underline">
        Fill the form
      </Link>
    );

  const schedule = [
    form.openAt ? "Opens " + fmtDateTime(form.openAt) : "",
    form.deadline ? "Closes " + fmtDateTime(form.deadline) : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="form-card">
      <h3 className="m-0 text-[16px] font-bold text-ink">{form.title}</h3>
      {form.description && <p className="m-0 text-[13.5px] text-muted">{form.description}</p>}
      <div className="flex flex-wrap items-center gap-2">
        {club && (
          <span className="pill club">
            <span aria-hidden="true">{club.icon}</span> {club.name}
          </span>
        )}
        <span className="pill">
          {form.fields.length} field{form.fields.length === 1 ? "" : "s"}
        </span>
        {statusPill}
        <span className="pill">{subs} filled</span>
      </div>
      {schedule && <p className="m-0 text-[12.5px] text-muted">{schedule}</p>}
      <div>{btn}</div>
    </div>
  );
}

export function FormGrid({ forms }: { forms: Form[] }) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
      {forms.map((f) => (
        <FormCard key={f.id} form={f} />
      ))}
    </div>
  );
}
