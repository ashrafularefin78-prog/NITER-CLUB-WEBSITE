"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDb } from "@/lib/store";
import { clubById, fmtDateTime } from "@/lib/utils";
import {
  canCheckIn,
  capacityLeft,
  certFor,
  certificateUrl,
  checkInCount,
  checkInOf,
  checkInPerson,
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
import { PageHero, Skeleton } from "@/components/ui";

export default function EventDetailView({ eventId }: { eventId: string }) {
  const db = useDb();
  const toast = useToast();
  const { person, setPerson } = useIdentity();
  const [askIdentity, setAskIdentity] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);

  useEffect(() => {
    if (window.location.search.includes("checkin=1")) setCheckinOpen(true);
  }, []);

  if (!db) return <DetailSkeleton />;
  const ev = (db.events || []).find((e) => e.id === eventId);
  if (!ev) return <EventMissing />;

  const club = clubById(db, ev.clubId);
  const phase = eventPhase(ev);
  const rsvps = rsvpCount(ev);
  const ins = checkInCount(ev);
  const left = capacityLeft(ev);
  const clashes = eventClashes(db, ev);
  const cert = person ? certFor(db, ev, person) : undefined;
  const rsvpState = person ? rsvpOf(ev, person) : undefined;
  const waitState = person ? waitlistOfPerson(ev, person) : undefined;
  const waitPos = person ? waitlistPosition(ev, person) : null;
  const waitCount = waitlistCount(ev);
  const inState = person ? checkInOf(ev, person) : undefined;
  const canIn = canCheckIn(ev);
  const isFull = ev.capacity > 0 && rsvps >= ev.capacity;

  const onRsvp = () => {
    if (!person) {
      setAskIdentity(true);
      return;
    }
    const hadWaitlist = waitlistCount(ev) > 0;
    const wasWaitlisted = !!waitlistOfPerson(ev, person);
    const res = toggleRsvp(db, ev, person);
    if (res === "confirmed") {
      toast.toast("✓ You're in — see you there!", "ok");
      logAudit("rsvp", `RSVP'd to ${ev.title}`, "info", person.email, person.email);
    } else if (res === "waitlisted") {
      toast.toast(`The event is full — you're #${waitlistCount(ev)} on the waitlist.`, "ok");
      logAudit("rsvp_waitlist", `Joined the waitlist for ${ev.title}`, "info", person.email, person.email);
    } else if (wasWaitlisted) {
      toast.toast("Removed from the waitlist.", "");
      logAudit("rsvp_waitlist_leave", `Left the waitlist for ${ev.title}`, "info", person.email, person.email);
    } else {
      toast.toast(
        hadWaitlist ? "RSVP removed — the next waitlisted student was moved in." : "RSVP removed.",
        ""
      );
      logAudit("rsvp_cancel", `Cancelled RSVP for ${ev.title}`, "info", person.email, person.email);
    }
  };

  const submitCheckIn = () => {
    if (!person) {
      setAskIdentity(true);
      return;
    }
    if (code.trim() !== (ev.code || "")) {
      toast.toast("That door code doesn't match — check it at the entrance.", "err");
      logAudit("checkin_fail", `Wrong door code for ${ev.title}`, "warn", person.email, person.email);
      return;
    }
    setBusy(true);
    const issued = checkInPerson(db, ev, person, "self");
    setBusy(false);
    setCode("");
    if (issued) {
      setJustCheckedIn(true);
      toast.toast("✓ Checked in — your certificate is ready!", "ok");
      logAudit("checkin", `Checked in to ${ev.title}`, "info", person.email, person.email);
      logAudit("certificate", `Certificate ${issued.id} issued for ${ev.title}`, "info", person.email, person.email);
    } else {
      toast.toast("You're already checked in.", "");
    }
  };

  const phasePill =
    phase === "live" ? (
      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
        ● Live now
      </span>
    ) : phase === "ended" ? (
      <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-bold text-muted">Ended</span>
    ) : null;

  return (
    <>
      <PageHero eyebrow="Events" title={ev.title} sub={club ? club.tagline : ""}>
        <div className="mt-4 flex flex-wrap items-center gap-2">{phasePill}</div>
      </PageHero>
      <div className="container-x py-10">
        <nav aria-label="Breadcrumb" className="text-[13px] text-muted">
          <Link href="/" className="no-underline hover:underline">
            Home
          </Link>{" "}
          /{" "}
          <Link href="/events" className="no-underline hover:underline">
            Events
          </Link>{" "}
          / <span className="text-ink">{ev.title}</span>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="min-w-0 space-y-6">
            <div className="card p-6">
              <h2 className="m-0 text-[18px] font-bold text-ink">About this event</h2>
              <p className="m-0 mt-3 whitespace-pre-line text-[14.5px] leading-relaxed text-ink/90">
                {ev.description || "No description added by the organizers yet."}
              </p>
              {clashes.length > 0 && (
                <p className="mb-0 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                  ⚔️ <b>Clash radar:</b> this event overlaps with{" "}
                  {clashes.map((c, i) => (
                    <span key={c.id}>
                      {i > 0 && ", "}
                      <Link href={`/events/${c.id}`} className="font-semibold no-underline hover:underline">
                        {clubById(db, c.clubId)?.icon} {c.title}
                      </Link>
                    </span>
                  ))}
                  . The clubs may want to reschedule.
                </p>
              )}
            </div>

            <div className="card p-6">
              <h2 className="m-0 text-[18px] font-bold text-ink">📶 Attendance & certificates</h2>
              <p className="m-0 mt-2 text-[13.5px] leading-relaxed text-muted">
                Check in at the entrance with the day's door code (shown by the organizers). Your attendance is
                recorded instantly and a <b className="text-ink">verifiable participation certificate</b> is
                issued — anyone can confirm it at <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[12px]">/verify/CERT-…</code>.
              </p>

              {justCheckedIn || inState || cert ? (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                  <p className="m-0 text-[14px] font-bold text-emerald-800 dark:text-emerald-300">
                    ✓ You're checked in{phase === "ended" ? "" : " — attendance confirmed"}!
                  </p>
                  {cert && (
                    <Link href={certificateUrl(cert)} className="btn btn-primary btn-sm mt-3 no-underline">
                      📜 View your certificate
                    </Link>
                  )}
                </div>
              ) : canIn ? (
                <div className="mt-4">
                  {person ? (
                    <form
                      className="flex flex-wrap items-end gap-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        submitCheckIn();
                      }}
                    >
                      <div>
                        <label className="label" htmlFor="checkin-code">
                          Door code (from the organizers)
                        </label>
                        <input
                          id="checkin-code"
                          className="input w-44 font-mono text-center text-[18px] tracking-[0.3em]"
                          placeholder="000000"
                          inputMode="numeric"
                          maxLength={6}
                          value={code}
                          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                        />
                      </div>
                      <button type="submit" className="btn btn-primary" disabled={busy || code.length < 6}>
                        {busy ? "Checking…" : "Check me in"}
                      </button>
                    </form>
                  ) : (
                    <>
                      <button className="btn btn-primary" onClick={() => setAskIdentity(true)}>
                        📍 I'm here — check me in
                      </button>
                      {askIdentity && (
                        <IdentityPrompt
                          onIdentity={(p) => {
                            setPerson(p);
                            setAskIdentity(false);
                          }}
                          onCancel={() => setAskIdentity(false)}
                        />
                      )}
                    </>
                  )}
                  {!checkinOpen && (
                    <p className="m-0 mt-2 text-[12px] text-muted">
                      Check-in opens at {fmtDateTime(ev.startsAt)} — share this page&apos;s link so attendees can
                      check themselves in at the door.
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-4 rounded-lg border border-dashed border-line p-3 text-[13px] text-muted">
                  ⏳ Check-in opens on {fmtDateTime(ev.startsAt)}. RSVP above and you'll be first in.
                </p>
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="card p-5 text-center">
              <div className="text-5xl" aria-hidden="true">
                {club?.icon ?? "🎪"}
              </div>
              <h3 className="m-0 mt-2 text-[17px] font-bold text-ink">{club?.name ?? "NITER Club"}</h3>
              {club && (
                <Link href={`/club/${club.id}`} className="text-[12.5px] font-semibold text-crimson no-underline hover:underline">
                  Club page →
                </Link>
              )}
            </div>

            <div className="card p-5">
              <h3 className="m-0 text-[15px] font-bold text-ink">📅 When & where</h3>
              <dl className="m-0 mt-3 space-y-2.5 text-[13.5px]">
                <MetaRow k="Starts" v={fmtDateTime(ev.startsAt)} />
                {ev.endsAt && <MetaRow k="Ends" v={fmtDateTime(ev.endsAt)} />}
                <MetaRow k="Venue" v={ev.venue || "TBA"} />
                <MetaRow k="Capacity" v={ev.capacity > 0 ? String(ev.capacity) : "Unlimited"} />
              </dl>
            </div>

            <div className="card p-5">
              <h3 className="m-0 text-[15px] font-bold text-ink">📊 Live counts</h3>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <CountStat value={rsvps} label="going" />
                <CountStat value={ins} label="checked in" />
                <CountStat
                  value={ev.capacity > 0 && left === 0 ? "Full" : left === Infinity ? "∞" : left}
                  label={ev.capacity > 0 && left === 0 ? "full" : "spots left"}
                />
              </div>
              {ev.capacity > 0 && (
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={`h-full rounded-full ${isFull ? "bg-crimson" : "bg-gold"}`}
                    style={{ width: `${Math.min(100, Math.round((rsvps / ev.capacity) * 100))}%` }}
                  />
                </div>
              )}
              {isFull && waitCount > 0 && (
                <p className="m-0 mt-2 text-[11.5px] font-semibold text-crimson">
                  ⏳ Full — {waitCount} on the waitlist, promoted automatically as spots open.
                </p>
              )}
            </div>

            {phase === "upcoming" && (
              <div className="card p-5 text-center">
                <h3 className="m-0 text-[15px] font-bold text-ink">Coming up?</h3>
                <p className="m-0 mt-1 text-[13px] text-muted">
                  {isFull && !rsvpState && !waitState
                    ? "This event is full — join the waitlist and you'll move in automatically if a spot opens."
                    : "Reserve your spot so the organizers know you're coming."}
                </p>
                {rsvpState ? (
                  <button className="btn btn-outline mt-3 w-full" onClick={onRsvp}>
                    ✓ RSVP'd — tap to cancel
                  </button>
                ) : waitState ? (
                  <button className="btn btn-outline mt-3 w-full" onClick={onRsvp}>
                    ⏳ On waitlist (#{waitPos}) — tap to leave
                  </button>
                ) : (
                  <button className="btn btn-primary mt-3 w-full" onClick={onRsvp}>
                    {isFull ? "Join the waitlist" : "RSVP now"}
                  </button>
                )}
                {askIdentity && person === null && (
                  <IdentityPrompt
                    onIdentity={(p) => {
                      setPerson(p);
                      setAskIdentity(false);
                    }}
                    onCancel={() => setAskIdentity(false)}
                  />
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}

function MetaRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 font-semibold text-muted">{k}</dt>
      <dd className="m-0 text-right text-ink">{v}</dd>
    </div>
  );
}

function CountStat({ value, label }: { value: number | string; label: string }) {
  return (
    <div>
      <div className="text-[20px] font-extrabold leading-none text-ink">{value}</div>
      <div className="mt-1 text-[11px] text-muted">{label}</div>
    </div>
  );
}

function EventMissing() {
  return (
    <div className="container-x py-16 text-center">
      <div className="text-5xl">🤔</div>
      <h1 className="mt-3 text-xl font-bold text-ink">Event not found</h1>
      <p className="text-muted">This event doesn't exist or was removed.</p>
      <Link href="/events" className="btn btn-primary mt-4 no-underline">
        Browse all events
      </Link>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="container-x py-10">
      <Skeleton className="h-5 w-48" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-40" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    </div>
  );
}
