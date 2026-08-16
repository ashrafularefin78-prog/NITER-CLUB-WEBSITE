"use client";

import { useMemo, useState } from "react";
import { useDb } from "@/lib/store";
import { sortNotices } from "@/lib/utils";
import { NoticeCard } from "@/components/cards";
import { EmptyState, PageHero, Skeleton } from "@/components/ui";

export default function NoticesView() {
  const db = useDb();
  const [query, setQuery] = useState("");
  const [clubId, setClubId] = useState("");

  const filtered = useMemo(() => {
    if (!db) return [];
    const q = query.trim().toLowerCase();
    return sortNotices(db.notices).filter((n) => {
      if (clubId && n.clubId !== clubId) return false;
      if (!q) return true;
      return (
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        (db.clubs.find((c) => c.id === n.clubId)?.name.toLowerCase() ?? "").includes(q)
      );
    });
  }, [db, query, clubId]);

  if (!db)
    return (
      <div className="container-x py-10">
        <Skeleton className="h-8 w-48" />
        <div className="mt-6 space-y-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      </div>
    );

  return (
    <>
      <PageHero
        eyebrow="Announcements"
        title="Notices"
        sub="Everything happening across NITER campus — pinned first, newest on top."
      />
      <div className="container-x py-10">

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍  Search notices… (e.g. contest, blood, workshop)"
          className="input grow"
          aria-label="Search notices"
        />
        <select
          value={clubId}
          onChange={(e) => setClubId(e.target.value)}
          className="select sm:max-w-[280px]"
          aria-label="Filter by club"
        >
          <option value="">All clubs</option>
          {db.clubs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 space-y-4">
        {filtered.length ? (
          filtered.map((n) => <NoticeCard key={n.id} notice={n} showClub />)
        ) : (
          <EmptyState icon="🔎">No notices match your search. Try a different keyword or club.</EmptyState>
        )}
      </div>
      </div>
    </>
  );
}
