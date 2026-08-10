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
