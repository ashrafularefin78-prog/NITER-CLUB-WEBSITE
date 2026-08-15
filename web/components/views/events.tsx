"use client";

import Link from "next/link";
import { useState } from "react";
import type { ClubEvent } from "@/lib/types";
import { useDb } from "@/lib/store";
import { clubById, fmtDateTime } from "@/lib/utils";
import {
  capacityLeft,
  checkInCount,
  checkInOf,
  eventClashes,
  eventPhase,
  rsvpCount,
  rsvpOf,
  toggleRsvp,
  waitlistCount,
  waitlistOfPerson,
  waitlistPosition,
} from "@/lib/events";
import { logAudit } from "@/lib/audit";
import { useToast } from "@/components/providers";
import { IdentityPrompt, useIdentity } from "@/components/identity";
import { EmptyState, PageHero, SectionHead, Skeleton } from "@/components/ui";

export default function EventsView() {
  const db = useDb();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  if (!db) return <EventsSkeleton />;

  const now = Date.now();
  const sorted = (db.events || []).slice().sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const upcoming = sorted.filter((ev) => new Date(ev.startsAt).getTime() >= now);
  const past = sorted.filter((ev) => new Date(ev.startsAt).getTime() < now);
  const list = tab === "upcoming" ? upcoming : past;

  return (
    <>
      <PageHero
        eyebrow="Campus"
        title="🗓 Events & RSVP"
        sub="Every club event on one shared calendar — RSVP in a tap, check in with a door code at the entrance, and earn attendance certificates."
      />
      <div className="container-x py-10">
        <div className="tabs" role="tablist" aria-label="Events">
          {(["upcoming", "past"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className={`tab ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "upcoming" ? "Upcoming" : "Past"} ({t === "upcoming" ? upcoming.length : past.length})
            </button>
          ))}
        </div>

        <div key={tab} className="anim-fade-up mt-6">
          {list.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {list.map((ev) => (
                <EventCard key={ev.id} ev={ev} />
              ))}
            </div>
          ) : (
            <EmptyState icon={tab === "upcoming" ? "🗓" : "🕰"}>
              {tab === "upcoming"
                ? "No upcoming events yet — clubs post them here as they plan them."
                : "No past events on record yet."}
            </EmptyState>
          )}
        </div>

        <div className="mt-12">
          <SectionHead
            title="⚔️ Clash radar"
            sub="Events flagged when two clubs' schedules overlap — so you never have to pick."
          />
          <div className="panel mt-3">
            {upcoming.length > 1 ? (
              <ul className="m-0 grid list-none gap-3 p-0">
                {upcoming.map((ev) => {
                  const clashes = eventClashes(db, ev);
                  if (!clashes.length) return null;
                  const club = clubById(db, ev.clubId);
                  return (
                    <li key={ev.id} className="rounded-lg border border-amber-200 bg-amber-50/60 p-3.5 text-[13.5px] dark:border-amber-500/30 dark:bg-amber-500/10">
                      <b className="text-ink">
                        {club?.icon} {ev.title}
                      </b>{" "}
                      <span className="text-muted">({fmtDateTime(ev.startsAt)})</span>{" "}
                      <span className="text-amber-700 dark:text-amber-300">clashes with</span>{" "}
                      {clashes.map((c, i) => {
                        const cc = clubById(db, c.clubId);
                        return (
                          <span key={c.id}>
                            {i > 0 && ", "}
                            <Link href={`/events/${c.id}`} className="font-semibold text-crimson no-underline hover:underline">
                              {cc?.icon} {c.title}
                            </Link>
                          </span>
                        );
                      })}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="m-0 text-[13.5px] text-muted">No scheduling conflicts among upcoming events. 🎉</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function EventCard({ ev }: { ev: ClubEvent }) {
  const db = useDb()!;
  const toast = useToast();
  const { person, setPerson } = useIdentity();
  const [askIdentity, setAskIdentity] = useState(false);

  const club = clubById(db, ev.clubId);
  const phase = eventPhase(ev);
  const rsvps = rsvpCount(ev);
  const ins = checkInCount(ev);
  const left = capacityLeft(ev);
  const clashes = eventClashes(db, ev);
  const rsvpState = person ? rsvpOf(ev, person) : undefined;
  const waitState = person ? waitlistOfPerson(ev, person) : undefined;
  const waitPos = person ? waitlistPosition(ev, person) : null;
  const waitCount = waitlistCount(ev);
  const isFull = ev.capacity > 0 && rsvps >= ev.capacity;
  const inState = person ? checkInOf(ev, person) : undefined;

  const phasePill =
    phase === "live" ? (
      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
        ● Live now
      </span>
    ) : phase === "ended" ? (
      <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-bold text-muted">Ended</span>
    ) : null;

  const onRsvp = () => {
    if (!person) {
      setAskIdentity(true);
      return;
    }
    const hadWaitlist = waitlistCount(ev) > 0;
    const wasWaitlisted = !!waitlistOfPerson(ev, person);
    const res = toggleRsvp(db, ev, person);
    if (res === "confirmed") {
      toast.toast("✓ You're in! RSVP saved.", "ok");
      logAudit("rsvp", `RSVP'd to ${ev.title}`, "info", person.email, person.email);
    } else if (res === "waitlisted") {
      toast.toast(`Full — you're #${waitlistCount(ev)} on the waitlist.`, "ok");
      logAudit("rsvp_waitlist", `Joined the waitlist for ${ev.title}`, "info", person.email, person.email);
    } else if (wasWaitlisted) {
      toast.toast("Removed from the waitlist.", "");
      logAudit("rsvp_waitlist_leave", `Left the waitlist for ${ev.title}`, "info", person.email, person.email);
    } else {
      toast.toast(hadWaitlist ? "RSVP removed — the next waitlisted student moved in." : "RSVP removed.", "");
      logAudit("rsvp_cancel", `Cancelled RSVP for ${ev.title}`, "info", person.email, person.email);
    }
  };

  return (
    <article className="card flex flex-col p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[22px]" style={{ background: club?.color || "#eef2f7" }} aria-hidden="true">
          {club?.icon ?? "🎪"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0 text-[16px] font-bold text-ink">
              <Link href={`/events/${ev.id}`} className="no-underline hover:underline">
                {ev.title}
              </Link>
            </h3>
            {phasePill}
          </div>
          <p className="m-0 mt-0.5 text-[12.5px] text-muted">
            {club?.name} · 🕒 {fmtDateTime(ev.startsAt)}
          </p>
          {ev.venue && (
            <p className="m-0 text-[12.5px] text-muted">
              📍 {ev.venue}
              {ev.endsAt ? ` · until ${fmtDateTime(ev.endsAt)}` : ""}
            </p>
          )}
        </div>
      </div>

      {clashes.length > 0 && (
        <p className="mb-0 mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[12px] font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          ⚠️ Overlaps with {clashes.length} other event{clashes.length > 1 ? "s" : ""} on the campus calendar
        </p>
      )}

      <div className="mt-3">
        <div className="flex items-center justify-between text-[12px] font-semibold text-muted">
          <span>
            {rsvps} going
            {ev.capacity > 0
              ? isFull
                ? ` · full${waitCount > 0 ? ` · ${waitCount} on waitlist` : ""}`
                : ` · ${left} spot${left === 1 ? "" : "s"} left`
              : ""}
          </span>
          <span>
            {ins} checked in
            {phase === "ended" ? " · attendance recorded" : ""}
          </span>
        </div>
        {ev.capacity > 0 && (
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className={`h-full rounded-full ${isFull ? "bg-crimson" : "bg-gold"}`}
              style={{ width: `${Math.min(100, Math.round((rsvps / ev.capacity) * 100))}%` }}
            />
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {phase === "upcoming" ? (
          rsvpState ? (
            <button className="btn btn-outline btn-sm" onClick={onRsvp}>
              ✓ RSVP'd — tap to cancel
            </button>
          ) : waitState ? (
            <button className="btn btn-outline btn-sm" onClick={onRsvp}>
              ⏳ Waitlist #{waitPos}
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={onRsvp}>
              {isFull ? "Join waitlist" : "RSVP now"}
            </button>
          )
        ) : inState ? (
          <span className="rounded-md bg-emerald-100 px-3 py-1.5 text-[12.5px] font-bold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
            ✓ Attended
          </span>
        ) : (
          <Link href={`/events/${ev.id}?checkin=1`} className="btn btn-outline btn-sm no-underline">
            📍 I was there
          </Link>
        )}
        <Link href={`/events/${ev.id}`} className="btn btn-ghost btn-sm no-underline">
          Details →
        </Link>
        {phase === "ended" && rsvps > 0 && (
          <span className="ml-auto text-[12px] text-muted">Certificates issued at check-in</span>
        )}
      </div>

      {askIdentity && (
        <IdentityPrompt
          onIdentity={(p) => {
            setPerson(p);
            setAskIdentity(false);
          }}
          onCancel={() => setAskIdentity(false)}
        />
      )}
    </article>
  );
}

function EventsSkeleton() {
  return (
    <div className="container-x py-14">
      <Skeleton className="h-10 w-72" />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}
