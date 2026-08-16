import type { Database } from "./types";
import rawSeed from "./seed.json";

/**
 * The canned seed content was authored relative to a fixed "seed epoch".
 * At runtime we shift every stored date by the same amount so the demo data
 * always feels fresh (notices are days old, deadlines are weeks ahead),
 * exactly like the original app's `daysAgo()` seeding.
 */
const SEED_EPOCH_MS = Date.parse("2026-08-10T00:00:00.000Z");
const SHIFT_MS = Date.now() - SEED_EPOCH_MS;

const pad = (n: number) => (n < 10 ? "0" : "") + n;

function rebaseDateTime(value: string): string {
  if (!value) return value;
  const isUtcIso = /(Z|[+-]\d\d:\d\d)$/.test(value);
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const shifted = new Date(d.getTime() + SHIFT_MS);
  if (isUtcIso) return shifted.toISOString();
  // Naive local datetime / date — re-serialize without a timezone so the
  // original "YYYY-MM-DDTHH:mm" / "YYYY-MM-DD" shape is preserved.
  const base = shifted.getFullYear() + "-" + pad(shifted.getMonth() + 1) + "-" + pad(shifted.getDate());
  if (value.length <= 10) return base;
  return (
    base +
    "T" +
    pad(shifted.getHours()) +
    ":" +
    pad(shifted.getMinutes()) +
    (value.length >= 19 ? ":" + pad(shifted.getSeconds()) : "")
  );
}

const DATE_KEYS = new Set(["createdAt", "date", "submittedAt", "resolvedAt", "openAt", "deadline"]);

function rebaseDates(value: unknown): unknown {
  if (typeof value === "string") return rebaseDateTime(value);
  if (Array.isArray(value)) return value.map(rebaseDates);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = DATE_KEYS.has(k) && typeof v === "string" ? rebaseDateTime(v) : rebaseDates(v);
    }
    return out;
  }
  return value;
}

/** Fresh seed database, dates relative to today. */
export function createSeed(): Database {
  return rebaseDates(rawSeed) as Database;
}
