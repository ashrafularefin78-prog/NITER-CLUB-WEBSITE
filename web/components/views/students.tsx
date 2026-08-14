"use client";

import { useMemo, useState } from "react";
import { useDb } from "@/lib/store";
import { PageHero, Skeleton } from "@/components/ui";

export default function StudentsView() {
  const db = useDb();
  const [q, setQ] = useState("");

  const students = useMemo(() => db?.students ?? [], [db]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return students;
    return students.filter(
      (s) => s.id.toLowerCase().includes(query) || s.name.toLowerCase().includes(query)
    );
  }, [students, q]);

  if (!db) return <DirectorySkeleton />;

  const deptOf = (s: { id: string; department?: string }) => {
    const d = (s.department || "").toLowerCase();
    if (d.includes("textile")) return "Textile Engineering (TE)";
    if (d.includes("cse") || d.includes("computer")) return "Computer Science & Engineering (CSE)";
    const m = /^([A-Z]{1,5})/i.exec(s.id || "");
    return m ? m[1].toUpperCase() : "—";
  };

  return (
    <>
      <PageHero eyebrow="NITER · All departments" title="🎓 Student directory" sub={`Find a classmate by name or student ID — ${students.length} students.`} />
      <div className="container-x py-10">
        <p className="m-0 -mt-4 mb-6 text-[12.5px] text-muted">
          Student ID format: <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[12px]">CS-2506001</code> →{" "}
          <b>CS</b> = department (CSE), <b>25</b> = batch year, <b>06</b> = NITER dept code, <b>001</b> = department roll.
        </p>
        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="m-0 text-[18px] font-bold text-ink">Students</h2>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or ID…"
              aria-label="Search students by name or ID"
              className="input w-full max-w-[300px]"
            />
          </div>
          <p className="mb-3 mt-3 text-[13px] text-muted">
            Showing <b>{filtered.length}</b> of {students.length} students
            {q.trim() ? <> matching &ldquo;{q.trim()}&rdquo;</> : ""}.
          </p>
          <div className="overflow-x-auto rounded-lg border border-hairline">
            <table className="w-full border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-hairline bg-canvas text-left text-[11.5px] uppercase tracking-[0.4px] text-muted">
                  <th className="px-4 py-2.5 font-semibold">Sl.</th>
                  <th className="px-4 py-2.5 font-semibold">Merit</th>
                  <th className="px-4 py-2.5 font-semibold">Student ID</th>
                  <th className="px-4 py-2.5 font-semibold">Name</th>
                  <th className="px-4 py-2.5 font-semibold">Department</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-hairline last:border-0 hover:bg-surface-2/60">
                    <td className="px-4 py-2.5 text-muted">{s.sl}</td>
                    <td className="px-4 py-2.5 text-muted">{s.merit || "—"}</td>
                    <td className="px-4 py-2.5">
                      <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[12.5px] text-navy">
                        {s.id}
                      </code>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-ink">{s.name}</td>
                    <td className="px-4 py-2.5 text-muted">{deptOf(s)}</td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-[14px] text-muted">
                      🔍 No students match that search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function DirectorySkeleton() {
  return (
    <div className="container-x py-16">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="mt-6 h-72 w-full" />
    </div>
  );
}
