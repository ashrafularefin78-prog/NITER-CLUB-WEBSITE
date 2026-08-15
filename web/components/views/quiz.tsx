"use client";

import Link from "next/link";
import { useState } from "react";
import { useDb } from "@/lib/store";
import { QUIZ_QUESTIONS, quizMatches } from "@/lib/quiz";
import { PageHero, Skeleton } from "@/components/ui";

export default function QuizView() {
  const db = useDb();
  const [answers, setAnswers] = useState<(number | null)[]>(() => Array(QUIZ_QUESTIONS.length).fill(null));
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  if (!db) return <QuizSkeleton />;

  const total = QUIZ_QUESTIONS.length;
  const answeredCount = answers.filter((a) => a !== null).length;

  const restart = () => {
    setAnswers(Array(QUIZ_QUESTIONS.length).fill(null));
    setStep(0);
    setDone(false);
  };

  if (done) {
    const matches = quizMatches(db, answers as number[]);
    return (
      <ResultView
        matches={matches}
        onRetake={restart}
      />
    );
  }

  const q = QUIZ_QUESTIONS[step];
  const chosen = answers[step];

  return (
    <>
      <PageHero
        eyebrow="Getting started"
        title="🧭 Which club fits you?"
        sub="Not sure where you belong? Answer eight quick questions and we'll match you to the NITER clubs that fit your vibe. Takes under two minutes."
      />

      <div className="container-x py-10">
        <div className="mx-auto max-w-2xl">
          <div className="mb-3 flex items-center justify-between text-[12.5px] font-semibold text-muted">
            <span>
              Question {step + 1} of {total}
            </span>
            <span>{answeredCount} answered</span>
          </div>
          <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-gold transition-all"
              style={{ width: `${Math.round(((step + (chosen !== null ? 1 : 0)) / total) * 100)}%` }}
            />
          </div>

          <div key={step} className="card anim-fade-up p-6">
            <h2 className="m-0 text-[18px] font-bold leading-snug text-ink">{q.q}</h2>
            <div className="mt-4 grid gap-2.5">
              {q.options.map((opt, i) => {
                const selected = chosen === i;
                return (
                  <button
                    key={i}
                    onClick={() =>
                      setAnswers((prev) => {
                        const next = prev.slice();
                        next[step] = i;
                        return next;
                      })
                    }
                    className={`rounded-xl border p-3.5 text-left text-[14px] font-semibold transition ${
                      selected
                        ? "border-gold bg-gold/10 text-ink shadow-sm"
                        : "border-hairline bg-surface-card text-ink/85 hover:border-navy/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                className="btn btn-ghost btn-sm"
                disabled={step === 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                ← Back
              </button>
              <button
                className="btn btn-primary btn-sm"
                disabled={chosen === null}
                onClick={() => {
                  if (step + 1 < total) setStep((s) => s + 1);
                  else setDone(true);
                }}
              >
                {step + 1 < total ? "Next →" : "See my matches ✨"}
              </button>
            </div>
          </div>

          <p className="mt-5 text-[12px] leading-relaxed text-muted">
            🧭 Your answers are never stored — the quiz only matches your picks against each club&apos;s personality
            tags, right in your browser.
          </p>
        </div>
      </div>
    </>
  );
}

function ResultView({ matches, onRetake }: { matches: ReturnType<typeof quizMatches>; onRetake: () => void }) {
  return (
    <>
      <PageHero
        eyebrow="Getting started"
        title="✨ Your club matches"
        sub="Based on your answers — head to a club page to learn more or send a join request."
      />
      <div className="container-x py-10">
        <div className="mx-auto max-w-3xl">
          {matches.length ? (
            <div className="space-y-4">
              {matches.slice(0, 3).map((m, i) => (
                <div
                  key={m.club.id}
                  className={`card p-5 ${i === 0 ? "border-2 border-gold" : ""}`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className="grid h-14 w-14 shrink-0 place-items-center rounded-xl text-[26px]"
                      style={{ background: m.club.color + "22" }}
                      aria-hidden="true"
                    >
                      {m.club.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="m-0 text-[17px] font-bold text-ink">{m.club.name}</h2>
                        {i === 0 && (
                          <span className="rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-extrabold text-navy">
                            ★ Top match
                          </span>
                        )}
                      </div>
                      <p className="m-0 text-[13px] text-muted">{m.club.tagline}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-[22px] font-extrabold leading-none text-ink">{m.pct}%</div>
                      <div className="text-[11px] font-semibold uppercase tracking-[1px] text-muted">match</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {m.matchedTags.map((t) => (
                      <span key={t} className="rounded-full bg-surface-2 px-2.5 py-1 text-[11.5px] font-bold text-muted">
                        #{t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/club/${m.club.id}`} className="btn btn-primary btn-sm no-underline">
                      View club →
                    </Link>
                    <Link href={`/club/${m.club.id}#join`} className="btn btn-outline btn-sm no-underline">
                      Send join request
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <div className="text-5xl" aria-hidden="true">
                🤔
              </div>
              <h2 className="mt-3 text-[18px] font-bold text-ink">No matches found</h2>
              <p className="mx-auto mt-1 max-w-md text-[13.5px] text-muted">
                We couldn&apos;t map your picks to a club — retake the quiz or browse every club directly.
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button className="btn btn-outline btn-sm" onClick={onRetake}>
              ↺ Retake the quiz
            </button>
            <Link href="/clubs" className="btn btn-ghost btn-sm no-underline">
              Browse all clubs →
            </Link>
          </div>
          <p className="mt-6 text-[12px] leading-relaxed text-muted">
            🧭 A club is a place you grow, not a label you wear — matches are a starting point, not a verdict. Your
            answers were never stored.
          </p>
        </div>
      </div>
    </>
  );
}

function QuizSkeleton() {
  return (
    <div className="container-x py-14">
      <Skeleton className="h-10 w-80" />
      <div className="mx-auto mt-8 max-w-2xl">
        <Skeleton className="h-56" />
      </div>
    </div>
  );
}
