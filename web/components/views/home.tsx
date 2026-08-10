"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useDb } from "@/lib/store";
import { clubById, formById, isOpen, nextDeadline, sortNotices, statusOf } from "@/lib/utils";
import { ClubGrid, FormGrid, NoticeCard } from "@/components/cards";
import { LiveBadge, SectionHead, Skeleton } from "@/components/ui";
import { Countdown, LiveClock, RelativeTime } from "@/components/countdown";
import { Reveal } from "@/components/reveal";

export default function HomeView() {
  const db = useDb();

  if (!db) return <HomeSkeleton />;

  const latest = sortNotices(db.notices).slice(0, 4);
  const openForms = db.forms.filter(isOpen).slice(0, 6);
  const totalSubs = db.submissions.length;
  const weekAgo = Date.now() - 7 * 86400000;
  const weekNotices = db.notices.filter((n) => new Date(n.createdAt || n.date).getTime() >= weekAgo).length;
  const upcoming = nextDeadline(db.forms);
  const activity = db.submissions
    .slice()
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .slice(0, 6);

  return (
    <>
      {/* ---------------- Hero — NITER campus banner + navy overlay ---------------- */}
      <section className="relative overflow-hidden bg-navy text-white">
        {/* campus photo with the institutional navy overlay (05-DESIGN.md §7: text on photos needs overlay) */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/front-banner.jpg)" }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(100deg, rgba(0,33,71,0.92) 0%, rgba(0,33,71,0.78) 45%, rgba(26,58,92,0.55) 100%)",
          }}
          aria-hidden="true"
        />
        <div className="container-x relative grid gap-12 py-16 md:py-24 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div className="hero-anim">
            <p className="m-0 inline-flex items-center gap-2 rounded-sm border border-gold/50 bg-gold/15 px-3 py-1 text-[12px] font-bold uppercase tracking-[1.6px] text-gold">
              NITER · One portal for every club
            </p>
            <h1 className="display-xl m-0 mt-5 text-white">
              Every club at NITER, <span className="text-gold">one portal</span>.
            </h1>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-white/85">
              Discover notices, register for events, join clubs, and fill forms — all in one place. Club
              executives can post notices and publish membership forms in seconds.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/clubs"
                className="btn no-underline"
                style={{ background: "#FFB606", color: "#002147", borderColor: "#FFB606" }}
              >
                Explore Clubs →
              </Link>
              <Link
                href="/notices"
                className="btn no-underline"
                style={{
                  background: "transparent",
                  color: "#ffffff",
                  borderColor: "rgba(255,255,255,0.6)",
                }}
              >
                Browse Notices
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-2.5">
              <HeroStat icon="🎓" value={db.clubs.length} label="clubs" />
              <HeroStat icon="📝" value={openForms.length} label="forms open now" />
              <HeroStat
                icon="⏳"
                value={db.forms.filter((f) => statusOf(f).key === "soon").length}
                label="forms opening soon"
              />
              <HeroStat icon="📢" value={weekNotices} label="notices this week" />
            </div>
          </div>

          <div className="hero-anim grid gap-4">
            <div className="rounded-lg border border-white/20 bg-white/10 p-6 text-white backdrop-blur-sm">
              <LiveBadge onDark>Live now</LiveBadge>
              <div className="mt-2">
                <LiveClock />
              </div>
              <div className="mt-4 border-t border-white/20 pt-3 text-[14px] text-white/90">
                {upcoming ? (
                  <>
                    <b className="text-gold">
                      {upcoming.key === "soon" ? "🚀 Opens in" : "⏳ Closes in"}: {upcoming.form.title}
                    </b>
                    <div className="mt-1 text-[15px] text-white">
                      <Countdown
                        start={upcoming.key === "soon" ? upcoming.form.openAt : null}
                        end={upcoming.key === "open" ? upcoming.form.deadline : null}
                      />
                    </div>
                  </>
                ) : (
                  <b>No upcoming deadlines</b>
                )}
              </div>
              <div className="mt-4 border-t border-white/20 pt-3">
                <b className="text-gold">📥 Forms filled by students</b>
                <div className="mt-0.5 text-[15px]">
                  <span className="font-bold text-white">{totalSubs}</span>{" "}
                  <span className="text-white/75">
                    submission{totalSubs === 1 ? "" : "s"} across all clubs
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/20 bg-white/10 p-6 text-white backdrop-blur-sm">
              <h3 className="m-0 text-[15px] font-bold text-gold">📢 Latest notices</h3>
              <ul className="mt-3 space-y-3">
                {latest.map((n) => {
                  const club = clubById(db, n.clubId);
                  return (
                    <li key={n.id} className="flex gap-2.5 text-[13.5px] leading-snug">
                      <span aria-hidden="true">{club?.icon ?? "📢"}</span>
                      <span className="text-white/90">
                        <b className="text-white">
                          {n.pinned ? "📌 " : ""}
                          {n.title}
                        </b>
                        <span className="block text-[12px] text-white/70">
                          {club?.name} · <RelativeTime ts={n.createdAt || n.date} />
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- NITER institutional stats band ---------------- */}
      <div className="border-b border-hairline bg-surface-2">
        <div className="container-x">
          <Reveal>
            <div className="grid gap-8 py-12 text-center sm:grid-cols-2 lg:grid-cols-4">
              <NiterFact value="2009" label="Established" />
              <NiterFact value="2000+" label="Students" />
              <NiterFact value="5" label="Departments" />
              <NiterFact value="DU" label="Constituent institute" />
            </div>
          </Reveal>
        </div>
      </div>

      {/* ---------------- Clubs ---------------- */}
      <section className="container-x py-16 md:py-20">
        <Reveal>
          <SectionHead
            title="Our clubs"
            sub="Find your community — every club at NITER in one place."
            action={
              <Link href="/clubs" className="text-sm font-semibold text-crimson no-underline hover:underline">
                View all →
              </Link>
            }
          />
          <ClubGrid clubs={db.clubs} />
        </Reveal>
      </section>

      {/* ---------------- Forms open now ---------------- */}
      <section className="bg-surface-soft">
        <div className="container-x py-16 md:py-20">
          <SectionHead
            title="Forms open now"
            sub="Memberships, events and registrations — with live countdowns."
            action={
              <Link href="/clubs" className="text-sm font-semibold text-crimson no-underline hover:underline">
                Browse by club →
              </Link>
            }
          />
          {openForms.length ? (
            <FormGrid forms={openForms} />
          ) : (
            <div className="panel">
              <p className="m-0 text-center text-muted">No forms are open right now — check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* ---------------- Live activity ---------------- */}
      <section className="container-x py-16 md:py-20">
        <Reveal>
          <SectionHead
            title="📡 Live activity"
            sub="Latest form submissions across all clubs."
            action={<LiveBadge>Realtime</LiveBadge>}
          />
          <div className="panel">
            {activity.length ? (
              <ul className="divide-y divide-line">
                {activity.map((s) => {
                  const f = formById(db, s.formId);
                  if (!f) return null;
                  const club = clubById(db, f.clubId);
                  const name =
                    s.data.name || s.data.teamName || s.data.captain || s.data.member1 || "A student";
                  return (
                    <li key={s.id} className="flex items-center gap-3 py-3">
                      <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-surface-2 text-lg"
                        aria-hidden="true"
                      >
                        {club?.icon ?? "📝"}
                      </span>
                      <span className="text-[14px]">
                        <b className="text-ink">{name}</b> filled <b className="text-ink">{f.title}</b>
                        <span className="block text-[12.5px] text-muted">
                          <RelativeTime ts={s.submittedAt} /> · {club?.name}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="empty-state">
                <div className="icon">📥</div>
                <p>No submissions yet — be the first!</p>
              </div>
            )}
          </div>
        </Reveal>
      </section>

      {/* ---------------- Latest notices ---------------- */}
      <section className="container-x pb-16 md:pb-20">
        <Reveal>
          <SectionHead
            title="Latest notices"
            sub="Everything happening across campus — pinned first."
            action={
              <Link href="/notices" className="text-sm font-semibold text-crimson no-underline hover:underline">
                All notices →
              </Link>
            }
          />
          <div className="space-y-4">
            {latest.map((n) => (
              <NoticeCard key={n.id} notice={n} showClub />
            ))}
          </div>
        </Reveal>
      </section>

      {/* ---------------- Student tools — navy callout band ---------------- */}
      <section className="container-x pb-16 md:pb-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-lg bg-navy p-8 text-white md:p-12">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-25"
              style={{ backgroundImage: "url(/images/DSC_2886-(1).jpg)" }}
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/70" aria-hidden="true" />
            <div className="relative flex flex-wrap items-center gap-6">
              <div className="min-w-0 flex-1">
                <p className="m-0 text-[12px] font-bold uppercase tracking-[1.6px] text-gold">Student tools</p>
                <h2 className="display-sm m-0 mt-2 text-white">🖥 Report campus IT issues</h2>
                <p className="m-0 mt-3 max-w-xl text-[15px] leading-relaxed text-white/85">
                  Report WiFi, computer lab, portal or equipment issues — the IT team will follow up. Built for
                  coursework at NITER, available to every student.
                </p>
              </div>
              <Link
                href="/it-support"
                className="btn no-underline"
                style={{ background: "#FFB606", color: "#002147", borderColor: "#FFB606" }}
              >
                Report an issue →
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}

/* Counts up from 0 to `value` when first scrolled into view.
   Honors prefers-reduced-motion (instant) and realtime updates (jumps to
   the new value once the initial animation has finished). */
function CountUp({ value, duration = 1100 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) {
      setDisplay(value);
      return;
    }
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      done.current = true;
      setDisplay(value);
      return;
    }
    let cancelled = false;
    const animate = () => {
      const t0 = performance.now();
      const tick = (t: number) => {
        if (cancelled) return;
        const p = Math.min(1, (t - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplay(Math.round(eased * value));
        if (p < 1) requestAnimationFrame(tick);
        else done.current = true;
      };
      requestAnimationFrame(tick);
    };
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver !== "undefined") {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            io.disconnect();
            animate();
          }
        },
        { threshold: 0.3 }
      );
      io.observe(el);
      // Safety net: start the count even if the observer never fires
      // (e.g. an iframe/webview that can't scroll), so numbers can't stay at 0.
      const fallback = window.setTimeout(() => {
        if (!done.current) {
          io.disconnect();
          animate();
        }
      }, 1600);
      return () => {
        cancelled = true;
        io.disconnect();
        window.clearTimeout(fallback);
      };
    }
    animate();
    return () => {
      cancelled = true;
    };
  }, [value, duration]);

  return <span ref={ref}>{display}</span>;
}

function HeroStat({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-white/25 bg-white/10 px-3.5 py-1.5 text-[13px] font-medium text-white backdrop-blur-sm">
      <span aria-hidden="true">{icon}</span>
      <b className="font-bold text-gold">
        <CountUp value={value} />
      </b>
      {label}
    </span>
  );
}

function NiterFact({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="display-md m-0 text-navy dark:text-gold">{value}</div>
      <div className="mt-1 text-[13px] font-medium uppercase tracking-[1.4px] text-muted">{label}</div>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="container-x py-14">
      <Skeleton className="h-12 w-3/4 max-w-lg" />
      <Skeleton className="mt-4 h-5 w-full max-w-xl" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-44" />
        ))}
      </div>
    </div>
  );
}
