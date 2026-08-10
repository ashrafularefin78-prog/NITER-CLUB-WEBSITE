import type { Database, Form } from "./types";
import { PAYMENT_OPTIONS } from "./utils";

/**
 * Every application form always collects a phone number and a payment method
 * (with transaction number). These are appended to any form that lacks them.
 */
export function ensureStandardFields(f: Form): Form {
  if (!Array.isArray(f.fields)) f.fields = [];
  if (!f.fields.some((x) => x && x.type === "phone")) {
    f.fields.push({
      id: "phone",
      label: "Phone Number",
      type: "phone",
      required: true,
      placeholder: "01XXXXXXXXX",
    });
  }
  if (!f.fields.some((x) => x && x.type === "payment")) {
    f.fields.push({
      id: "payment",
      label: "Payment Method",
      type: "payment",
      required: true,
      options: PAYMENT_OPTIONS,
    });
  }
  return f;
}

/** Tolerantly parse + backfill a database object loaded from storage. */
export function normalizeDb(d: Database): Database {
  d.version = typeof d.version === "number" ? d.version : 1;
  if (!Array.isArray(d.complaints)) d.complaints = [];
  if (!Array.isArray(d.submissions)) d.submissions = [];
  d.submissions.forEach((s) => {
    if (!s.clubId) {
      const sf = d.forms.find((x) => x.id === s.formId);
      if (sf && sf.clubId) s.clubId = sf.clubId;
    }
  });
  d.complaints.forEach((cp) => {
    if (!cp.status) cp.status = "open";
    if (!cp.reply) cp.reply = "";
    if (!cp.resolvedAt) cp.resolvedAt = "";
    if (!cp.createdAt) cp.createdAt = new Date().toISOString();
  });
  d.clubs.forEach((c) => {
    if (!Array.isArray(c.executives)) {
      c.executives = [
        { role: "President", name: "" },
        { role: "Vice President", name: "" },
        { role: "General Secretary", name: "" },
      ];
    } else {
      c.executives = c.executives.map((r) =>
        typeof r === "string" ? { role: r, name: "" } : { role: r.role || "", name: r.name || "" }
      );
    }
  });
  d.notices.forEach((n) => {
    if (!n.createdAt) n.createdAt = (n.date || "") + "T09:00:00";
    if (n.pinned == null) n.pinned = false;
    if (!n.reactions || typeof n.reactions !== "object") n.reactions = {};
  });
  d.forms.forEach((f) => {
    if (f.openAt == null) f.openAt = "";
    if (f.deadline && f.deadline.length === 10) f.deadline += "T23:59";
    ensureStandardFields(f);
  });
  return d;
}
