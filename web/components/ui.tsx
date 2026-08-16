import type { ReactNode } from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function EmptyState({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <div className="empty-state">
      <div className="icon">{icon}</div>
      <p>{children}</p>
    </div>
  );
}

export function SectionHead({
  title,
  sub,
  action,
}: {
  title: ReactNode;
  sub?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="section-head">
      <div>
        <h2 className="display-md m-0 text-ink">{title}</h2>
        {sub && <p className="m-0 mt-1.5 text-[14px] text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/** Navy institutional page banner (mirrors the niter.edu.bd page heroes). */
export function PageHero({
  eyebrow,
  title,
  sub,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="border-b-4 border-gold bg-navy text-white">
      <div className="container-x py-12 md:py-14">
        {eyebrow && (
          <p className="m-0 text-[12px] font-bold uppercase tracking-[1.6px] text-gold">{eyebrow}</p>
        )}
        <h1 className="display-lg m-0 mt-2 text-white">{title}</h1>
        {sub && <p className="m-0 mt-2 max-w-2xl text-[14.5px] leading-relaxed text-white/80">{sub}</p>}
        {children}
      </div>
    </div>
  );
}

export function LiveBadge({ children = "LIVE", onDark = false }: { children?: ReactNode; onDark?: boolean }) {
  return (
    <span className={`live-badge ${onDark ? "on-dark" : ""}`}>
      <span className="live-dot" />
      {children}
    </span>
  );
}

/* The four-color Google "G" mark (official brand SVG). */
export function GoogleG({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

/** Pill-shaped "Sign in with Google" button (standard Google sign-in UI). */
export function GoogleButton({
  onClick,
  busy = false,
  label = "Sign in with Google",
}: {
  onClick: () => void;
  busy?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="flex w-full items-center justify-center gap-3 rounded-full border border-hairline bg-white px-4 py-2.5 text-[14px] font-medium text-[#3c4043] shadow-sm transition hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson disabled:cursor-not-allowed disabled:opacity-60"
    >
      <GoogleG />
      {busy ? "Signing in…" : label}
    </button>
  );
}

/** "or use email" divider shown under the Google button on auth cards. */
export function OrDivider({ text = "or use email" }: { text?: string }) {
  return (
    <div className="my-5 flex items-center gap-3 text-[12px] text-muted" aria-hidden="true">
      <span className="h-px flex-1 bg-hairline" />
      <span>{text}</span>
      <span className="h-px flex-1 bg-hairline" />
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-10 text-muted">
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-crimson"
        aria-hidden="true"
      />
      {label && <span className="text-sm font-medium">{label}</span>}
    </div>
  );
}
