"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, writeBatch } from "firebase/firestore";
import type { PortalUser, Session } from "./types";
import { getCloudAuth, getCloudDb } from "./firebase";
import { getDb, linkSubmissionsToUser, setReadScope } from "./store";

export const DEMO_CODE = "niter2025";
const SESSION_KEY = "niter-portal-session";

export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/email-already-in-use":
      return "That email is already registered — try signing in instead.";
    case "auth/user-not-found":
      return "No account found with that email.";
    case "auth/wrong-password":
      return "Incorrect password.";
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
      return "Incorrect email or password — check both, or switch to \"Create account\" if you haven't signed up yet.";
    case "auth/too-many-requests":
      return "Too many sign-in attempts — wait a minute and try again.";
    case "auth/invalid-email":
      return "That email address is not valid.";
    case "auth/weak-password":
      return "Password too weak — use at least 6 characters.";
    case "auth/operation-not-allowed":
      return "Email/password sign-in is not enabled — turn it on in Firebase → Authentication → Sign-in method.";
    case "auth/network-request-failed":
      return "Network error — check your connection.";
    default:
      return (err as Error)?.message || "Something went wrong.";
  }
}

function readSavedSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Session;
      if (parsed && parsed.clubId) return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function persistSession(session: Session | null) {
  try {
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

interface AuthState {
  user: PortalUser | null;
  session: Session | null;
  /** True until the initial Firebase auth state is resolved. */
  loading: boolean;
  /** True when Firebase is configured (cloud mode). */
  cloud: boolean;
  setClubSession: (clubId: string) => void;
  loginWithCode: (clubId: string, code: string) => Promise<string | null>;
  loginEmail: (
    email: string,
    pass: string,
    mode: "signin" | "signup",
    name?: string
  ) => Promise<string | null>;
  loginWithGoogle: () => Promise<string | null>;
  signOut: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

/** Load (or create) the Firestore profile for a signed-in user.
 *
 * Only create the doc when it does not already exist. The security rules let
 * a member update only their name field (admins may update anything), so
 * re-writing the whole profile here on every sign-in is treated as an update
 * of role/clubs/status and gets denied — which surfaces as "Could not load
 * your profile: Missing or insufficient permissions" for returning members.
 */
async function bootstrapUser(
  user: { uid: string; email: string | null; displayName?: string | null },
  name: string
): Promise<PortalUser> {
  const db = getCloudDb();
  const uid = user.uid;
  const email = (user.email ?? "").toLowerCase();
  if (!db) throw new Error("Cloud disabled");

  const existing = await getDoc(doc(db, "users", uid));
  if (existing.exists()) {
    const d = existing.data() as Partial<PortalUser>;
    return {
      uid,
      email: d.email || email,
      name: d.name || name || user.displayName || "",
      role: d.role || "member",
      clubs: d.clubs || [],
      studentId: d.studentId || "",
    };
  }

  // Brand-new profile — create it. The first account ever becomes admin.
  try {
    const snap = await getDoc(doc(db, "meta", "bootstrap"));
    const first = !snap.exists();
    const batch = writeBatch(db);
    let clubs: string[] = [];
    const role = first ? "admin" : "member";
    if (first) {
      clubs = (getDb()?.clubs ?? []).map((c) => c.id);
      batch.set(doc(db, "meta", "bootstrap"), { uid, at: new Date().toISOString() });
    }
    batch.set(doc(db, "users", uid), {
      uid,
      email,
      name: name || user.displayName || "",
      role,
      clubs,
      status: "active",
      createdAt: new Date().toISOString(),
    });
    await batch.commit();
    return { uid, email, name: name || user.displayName || "", role, clubs };
  } catch (err) {
    // Concurrent bootstrap race (another account became admin first, or the
    // meta/bootstrap marker was created mid-flight) — retry as a plain member
    // profile so the account is never left unusable.
    console.warn("Bootstrap race, falling back to member profile:", (err as Error)?.message);
    await setDoc(doc(db, "users", uid), {
      uid,
      email,
      name: name || user.displayName || "",
      role: "member",
      clubs: [],
      status: "active",
      createdAt: new Date().toISOString(),
    });
    return { uid, email, name: name || user.displayName || "", role: "member", clubs: [] };
  }
}

async function loadProfile(user: {
  uid: string;
  email: string | null;
  displayName?: string | null;
}): Promise<PortalUser> {
  const db = getCloudDb();
  if (!db) throw new Error("Cloud disabled");
  const snap = await getDoc(doc(db, "users", user.uid));    if (snap.exists()) {
    const d = snap.data() as Partial<PortalUser>;
    return {
      uid: user.uid,
      email: d.email || user.email || "",
      name: d.name || user.displayName || "",
      role: d.role || "member",
      clubs: d.clubs || [],
      studentId: d.studentId || "",
    };
  }
  return bootstrapUser(user, user.displayName || "");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const cloud = !!getCloudAuth();
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    // Restore the classic demo session (offline + cloud modes both respect it).
    const saved = readSavedSession();
    if (saved) setSession(saved);
    if (!cloud) {
      setLoading(false);
      return;
    }
    const auth = getCloudAuth()!;
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          const profile = await loadProfile(fbUser);
          setUser(profile);
          setReadScope({ role: profile.role, clubs: profile.clubs, uid: profile.uid, email: profile.email });
          const savedClub = readSavedSession()?.clubId;
          const canUseSaved = profile.role === "admin" || (profile.clubs || []).includes(savedClub || "");
          if (savedClub && canUseSaved) {
            setSession({ clubId: savedClub });
          } else {
            setSession(null);
            persistSession(null);
          }
        } else {
          setUser(null);
          setReadScope(null);
        }
      } catch (err) {
        console.warn("Profile load failed:", err);
        setUser(null);
        setReadScope(null);
      } finally {
        if (!bootstrappedRef.current) {
          bootstrappedRef.current = true;
          setLoading(false);
        }
      }
    });
    return unsub;
  }, [cloud]);

  const setClubSession = useCallback((clubId: string) => {
    const s: Session = { clubId };
    setSession(s);
    persistSession(s);
  }, []);

  const loginWithCode = useCallback(
    async (clubId: string, code: string): Promise<string | null> => {
      if (code.trim() !== DEMO_CODE) return "Incorrect member code.";
      setClubSession(clubId);
      return null;
    },
    [setClubSession]
  );

  const loginEmail = useCallback(
    async (email: string, pass: string, mode: "signin" | "signup", name?: string): Promise<string | null> => {
      const auth = getCloudAuth();
      if (!auth) return "Cloud sign-in is not available in demo mode.";
      email = email.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) return "Enter a valid email address.";
      if (pass.length < 6) return "Password must be at least 6 characters.";
      try {
        const req =
          mode === "signup"
            ? await createUserWithEmailAndPassword(auth, email, pass)
            : await signInWithEmailAndPassword(auth, email, pass);
        const profile = await bootstrapUser(req.user, name || "");
        setUser(profile);
        setReadScope({ role: profile.role, clubs: profile.clubs, uid: profile.uid, email: profile.email });
        setSession(null);
        persistSession(null);
        // Claim any submissions made with this email as a visitor.
        linkSubmissionsToUser({ uid: profile.uid, email: profile.email, name: profile.name, studentId: profile.studentId });
        return null;
      } catch (err) {
        return authErrorMessage(err);
      }
    },
    []
  );

  const loginWithGoogle = useCallback(async (): Promise<string | null> => {
    const auth = getCloudAuth();
    if (!auth) return "Google sign-in is not available in demo mode.";
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const profile = await bootstrapUser(res.user, res.user.displayName || "");
      setUser(profile);
      setReadScope({ role: profile.role, clubs: profile.clubs, uid: profile.uid, email: profile.email });
      setSession(null);
      persistSession(null);
      // Claim any submissions made with this email as a visitor.
      linkSubmissionsToUser({ uid: profile.uid, email: profile.email, name: profile.name, studentId: profile.studentId });
      return null;
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return null;
      return authErrorMessage(err);
    }
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    setUser(null);
    persistSession(null);
    setReadScope(null);
    if (cloud) fbSignOut(getCloudAuth()!).catch(() => undefined);
  }, [cloud]);

  const value = useMemo<AuthState>(
    () => ({ user, session, loading, cloud, setClubSession, loginWithCode, loginEmail, loginWithGoogle, signOut }),
    [user, session, loading, cloud, setClubSession, loginWithCode, loginEmail, loginWithGoogle, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
