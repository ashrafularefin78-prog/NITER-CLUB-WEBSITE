"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useDb } from "@/lib/store";
import { clubById, fmtDate, fmtDateTime, formById, isOpen, nextDeadline, personKey, relativeAgo, sortNotices, statusOf } from "@/lib/utils";
import { rsvpCount } from "@/lib/events";
import { ClubGrid, FormGrid, NoticeCard } from "@/components/cards";
import AdsCarousel from "@/components/ads";
import { LiveBadge, SectionHead, Skeleton } from "@/components/ui";
import { Countdown, LiveClock, RelativeTime } from "@/components/countdown";
import { Reveal } from "@/components/reveal";
import { useIdentity } from "@/components/identity";

export default function HomeView() {
  const db = useDb();
  const { person } = useIdentity();

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

  // Personalization — a signed-in student's own upcoming RSVPs, straight from live data.
  const myUpcoming = person
    ? (db.events || [])
        .filter((ev) => (ev.rsvps || []).some((r) => personKey(r) === personKey(person)))
        .filter((ev) => new Date(ev.startsAt).getTime() >= Date.now())
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
        .slice(0, 3)
    : [];

  // This-week digest — events, deadlines and fresh notices in the next 7 days.
  const weekMs = Date.now();
  const weekEndMs = weekMs + 7 * 86400000;
  const weekEvents = (db.events || [])
    .filter((ev) => {
      const t = new Date(ev.startsAt).getTime();
      return !isNaN(t) && t >= weekMs && t <= weekEndMs;
    })
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const weekDeadlines = db.forms
    .map((f) => ({ f, st: statusOf(f) }))
    .filter(({ st }) => {
      if (st.key === "closed") return false;
      const at = st.key === "soon" ? st.start : st.end;
      return !!at && at.getTime() >= weekMs && at.getTime() <= weekEndMs;
    })
    .map(({ f, st }) => ({
      f,
      key: st.key as "soon" | "open",
      at: (st.key === "soon" ? st.start : st.end) as Date,
    }))
    .sort((a, b) => a.at.getTime() - b.at.getTime());
  const weekNotices = sortNotices(db.notices)
    .filter((n) => new Date(n.createdAt || n.date).getTime() >= weekMs - 7 * 86400000)
    .slice(0, 3);

  // Site identity comes from the live config — admins can edit it in the portal.
  const cfg = db.config;
  const heroTitle = cfg?.heroTitle || "Every club at NITER,";
  const heroAccent = cfg?.heroAccent || "one portal.";
  const heroSub =
    cfg?.heroSub ||
    "Discover notices, register for events, join clubs, and fill forms — all in one place. Club executives can post notices and publish membership forms in seconds.";

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
              {heroTitle} <span className="text-gold">{heroAccent}</span>
            </h1>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-white/85">{heroSub}</p>
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

      {/* ---------------- Sponsored club ads (moderator-published image/video) ---------------- */}
      <AdsCarousel />

      {/* ---------------- NITER stats band — every number derived live ---------------- */}
      <div className="border-b border-hairline bg-surface-2">
        <div className="container-x">
          <Reveal>
            <div className="grid gap-8 py-12 text-center sm:grid-cols-2 lg:grid-cols-4">
              <NiterFact value={cfg?.established || "2009"} label="Established" />
              <NiterFact value={String(db.clubs.length)} label="Clubs" />
              <NiterFact value={String(db.students.length)} label="Students" />
              <NiterFact value={String(db.events.length)} label="Events hosted" />
            </div>
          </Reveal>
        </div>
      </div>

      {/* ---------------- This week at NITER — live digest ---------------- */}
      <section className="container-x py-12 md:py-16">
        <SectionHead
          title="🗓 This week at NITER"
          sub="Everything happening in the next 7 days — events, form deadlines and fresh notices, all live."
          action={
            <Link href="/events" className="text-sm font-semibold text-crimson no-underline hover:underline">
              Full calendar →
            </Link>
          }
        />
        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          <DigestCard
            icon="📅"
            title="Events"
            count={weekEvents.length}
            empty="No events in the next 7 days — check the full calendar."
            items={weekEvents.slice(0, 4).map((ev) => {
              const club = clubById(db, ev.clubId);
              return {
                key: ev.id,
                href: `/events/${ev.id}`,
                icon: club?.icon,
                title: ev.title,
                sub: club?.name,
                meta: fmtDateTime(ev.startsAt) + (ev.venue ? ` · ${ev.venue}` : ""),
              };
            })}
            seeAll={{ href: "/events", label: "All events →" }}
          />
          <DigestCard
            icon="⏳"
            title="Deadlines"
            count={weekDeadlines.length}
            empty="Nothing closing or opening this week."
            items={weekDeadlines.slice(0, 4).map(({ f, key, at }) => {
              const club = clubById(db, f.clubId);
              return {
                key: f.id,
                href: `/form/${f.id}`,
                icon: club?.icon,
                title: f.title,
                sub: club?.name,
                meta: `${key === "soon" ? "🚀 Opens" : "⏳ Closes"} ${fmtDate(at.toISOString())}`,
              };
            })}
            seeAll={{ href: "/clubs", label: "Browse forms →" }}
          />
          <DigestCard
            icon="📢"
            title="New notices"
            count={weekNotices.length}
            empty="No new notices this week — check the notice board."
            items={weekNotices.map((n) => {
              const club = clubById(db, n.clubId);
              return {
                key: n.id,
                href: "/notices",
                icon: club?.icon,
                title: (n.pinned ? "📌 " : "") + n.title,
                sub: club?.name,
                meta: relativeAgo(n.createdAt || n.date),
              };
            })}
            seeAll={{ href: "/notices", label: "All notices →" }}
          />
        </div>
      </section>

      {/* ---------------- Your RSVPs — personal, live, signed-in only ---------------- */}
      {myUpcoming.length > 0 && (
        <section className="container-x py-12 md:py-14">
          <SectionHead
            title="🎟 Your RSVPs"
            sub="Events you're attending — they update here the moment anything changes."
            action={
              <Link href="/events" className="text-sm font-semibold text-crimson no-underline hover:underline">
                All events →
              </Link>
            }
          />
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            {myUpcoming.map((ev) => {
              const club = clubById(db, ev.clubId);
              return (
                <Link
                  key={ev.id}
                  href={`/events/${ev.id}`}
                  className="card p-5 no-underline transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[20px]"
                      style={{ background: club?.color || "#eef2f7" }}
                      aria-hidden="true"
                    >
                      {club?.icon ?? "🎪"}
                    </span>
                    <div className="min-w-0">
                      <h3 className="m-0 truncate text-[15px] font-bold text-ink">{ev.title}</h3>
                      <p className="m-0 text-[12px] text-muted">{club?.name}</p>
                    </div>
                  </div>
                  <p className="m-0 mt-3 text-[12.5px] text-muted">
                    🕒 {fmtDateTime(ev.startsAt)}
                    {ev.venue ? ` · 📍 ${ev.venue}` : ""}
                  </p>
                  <p className="m-0 mt-1.5 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">
                    ✓ You're RSVP'd
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

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

      {/* ---------------- Upcoming events — shared campus calendar ---------------- */}
      <section className="bg-surface-soft">
        <div className="container-x py-16 md:py-20">
          <SectionHead
            title="🗓 Upcoming events"
            sub="RSVP from the shared campus calendar — clash-free, with certificates at the door."
            action={
              <Link href="/events" className="text-sm font-semibold text-crimson no-underline hover:underline">
                All events →
              </Link>
            }
          />
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            {nextUpcoming(db, 3).length ? (
              nextUpcoming(db, 3).map((ev) => {
                const club = clubById(db, ev.clubId);
                return (
                  <Link
                    key={ev.id}
                    href={`/events/${ev.id}`}
                    className="card p-5 no-underline transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[20px]"
                        style={{ background: club?.color || "#eef2f7" }}
                        aria-hidden="true"
                      >
                        {club?.icon ?? "🎪"}
                      </span>
                      <div className="min-w-0">
                        <h3 className="m-0 truncate text-[15px] font-bold text-ink">{ev.title}</h3>
                        <p className="m-0 text-[12px] text-muted">{club?.name}</p>
                      </div>
                    </div>
                    <p className="m-0 mt-3 text-[12.5px] text-muted">
                      🕒 {fmtDateTime(ev.startsAt)}
                      {ev.venue ? ` · 📍 ${ev.venue}` : ""}
                    </p>
                    <p className="m-0 mt-1.5 text-[12px] font-semibold text-navy dark:text-gold">
                      {rsvpCount(ev)} going — RSVP now
                    </p>
                  </Link>
                );
              })
            ) : (
              <div className="panel md:col-span-3">
                <p className="m-0 text-center text-[13.5px] text-muted">
                  No upcoming events right now — check back soon, or browse the full campus calendar.
                </p>
              </div>
            )}
          </div>
        </div>
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

      {/* ---------------- Get involved — passport & club quiz ---------------- */}
      <section className="container-x pb-16 md:pb-20">
        <Reveal>
          <SectionHead
            title="🛂 More ways in"
            sub="Your attendance is already tracked — make it count, and find the club that actually fits you."
          />
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <Link
              href="/passport"
              className="card p-6 no-underline transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="text-3xl" aria-hidden="true">
                🛂
              </div>
              <h3 className="m-0 mt-3 text-[17px] font-bold text-ink">Club Passport</h3>
              <p className="m-0 mt-1 text-[13.5px] leading-relaxed text-muted">
                Every event you check in to stamps your passport with that club&apos;s mark. Collect stamps across
                clubs and unlock the <b className="text-ink">Club Hopper</b> badge.
              </p>
              <p className="m-0 mt-3 text-[13px] font-semibold text-crimson">Open your passport →</p>
            </Link>
            <Link
              href="/quiz"
              className="card p-6 no-underline transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="text-3xl" aria-hidden="true">
                🧭
              </div>
              <h3 className="m-0 mt-3 text-[17px] font-bold text-ink">Which club fits you?</h3>
              <p className="m-0 mt-1 text-[13.5px] leading-relaxed text-muted">
                Eight quick questions, one honest match — get pointed at the clubs that fit your interests instead
                of scrolling the whole directory.
              </p>
              <p className="m-0 mt-3 text-[13px] font-semibold text-crimson">Take the 2-minute quiz →</p>
            </Link>
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
/** Next few upcoming events across all clubs, nearest first. */
function nextUpcoming(db: NonNullable<ReturnType<typeof useDb>>, n: number) {
  const now = Date.now();
  return (db.events || [])
    .filter((ev) => new Date(ev.startsAt).getTime() >= now)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, n);
}

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

/* One column of the "This week at NITER" digest — events, deadlines or notices. */
function DigestCard({
  icon,
  title,
  count,
  empty,
  items,
  seeAll,
}: {
  icon: string;
  title: string;
  count: number;
  empty: string;
  items: { key: string; href: string; icon?: string; title: string; sub?: string; meta: string }[];
  seeAll: { href: string; label: string };
}) {
  return (
    <div className="card flex flex-col p-5">
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden="true">
          {icon}
        </span>
        <h3 className="m-0 text-[15.5px] font-bold text-ink">{title}</h3>
        <span className="ml-auto rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-bold text-muted">{count}</span>
      </div>
      <div className="mt-3 flex-1 space-y-2.5">
        {items.length ? (
          items.map((it) => (
            <Link
              key={it.key}
              href={it.href}
              className="block rounded-lg border border-hairline p-3 no-underline transition hover:border-navy/30 hover:bg-surface-2/40"
            >
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 text-lg" aria-hidden="true">
                  {it.icon ?? "•"}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-bold text-ink">{it.title}</div>
                  {it.sub && <div className="truncate text-[11.5px] text-muted">{it.sub}</div>}
                  <div className="mt-0.5 text-[11.5px] font-medium text-muted">{it.meta}</div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <p className="m-0 text-[12.5px] leading-relaxed text-muted">{empty}</p>
        )}
      </div>
      <Link
        href={seeAll.href}
        className="mt-3 inline-block text-[12.5px] font-semibold text-crimson no-underline hover:underline"
      >
        {seeAll.label}
      </Link>
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
