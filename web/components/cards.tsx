"use client";

import { useState } from "react";
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
