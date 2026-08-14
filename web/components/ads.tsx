"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Ad } from "@/lib/types";
import { useDb } from "@/lib/store";
import { activeAds, clubById } from "@/lib/utils";
import { SectionHead } from "@/components/ui";

/**
 * Home-page sponsored carousel — image/video ads published by club
 * moderators from the portal ("📣 Ads" tab). Renders nothing when no club
 * has a live ad. Autoplay respects prefers-reduced-motion and pauses while
 * hovered or focused.
 */
export default function AdsCarousel() {
  const db = useDb();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const list = db ? activeAds(db) : [];

  useEffect(() => {
    if (index >= list.length) setIndex(0);
  }, [list.length, index]);

  const next = useCallback(() => {
    setIndex((i) => (list.length ? (i + 1) % list.length : 0));
  }, [list.length]);

  // Auto-rotate every 6s (skipped for reduced motion).
  useEffect(() => {
    if (list.length < 2 || paused) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(next, 6000);
    return () => window.clearInterval(timer);
  }, [list.length, paused, next]);

  if (!db || !list.length) return null;
  const safeIndex = index < list.length ? index : 0;

  return (
    <section className="section container-x py-14 md:py-16">
      <SectionHead
        title="📣 Sponsored by our clubs"
        sub="Events and campaigns published by NITER clubs — tap to learn more."
        action={<span className="live-badge">SPONSORED</span>}
      />
      <div
        className="ads-carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        {list.map((ad, i) => (
          <AdSlide key={ad.id} ad={ad} active={i === safeIndex} />
        ))}
        {list.length > 1 && (
          <>
            <button
              type="button"
              className="ads-nav prev"
              aria-label="Previous ad"
              onClick={() => setIndex((safeIndex - 1 + list.length) % list.length)}
            >
              ‹
            </button>
            <button
              type="button"
              className="ads-nav next"
              aria-label="Next ad"
              onClick={() => setIndex((safeIndex + 1) % list.length)}
            >
              ›
            </button>
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
    </section>
  );
}

function AdSlide({ ad, active }: { ad: Ad; active: boolean }) {
  const db = useDb();
  const club = db ? clubById(db, ad.clubId) : null;
  const isForm = ad.link?.type === "form";
  const href =
    ad.link?.type === "external"
      ? ad.link.value
      : ad.link?.type === "form"
        ? `/form/${encodeURIComponent(ad.link.value)}`
        : `/club/${encodeURIComponent(ad.clubId)}`;
  const external = ad.link?.type === "external";
  const cta = <span className="ad-cta">{isForm ? "Apply now →" : "Learn more →"}</span>;

  return (
    <div className={`ads-slide${active ? " active" : ""}`}>
      {ad.mediaType === "video" ? (
        <video className="ads-media" src={ad.media} autoPlay muted loop playsInline preload="metadata" />
      ) : (
        <img className="ads-media" src={ad.media} alt="" loading="lazy" />
      )}
      <div className="ads-overlay">
        <div className="ads-copy">
          <span className="ad-club">{club ? `${club.icon} ${club.name}` : `📣 ${ad.clubId || ""}`}</span>
          <h3>{ad.title}</h3>
          {ad.tagline ? <p>{ad.tagline}</p> : null}
          {external ? (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {cta}
            </a>
          ) : (
            <Link href={href}>{cta}</Link>
          )}
        </div>
      </div>
    </div>
  );
}
