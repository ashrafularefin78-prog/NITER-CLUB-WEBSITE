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
import type { PortalUser, Session, ModeratorRequest } from "./types";
import { getCloudAuth, getCloudDb } from "./firebase";
import { getDb, linkSubmissionsToUser, setReadScope } from "./store";
import { logAudit } from "./audit";

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
    name?: string,
    role?: string,
    selectedClubId?: string,
    studentId?: string,
    phone?: string,
    classId?: string
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
  name: string,
  requestedRole?: string,
  selectedClubId?: string,
  studentId?: string,
  phone?: string,
  classId?: string
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
      phone: d.phone || "",
      classId: d.classId || "",
    };
  }

  // Brand-new profile — create it. The first account ever becomes admin.
  try {
    const snap = await getDoc(doc(db, "meta", "bootstrap"));
    const first = !snap.exists();
    const batch = writeBatch(db);
    let clubs: string[] = [];
    let role: string = first ? "admin" : (requestedRole || "member");
    let pendingModeratorClubId: string | undefined;
    let pendingModeratorRequestedAt: string | undefined;
    if (first) {
      // First account gets admin of ALL clubs
      clubs = (getDb()?.clubs ?? []).map((c) => c.id);
      batch.set(doc(db, "meta", "bootstrap"), { uid, at: new Date().toISOString() });
    } else if (role === "admin" && selectedClubId) {
      // Check if this club already has an admin
      const { collection, getDocs, query, where } = await import("firebase/firestore");
      const adminsQuery = query(
        collection(db, "users"),
        where("role", "==", "admin"),
        where("clubs", "array-contains", selectedClubId)
      );
      const existingAdmins = await getDocs(adminsQuery);
      if (!existingAdmins.empty) {
        // Club already has an admin — throw error to prevent creation
        const allClubs = getDb()?.clubs ?? [];
        const clubName = allClubs.find((c) => c.id === selectedClubId)?.name || selectedClubId;
        throw new Error(`This club already has an admin. Each club can only have one admin. Please contact the existing admin of ${clubName} to manage the club.`);
      }
      clubs = [selectedClubId];
    } else if (role === "moderator" && selectedClubId) {
      // Moderator account: stays as member until admin approves
      role = "member";
      pendingModeratorClubId = selectedClubId;
      pendingModeratorRequestedAt = new Date().toISOString();
      // Create a moderator request for admin approval
      const requestId = "mr-" + uid + "-" + selectedClubId;
      const modRequest: ModeratorRequest = {
        id: requestId,
        userId: uid,
        clubId: selectedClubId,
        status: "pending",
        requestedAt: pendingModeratorRequestedAt,
        userName: name || user.displayName || "",
        userEmail: email,
        studentId: studentId || "",
      };
      batch.set(doc(db, "moderatorRequests", requestId), modRequest);
    }
    batch.set(doc(db, "users", uid), {
      uid,
      email,
      name: name || user.displayName || "",
      role,
      clubs,
      status: "active",
      createdAt: new Date().toISOString(),
      studentId: studentId || "",
      phone: phone || "",
      classId: classId || "",
      ...(pendingModeratorClubId ? { pendingModeratorClubId, pendingModeratorRequestedAt } : {}),
    });
    await batch.commit();

    // Send notification to club admin about the moderator request
    if (role === "member" && pendingModeratorClubId) {
      void notifyClubAdmin(selectedClubId!, name || user.displayName || "", email, studentId || "");
    }

    return {
      uid,
      email,
      name: name || user.displayName || "",
      role: role as PortalUser["role"],
      clubs,
      studentId: studentId || "",
      phone: phone || "",
      classId: classId || "",
      ...(pendingModeratorClubId ? { pendingModeratorClubId, pendingModeratorRequestedAt } : {}),
    };
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

/**
 * Notify the club admin when a student requests to become a moderator.
 * Best-effort — failures are silently ignored since the request is already stored.
 */
async function notifyClubAdmin(
  clubId: string,
  requesterName: string,
  requesterEmail: string,
  studentId: string
): Promise<void> {
  try {
    const db = getCloudDb();
    if (!db) return;

    // Find the club admin(s) for this club
    const { collection, getDocs, query, where } = await import("firebase/firestore");
    const usersSnap = await getDocs(collection(db, "users"));
    const admins: { email: string; name?: string }[] = [];
    usersSnap.forEach((ds) => {
      const u = ds.data() as PortalUser;
      if (u.role === "admin" && (u.clubs || []).includes(clubId) && u.email) {
        admins.push({ email: u.email, name: u.name || u.email });
      }
    });

    // Get club name
    const clubs = getDb()?.clubs ?? [];
    const club = clubs.find((c) => c.id === clubId);
    const clubName = club?.name || clubId;

    if (!admins.length) return;

    // Send email notification via the API
    await fetch("/api/moderator-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clubId,
        clubName,
        requesterName,
        requesterEmail,
        studentId,
        adminEmails: admins,
        url: typeof window !== "undefined" ? `${window.location.origin}/portal` : "",
      }),
    });
  } catch {
    // Best-effort notification — don't fail the signup
  }
}

async function loadProfile(user: {
  uid: string;
  email: string | null;
  displayName?: string | null;
}): Promise<PortalUser> {
  const db = getCloudDb();
  if (!db) throw new Error("Cloud disabled");
  const snap = await getDoc(doc(db, "users", user.uid));
  if (snap.exists()) {
    const d = snap.data() as Partial<PortalUser>;
    return {
      uid: user.uid,
      email: d.email || user.email || "",
      name: d.name || user.displayName || "",
      role: d.role || "member",
      clubs: d.clubs || [],
      studentId: d.studentId || "",
      phone: d.phone || "",
      classId: d.classId || "",
      pendingModeratorClubId: d.pendingModeratorClubId || undefined,
      pendingModeratorRequestedAt: d.pendingModeratorRequestedAt || undefined,
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
      if (code.trim() !== DEMO_CODE) {
        logAudit("login_fail", "Wrong member code", "warn", clubId, "");
        return "Incorrect member code.";
      }
      setClubSession(clubId);
      logAudit("login_ok", "Signed in with member code", "info", clubId, "");
      return null;
    },
    [setClubSession]
  );

  const loginEmail = useCallback(
    async (
      email: string,
      pass: string,
      mode: "signin" | "signup",
      name?: string,
      role?: string,
      selectedClubId?: string,
      studentId?: string,
      phone?: string,
      classId?: string
    ): Promise<string | null> => {
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
        const profile = await bootstrapUser(req.user, name || "", role, selectedClubId, studentId, phone, classId);
        setUser(profile);
        setReadScope({ role: profile.role, clubs: profile.clubs, uid: profile.uid, email: profile.email });
        setSession(null);
        persistSession(null);
        // Claim any submissions made with this email as a visitor.
        linkSubmissionsToUser({ uid: profile.uid, email: profile.email, name: profile.name, studentId: profile.studentId });
        logAudit("login_ok", mode === "signup" ? "Account created & signed in" : "Signed in", "info", email, email);
        return null;
      } catch (err) {
        // Handle custom errors from bootstrapUser (e.g., duplicate admin)
        const msg = err instanceof Error ? err.message : "";
        if (msg && !msg.includes("auth/")) {
          // This is a custom error, not a Firebase auth error
          logAudit("login_fail", msg, "warn", msg, email);
          return msg;
        }
        logAudit("login_fail", "Failed sign-in attempt", "warn", authErrorMessage(err), email);
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
      logAudit("login_ok", "Signed in with Google", "info", profile.email, profile.email);
      return null;
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return null;
      logAudit("login_fail", "Failed Google sign-in", "warn", authErrorMessage(err), "");
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
