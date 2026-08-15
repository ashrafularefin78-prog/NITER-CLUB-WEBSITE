"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { loadGuestIdentity, saveGuestIdentity, type Person } from "@/lib/events";

/**
 * Identity used for RSVPs, check-ins and certificates.
 * Order of preference: signed-in Firebase user → stored guest identity →
 * dashboard demo session (prefill) → null (caller shows an identity prompt).
 * Guest identity lives in localStorage so the offline demo works end to end.
 */
export function useIdentity(): { person: Person | null; setPerson: (p: Person) => void } {
  const auth = useAuth();
  const [guest, setGuest] = useState<Person | null>(() => {
    const g = loadGuestIdentity();
    if (g) return g;
    try {
      const email = localStorage.getItem("niter-student-session") || "";
      if (email) {
        const acc = JSON.parse(localStorage.getItem("niter-student-accounts") || "{}")[email];
        if (acc) return { userId: "local-" + email, name: acc.name, email, studentId: acc.studentId };
      }
    } catch {
      /* ignore */
    }
    return null;
  });

  if (auth.user) {
    return {
      person: {
        userId: auth.user.uid,
        name: auth.user.name || auth.user.email,
        email: auth.user.email,
        studentId: auth.user.studentId,
      },
      setPerson: () => undefined,
    };
  }
  return {
    person: guest,
    setPerson: (p) => {
      saveGuestIdentity(p);
      setGuest(p);
    },
  };
}

/** Small inline form — "who are you?" — used before the first RSVP/check-in. */
export function IdentityPrompt({ onIdentity, onCancel }: { onIdentity: (p: Person) => void; onCancel?: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const nm = name.trim();
    const em = email.trim().toLowerCase();
    if (!nm) return;
    if (!/^\S+@\S+\.\S+$/.test(em)) return;
    onIdentity({ userId: "guest-" + em, name: nm, email: em, studentId: studentId.trim() || undefined });
  };

  return (
    <form className="mt-3 space-y-2.5 rounded-xl border border-line bg-surface-2/50 p-4" onSubmit={submit}>
      <p className="m-0 text-[13px] font-semibold text-ink">👋 Quick sign-in — who are you?</p>
      <input
        className="input"
        placeholder="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="Full name"
      />
      <input
        className="input"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="Email"
      />
      <input
        className="input"
        placeholder="NITER student ID (optional, e.g. CS-2607001)"
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        aria-label="NITER student ID (optional)"
      />
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary btn-sm">
          Continue
        </button>
        {onCancel && (
          <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
