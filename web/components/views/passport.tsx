"use client";

import Link from "next/link";
import { useState } from "react";
import { useDb } from "@/lib/store";
import { fmtDate } from "@/lib/utils";
import { hopperProgress, passportFor } from "@/lib/passport";
import { IdentityPrompt, useIdentity } from "@/components/identity";
import { PageHero, Skeleton } from "@/components/ui";

export default function PassportView() {
  const db = useDb();
  const { person, setPerson } = useIdentity();
  const [askIdentity, setAskIdentity] = useState(false);

  if (!db) return <PassportSkeleton />;

  const pass = person ? passportFor(db, person) : null;
  const hopper = pass ? hopperProgress(pass) : null;

  return (
    <>
      <PageHero
        eyebrow="Achievements"
        title="🛂 Club Passport"
        sub="Every event you check in to stamps your passport with that club's mark. Collect stamps across clubs — 3+ unlocks the Club Hopper badge on the leaderboard."
      />

      <div className="container-x py-10">
        <div className="mx-auto max-w-4xl">
          {!person ? (
            <div className="card p-8 text-center">
              <div className="text-5xl" aria-hidden="true">
                🛂
              </div>
              <h2 className="mt-3 text-[19px] font-bold text-ink">Your passport, one quick step away</h2>
              <p className="mx-auto mt-1 max-w-md text-[13.5px] text-muted">
                Tell us who you are (no account needed) and we&apos;ll pull every check-in you&apos;ve made — each one
                becomes a stamp.
              </p>
              <div className="mt-5 flex justify-center">
                <button className="btn btn-primary" onClick={() => setAskIdentity(true)}>
                  Unlock my passport
                </button>
              </div>
              {askIdentity && (
                <div className="mx-auto mt-4 max-w-sm">
                  <IdentityPrompt
                    onIdentity={(p) => {
                      setPerson(p);
                      setAskIdentity(false);
                    }}
                    onCancel={() => setAskIdentity(false)}
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              {/* stats */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Stat value={pass!.totalEvents} label="events attended" />
                <Stat value={pass!.clubsVisited} label="club stamps" />
                <Stat value={pass!.firstAt ? fmtDate(pass!.firstAt) : "—"} label="first stamp" small />
                <Stat value={pass!.lastAt ? fmtDate(pass!.lastAt) : "—"} label="latest stamp" small />
              </div>

              {/* club hopper progress */}
              <div className="card mt-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="m-0 text-[15px] font-bold text-ink">
                    🌍 Club Hopper badge{" "}
                    <span className="font-medium text-muted">— visit {hopper!.need > 0 ? `${hopper!.need} more club${hopper!.need === 1 ? "" : "s"}` : "every club visited!"}</span>
                  </h2>
                  <span className="text-[12px] font-bold text-muted">{pass!.clubsVisited} / 3 clubs</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={`h-full rounded-full ${hopper!.done ? "bg-emerald-500" : "bg-gold"}`}
                    style={{ width: `${Math.min(100, Math.round((pass!.clubsVisited / 3) * 100))}%` }}
                  />
                </div>
                <p className="m-0 mt-2 text-[12px] text-muted">
                  {hopper!.done
                    ? "✅ Badge unlocked — check your XP card on the dashboard."
                    : "Check in at events from different clubs to fill your passport and earn the badge."}
                </p>
              </div>

              {/* stamps */}
              <h2 className="mb-3 mt-8 text-[17px] font-bold text-ink">
                Passport stamps <span className="text-muted">({pass!.clubsVisited} of {db.clubs.length})</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {db.clubs.map((c) => {
                  const stamp = pass!.stamps.find((s) => s.clubId === c.id);
                  return (
                    <div
                      key={c.id}
                      className={`card p-5 ${stamp ? "" : "opacity-70"}`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-[24px]"
                          style={{ background: stamp ? c.color + "22" : "#eef2f7" }}
                          aria-hidden="true"
                        >
                          {stamp ? c.icon : "🔒"}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-[14.5px] font-bold text-ink">{c.short || c.name}</div>
                          <div className="text-[12px] font-semibold text-muted">
                            {stamp
                              ? `${stamp.events.length} stamp${stamp.events.length === 1 ? "" : "s"}`
                              : "No stamp yet"}
                          </div>
                        </div>
                      </div>
                      {stamp ? (
                        <ul className="m-0 mt-3 space-y-1.5 border-t border-line pt-3 text-[12.5px] text-muted">
                          {stamp.events.slice(0, 3).map((e) => (
                            <li key={e.eventId} className="flex items-start gap-2">
                              <span aria-hidden="true">✓</span>
                              <Link href={`/events/${e.eventId}`} className="no-underline hover:underline">
                                <span className="text-ink/90">{e.title}</span> · {fmtDate(e.at)}
                              </Link>
                            </li>
                          ))}
                          {stamp.events.length > 3 && (
                            <li className="pl-4 text-[11.5px]">+{stamp.events.length - 3} more</li>
                          )}
                        </ul>
                      ) : (
                        <p className="m-0 mt-3 border-t border-line pt-3 text-[12px] text-muted">
                          Check in at their next event to collect the stamp.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="mt-8 text-[12px] leading-relaxed text-muted">
                🛂 Every stamp is backed by a verified check-in and a certificate — this isn&apos;t a points farm,
                it&apos;s a real record of what you attended. Want more stamps?{" "}
                <Link href="/events" className="font-semibold no-underline hover:underline">
                  Browse all events →
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Stat({ value, label, small = false }: { value: number | string; label: string; small?: boolean }) {
  return (
    <div className="card p-4 text-center">
      <div className={`${small ? "text-[15px]" : "text-[26px]"} font-extrabold leading-none text-ink`}>{value}</div>
      <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-[1px] text-muted">{label}</div>
    </div>
  );
}

function PassportSkeleton() {
  return (
    <div className="container-x py-14">
      <Skeleton className="h-10 w-80" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    </div>
  );
}
