"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useDb } from "@/lib/store";
import { ALL_BADGES, allProfiles, profileFor, XP } from "@/lib/gamification";
import { relativeAgo } from "@/lib/utils";
import { useIdentity } from "@/components/identity";
import { PageHero, SectionHead, Skeleton } from "@/components/ui";

const RANK_TONES = ["bg-gold text-navy", "bg-surface-2 text-ink", "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200"];

export default function LeaderboardView() {
  const db = useDb();
  const { person } = useIdentity();
  const [period, setPeriod] = useState<"all" | "month">("all");

  const rows = useMemo(() => (db ? allProfiles(db, period) : []), [db, period]);
  const me = useMemo(
    () => (db && person ? profileFor(db, { email: person.email, userId: person.userId }, period) : null),
    [db, person, period]
  );

  if (!db) return <LbSkeleton />;

  return (
    <>
      <PageHero
        eyebrow="Community"
        title="🏆 Contribution leaderboard"
        sub="XP is earned by real activity — RSVPs, attendance, applications, memberships and organizing. No points for show, everything comes from the audit trail."
      >
        <div className="mt-5 flex flex-wrap gap-2">
          {(["all", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md border px-4 py-1.5 text-[13px] font-bold transition ${
                period === p
                  ? "border-gold bg-gold text-navy"
                  : "border-white/30 bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {p === "all" ? "All-time" : "This month"}
            </button>
          ))}
        </div>
      </PageHero>

      <div className="container-x py-10">
        {me && me.xp > 0 && (
          <div className="card mb-6 flex flex-wrap items-center gap-4 border-2 border-gold/40 p-5">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-gold text-[22px] font-extrabold text-navy">
              {me.key === (person?.email || "").toLowerCase() ? "⭐" : "#"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="m-0 text-[12px] font-bold uppercase tracking-[1.2px] text-muted">Your rank</p>
              <p className="m-0 text-[17px] font-bold text-ink">
                #{rows.findIndex((r) => r.key === me.key) + 1 || "—"} of {rows.length} contributors · {me.xp} XP
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {me.badges.map((b) => (
                  <BadgeChip key={b.id} emoji={b.emoji} name={b.name} />
                ))}
                {me.badges.length === 0 && <span className="text-[12.5px] text-muted">No badges yet — RSVP to an event to start!</span>}
              </div>
            </div>
            <Link href="/events" className="btn btn-outline btn-sm no-underline">
              Earn more XP →
            </Link>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div>
            {rows.length === 0 ? (
              <div className="panel p-10 text-center">
                <div className="text-5xl">📭</div>
                <p className="mt-3 text-[14px] text-muted">
                  No activity {period === "month" ? "this month" : "yet"} — be the first contributor!
                </p>
                <Link href="/events" className="btn btn-primary mt-4 no-underline">
                  Explore events
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {rows.map((p, i) => {
                  const rank = i + 1;
                  const isMe = me && p.key === me.key;
                  return (
                    <div
                      key={p.key}
                      className={`card flex items-center gap-4 p-4 ${isMe ? "border-2 border-gold/50" : ""}`}
                    >
                      <span
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-[14px] font-extrabold ${
                          i < 3 ? RANK_TONES[i] : "bg-surface-2 text-muted"
                        }`}
                      >
                        {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="m-0 truncate text-[15px] font-bold text-ink">
                          {p.name}
                          {isMe && <span className="ml-1.5 rounded-full bg-gold/20 px-2 py-0.5 text-[10.5px] font-bold text-navy">YOU</span>}
                        </p>
                        <p className="m-0 text-[12px] text-muted">
                          {p.studentId ? (
                            <span className="font-mono">{maskId(p.studentId)}</span>
                          ) : (
                            <span className="font-mono">{maskEmail(p.email)}</span>
                          )}{" "}
                          · last active {p.lastActive ? relativeAgo(p.lastActive) : "never"}
                        </p>
                      </div>
                      <div className="hidden flex-wrap justify-end gap-1.5 sm:flex">
                        {p.badges.slice(0, 4).map((b) => (
                          <BadgeChip key={b.id} emoji={b.emoji} name={b.name} />
                        ))}
                        {p.badges.length > 4 && (
                          <span className="rounded-full bg-surface-2 px-2 py-1 text-[11px] font-bold text-muted">
                            +{p.badges.length - 4}
                          </span>
                        )}
                      </div>
                      <div className="w-24 shrink-0 text-right">
                        <div className="text-[18px] font-extrabold text-navy dark:text-gold">{p.xp}</div>
                        <div className="text-[10.5px] font-bold uppercase tracking-[1px] text-muted">XP</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="space-y-5">
            <div className="card p-5">
              <h3 className="m-0 text-[15px] font-bold text-ink">🧮 How XP works</h3>
              <ul className="m-0 mt-3 grid list-none gap-2 p-0 text-[13px] text-ink/90">
                <XpRow pts={XP.checkIn} label="Check in to an event (attendance)" />
                <XpRow pts={XP.eventCreated} label="Organize / create an event" />
                <XpRow pts={XP.membership} label="Get accepted into a club" />
                <XpRow pts={XP.submission} label="Submit an application form" />
                <XpRow pts={XP.rsvp} label="RSVP to an event" />
                <XpRow pts={XP.earlyRsvpBonus} label="Bonus: RSVP a week early" />
                <XpRow pts={XP.certificate} label="Earn a certificate" />
                <XpRow pts={XP.answerUpvote} label="Upvote received on your Q&amp;A answer" />
                <XpRow pts={XP.answerAccepted} label="Q&amp;A answer accepted as best" />
              </ul>
              <p className="m-0 mt-3 text-[11.5px] leading-relaxed text-muted">
                Q&amp;A points are capped (first 5 upvotes per answer, 150 XP per month) and self-upvotes are
                blocked — helpfulness is measured by other students, not by you.
              </p>
            </div>

            <div className="card p-5">
              <h3 className="m-0 text-[15px] font-bold text-ink">🎖 Badges</h3>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {ALL_BADGES.map((b) => (
                  <div key={b.id} className="rounded-lg border border-line bg-surface-2/40 p-2.5" title={b.desc}>
                    <span className="text-[18px]" aria-hidden="true">
                      {b.emoji}
                    </span>
                    <p className="m-0 text-[11.5px] font-bold leading-tight text-ink">{b.name}</p>
                    <p className="m-0 text-[10.5px] leading-tight text-muted">{b.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="m-0 text-[12px] leading-relaxed text-muted">
              💡 Leaderboards are rebuilt live from the same activity records used for certificates and the
              audit log — so every point is traceable to a real action.
            </p>
          </aside>
        </div>

        <div className="mt-14">
          <SectionHead title="Top contributors, all time" sub="The community's most active members." />
          <div className="panel mt-3 flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="m-0 text-[13.5px] text-muted">
              The <b className="text-ink">Top Contributor</b> badge 👑 goes to the five members with the most
              all-time XP. Monthly leaderboards reset every month to keep newcomers in the race.
            </p>
            <Link href="/events" className="btn btn-outline btn-sm no-underline">
              Start contributing →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function BadgeChip({ emoji, name }: { emoji: string; name: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-hairline bg-surface-2 px-2 py-0.5 text-[11px] font-bold text-ink" title={name}>
      <span aria-hidden="true">{emoji}</span> {name}
    </span>
  );
}

function XpRow({ pts, label }: { pts: number; label: string }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11.5px] font-extrabold text-navy dark:text-gold">
        +{pts}
      </span>
    </li>
  );
}

function maskId(id: string): string {
  if (id.length <= 6) return id;
  return id.slice(0, 3) + "•".repeat(id.length - 6) + id.slice(-3);
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  return user.slice(0, 2) + "•••@" + domain;
}

function LbSkeleton() {
  return (
    <div className="container-x py-14">
      <Skeleton className="h-10 w-80" />
      <div className="mt-8 space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  );
}
