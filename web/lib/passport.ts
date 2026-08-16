import type { Club, Database } from "./types";
import { clubById, personKey } from "./utils";

export interface PassportEvent {
  eventId: string;
  title: string;
  at: string;
}

export interface PassportStamp {
  clubId: string;
  club?: Club;
  events: PassportEvent[];
}

export interface Passport {
  /** Clubs visited, most recent stamp first. */
  stamps: PassportStamp[];
  totalEvents: number;
  clubsVisited: number;
  firstAt: string | null;
  lastAt: string | null;
}

/**
 * Derive a member's club passport from verified check-ins — every stamp is a
 * real event they attended (a certificate backs it up), so the passport is
 * always consistent with the attendance records. Nothing extra is stored.
 */
export function passportFor(db: Database, person: { email?: string; userId?: string }): Passport {
  const key = (personKey(person) || "").toLowerCase();
  if (!key) return emptyPassport();
  const map = new Map<string, PassportStamp>();
  let firstAt: string | null = null;
  let lastAt: string | null = null;
  (db.events || []).forEach((ev) => {
    (ev.checkIns || []).forEach((c) => {
      if ((personKey(c) || "").toLowerCase() !== key) return;
      const stamp = map.get(ev.clubId) || { clubId: ev.clubId, club: clubById(db, ev.clubId), events: [] };
      stamp.events.push({ eventId: ev.id, title: ev.title, at: c.at });
      map.set(ev.clubId, stamp);
      if (!firstAt || c.at < firstAt) firstAt = c.at;
      if (!lastAt || c.at > lastAt) lastAt = c.at;
    });
  });
  const stamps = [...map.values()]
    .map((s) => ({ ...s, events: s.events.slice().sort((a, b) => b.at.localeCompare(a.at)) }))
    .sort((a, b) => (b.events[0]?.at || "").localeCompare(a.events[0]?.at || ""));
  return {
    stamps,
    totalEvents: stamps.reduce((n, s) => n + s.events.length, 0),
    clubsVisited: stamps.length,
    firstAt,
    lastAt,
  };
}

function emptyPassport(): Passport {
  return { stamps: [], totalEvents: 0, clubsVisited: 0, firstAt: null, lastAt: null };
}

/** How many more clubs the member needs to unlock the Club Hopper badge (3+). */
export function hopperProgress(pass: Passport): { done: boolean; need: number } {
  return { done: pass.clubsVisited >= 3, need: Math.max(0, 3 - pass.clubsVisited) };
}
