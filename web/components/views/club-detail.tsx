"use client";

import Link from "next/link";
import { useDb } from "@/lib/store";
import { clubForms, clubNotices, isClosed, nextDeadline, statusOf } from "@/lib/utils";
import { FormGrid, NoticeCard } from "@/components/cards";
import { Countdown } from "@/components/countdown";
import { EmptyState, PageHero, Skeleton } from "@/components/ui";

export default function ClubDetailView({ clubId }: { clubId: string }) {
  const db = useDb();
  const club = db?.clubs.find((c) => c.id === clubId) ?? null;

  if (!db) return <ClubDetailSkeleton />;
  if (!club) return <ClubMissing />;

  const notices = clubNotices(db, club.id);
  const forms = clubForms(db, club.id);
  // Match the membership application by title (falls back to the first form),
  // mirroring the legacy app — form ids are not predictable.
  const membership = forms.find((f) => /membership/i.test(f.title)) || forms[0] || null;
  const execs = club.executives.filter((e) => e.name);
  const clubNext = nextDeadline(forms);
  const clubOpen = forms.filter((f) => statusOf(f).key === "open").length;
  const clubSoon = forms.filter((f) => statusOf(f).key === "soon").length;
  const clubSubs = forms.reduce((sum, f) => sum + db.submissions.filter((s) => s.formId === f.id).length, 0);

  const facebookHref =
    club.facebook || `https://www.google.com/search?q=${encodeURIComponent(club.name + " facebook")}`;

  return (
    <>
      <PageHero eyebrow="Clubs" title={club.name} sub={club.tagline}>
        <span className="mt-4 inline-flex items-center gap-2 rounded-md border border-gold/50 bg-gold/15 px-3 py-1 text-[12px] font-bold uppercase tracking-[1.4px] text-gold">
          <span aria-hidden="true">{club.icon}</span>
          {club.panel ? "Panel " + club.panel : "New committee"}
        </span>
      </PageHero>
      <div className="container-x py-10">
      {/* breadcrumbs */}
      <nav aria-label="Breadcrumb" className="text-[13px] text-muted">
        <Link href="/" className="no-underline hover:underline">
          Home
        </Link>{" "}
        /{" "}
        <Link href="/clubs" className="no-underline hover:underline">
          Clubs
        </Link>{" "}
        / <span className="text-ink">{club.name}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">

          <section className="mt-6">
            <h2 className="m-0 text-[19px] font-bold text-ink">About the club</h2>
            <div className="card mt-3 p-5">
              <p className="m-0 text-[14.5px] leading-relaxed text-ink/90">{club.about}</p>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="m-0 text-[19px] font-bold text-ink">
              Notices <span className="text-muted">({notices.length})</span>
            </h2>
            <div className="mt-3 space-y-4">
              {notices.length ? (
                notices.map((n) => <NoticeCard key={n.id} notice={n} />)
              ) : (
                <EmptyState icon="📢">No notices posted yet.</EmptyState>
              )}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="m-0 text-[19px] font-bold text-ink">
              Forms <span className="text-muted">({forms.length})</span>
            </h2>
            <div className="mt-3">
              {forms.length ? (
                <FormGrid forms={forms} />
              ) : (
                <EmptyState icon="📝">No forms published yet.</EmptyState>
              )}
            </div>
          </section>
        </div>

        {/* sidebar */}
        <aside className="space-y-4">
          <div className="card p-5 text-center">
            <div className="text-5xl" aria-hidden="true">
              {club.icon}
            </div>
            <h3 className="m-0 mt-2 text-[16px] font-bold text-ink">Interested in joining?</h3>
            <p className="m-0 mt-1 text-[13px] text-muted">
              Apply through our membership form and our team will get back to you.
            </p>
            <div className="mt-3">
              {membership ? (
                isClosed(membership) ? (
                  <button className="btn btn-outline w-full" disabled>
                    Applications closed
                  </button>
                ) : (
                  <Link href={`/form/${membership.id}`} className="btn btn-primary w-full no-underline">
                    Apply now
                  </Link>
                )
              ) : (
                <button className="btn btn-outline w-full" disabled>
                  No application form yet
                </button>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="m-0 text-[15px] font-bold text-ink">📊 Forms status</h3>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <ClubStat value={clubOpen} label="open now" tone="text-ok" />
              <ClubStat value={clubSoon} label="opening soon" tone="text-crimson" />
              <ClubStat value={clubSubs} label="submissions" tone="text-navy dark:text-gold" />
            </div>
            {clubNext && (
              <div className="mt-3 border-t border-line pt-3 text-[13.5px] text-ink">
                {clubNext.key === "soon" ? "🚀 Opens in" : "⏳ Closes in"}: <b>{clubNext.form.title}</b>
                <div className="mt-1 text-[14.5px]">
                  <Countdown
                    start={clubNext.key === "soon" ? clubNext.form.openAt : null}
                    end={clubNext.key === "open" ? clubNext.form.deadline : null}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="card p-5">
            <h3 className="m-0 text-[15px] font-bold text-ink">📮 Complaint box</h3>
            <p className="m-0 mt-1 text-[13px] text-muted">
              Something wrong with this club’s events, forms or members? File a confidential complaint — the
              executives will review it.
            </p>
            <Link href={`/complaint/${club.id}`} className="btn btn-outline btn-sm mt-3 no-underline">
              File a complaint
            </Link>
          </div>

          <div className="card p-5">
            <h3 className="m-0 text-[15px] font-bold text-ink">Contact & info</h3>
            <dl className="m-0 mt-3 space-y-2.5 text-[13.5px]">
              <InfoRow k="Email" v={club.email || "—"} />
              <InfoRow k="Room" v={club.room || "—"} />
              <InfoRow k="Weekly" v={club.weekly || "—"} />
              <div className="flex justify-between gap-3">
                <dt className="shrink-0 font-semibold text-muted">Facebook</dt>
                <dd className="m-0 text-right">
                  <a
                    href={facebookHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-crimson no-underline hover:underline"
                  >
                    {club.facebook ? "Official page →" : "Find on Facebook →"}
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          <div className="card p-5">
            <h3 className="m-0 text-[15px] font-bold text-ink">
              Executive committee{club.panel ? ` · ${club.panel}` : ""}
            </h3>
            {execs.length ? (
              <>
                <ul className="m-0 mt-3 list-none space-y-2.5 p-0">
                  {execs.map((e, i) => (
                    <li key={i} className="flex items-baseline justify-between gap-3 text-[13.5px]">
                      <span className="shrink-0 font-semibold text-muted">{e.role}</span>
                      <span className="text-right font-semibold text-ink">{e.name}</span>
                    </li>
                  ))}
                </ul>
                <p className="m-0 mt-3 text-[11.5px] text-muted">
                  Compiled from official club Facebook pages & NITER sources. Verify with the club for the
                  latest panel.
                </p>
              </>
            ) : (
              <p className="m-0 mt-2 text-[13px] text-muted">
                Committee panel not listed yet — check the club’s Facebook page for the latest updates.
              </p>
            )}
          </div>
        </aside>
      </div>
      </div>
    </>
  );
}

function ClubStat({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div>
      <div className={`text-[22px] font-extrabold leading-none ${tone}`}>{value}</div>
      <div className="mt-1 text-[11.5px] leading-tight text-muted">{label}</div>
    </div>
  );
}

function InfoRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 font-semibold text-muted">{k}</dt>
      <dd className="m-0 text-right text-ink">{v}</dd>
    </div>
  );
}

function ClubMissing() {
  return (
    <div className="container-x py-16 text-center">
      <div className="text-5xl">🤔</div>
      <h1 className="mt-3 text-xl font-bold text-ink">Club not found</h1>
      <p className="text-muted">This club doesn’t exist or was removed.</p>
      <Link href="/clubs" className="btn btn-primary mt-4 no-underline">
        Browse all clubs
      </Link>
    </div>
  );
}

function ClubDetailSkeleton() {
  return (
    <div className="container-x py-10">
      <Skeleton className="h-5 w-48" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-40" />
        </div>
      </div>
    </div>
  );
}
