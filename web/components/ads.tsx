"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Ad } from "@/lib/types";
import { mutate, useDb } from "@/lib/store";
import { activeAds, clubById, fmtCount } from "@/lib/utils";
import { SectionHead } from "@/components/ui";

const AUTOPLAY_MS = 6000;

/**
 * Home-page sponsored carousel — image/video ads published by club
 * moderators from the portal ("📣 Ads" tab). Features: autoplay with a
 * visible progress bar, play/pause, prev/next, dots, swipe on touch,
 * arrow-key navigation, an honest "AD" label, a branded fallback tile when
 * media fails to load, and an "All sponsors" strip below. Impressions and
 * CTA clicks are counted per ad (impressions deduped per viewer session).
 */
export default function AdsCarousel() {
  const db = useDb();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const list = db ? activeAds(db) : [];
  const safeIndex = list.length ? (index >= list.length ? 0 : index) : 0;

  // Count one impression per ad per viewer session (page views, not loops).
  const markedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    list.forEach((ad) => {
      if (markedRef.current.has(ad.id)) return;
      markedRef.current.add(ad.id);
      markImpression(ad.id);
    });
  }, [list]);

  useEffect(() => {
    if (index >= list.length) setIndex(0);
  }, [list.length, index]);

  const next = useCallback(() => {
    setIndex((i) => (list.length ? (i + 1) % list.length : 0));
  }, [list.length]);

  // Auto-rotate every 6s (skipped for reduced motion; paused on hover/focus).
  useEffect(() => {
    if (list.length < 2 || paused) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(next, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [list.length, paused, next]);

  if (!db || !list.length) return null;

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + list.length) % list.length);

  const onAdClick = (ad: Ad) => {
    mutate((d) => {
      const t = (d.ads ?? []).find((x) => x.id === ad.id);
      if (t) t.clicks = (t.clicks || 0) + 1;
    });
  };

  return (
    <section className="section container-x py-14 md:py-16">
      <SectionHead
        title="📣 Sponsored by our clubs"
        sub={`${list.length} live ad${list.length === 1 ? "" : "s"} · events and campaigns published by NITER clubs.`}
        action={<span className="live-badge">SPONSORED</span>}
      />
      <div
        className="ads-carousel"
        tabIndex={0}
        aria-roledescription="carousel"
        aria-label="Sponsored ads"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 48) go(dx < 0 ? 1 : -1);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          else if (e.key === "ArrowLeft") go(-1);
        }}
      >
        {list.map((ad, i) => (
          <AdSlide key={ad.id} ad={ad} active={i === safeIndex} onAdClick={onAdClick} />
        ))}

        {/* autoplay progress — the bar re-fills each time the slide changes */}
        {list.length > 1 && (
          <div className="ads-progress" aria-hidden="true">
            <div key={safeIndex} className={`ads-progress-bar${paused ? " paused" : ""}`} style={{ animationDuration: AUTOPLAY_MS + "ms" }} />
          </div>
        )}

        {list.length > 1 && (
          <>
            <button type="button" className="ads-nav prev" aria-label="Previous ad" onClick={() => go(-1)}>
              ‹
            </button>
            <button type="button" className="ads-nav next" aria-label="Next ad" onClick={() => go(1)}>
              ›
            </button>
            <div className="ads-controls">
              <button
                type="button"
                className="ads-control-btn"
                aria-label={paused ? "Play slideshow" : "Pause slideshow"}
                onClick={() => setPaused((p) => !p)}
              >
                {paused ? "▶" : "❚❚"}
              </button>
              <span className="ads-counter" aria-live="polite">
                {safeIndex + 1} / {list.length}
              </span>
            </div>
            <div className="ads-dots">
              {list.map((a, i) => (
                <button
                  key={a.id}
                  type="button"
                  className={i === safeIndex ? "active" : ""}
                  aria-label={`Go to ad ${i + 1}`}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* all sponsors — every live ad at a glance */}
      {list.length >= 2 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((ad) => (
            <AdCard key={ad.id} ad={ad} onAdClick={onAdClick} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------------- analytics helpers ---------------- */

function markImpression(adId: string) {
  const key = "ad-viewed-" + adId;
  try {
    if (sessionStorage.getItem(key) === "1") return;
    sessionStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }
  mutate((d) => {
    const t = (d.ads ?? []).find((x) => x.id === adId);
    if (t) t.views = (t.views || 0) + 1;
  });
}

/* ---------------- hero slide ---------------- */

function AdSlide({ ad, active, onAdClick }: { ad: Ad; active: boolean; onAdClick: (ad: Ad) => void }) {
  const db = useDb();
  const club = db ? clubById(db, ad.clubId) : null;
  const [failed, setFailed] = useState(false);
  const href = linkHref(ad);
  const external = ad.link?.type === "external";
  const cta = <span className="ad-cta">{ad.link?.type === "form" ? "Apply now →" : "Learn more →"}</span>;

  return (
    <div className={`ads-slide${active ? " active" : ""}`}>
      {failed ? (
        <FallbackTile ad={ad} clubIcon={club?.icon} clubColor={club?.color} />
      ) : ad.mediaType === "video" ? (
        <video className="ads-media" src={ad.media} autoPlay muted loop playsInline preload="metadata" onError={() => setFailed(true)} />
      ) : (
        <img className="ads-media" src={ad.media} alt="" loading="lazy" onError={() => setFailed(true)} />
      )}
      <span className="ad-chip" aria-hidden="true">
        AD
      </span>
      <div className="ads-overlay">
        <div className="ads-copy">
          <span className="ad-club">{club ? `${club.icon} ${club.name}` : `📣 ${ad.clubId || ""}`}</span>
          <h3>{ad.title}</h3>
          {ad.tagline ? <p>{ad.tagline}</p> : null}
          {external ? (
            <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => onAdClick(ad)}>
              {cta}
            </a>
          ) : (
            <Link href={href} onClick={() => onAdClick(ad)}>
              {cta}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/** Branded placeholder so a broken upload never shows a broken image. */
function FallbackTile({ ad, clubIcon, clubColor }: { ad: Ad; clubIcon?: string; clubColor?: string }) {
  return (
    <div
      className="ads-media ads-fallback"
      style={{ background: `linear-gradient(120deg, ${clubColor || "#1a3a5c"} 0%, #0b1b33 90%)` }}
    >
      <span className="text-6xl" aria-hidden="true">
        {clubIcon || "📣"}
      </span>
      <b>{ad.title}</b>
    </div>
  );
}

/* ---------------- sponsor card (strip) ---------------- */

function AdCard({ ad, onAdClick }: { ad: Ad; onAdClick: (ad: Ad) => void }) {
  const db = useDb();
  const club = db ? clubById(db, ad.clubId) : null;
  const [failed, setFailed] = useState(false);
  const href = linkHref(ad);
  const external = ad.link?.type === "external";

  const media =
    failed ? (
      <div
        className="grid h-36 w-full place-items-center text-center"
        style={{ background: `linear-gradient(120deg, ${club?.color || "#1a3a5c"} 0%, #0b1b33 90%)` }}
      >
        <span className="text-4xl" aria-hidden="true">
          {club?.icon || "📣"}
        </span>
      </div>
    ) : ad.mediaType === "video" ? (
      <video className="h-36 w-full object-cover" src={ad.media} muted preload="metadata" onError={() => setFailed(true)} />
    ) : (
      <img className="h-36 w-full object-cover" src={ad.media} alt="" loading="lazy" onError={() => setFailed(true)} />
    );

  const body = (
    <>
      {media}
      <div className="flex flex-col p-4">
        <span className="text-[11px] font-bold uppercase tracking-[1.2px] text-muted">
          {club ? `${club.icon} ${club.name}` : "NITER club"} · <span className="text-crimson">AD</span>
        </span>
        <h3 className="m-0 mt-1 text-[15px] font-bold leading-snug text-ink">{ad.title}</h3>
        {ad.tagline && <p className="m-0 mt-1 line-clamp-2 text-[12.5px] text-muted">{ad.tagline}</p>}
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-bold text-muted">
            👁 {fmtCount(ad.views || 0)} · 👆 {fmtCount(ad.clicks || 0)}
          </span>
          <span className="ad-cta !px-3.5 !py-1.5 !text-[12px]">{ad.link?.type === "form" ? "Apply →" : "More →"}</span>
        </div>
      </div>
    </>
  );

  const cls = "card block overflow-hidden !p-0 no-underline transition hover:-translate-y-0.5 hover:shadow-md";

  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls} onClick={() => onAdClick(ad)}>
      {body}
    </a>
  ) : (
    <Link href={href} className={cls} onClick={() => onAdClick(ad)}>
      {body}
    </Link>
  );
}

/* ---------------- shared helpers ---------------- */

function linkHref(ad: Ad): string {
  if (ad.link?.type === "external") return ad.link.value;
  if (ad.link?.type === "form") return `/form/${encodeURIComponent(ad.link.value)}`;
  return `/club/${encodeURIComponent(ad.clubId)}`;
}
