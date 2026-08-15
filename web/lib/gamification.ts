import type { Database } from "./types";
import { personKey } from "./utils";

/**
 * Contribution matrix — XP is derived live from real activity records
 * (RSVPs, check-ins, submissions, memberships, certificates, created events).
 * Nothing is stored, so it can never drift out of sync with the data and
 * every change is auditable from the same records.
 */
export const XP = {
  rsvp: 5,
  earlyRsvpBonus: 5,
  checkIn: 20,
  submission: 10,
  membership: 15,
  eventCreated: 25,
  certificate: 5,
  answerUpvote: 5, // per upvote received on a Q&A answer
  answerAccepted: 30, // answer accepted as best on the Q&A board
} as const;

/** Anti-gaming caps for Q&A XP. */
export const ANSWER_UPVOTE_XP_CAP_COUNT = 5; // only the first 5 upvotes on an answer pay XP (25 XP max)
const QA_MONTHLY_XP_CAP = 150; // per author per calendar month

export interface ActivityStats {
  rsvps: number;
  earlyRsvps: number;
  checkIns: number;
  submissions: number;
  memberships: number;
  eventsCreated: number;
  certificates: number;
  answersWritten: number;
  bestAnswers: number;
  answerUpvotes: number;
}

export interface Badge {
  id: string;
  emoji: string;
  name: string;
  desc: string;
}

export const ALL_BADGES: Badge[] = [
  { id: "first_rsvp", emoji: "🎟", name: "First RSVP", desc: "RSVP'd to your first event" },
  { id: "early_bird", emoji: "⚡", name: "Early Bird", desc: "RSVP'd a week before an event" },
  { id: "regular", emoji: "🚀", name: "Regular Attendee", desc: "Checked in to 3+ events" },
  { id: "maestro", emoji: "🏆", name: "Event Maestro", desc: "Checked in to 5+ events" },
  { id: "member", emoji: "🤝", name: "Club Member", desc: "Got accepted into a club" },
  { id: "hopper", emoji: "🌍", name: "Club Hopper", desc: "Member of 3+ clubs" },
  { id: "contributor", emoji: "📝", name: "Form Filler", desc: "Submitted 3+ applications" },
  { id: "organizer", emoji: "🎪", name: "Event Organizer", desc: "Created a club event" },
  { id: "certified", emoji: "📜", name: "Certified", desc: "Earned a participation certificate" },
  {
    id: "mentor",
    emoji: "🧑‍🏫",
    name: "Community Mentor",
    desc: "2 accepted best answers, or 10+ upvotes on your Q&A answers",
  },
  { id: "top_contributor", emoji: "👑", name: "Top Contributor", desc: "Among the top 5 contributors" },
];

export interface MemberProfile {
  key: string;
  name: string;
  email: string;
  studentId?: string;
  xp: number;
  stats: ActivityStats;
  lastActive: string;
  badges: Badge[];
}

const EMPTY_STATS: ActivityStats = {
  rsvps: 0,
  earlyRsvps: 0,
  checkIns: 0,
  submissions: 0,
  memberships: 0,
  eventsCreated: 0,
  certificates: 0,
  answersWritten: 0,
  bestAnswers: 0,
  answerUpvotes: 0,
};

function monthStartTs(): number {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), 1).getTime();
}

function badgesFor(stats: ActivityStats): Badge[] {
  const out: Badge[] = [];
  const has = (id: string) => ALL_BADGES.some((b) => b.id === id);
  if (stats.rsvps >= 1 && has("first_rsvp")) out.push(ALL_BADGES.find((b) => b.id === "first_rsvp")!);
  if (stats.earlyRsvps >= 1 && has("early_bird")) out.push(ALL_BADGES.find((b) => b.id === "early_bird")!);
  if (stats.checkIns >= 3 && has("regular")) out.push(ALL_BADGES.find((b) => b.id === "regular")!);
  if (stats.checkIns >= 5 && has("maestro")) out.push(ALL_BADGES.find((b) => b.id === "maestro")!);
  if (stats.memberships >= 1 && has("member")) out.push(ALL_BADGES.find((b) => b.id === "member")!);
  if (stats.memberships >= 3 && has("hopper")) out.push(ALL_BADGES.find((b) => b.id === "hopper")!);
  if (stats.submissions >= 3 && has("contributor")) out.push(ALL_BADGES.find((b) => b.id === "contributor")!);
  if (stats.eventsCreated >= 1 && has("organizer")) out.push(ALL_BADGES.find((b) => b.id === "organizer")!);
  if (stats.certificates >= 1 && has("certified")) out.push(ALL_BADGES.find((b) => b.id === "certified")!);
  if ((stats.bestAnswers >= 2 || stats.answerUpvotes >= 10) && has("mentor"))
    out.push(ALL_BADGES.find((b) => b.id === "mentor")!);
  return out;
}

function xpOf(stats: ActivityStats): number {
  return (
    stats.rsvps * XP.rsvp +
    stats.earlyRsvps * XP.earlyRsvpBonus +
    stats.checkIns * XP.checkIn +
    stats.submissions * XP.submission +
    stats.memberships * XP.membership +
    stats.eventsCreated * XP.eventCreated +
    stats.certificates * XP.certificate
  );
}

/** All ranked member profiles. `period` = "month" counts only activity in the
 *  current calendar month. `withTop` adds the Top Contributor badge to the
 *  top-5 all-time (only meaningful for period "all"). */
export function allProfiles(db: Database, period: "all" | "month", withTop = true): MemberProfile[] {
  const cutoff = period === "month" ? monthStartTs() : 0;
  const map = new Map<string, MemberProfile>();

  const get = (key: string, name: string, email: string, studentId?: string): MemberProfile => {
    let p = map.get(key);
    if (!p) {
      p = {
        key,
        name: name || email || key,
        email,
        studentId,
        xp: 0,
        stats: { ...EMPTY_STATS },
        lastActive: "",
        badges: [],
      };
      map.set(key, p);
    }
    if (name && !p.name) p.name = name;
    if (studentId && !p.studentId) p.studentId = studentId;
    return p;
  };

  const bump = (p: MemberProfile, ts: string) => {
    if (ts && (!p.lastActive || new Date(ts).getTime() > new Date(p.lastActive).getTime())) p.lastActive = ts;
  };

  (db.events || []).forEach((ev) => {
    const rsvps = Array.isArray(ev.rsvps) ? ev.rsvps : [];
    const checkIns = Array.isArray(ev.checkIns) ? ev.checkIns : [];
    const starts = new Date(ev.startsAt).getTime();
    rsvps.forEach((r) => {
      const at = new Date(r.at).getTime();
      if (at < cutoff) return;
      const p = get(personKey(r), r.name, r.email, r.studentId);
      p.stats.rsvps++;
      if (!isNaN(starts) && starts - at >= 7 * 86400000) p.stats.earlyRsvps++;
      bump(p, r.at);
    });
    checkIns.forEach((c) => {
      const at = new Date(c.at).getTime();
      if (at < cutoff) return;
      const p = get(personKey(c), c.name, c.email, c.studentId);
      p.stats.checkIns++;
      bump(p, c.at);
    });
  });

  (db.submissions || []).forEach((s) => {
    const at = new Date(s.submittedAt).getTime();
    if (at < cutoff) return;
    const p = get(personKey({ email: s.submitterEmail, userId: s.userId }), s.submitterName || "", s.submitterEmail || "");
    p.stats.submissions++;
    bump(p, s.submittedAt);
  });

  (db.memberships || []).forEach((m) => {
    if (m.status !== "approved") return;
    const ts = m.reviewedAt || m.requestedAt;
    const at = new Date(ts).getTime();
    if (at < cutoff) return;
    const p = get(personKey({ email: m.userEmail, userId: m.userId }), m.userName, m.userEmail, m.studentId);
    p.stats.memberships++;
    bump(p, ts);
  });

  (db.certificates || []).forEach((c) => {
    const at = new Date(c.issuedAt).getTime();
    if (at < cutoff) return;
    const p = get(c.userId, c.name, c.email, c.studentId);
    p.stats.certificates++;
    bump(p, c.issuedAt);
  });

  // Q&A helpfulness — upvotes received & accepted best answers. Both require
  // other students to engage (no self-upvotes are allowed), and XP is capped
  // at 5 upvotes per answer and 150 XP per author per calendar month, so the
  // board can't be farmed for points.
  const monthXp = new Map<string, number>(); // `${authorKey}|YYYY-MM` → answer XP
  (db.questions || []).forEach((q) => {
    (q.answers || []).forEach((a) => {
      const at = new Date(a.at).getTime();
      if (at < cutoff) return;
      // Moderator-hidden answers (spam/abuse) earn nothing — XP only comes
      // from content that's visible and useful to other students.
      if (a.hidden) return;
      const p = get(a.authorKey, a.authorName, a.authorKey);
      p.stats.answersWritten++;
      p.stats.answerUpvotes += a.upvotes || 0;
      if (a.accepted) p.stats.bestAnswers++;
      const upXp = Math.min(a.upvotes || 0, ANSWER_UPVOTE_XP_CAP_COUNT) * XP.answerUpvote;
      const accXp = a.accepted ? XP.answerAccepted : 0;
      const mk = a.authorKey + "|" + (a.at || "").slice(0, 7);
      monthXp.set(mk, (monthXp.get(mk) || 0) + upXp + accXp);
      bump(p, a.at);
    });
  });

  (db.events || []).forEach((ev) => {
    const at = new Date(ev.createdAt).getTime();
    if (at < cutoff) return;
    const createdBy = (ev.createdBy || "").trim().toLowerCase();
    if (!createdBy.includes("@")) return;
    const p = get(createdBy, "", createdBy);
    p.stats.eventsCreated++;
    bump(p, ev.createdAt);
  });

  const profiles = [...map.values()];
  profiles.forEach((p) => {
    // Q&A XP is capped per author per calendar month (summed across months for
    // the all-time view).
    let qaXp = 0;
    monthXp.forEach((v, mk) => {
      if (mk.startsWith(p.key + "|")) qaXp += Math.min(v, QA_MONTHLY_XP_CAP);
    });
    p.xp = xpOf(p.stats) + qaXp;
    p.badges = badgesFor(p.stats);
  });
  profiles.sort((a, b) => b.xp - a.xp || (b.lastActive || "").localeCompare(a.lastActive || ""));
  if (withTop && period === "all") {
    profiles.slice(0, 5).forEach((p) => {
      if (p.xp > 0 && !p.badges.some((b) => b.id === "top_contributor")) {
        p.badges.push(ALL_BADGES.find((b) => b.id === "top_contributor")!);
      }
    });
  }
  return profiles;
}

/** Ranked profile for one person (by email/uid), or null. */
export function profileFor(
  db: Database,
  identity: { email?: string; userId?: string },
  period: "all" | "month" = "all"
): MemberProfile | null {
  const key = personKey(identity);
  if (!key) return null;
  return allProfiles(db, period, period === "all").find((p) => p.key === key) ?? null;
}
