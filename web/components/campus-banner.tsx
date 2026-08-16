"use client";

import { useState } from "react";

/* Real NITER campus photos — served from web/public/images/ (from the
   official site's photo set). A fresh random one is picked on every login
   (never the same as the previous login). */
const CAMPUS_PHOTOS = [
  "/images/front-banner.jpg",
  "/images/Convocation_2021.jpg",
  "/images/DSC_2886-(1).jpg",
  "/images/1.jpg",
  "/images/3.jpg",
  "/images/4.jpg",
  "/images/AbedTE.jpg",
  "/images/groundwater.jpg",
  "/images/undergraduate--2.jpg",
  "/images/Training-(29-30-July-2024).jpg",
];

/** Pick (or reuse) the campus photo for this session. Pass forceNew right
 *  after a login to roll a new random one (the previous login's photo is
 *  excluded so consecutive logins differ). */
export function campusPhoto(forceNew?: boolean): string {
  if (!forceNew) {
    try {
      const sess = sessionStorage.getItem("niter-campus-photo");
      if (sess && CAMPUS_PHOTOS.includes(sess)) return sess;
    } catch {
      /* ignore */
    }
  }
  let last: string | null = null;
  try {
    last = localStorage.getItem("niter-campus-photo");
  } catch {
    /* ignore */
  }
  let pool = CAMPUS_PHOTOS.filter((p) => p !== last);
  if (!pool.length) pool = CAMPUS_PHOTOS;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  try {
    sessionStorage.setItem("niter-campus-photo", pick);
    localStorage.setItem("niter-campus-photo", pick);
  } catch {
    /* ignore */
  }
  return pick;
}

export default function CampusBanner() {
  const [src] = useState(() => campusPhoto());
  return (
    <div className="relative h-52 overflow-hidden rounded-2xl shadow-[0_6px_20px_rgba(0,33,71,0.14)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="NITER campus" className="h-full w-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent" />
      <span className="absolute bottom-3 left-3 rounded-full bg-navy/80 px-3 py-1 text-[13px] font-semibold text-white">
        🏫 NITER Campus
      </span>
    </div>
  );
}
