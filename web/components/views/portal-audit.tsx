"use client";

import { useMemo, useState } from "react";
import type { AuditEvent } from "@/lib/types";
import { useDb } from "@/lib/store";
import { failedLoginCount } from "@/lib/audit";
import { relativeAgo } from "@/lib/utils";
import { EmptyState } from "@/components/ui";

const SEVERITY_TONE: Record<AuditEvent["severity"], string> = {
  info: "bg-surface-2 text-muted",
  warn: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  alert: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

/**
 * Security transparency panel (admins only). Shows the recent audit trail —
 * who did what, when — and surfaces anomaly flags automatically (e.g. five
 * failed logins for one account in 15 minutes reads as a brute-force attempt).
 */
export function AuditLogPanel() {
  const db = useDb()!;
  const [filter, setFilter] = useState<"all" | "warn" | "alert">("all");

  const log: AuditEvent[] = useMemo(() => (db.auditLog || []).slice().sort((a, b) => b.at.localeCompare(a.at)), [db.auditLog]);

  // Group failed logins per actor to flag brute-force-style patterns.
  const anomalies = useMemo(() => {
    const actors = new Set<string>();
    log.forEach((e) => {
      if (e.action === "login_fail" && e.actor) actors.add(e.actor);
    });
    return [...actors]
      .filter((a) => failedLoginCount(log, a) >= 5)
      .map((a) => ({ actor: a, count: failedLoginCount(log, a) }));
  }, [log]);

  const shown = log.filter((e) => (filter === "all" ? true : e.severity === filter));
  const warnCount = log.filter((e) => e.severity !== "info").length;

  return (
    <div className="panel lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="m-0 text-[18px] font-bold text-ink">🕵️ Audit log</h2>
          <p className="m-0 mt-0.5 text-[13px] text-muted">
            Who did what, when — every sensitive action is recorded here. {warnCount} warning{warnCount === 1 ? "" : "s"} on record.
          </p>
        </div>
        <div className="flex gap-2">
          {(["all", "warn", "alert"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md border px-3 py-1 text-[12.5px] font-bold transition ${
                filter === f ? "border-crimson bg-crimson text-white" : "border-hairline text-muted hover:border-crimson"
              }`}
            >
              {f === "all" ? "All" : f === "warn" ? "⚠ Warnings" : "🚨 Alerts"}
            </button>
          ))}
        </div>
      </div>

      {anomalies.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="m-0 text-[12px] font-bold uppercase tracking-[1.2px] text-rose-700 dark:text-rose-300">
            🚨 Anomaly flags — possible brute-force attempts
          </p>
          {anomalies.map((a) => (
            <div key={a.actor} className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-[13px] dark:border-rose-500/30 dark:bg-rose-500/10">
              <b className="text-ink">{a.actor}</b>{" "}
              <span className="text-rose-700 dark:text-rose-300">
                failed to sign in {a.count} times in the last 15 minutes
              </span>
              <span className="ml-1 text-muted">— rate-limit or review this account.</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        {shown.length ? (
          <div className="max-h-[440px] space-y-1.5 overflow-y-auto pr-1">
            {shown.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-line px-3 py-2 text-[13px]">
                <span className="w-20 shrink-0 font-mono text-[11px] text-muted" title={e.at}>
                  {relativeAgo(e.at)}
                </span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${SEVERITY_TONE[e.severity]}`}>
                  {e.severity}
                </span>
                <span className="min-w-0 flex-1 text-ink">{e.label}</span>
                {e.actor && <span className="shrink-0 max-w-[180px] truncate font-mono text-[11px] text-muted">{e.actor}</span>}
                {e.detail && <span className="w-full text-[11.5px] text-muted">{e.detail}</span>}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon="🛡">
            No audit entries{filter !== "all" ? " with this severity" : ""} yet — actions like sign-ins,
            submissions, reviews and check-ins will appear here.
          </EmptyState>
        )}
      </div>

      <p className="mb-0 mt-4 text-[12px] text-muted">
        The log is append-only, capped at the most recent 800 entries, and readable only by admins. It also backs
        the leaderboard — every XP point traces to a logged action.
      </p>
    </div>
  );
}
