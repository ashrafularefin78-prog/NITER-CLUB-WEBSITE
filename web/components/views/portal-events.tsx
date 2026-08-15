"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ClubEvent } from "@/lib/types";
import { useDb, mutate } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { clubById, doorCode, fmtDateTime, relativeAgo, uid } from "@/lib/utils";
import {
  checkInCount,
  checkInPerson,
  eventClashes,
  eventPhase,
  exportCheckInsCsv,
  rsvpCount,
  undoCheckIn,
} from "@/lib/events";
import { logAudit } from "@/lib/audit";
import { useToast } from "@/components/providers";
import { EmptyState } from "@/components/ui";

interface Draft {
  evId?: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  venue: string;
  capacity: string;
}

const EMPTY_DRAFT: Draft = { title: "", description: "", startsAt: "", endsAt: "", venue: "", capacity: "" };

export function EventsTab({ clubId }: { clubId: string }) {
  const db = useDb()!;
  const toast = useToast();
  const [builder, setBuilder] = useState<Draft | null>(null);
  const [consoleEvId, setConsoleEvId] = useState<string | null>(null);

  const list = useMemo(
    () =>
      (db.events || [])
        .filter((e) => e.clubId === clubId)
        .sort((a, b) => b.startsAt.localeCompare(a.startsAt)),
    [db.events, clubId]
  );

  if (consoleEvId) {
    return (
      <CheckInConsole
        evId={consoleEvId}
        onBack={() => setConsoleEvId(null)}
        onEdit={() => {
          const ev = (db.events || []).find((e) => e.id === consoleEvId);
          if (!ev) return;
          setConsoleEvId(null);
          setBuilder({
            evId: ev.id,
            title: ev.title,
            description: ev.description || "",
            startsAt: toLocalInput(ev.startsAt),
            endsAt: ev.endsAt ? toLocalInput(ev.endsAt) : "",
            venue: ev.venue || "",
            capacity: ev.capacity ? String(ev.capacity) : "",
          });
        }}
      />
    );
  }

  if (builder) {
    return (
      <EventForm
        clubId={clubId}
        initial={builder}
        onCancel={() => setBuilder(null)}
        onSaved={() => {
          setBuilder(null);
          toast.toast(builder.evId ? "Event updated." : "Event published.", "ok");
        }}
      />
    );
  }

  return (
    <div className="panel">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-[18px] font-bold text-ink">Events &amp; check-in</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setBuilder({ ...EMPTY_DRAFT })}>
          + Create event
        </button>
      </div>
      <p className="m-0 mb-4 text-[13px] text-muted">
        Publish events to the campus calendar, watch RSVPs grow, and run the door with the live check-in console
        — attendance and certificates are handled automatically.
      </p>
      {list.length ? (
        <div className="space-y-3">
          {list.map((ev) => (
            <EventRow key={ev.id} ev={ev} onConsole={() => setConsoleEvId(ev.id)} onEdit={() => {
              setBuilder({
                evId: ev.id,
                title: ev.title,
                description: ev.description || "",
                startsAt: toLocalInput(ev.startsAt),
                endsAt: ev.endsAt ? toLocalInput(ev.endsAt) : "",
                venue: ev.venue || "",
                capacity: ev.capacity ? String(ev.capacity) : "",
              });
            }}
            onDelete={() => {
              if (!confirm("Delete this event? RSVPs and check-ins go with it.")) return;
              mutate((d) => {
                d.events = d.events.filter((x) => x.id !== ev.id);
              });
              logAudit("event_delete", `Deleted event: ${ev.title}`, "warn", "", "");
              toast.toast("Event deleted.", "ok");
            }}
            />
          ))}
        </div>
      ) : (
        <EmptyState icon="🗓">
          No events yet — create one and share it. RSVPs, door check-in and certificates come free.
        </EmptyState>
      )}
    </div>
  );
}

function EventRow({
  ev,
  onConsole,
  onEdit,
  onDelete,
}: {
  ev: ClubEvent;
  onConsole: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const db = useDb()!;
  const club = clubById(db, ev.clubId);
  const phase = eventPhase(ev);
  const rsvps = rsvpCount(ev);
  const ins = checkInCount(ev);
  const clashes = eventClashes(db, ev);
  const phasePill =
    phase === "live" ? (
      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
        ● Live
      </span>
    ) : phase === "ended" ? (
      <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-bold text-muted">Ended</span>
    ) : null;

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0 text-[15px] font-bold text-ink">{ev.title}</h3>
            {phasePill}
          </div>
          <p className="m-0 mt-0.5 text-[12.5px] text-muted">
            🕒 {fmtDateTime(ev.startsAt)}
            {ev.endsAt ? ` → ${fmtDateTime(ev.endsAt)}` : ""} · 📍 {ev.venue || "TBA"}
          </p>
        </div>
        <span className="shrink-0 text-[12px] text-muted">
          Door code <b className="font-mono text-ink">{ev.code || doorCode(ev.id)}</b>
        </span>
      </div>
      {clashes.length > 0 && (
        <p className="mb-0 mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[12px] font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          ⚠️ Clash radar: overlaps with {clashes.map((c) => c.title).join(", ")}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button className="btn btn-primary btn-sm" onClick={onConsole}>
          📋 Check-in console
        </button>
        <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11.5px] font-bold text-muted">
          {rsvps} RSVPs · {ins} checked in
        </span>
        <button className="btn btn-outline btn-sm" onClick={onEdit}>
          Edit
        </button>
        <button className="btn btn-danger btn-sm" onClick={onDelete}>
          Delete
        </button>
        <Link href={`/events/${ev.id}`} className="btn btn-ghost btn-sm no-underline">
          Public page →
        </Link>
      </div>
      {ev.description && <p className="mb-0 mt-2 line-clamp-2 text-[12.5px] text-muted">{ev.description}</p>}
    </div>
  );
}

/* ---------------- create / edit form ---------------- */

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => (n < 10 ? "0" : "") + n;
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
}

function EventForm({
  clubId,
  initial,
  onCancel,
  onSaved,
}: {
  clubId: string;
  initial: Draft;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const db = useDb()!;
  const auth = useAuth();
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>(initial);
  const isEdit = !!draft.evId;

  const clashPreview = useMemo(() => {
    if (!draft.startsAt) return [];
    const probe: ClubEvent = {
      id: "probe",
      clubId,
      title: draft.title || "New event",
      description: "",
      startsAt: draft.startsAt,
      endsAt: draft.endsAt || undefined,
      venue: draft.venue,
      capacity: 0,
      createdBy: "",
      createdAt: new Date().toISOString(),
      code: "000000",
      rsvps: [],
      checkIns: [],
    };
    // Exclude the event being edited itself from the clash check.
    return eventClashes(db, probe).filter((o) => o.id !== initial.evId);
  }, [draft.startsAt, draft.endsAt, draft.title, draft.venue, clubId, db, initial.evId]);

  const save = () => {
    if (!draft.title.trim()) return toast.toast("Event title is required.", "err");
    if (!draft.startsAt) return toast.toast("Pick a start date & time.", "err");
    if (draft.endsAt && new Date(draft.endsAt).getTime() <= new Date(draft.startsAt).getTime())
      return toast.toast("End time must be after the start time.", "err");
    const capacity = parseInt(draft.capacity, 10) || 0;
    const actor = auth.user?.email || auth.user?.name || "";
    mutate((d) => {
      const evId = draft.evId || uid("ev");
      const existing = d.events.find((x) => x.id === evId);
      const base: ClubEvent = existing
        ? { ...existing }
        : {
            id: evId,
            clubId,
            title: "",
            description: "",
            startsAt: "",
            venue: "",
            capacity: 0,
            createdBy: actor,
            createdAt: new Date().toISOString(),
            code: doorCode(evId),
            rsvps: [],
            checkIns: [],
          };
      base.title = draft.title.trim();
      base.description = draft.description.trim();
      base.startsAt = draft.startsAt;
      base.endsAt = draft.endsAt || undefined;
      base.venue = draft.venue.trim();
      base.capacity = capacity;
      base.code = base.code || doorCode(evId);
      if (!Array.isArray(base.rsvps)) base.rsvps = [];
      if (!Array.isArray(base.checkIns)) base.checkIns = [];
      if (existing) {
        const idx = d.events.findIndex((x) => x.id === evId);
        if (idx >= 0) d.events[idx] = base;
      } else {
        d.events.push(base);
      }
    });
    logAudit("event", `${isEdit ? "Updated" : "Created"} event: ${draft.title.trim()}`, "info", draft.startsAt, auth.user?.email || auth.user?.name || "");
    onSaved();
  };

  return (
    <div className="panel">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="m-0 text-[18px] font-bold text-ink">{isEdit ? "Edit event" : "Create an event"}</h2>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>
          ← Cancel
        </button>
      </div>
      {clashPreview.length > 0 && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          ⚠️ <b>Clash radar:</b> another club already has{" "}
          {clashPreview.map((c) => c.title).join(", ")} at this time. You can still publish, but students will
          see the conflict.
        </p>
      )}
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div>
          <label className="label" htmlFor="ev-title">
            Event title <span className="text-crimson">*</span>
          </label>
          <input
            id="ev-title"
            className="input"
            placeholder="e.g. CodeStorm 2026 — Final Round"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          />
        </div>
        <div>
          <label className="label" htmlFor="ev-desc">
            Description
          </label>
          <textarea
            id="ev-desc"
            className="textarea"
            placeholder="What's this event about? Who should attend?"
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="ev-start">
              Starts <span className="text-crimson">*</span>
            </label>
            <input
              id="ev-start"
              type="datetime-local"
              className="input"
              value={draft.startsAt}
              onChange={(e) => setDraft((d) => ({ ...d, startsAt: e.target.value }))}
            />
          </div>
          <div>
            <label className="label" htmlFor="ev-end">
              Ends (optional)
            </label>
            <input
              id="ev-end"
              type="datetime-local"
              className="input"
              value={draft.endsAt}
              onChange={(e) => setDraft((d) => ({ ...d, endsAt: e.target.value }))}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="ev-venue">
              Venue
            </label>
            <input
              id="ev-venue"
              className="input"
              placeholder="e.g. Seminar Hall 2"
              value={draft.venue}
              onChange={(e) => setDraft((d) => ({ ...d, venue: e.target.value }))}
            />
          </div>
          <div>
            <label className="label" htmlFor="ev-cap">
              Capacity (0 = unlimited)
            </label>
            <input
              id="ev-cap"
              type="number"
              min={0}
              className="input"
              placeholder="0"
              value={draft.capacity}
              onChange={(e) => setDraft((d) => ({ ...d, capacity: e.target.value }))}
            />
          </div>
        </div>
        <p className="m-0 text-[12px] text-muted">
          A door code for entrance check-in is generated automatically — attendees quote it (or scan the QR) to
          get their attendance certificate.
        </p>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary">
            {isEdit ? "Save changes" : "Publish event"}
          </button>
          <button type="button" className="btn btn-outline" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------------- check-in console ---------------- */

function CheckInConsole({
  evId,
  onBack,
  onEdit,
}: {
  evId: string;
  onBack: () => void;
  onEdit: () => void;
}) {
  const db = useDb()!;
  const auth = useAuth();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [walkIn, setWalkIn] = useState({ name: "", email: "", studentId: "" });
  const [copied, setCopied] = useState(false);

  const ev = (db.events || []).find((e) => e.id === evId);
  if (!ev) {
    return (
      <div className="panel">
        <EmptyState icon="🗓">This event no longer exists.</EmptyState>
        <button className="btn btn-outline btn-sm mt-3" onClick={onBack}>
          ← Back to events
        </button>
      </div>
    );
  }

  const club = clubById(db, ev.clubId);
  const rsvps = Array.isArray(ev.rsvps) ? ev.rsvps : [];
  const ins = Array.isArray(ev.checkIns) ? ev.checkIns : [];
  const insKeys = new Set(ins.map((c) => (c.userId || c.email || "").toLowerCase()));
  const phase = eventPhase(ev);
  const filtered = q.trim()
    ? rsvps.filter((r) => (r.name + " " + r.email + " " + (r.studentId || "")).toLowerCase().includes(q.trim().toLowerCase()))
    : rsvps;
  const checkInUrl = typeof window !== "undefined" ? `${window.location.origin}/events/${ev.id}?checkin=1` : "";

  const doCheckIn = (person: { userId: string; name: string; email: string; studentId?: string }) => {
    const by = auth.user?.name || auth.user?.email || "organizer";
    const cert = checkInPerson(db, ev, person, by);
    if (cert) {
      toast.toast(`${person.name} checked in — certificate issued.`, "ok");
      logAudit("checkin", `Checked in ${person.name} to ${ev.title}`, "info", person.email, auth.user?.email || "");
    } else {
      toast.toast(`${person.name} was already checked in.`, "");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(checkInUrl);
      setCopied(true);
      toast.toast("Check-in link copied — share it on the notice board.", "ok");
    } catch {
      toast.toast("Couldn't copy — select the URL manually.", "err");
    }
  };

  return (
    <div className="panel">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-[18px] font-bold text-ink">📋 Check-in console — {ev.title}</h2>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm" onClick={onEdit}>
            Edit event
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onBack}>
            ← Back to events
          </button>
        </div>
      </div>

      {/* door + live counts */}
      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        <div className="rounded-xl border-2 border-dashed border-gold/60 bg-gold/10 p-5 text-center">
          <p className="m-0 text-[11px] font-bold uppercase tracking-[1.6px] text-muted">Door code</p>
          <p className="m-0 mt-1 font-mono text-[34px] font-extrabold leading-none tracking-[0.18em] text-navy dark:text-gold">
            {ev.code || doorCode(ev.id)}
          </p>
          <p className="m-0 mt-2 text-[11.5px] text-muted">
            Attendees enter this at{" "}
            <span className="font-mono">/events/{ev.id}?checkin=1</span>
          </p>
          {checkInUrl && (
            <button className="btn btn-outline btn-sm mt-2" onClick={copyLink}>
              {copied ? "✓ Copied" : "🔗 Copy check-in link"}
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <ConsoleStat value={rsvps.length} label="RSVPs" />
          <ConsoleStat value={ins.length} label="Checked in" tone="text-ok" />
          <ConsoleStat
            value={ev.capacity > 0 ? `${Math.max(0, ev.capacity - rsvps.length)}` : "∞"}
            label="spots left"
          />
        </div>
      </div>

      {phase !== "ended" && (
        <p className="mb-0 mt-3 text-[12.5px] text-muted">
          {phase === "live"
            ? "● The event is live — students can check themselves in with the door code."
            : "⏳ The event hasn't started — students can RSVP but check-in opens at the door."}
        </p>
      )}

      <div className="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="m-0 text-[15px] font-bold text-ink">RSVPs {filtered.length !== rsvps.length ? `(${filtered.length} of ${rsvps.length})` : `(${rsvps.length})`}</h3>
          <div className="flex flex-wrap gap-2">
            <input
              className="input !w-56 !py-1.5 text-[13px]"
              placeholder="🔍 Search by name, email or ID…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search RSVPs"
            />
            {ins.length > 0 && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  exportCheckInsCsv(ev, club?.name || "club");
                  toast.toast("Attendance CSV downloaded.", "ok");
                }}
              >
                ⬇ Export attendance
              </button>
            )}
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {filtered.length ? (
            filtered.map((r) => {
              const key = (r.userId || r.email || "").toLowerCase();
              const done = insKeys.has(key);
              return (
                <div key={key} className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-2.5">
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[12px] font-extrabold ${done ? "bg-emerald-100 text-emerald-800" : "bg-surface-2 text-muted"}`}>
                    {done ? "✓" : "•"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-bold text-ink">{r.name}</div>
                    <div className="text-[11.5px] text-muted">
                      {r.email}
                      {r.studentId ? ` · ${r.studentId}` : ""}
                    </div>
                  </div>
                  <span className="text-[11.5px] text-muted">{relativeAgo(r.at)}</span>
                  {done ? (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        undoCheckIn(db, ev, key);
                        toast.toast("Check-in removed (certificate stays on record).", "");
                      }}
                    >
                      Undo
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => doCheckIn({ userId: r.userId, name: r.name, email: r.email, studentId: r.studentId })}
                    >
                      ✓ Check in
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <EmptyState icon="🎟">No RSVPs yet — share the event link so students can sign up.</EmptyState>
          )}
        </div>
      </div>

      {/* walk-in */}
      <div className="mt-5 rounded-xl border border-dashed border-line p-4">
        <h3 className="m-0 text-[15px] font-bold text-ink">🚶 Walk-in (no RSVP)</h3>
        <form
          className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            const nm = walkIn.name.trim();
            const em = walkIn.email.trim().toLowerCase();
            if (!nm || !/^\S+@\S+\.\S+$/.test(em)) {
              toast.toast("Walk-in needs a name and a valid email.", "err");
              return;
            }
            doCheckIn({
              userId: "walkin-" + em,
              name: nm,
              email: em,
              studentId: walkIn.studentId.trim() || undefined,
            });
            setWalkIn({ name: "", email: "", studentId: "" });
          }}
        >
          <input className="input" placeholder="Full name" value={walkIn.name} onChange={(e) => setWalkIn({ ...walkIn, name: e.target.value })} aria-label="Walk-in name" />
          <input className="input" type="email" placeholder="Email" value={walkIn.email} onChange={(e) => setWalkIn({ ...walkIn, email: e.target.value })} aria-label="Walk-in email" />
          <input className="input" placeholder="Student ID (optional)" value={walkIn.studentId} onChange={(e) => setWalkIn({ ...walkIn, studentId: e.target.value })} aria-label="Walk-in student ID" />
          <button type="submit" className="btn btn-primary btn-sm">
            Check in
          </button>
        </form>
      </div>

      <p className="mb-0 mt-4 text-[12px] text-muted">
        Every check-in issues a verifiable certificate automatically — anyone can confirm it at{" "}
        <span className="font-mono">/verify/CERT-…</span>. Checked-in attendance also earns XP on the leaderboard.
      </p>
    </div>
  );
}

function ConsoleStat({ value, label, tone = "" }: { value: number | string; label: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/50 p-4 text-center">
      <div className={`text-[24px] font-extrabold leading-none ${tone || "text-ink"}`}>{value}</div>
      <div className="mt-1 text-[11px] font-semibold text-muted">{label}</div>
    </div>
  );
}

