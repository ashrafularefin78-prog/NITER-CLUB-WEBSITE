"use client";

import { useEffect, useState } from "react";
import type { Student } from "./types";

interface StudentsApiResponse {
  ok: boolean;
  disabled?: boolean;
  error?: string;
  students?: Student[];
  total?: number;
}

let cachePromise: Promise<StudentsApiResponse> | null = null;
let cacheResult: StudentsApiResponse | null = null;

function fetchRoster(): Promise<StudentsApiResponse> {
  if (cacheResult) return Promise.resolve(cacheResult);
  if (!cachePromise) {
    cachePromise = fetch("/api/students")
      .then((r) => r.json().catch(() => ({ ok: false })))
      .then((data) => {
        cacheResult = data as StudentsApiResponse;
        return cacheResult;
      })
      .catch(() => {
        cacheResult = { ok: false };
        return cacheResult;
      });
  }
  return cachePromise;
}

export type RosterState =
  | { status: "loading" }
  | { status: "live"; students: Student[] }
  | { status: "fallback" };

/**
 * Load the live student roster from the Appwrite backend (via the server
 * route). Falls back to the bundled roster — the caller decides what to show
 * — when Appwrite isn't configured or unreachable. Fetched once per page
 * session; the module-level cache keeps re-renders and re-visits cheap.
 */
export function useAppwriteStudents(): RosterState {
  const [state, setState] = useState<RosterState>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    void fetchRoster().then((res) => {
      if (!alive) return;
      if (res.ok && Array.isArray(res.students) && res.students.length) {
        setState({ status: "live", students: res.students });
      } else {
        setState({ status: "fallback" });
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
