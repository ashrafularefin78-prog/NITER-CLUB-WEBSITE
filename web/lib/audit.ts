import type { AuditEvent, AuditSeverity } from "./types";
import { mutate, useDb } from "./store";
import { uid } from "./utils";

/**
 * Append a row to the admin audit log ("who did what, when"). The log is a
 * capped FIFO (newest first, trimmed to MAX_ROWS) and syncs to Firestore like
 * every other collection — but only admins can read it (see firestore.rules).
 */
export const AUDIT_MAX_ROWS = 800;

export function logAudit(
  action: string,
  label: string,
  severity: AuditSeverity = "info",
  detail?: string,
  actor?: string
) {
  mutate((d) => {
    if (!Array.isArray(d.auditLog)) d.auditLog = [];
    d.auditLog.unshift({
      id: uid("a"),
      at: new Date().toISOString(),
      action,
      label,
      severity,
      detail: detail || "",
      actor: actor || "",
    } as AuditEvent);
    if (d.auditLog.length > AUDIT_MAX_ROWS) d.auditLog.length = AUDIT_MAX_ROWS;
  });
}

/** How many failed logins this actor had within the last `windowMs`. */
export function failedLoginCount(log: AuditEvent[], actor: string, windowMs = 15 * 60000): number {
  const key = (actor || "").toLowerCase();
  if (!key) return 0;
  const cutoff = Date.now() - windowMs;
  return log.filter(
    (e) => e.action === "login_fail" && (e.actor || "").toLowerCase() === key && new Date(e.at).getTime() >= cutoff
  ).length;
}

/** True when an actor has tripped the brute-force heuristic (>=5 fails / 15 min). */
export function isLoginAnomaly(log: AuditEvent[], actor: string): boolean {
  return failedLoginCount(log, actor) >= 5;
}