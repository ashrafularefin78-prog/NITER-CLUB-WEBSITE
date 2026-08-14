"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "@/components/providers";
import { useAuth } from "@/lib/auth";
import { AdminOnlyDirectoryLink } from "@/components/admin-links";

const NAV = [
  { href: "/", label: "Home", match: "/" },
  { href: "/notices", label: "Notices", match: "/notices" },
  { href: "/clubs", label: "Clubs", match: "/clubs" },
  { href: "/dashboard", label: "My Dashboard", match: "/dashboard" },
  { href: "/it-support", label: "IT Help", match: "/it-support" },
];

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3 no-underline" aria-label="NITER Clubs Portal — home">
      {/* NITER crest — official logo from niter.edu.bd */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/logo-niter.png"
        alt="NITER crest"
        width={44}
        height={44}
        className="h-11 w-11 rounded-full bg-white object-contain p-0.5 shadow-[0_1px_3px_rgba(0,33,71,0.3)]"
      />
      <span className="leading-tight">
        <span className={`block text-[18px] font-bold tracking-[0.2px] ${dark ? "text-white" : "text-navy"}`}>
          NITER <span className="text-gold">Clubs</span>
        </span>
        <span
          className={`block text-[10px] font-semibold uppercase tracking-[1.6px] ${
            dark ? "text-white/70" : "text-muted"
          }`}
        >
          One portal · every club
        </span>
      </span>
    </Link>
  );
}

function ThemeToggle({ dark = false }: { dark?: boolean }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={`grid h-9 w-9 place-items-center rounded-md border transition ${
        dark
          ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
          : "border-hairline bg-canvas text-ink hover:bg-surface-2"
      }`}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const isActive = (match: string) => (match === "/" ? pathname === "/" : pathname.startsWith(match));

  return (
    <header className="sticky top-0 z-50 shadow-[0_4px_12px_rgba(0,33,71,0.18)]">
      {/* institutional navy bar — mirrors the niter.edu.bd header */}
      <div className="bg-navy text-white">
        <div className="container-x flex h-[68px] items-center gap-4">
          <Logo dark />
          <nav aria-label="Main" className="ml-auto hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3.5 py-2 text-[14px] font-medium no-underline transition ${
                  isActive(item.match)
                    ? "bg-white/10 text-white shadow-[inset_0_-2px_0_#FFB606]"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/students"
                className={`rounded-md px-3.5 py-2 text-[14px] font-medium no-underline transition ${
                  isActive("/students")
                    ? "bg-white/10 text-white shadow-[inset_0_-2px_0_#FFB606]"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                Students
              </Link>
            )}
            <div className="ml-2">
              <ThemeToggle dark />
            </div>
            <Link href="/portal" className="btn ml-1 no-underline" style={{ background: "#FFB606", color: "#002147", borderColor: "#FFB606" }}>
              Member Portal
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-0 md:hidden">
            <ThemeToggle dark />
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
              aria-expanded={open}
              className="grid h-9 w-9 place-items-center rounded-md border border-white/25 bg-white/10 text-white"
            >
              {open ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </div>
      {open && (
        <nav aria-label="Mobile" className="mobile-nav bg-navy text-white shadow-[0_8px_25px_rgba(0,33,71,0.25)]">
          <div className="container-x flex flex-col gap-1 pb-5 pt-2 md:hidden">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-3 text-sm font-medium no-underline ${
                  isActive(item.match) ? "bg-white/10 text-white" : "text-white/80"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/students"
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-3 text-sm font-medium no-underline ${
                  isActive("/students") ? "bg-white/10 text-white" : "text-white/80"
                }`}
              >
                Students
              </Link>
            )}
            <Link
              href="/portal"
              onClick={() => setOpen(false)}
              className="btn mt-3 no-underline"
              style={{ background: "#FFB606", color: "#002147", borderColor: "#FFB606" }}
            >
              Member Portal
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

const FOOTER_LINKS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "Home", href: "/" },
      { label: "Notices", href: "/notices" },
      { label: "Clubs", href: "/clubs" },
      { label: "Student directory", href: "/students" },
    ],
  },
  {
    title: "For students",
    links: [
      { label: "My Dashboard", href: "/dashboard" },
      { label: "Member Portal", href: "/portal" },
      { label: "Browse forms", href: "/clubs" },
      { label: "Report an issue", href: "/it-support" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="site-footer bg-navy text-white/80">
      <div className="container-x grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Logo dark />
          <p className="mt-4 max-w-md text-[14px] leading-relaxed">
            The student club portal of the{" "}
            <b className="font-semibold text-white">
              National Institute of Textile Engineering and Research (NITER)
            </b>{" "}
            — a constituent institute of the University of Dhaka. Notices, forms and memberships for every club,
            in one place.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[1.2px] text-gold">
            Constituent Institute · Univ. of Dhaka
          </div>
        </div>
        {FOOTER_LINKS.map((col) => (
          <div key={col.title}>
            <h4 className="m-0 mb-3 text-[13px] font-bold uppercase tracking-[1.4px] text-white">
              {col.title}
            </h4>
            <ul className="m-0 grid list-none gap-2.5 p-0 text-[14px]">
              {col.links
                .filter((l) => l.href !== "/students")
                .map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} className="no-underline transition hover:text-gold">
                      {l.label}
                    </Link>
                  </li>
                ))}
              {col.title === "Explore" && <AdminOnlyDirectoryLink />}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/15">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-6 text-[12.5px] sm:flex-row">
          <p className="m-0">Built with Next.js · Data on Firebase</p>
          <p className="m-0">
            © {new Date().getFullYear()} NITER Clubs Portal · National Institute of Textile Engineering and
            Research
          </p>
        </div>
      </div>
    </footer>
  );
}
