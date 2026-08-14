import type { Database, Form, FormStatus, FormStatusKey } from "./types";

/* ---------------- ids ---------------- */
export function uid(prefix = "id"): string {
  return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

/* ---------------- date formatting ---------------- */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const pad2 = (n: number) => (n < 10 ? "0" : "") + n;

export function fmtDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
}

export function fmtDateTime(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const hh = d.getHours();
  const ap = hh >= 12 ? "PM" : "AM";
  return fmtDate(iso) + ", " + (hh % 12 || 12) + ":" + pad2(d.getMinutes()) + " " + ap;
}

export function clockTime(d = new Date()): string {
  const h = d.getHours();
  return (h % 12 || 12) + ":" + pad2(d.getMinutes()) + ":" + pad2(d.getSeconds()) + (h >= 12 ? " PM" : " AM");
}

export function clockDate(d = new Date()): string {
  return DAY_NAMES[d.getDay()] + ", " + d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
}

export function timeLeftText(endTs: number): { done: boolean; text: string } {
  const diff = endTs - Date.now();
  if (diff <= 0) return { done: true, text: "0s" };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  let text = days > 0 ? days + "d " : "";
  text += days > 0 || hours > 0 ? hours + "h " : "";
  text += days > 0 || hours > 0 || mins > 0 ? mins + "m " : "";
  text += secs + "s";
  return { done: false, text };
}

export function relativeAgo(ts?: string | null): string {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 3600000) return "just now";
  if (diff < 86400000) return Math.floor(diff / 3600000) + "h ago";
  if (diff < 7 * 86400000) return Math.floor(diff / 86400000) + "d ago";
  return fmtDate(ts);
}

/* ---------------- form status ---------------- */
export function formOpenAt(f: Form): Date | null {
  return f.openAt ? new Date(f.openAt) : null;
}
export function formDeadline(f: Form): Date | null {
  return f.deadline ? new Date(f.deadline) : null;
}

export function statusOf(f: Form): FormStatus {
  const now = Date.now();
  const open = formOpenAt(f);
  const end = formDeadline(f);
  if (open && now < open.getTime()) return { key: "soon", start: open, end };
  if (end && now > end.getTime()) return { key: "closed", start: null, end };
  return { key: "open", start: open, end };
}

export function isOpen(f: Form): boolean {
  return statusOf(f).key === "open";
}
export function isClosed(f: Form): boolean {
  return statusOf(f).key === "closed";
}

/* ---------------- collections ---------------- */
export function clubById(db: Database, id: string) {
  return db.clubs.find((c) => c.id === id);
}

export function formById(db: Database, id: string) {
  return db.forms.find((f) => f.id === id);
}

export function noticeById(db: Database, id: string) {
  return db.notices.find((n) => n.id === id);
}

export function clubNotices(db: Database, clubId: string) {
  return db.notices
    .filter((n) => n.clubId === clubId)
    .sort((a, b) => {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      return (b.createdAt || b.date).localeCompare(a.createdAt || a.date);
    });
}

export function clubForms(db: Database, clubId: string) {
  return db.forms.filter((f) => f.clubId === clubId);
}

export function formSubs(db: Database, formId: string) {
  return db.submissions.filter((s) => s.formId === formId);
}

/* ---------------- ads ---------------- */
/** Active ads across all clubs, newest first — the home carousel feed. */
export function activeAds(db: Database) {
  return (db.ads ?? [])
    .filter((a) => a.status === "active")
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

/** A club's own ads (any status), newest first — the portal ads tab. */
export function clubAds(db: Database, clubId: string) {
  return (db.ads ?? [])
    .filter((a) => a.clubId === clubId)
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export function sortNotices(list: ReturnType<typeof clubNotices>) {
  return list.slice().sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    return (b.createdAt || b.date).localeCompare(a.createdAt || a.date);
  });
}

/** Nearest upcoming opening or deadline among forms; null if none. */
export function nextDeadline(forms: Form[]): { form: Form; key: FormStatusKey; ts: number } | null {
  let nx: { form: Form; key: FormStatusKey; ts: number } | null = null;
  for (const f of forms) {
    const st = statusOf(f);
    if (st.key === "closed") continue;
    const ts = st.key === "soon" ? (st.start ? st.start.getTime() : 0) : st.end ? st.end.getTime() : 0;
    if (!ts) continue;
    if (!nx || ts < nx.ts) nx = { form: f, key: st.key, ts };
  }
  return nx;
}

export const PAYMENT_OPTIONS = ["bKash", "Nagad", "Rocket", "Bank transfer", "Cash (at venue)", "Other"];
