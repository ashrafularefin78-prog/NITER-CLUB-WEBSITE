import type { Certificate, ClubEvent, Database, EventPerson } from "./types";
import { clubById, doorCode, personKey, uid } from "./utils";
import { mutate } from "./store";

/* ---------------- guest identity (RSVP/check-in without an account) ---------------- */

export const GUEST_IDENTITY_KEY = "niter-guest-identity";

export interface Person {
  userId: string;
  name: string;
  email: string;
  studentId?: string;
}

export function loadGuestIdentity(): Person | null {
  try {
    const raw = localStorage.getItem(GUEST_IDENTITY_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Person;
      if (p && p.name && p.email) return p;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function saveGuestIdentity(p: Person) {
  try {
    localStorage.setItem(GUEST_IDENTITY_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

/* ---------------- counts & lookups ---------------- */

export function rsvpsOf(ev: ClubEvent): EventPerson[] {
  return Array.isArray(ev.rsvps) ? ev.rsvps : [];
}

export function checkInsOf(ev: ClubEvent): EventPerson[] {
  return Array.isArray(ev.checkIns) ? ev.checkIns : [];
}

export function rsvpCount(ev: ClubEvent): number {
  return rsvpsOf(ev).length;
}

export function checkInCount(ev: ClubEvent): number {
  return checkInsOf(ev).length;
}

export function capacityLeft(ev: ClubEvent): number {
  if (!ev.capacity || ev.capacity <= 0) return Infinity;
  return Math.max(0, ev.capacity - rsvpCount(ev));
}

export function rsvpOf(ev: ClubEvent, person: Person): EventPerson | undefined {
  const key = personKey(person);
  return rsvpsOf(ev).find((r) => personKey(r) === key);
}

export function checkInOf(ev: ClubEvent, person: Person): EventPerson | undefined {
  const key = personKey(person);
  return checkInsOf(ev).find((c) => personKey(c) === key);
}

/* ---------------- clash radar ---------------- */

function overlap(aStart: string, aEnd: string | undefined, bStart: string, bEnd: string | undefined): boolean {
  const a1 = new Date(aStart).getTime();
  const a2 = aEnd ? new Date(aEnd).getTime() : a1 + 3 * 3600000;
  const b1 = new Date(bStart).getTime();
  const b2 = bEnd ? new Date(bEnd).getTime() : b1 + 3 * 3600000;
  if (isNaN(a1) || isNaN(b1)) return false;
  return a1 < b2 && b1 < a2;
}

/** Events that clash with `ev` in time — the shared campus calendar radar. */
export function eventClashes(db: Database, ev: ClubEvent): ClubEvent[] {
  return (db.events || []).filter((o) => o.id !== ev.id && overlap(ev.startsAt, ev.endsAt, o.startsAt, o.endsAt));
}

/* ---------------- RSVP + waitlist ---------------- */

export function waitlistOf(ev: ClubEvent): EventPerson[] {
  return Array.isArray(ev.waitlist) ? ev.waitlist : [];
}

export function waitlistCount(ev: ClubEvent): number {
  return waitlistOf(ev).length;
}

export function waitlistOfPerson(ev: ClubEvent, person: Person): EventPerson | undefined {
  const key = personKey(person);
  return waitlistOf(ev).find((w) => personKey(w) === key);
}

/** 1-based waitlist position, or null when not waitlisted. */
export function waitlistPosition(ev: ClubEvent, person: Person): number | null {
  const key = personKey(person);
  const idx = waitlistOf(ev).findIndex((w) => personKey(w) === key);
  return idx >= 0 ? idx + 1 : null;
}

export type RsvpResult = "confirmed" | "waitlisted" | "cancelled";

/**
 * Toggle RSVP state on `ev` for `person`:
 *  - already confirmed → cancel, and the first waitlisted student is
 *    auto-promoted into the freed spot (no one loses their place silently);
 *  - on the waitlist → leave it;
 *  - event full → join the waitlist;
 *  - otherwise → confirm.
 * Returns the resulting state.
 */
export function toggleRsvp(db: Database, ev: ClubEvent, person: Person): RsvpResult {
  const key = personKey(person);
  const email = person.email.trim().toLowerCase();
  let out: RsvpResult = "confirmed";
  mutate((d) => {
    const t = d.events.find((e) => e.id === ev.id);
    if (!t) return;
    if (!Array.isArray(t.rsvps)) t.rsvps = [];
    if (!Array.isArray(t.waitlist)) t.waitlist = [];
    const rIdx = t.rsvps.findIndex((r) => personKey(r) === key);
    if (rIdx >= 0) {
      t.rsvps.splice(rIdx, 1);
      if (t.waitlist.length > 0) {
        const promoted = t.waitlist.shift()!;
        t.rsvps.push(promoted);
      }
      out = "cancelled";
      return;
    }
    const wIdx = t.waitlist.findIndex((w) => personKey(w) === key);
    if (wIdx >= 0) {
      t.waitlist.splice(wIdx, 1);
      out = "cancelled";
      return;
    }
    const entry: EventPerson = {
      userId: key,
      name: person.name.trim(),
      email,
      studentId: person.studentId?.trim() || "",
      at: new Date().toISOString(),
    };
    if (t.capacity && t.capacity > 0 && t.rsvps.length >= t.capacity) {
      t.waitlist.push(entry);
      out = "waitlisted";
      return;
    }
    t.rsvps.push(entry);
    out = "confirmed";
  });
  return out;
}

/** Move the first waitlisted student into the RSVP list (organizer action). */
export function promoteFromWaitlist(db: Database, ev: ClubEvent): EventPerson | null {
  let out: EventPerson | null = null;
  mutate((d) => {
    const t = d.events.find((e) => e.id === ev.id);
    if (!t) return;
    if (!Array.isArray(t.rsvps)) t.rsvps = [];
    if (!Array.isArray(t.waitlist)) t.waitlist = [];
    if (!t.waitlist.length) return;
    const promoted = t.waitlist.shift()!;
    t.rsvps.push(promoted);
    out = promoted;
  });
  return out;
}

/* ---------------- certificates ---------------- */

export function certId(): string {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return "CERT-" + Date.now().toString(36).toUpperCase() + rand;
}

export function certById(db: Database, id: string): Certificate | undefined {
  const key = id.trim().toUpperCase();
  return (db.certificates || []).find((c) => c.id.toUpperCase() === key);
}

export function certFor(db: Database, ev: ClubEvent, person: Person): Certificate | undefined {
  const key = personKey(person);
  return (db.certificates || []).find((c) => c.eventId === ev.id && (c.userId || "").toLowerCase() === key);
}

export function certificateUrl(c: Certificate): string {
  return "/verify/" + c.id;
}

/* ---------------- check-in (attendance + certificate issue) ---------------- */

/**
 * Check `person` into `ev` (deduped) and issue their participation
 * certificate in the same mutation. Returns the certificate, or null if the
 * person was already checked in (their existing cert is still returned via
 * certFor). `by` records who performed the check-in ("self", or an exec name).
 */
export function checkInPerson(db: Database, ev: ClubEvent, person: Person, by = "self"): Certificate | null {
  const key = personKey(person);
  const email = person.email.trim().toLowerCase();
  let out: Certificate | null = null;

  mutate((d) => {
    const t = d.events.find((e) => e.id === ev.id);
    if (!t) return;
    if (!Array.isArray(t.checkIns)) t.checkIns = [];
    const dup = t.checkIns.find((c) => personKey(c) === key);
    if (dup) {
      out =
        (d.certificates || []).find((c) => c.eventId === ev.id && (c.userId || "").toLowerCase() === key) ?? null;
      return;
    }
    t.checkIns.push({
      userId: key,
      name: person.name.trim(),
      email,
      studentId: person.studentId?.trim() || "",
      at: new Date().toISOString(),
      by,
    });
    // A waitlisted student who got in at the door no longer needs a waitlist
    // spot — dropping them now prevents a later "promotion" after they've
    // already attended.
    if (Array.isArray(t.waitlist)) {
      t.waitlist = t.waitlist.filter((w) => personKey(w) !== key);
    }
    const club = clubById(d, ev.clubId);
    const cert: Certificate = {
      id: certId(),
      eventId: ev.id,
      clubId: ev.clubId,
      userId: key,
      name: person.name.trim(),
      email,
      studentId: person.studentId?.trim() || "",
      eventTitle: ev.title,
      eventDate: ev.startsAt,
      clubName: club?.name || "NITER Clubs",
      issuedAt: new Date().toISOString(),
    };
    if (!Array.isArray(d.certificates)) d.certificates = [];
    d.certificates.unshift(cert);
    out = cert;
  });

  return out;
}

/** Remove a check-in (organizer correction) — the certificate stays on record. */
export function undoCheckIn(db: Database, ev: ClubEvent, key: string) {
  mutate((d) => {
    const t = d.events.find((e) => e.id === ev.id);
    if (!t) return;
    if (!Array.isArray(t.checkIns)) t.checkIns = [];
    t.checkIns = t.checkIns.filter((c) => personKey(c) !== key);
  });
}

/* ---------------- phase ---------------- */

export type EventPhase = "upcoming" | "live" | "ended";

export function eventPhase(ev: ClubEvent, now = Date.now()): EventPhase {
  const s = new Date(ev.startsAt).getTime();
  const e = ev.endsAt ? new Date(ev.endsAt).getTime() : s + 3 * 3600000;
  if (isNaN(s)) return "ended";
  if (now < s) return "upcoming";
  if (now <= e) return "live";
  return "ended";
}

/** Check-in opens when the event is scheduled to start (organizers can also
 *  record attendance from the portal afterwards). */
export function canCheckIn(ev: ClubEvent, now = Date.now()): boolean {
  return new Date(ev.startsAt).getTime() <= now;
}

/* ---------------- exports ---------------- */

export function exportCheckInsCsv(ev: ClubEvent, clubName: string) {
  const rows: string[][] = [["Name", "Email", "Student ID", "Checked in at", "Checked in by"]];
  checkInsOf(ev).forEach((c) => {
    rows.push([c.name, c.email, c.studentId || "", c.at, c.by || ""]);
  });
  const csv = rows
    .map((r) => r.map((v) => (/[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v)).join(","))
    .join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = (clubName + "-" + ev.title).replace(/[^\w\- ]+/g, "").trim() + "-attendance.csv";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 300);
}

export { doorCode, uid };
