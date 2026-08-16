"use client";

import { useMemo, useState } from "react";
import { useDb } from "@/lib/store";
import { ClubCard } from "@/components/cards";
import { EmptyState, PageHero, Skeleton } from "@/components/ui";

export default function ClubsView() {
  const db = useDb();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!db) return [];
    const q = query.trim().toLowerCase();
    if (!q) return db.clubs;
    return db.clubs.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.tagline.toLowerCase().includes(q) ||
        c.about.toLowerCase().includes(q) ||
        c.short.toLowerCase().includes(q)
    );
  }, [db, query]);

  if (!db)
    return (
      <div className="container-x py-10">
        <Skeleton className="h-8 w-40" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );

  return (
    <>
      <PageHero
        eyebrow="Clubs & societies"
        title="All clubs at NITER"
        sub={`${db.clubs.length} clubs · find your community at NITER. Memberships, events, notices and forms — all in one place.`}
      />
      <div className="container-x py-10">

      <div className="mt-6 max-w-[420px]">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍  Search clubs… (e.g. computer, debate, science)"
          className="input"
          aria-label="Search clubs"
        />
      </div>

      <div className="mt-6">
        {filtered.length ? (
          <div className="club-grid">
            {filtered.map((c) => (
              <ClubCard key={c.id} club={c} />
            ))}
          </div>
        ) : (
          <EmptyState icon="🎓">No clubs match your search.</EmptyState>
        )}
      </div>
      </div>
    </>
  );
}
