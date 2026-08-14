"use client";

import { useSyncExternalStore } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
  type Firestore,
  type QuerySnapshot,
} from "firebase/firestore";
import type { Database, PortalUser, Role } from "./types";
import { createSeed } from "./seed";
import { normalizeDb } from "./normalize";
import { getCloudDb } from "./firebase";

export const STORAGE_KEY = "niter-clubs-db-v8";

const CLOUD_COLLECTIONS = [
  "clubs",
  "notices",
  "forms",
  "submissions",
  "complaints",
  "memberships",
  "events",
  "ads",
  "students",
] as const;
const RESTRICTED_COLLECTIONS = new Set(["submissions", "complaints", "memberships"]);

type ReadScope = { role: Role; clubs: string[]; uid?: string; email?: string } | null;

/* ---------------- module state ---------------- */
let db: Database | null = null;
let initialized = false;
let hydrated = false;
let lastSynced: Record<string, unknown[]> | null = null;
let readScope: ReadScope = null;
let syncWarned = false;
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let cloudSubscribed = false;
const cloudUnsubs: (() => void)[] = [];
let restrictedUnsubs: (() => void)[] = [];

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  db = loadOrSeed();
  // Cross-tab local-storage sync (Firestore is realtime via onSnapshot — no
  // polling needed for the cloud).
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY || e.key === null) syncFromStorage();
  });
  setInterval(syncFromStorage, 4000);
  void hydrateFromCloud().then(() => {
    // First cloud pull done — pushes may now flow (nothing saved before the
    // pull is stranded).
    if (pendingPush) {
      pendingPush = false;
      diffPush();
    }
    subscribeCloud();
  });
  setInterval(() => tick(), 1000);
}

/* ---------------- persistence ---------------- */
function loadOrSeed(): Database {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Database;
      if (parsed && Array.isArray(parsed.clubs) && Array.isArray(parsed.forms)) {
        return normalizeDb(parsed);
      }
    }
  } catch {
    /* fall through to reseed */
  }
  const seeded = normalizeDb(createSeed());
  persist(seeded);
  return seeded;
}

function persist(d: Database, silent = false) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {
    /* storage full / unavailable */
  }
  if (!silent) schedulePush();
}

export function resetDb() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  db = null;
  initialized = false;
  lastSynced = null;
  hydrated = false;
  db = loadOrSeed();
  notify();
}

function syncFromStorage() {
  try {
    const fresh = loadRaw();
    if (!fresh || fresh.version === db?.version) return;
    db = fresh;
    notify();
  } catch {
    /* ignore */
  }
}

function loadRaw(): Database | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const parsed = JSON.parse(raw) as Database;
  return parsed && Array.isArray(parsed.clubs) && Array.isArray(parsed.forms) ? normalizeDb(parsed) : null;
}

/* ---------------- public API ---------------- */
export function getDb(): Database | null {
  ensureInit();
  return db;
}

export function subscribe(cb: () => void): () => void {
  ensureInit();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getSnapshot(): Database | null {
  ensureInit();
  return db;
}

export function useDb(): Database | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

/** Apply a mutation, persist, notify React, and schedule a cloud push. */
export function mutate(mutator: (draft: Database) => void) {
  ensureInit();
  if (!db) return;
  mutator(db);
  db.version = (db.version || 0) + 1;
  // Fresh top-level identity so useSyncExternalStore subscribers re-render
  // (nested objects are mutated in place, which React cannot detect).
  db = { ...db };
  persist(db);
  notify();
}

/** Permanently link submissions to the signed-in account. Submissions made
 *  as a visitor (typed email) carry no userId yet — after any sign-in we
 *  backfill userId (plus missing name/ID) onto every submission whose
 *  submitter email matches, so the dashboard keeps showing them even if the
 *  account email changes later. Returns how many were linked. */
export function linkSubmissionsToUser(profile: {
  uid: string;
  email: string;
  name?: string;
  studentId?: string;
}): number {
  let linked = 0;
  mutate((draft) => {
    const email = (profile.email || "").toLowerCase();
    (draft.submissions || []).forEach((s) => {
      if (!s.userId && s.submitterEmail && s.submitterEmail.toLowerCase() === email) {
        s.userId = profile.uid;
        if (!s.submitterName && profile.name) s.submitterName = profile.name;
        if (!s.submitterStudentId && profile.studentId) s.submitterStudentId = profile.studentId;
        linked++;
      }
    });
  });
  return linked;
}

export function setReadScope(scope: ReadScope) {
  readScope = scope;
  // Restricted collections (submissions / complaints) are only readable per
  // the signed-in user's scope — resubscribe when auth changes.
  if (initialized && cloudSubscribed) refreshRestrictedSubscriptions();
}

/** Cache of the users collection (portal member management). */
export function setUsers(list: PortalUser[]) {
  ensureInit();
  if (!db) return;
  db.__users = list;
  persist(db, true);
  notify();
}

/* ---------------- cloud sync (Firestore) ---------------- */
let pendingPush = false;

function cloudDb(): Firestore | null {
  return getCloudDb();
}

function mapSnap(snap: QuerySnapshot<unknown>): unknown[] {
  const items: unknown[] = [];
  snap.forEach((ds) => {
    const d = ds.data() as Record<string, unknown>;
    (d as { id: string }).id = ds.id;
    items.push(d);
  });
  return items;
}

function toDoc(obj: Record<string, unknown>): Record<string, unknown> {
  const docData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === "id" || k === "__cloud") continue;
    docData[k] = v;
  }
  return docData;
}

function cloneList(list: unknown[]): unknown[] {
  return JSON.parse(JSON.stringify(list));
}

function snapshotOf(d: Database): Record<string, unknown[]> {
  const snap: Record<string, unknown[]> = {};
  CLOUD_COLLECTIONS.forEach((name) => {
    snap[name] = cloneList(d[name] ?? []);
  });
  return snap;
}

/** Does the local collection hold changes not yet pushed to the cloud? */
function collectionDirty(name: string): boolean {
  if (!lastSynced) return false;
  const a = (db?.[name as keyof Database] as unknown[] | undefined) ?? [];
  const b = lastSynced[name] ?? [];
  if (a.length !== b.length) return true;
  const byId = new Map(b.map((x) => [(x as { id: string }).id, x]));
  for (const item of a) {
    const p = byId.get((item as { id: string }).id);
    if (!p || JSON.stringify(p) !== JSON.stringify(item)) return true;
  }
  return false;
}

async function fetchCollection(
  dbRef: Firestore,
  name: string
): Promise<{ items: unknown[] | null; err?: unknown }> {
  if (RESTRICTED_COLLECTIONS.has(name)) {
    if (!readScope || readScope.role === "member") return { items: null };
    if (readScope.role === "admin") {
      try {
        return { items: mapSnap(await getDocs(collection(dbRef, name))) };
      } catch (err) {
        return { err, items: null };
      }
    }
    // IT staff (admin-granted) read only the IT helpdesk complaints.
    if (name === "complaints" && readScope.role === "it-staff") {
      try {
        const q = query(collection(dbRef, name), where("clubId", "==", "it"));
        return { items: mapSnap(await getDocs(q)) };
      } catch (err) {
        return { err, items: null };
      }
    }
    // Memberships: each student sees their own requests; staff see the clubs
    // they manage. Queries merge by id, and one unreadable query never fails
    // the rest.
    if (name === "memberships") {
      const mq: Promise<unknown[]>[] = [];
      if (readScope.uid) {
        mq.push(
          getDocs(query(collection(dbRef, name), where("userId", "==", readScope.uid))).then(mapSnap)
        );
      }
      (readScope.clubs ?? []).slice(0, 10).forEach((cid) => {
        mq.push(
          getDocs(query(collection(dbRef, name), where("clubId", "==", cid))).then(mapSnap)
        );
      });
      const parts = await Promise.all(mq.map((p) => p.catch(() => [] as unknown[])));
      const byId = new Map<string, unknown>();
      parts.forEach((part) => part.forEach((x) => byId.set((x as { id: string }).id, x)));
      return { items: [...byId.values()] };
    }
    const clubs = (readScope.clubs ?? []).slice();
    if (!clubs.length) return { items: null };
    const parts = await Promise.all(
      clubs.map(async (cid) => {
        try {
          const q = query(collection(dbRef, name), where("clubId", "==", cid));
          return mapSnap(await getDocs(q));
        } catch {
          return [];
        }
      })
    );
    return { items: parts.flat() };
  }
  try {
    return { items: mapSnap(await getDocs(collection(dbRef, name))) };
  } catch (err) {
    return { err, items: null };
  }
}

async function hydrateFromCloud(): Promise<boolean> {
  const dbRef = cloudDb();
  if (!dbRef || !db) return false;
  const oldBaseline = lastSynced;
  let changed = false;
  let pending = false;
  const skipped = new Set<string>();

  const results = await Promise.all(
    CLOUD_COLLECTIONS.map(async (name) => ({ name, ...(await fetchCollection(dbRef, name)) }))
  );

  for (const { name, items, err } of results) {
    if (err || items == null) continue;
    if (items.length && !collectionDirty(name)) {
      (db[name as keyof Database] as unknown[]) = items;
      changed = true;
    } else if (items.length) {
      skipped.add(name);
    }
  }
  if (changed) db = { ...db };

  try {
    const cfg = await getDoc(doc(dbRef, "config", "site"));
    if (cfg.exists()) {
      db.config = { ...db.config, ...(cfg.data() as Database["config"]) };
      changed = true;
    }
  } catch {
    /* offline / no perms — keep local config */
  }

  hydrated = true;
  const newBase: Record<string, unknown[]> = {};
  CLOUD_COLLECTIONS.forEach((name) => {
    if (skipped.has(name)) {
      newBase[name] = oldBaseline ? cloneList(oldBaseline[name]) : [];
    } else {
      newBase[name] = cloneList((db?.[name as keyof Database] as unknown[]) ?? []);
    }
  });
  lastSynced = newBase;
  if (changed) persist(db, true);
  if (skipped.size) pending = true;
  notify();
  return changed || pending;
}

/* ---------------- realtime cloud subscriptions ---------------- */

/**
 * Merge a fresh cloud snapshot into the local store. Empty collections keep
 * the local cache (so a brand-new project still shows the demo seed), and a
 * collection holding un-pushed local edits is left alone until the diff-push
 * converges — a server update can never erase a just-saved change.
 */
function applyCloudCollection(name: string, items: unknown[]) {
  if (!db) return;
  if (!items.length) return;
  if (collectionDirty(name)) return;
  (db[name as keyof Database] as unknown[]) = items;
  if (!lastSynced) lastSynced = {};
  lastSynced[name] = cloneList(items);
  db = { ...db };
  persist(db, true);
  notify();
}

function restrictedQuery(dbRef: Firestore, name: string): ReturnType<typeof query> | null {
  if (!readScope || readScope.role === "member") return null;
  if (readScope.role === "admin") return query(collection(dbRef, name));
  // IT staff see only the IT helpdesk complaints.
  if (name === "complaints" && readScope.role === "it-staff") {
    return query(collection(dbRef, name), where("clubId", "==", "it"));
  }
  const clubs = (readScope.clubs ?? []).slice();
  if (!clubs.length) return null;
  // Executives query only the clubs they manage — matching the security rules.
  return query(collection(dbRef, name), where("clubId", "in", clubs.slice(0, 10)));
}

function subscribeCloud() {
  const dbRef = cloudDb();
  if (!dbRef || cloudSubscribed) return;
  cloudSubscribed = true;

  // Config doc.
  cloudUnsubs.push(
    onSnapshot(
      doc(dbRef, "config", "site"),
      (docSnap) => {
        if (docSnap.exists() && db) {
          db.config = { ...db.config, ...(docSnap.data() as Database["config"]) };
          db = { ...db };
          notify();
        }
      },
      () => {
        /* no read permission — keep local config */
      }
    )
  );

  // Public collections.
  for (const name of CLOUD_COLLECTIONS) {
    if (RESTRICTED_COLLECTIONS.has(name)) continue;
    cloudUnsubs.push(
      onSnapshot(
        collection(dbRef, name),
        (snap) => applyCloudCollection(name, mapSnap(snap)),
        () => {
          /* no read permission — keep local data */
        }
      )
    );
  }

  refreshRestrictedSubscriptions();
}

/** (Re)attach restricted-collection listeners for the current read scope. */
function refreshRestrictedSubscriptions() {
  const dbRef = cloudDb();
  if (!dbRef) return;
  for (const unsub of restrictedUnsubs) unsub();
  restrictedUnsubs = [];
  for (const name of RESTRICTED_COLLECTIONS) {
    // Memberships need per-user + per-club listeners merged (a single "in"
    // query can't span two different fields without a compound index).
    if (name === "memberships" && readScope && readScope.role !== "admin") {
      const attach = (q: ReturnType<typeof query> | null) => {
        if (!q) return;
        restrictedUnsubs.push(
          onSnapshot(
            q,
            (snap) => applyCloudCollection(name, mapSnap(snap)),
            () => {
              /* no read permission for this scope */
            }
          )
        );
      };
      if (readScope.role === "member" && readScope.uid) {
        attach(query(collection(dbRef, name), where("userId", "==", readScope.uid)));
      } else {
        (readScope.clubs ?? []).slice(0, 10).forEach((cid) => {
          attach(query(collection(dbRef, name), where("clubId", "==", cid)));
        });
      }
      continue;
    }
    const q = restrictedQuery(dbRef, name);
    if (!q) continue;
    const unsub = onSnapshot(
      q,
      (snap) => applyCloudCollection(name, mapSnap(snap)),
      () => {
        /* no read permission for this scope */
      }
    );
    restrictedUnsubs.push(unsub);
  }
}

/** Push local changes (adds / edits / removals) to Firestore. */
async function diffPush() {
  const dbRef = cloudDb();
  if (!dbRef || !db || !hydrated) return;
  const cur = snapshotOf(db);
  const prev =
    lastSynced ??
    { clubs: [], notices: [], forms: [], submissions: [], complaints: [], memberships: [], events: [], ads: [], students: [] };
  const next: Record<string, unknown[]> = {};
  CLOUD_COLLECTIONS.forEach((name) => (next[name] = []));

  const jobs: Promise<void>[] = [];
  const carry = (name: string, item: unknown): void => {
    next[name].push(item);
  };

  CLOUD_COLLECTIONS.forEach((name) => {
    const curById = new Map(cur[name].map((x) => [(x as { id: string }).id, x]));
    const prevById = new Map(prev[name].map((x) => [(x as { id: string }).id, x]));

    cur[name].forEach((x) => {
      const p = prevById.get((x as { id: string }).id);
      if (p && JSON.stringify(p) === JSON.stringify(x)) {
        carry(name, x);
        return;
      }
      jobs.push(
        setDoc(doc(dbRef, name, (x as { id: string }).id), toDoc(x as Record<string, unknown>))
          .then(() => carry(name, x))
          .catch((err) => {
            if (!syncWarned) {
              syncWarned = true;
              console.warn("Cloud write blocked — check Firestore rules:", err?.message);
            }
          })
      );
    });

    prev[name].forEach((x) => {
      if (curById.has((x as { id: string }).id)) return;
      jobs.push(deleteDoc(doc(dbRef, name, (x as { id: string }).id)).catch(() => {}));
    });
  });

  await Promise.all(jobs);
  lastSynced = next;
}

function schedulePush() {
  const dbRef = cloudDb();
  if (!dbRef || !hydrated) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    void diffPush();
  }, 800);
}

/* ---------------- live clock tick (hero clock / countdowns) ---------------- */
const tickListeners = new Set<() => void>();
let nowCache = new Date();

export function subscribeTick(cb: () => void): () => void {
  tickListeners.add(cb);
  return () => {
    tickListeners.delete(cb);
  };
}

function tick() {
  nowCache = new Date();
  tickListeners.forEach((fn) => fn());
}

/** Subscribe to a 1s clock tick — returns a stable cached Date instance. */
export function useNow(): Date {
  return useSyncExternalStore(
    (cb) => {
      ensureInit();
      subscribeTick(cb);
      return () => tickListeners.delete(cb);
    },
    () => nowCache,
    () => nowCache
  );
}

/** Push the built-in demo data to the cloud (missing docs only). */
export async function pushSampleToCloud(): Promise<{ ok: boolean; err?: unknown }> {
  const dbRef = cloudDb();
  if (!dbRef) return { ok: false, err: new Error("Cloud disabled") };
  const base = normalizeDb(createSeed());
  try {
    await Promise.all(
      CLOUD_COLLECTIONS.map(async (name) => {
        const snap = await getDocs(collection(dbRef, name));
        const have = new Set(snap.docs.map((d) => d.id));
        await Promise.all(
          ((base[name as keyof Database] as unknown[]) ?? [])
            .filter((x) => !have.has((x as { id: string }).id))
            .map((x) =>
              setDoc(doc(dbRef, name, (x as { id: string }).id), toDoc(x as Record<string, unknown>))
            )
        );
      })
    );
    await setDoc(doc(dbRef, "config", "site"), toDoc(base.config as unknown as Record<string, unknown>), {
      merge: true,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, err };
  }
}
