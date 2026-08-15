"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { mutate, useDb } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { relativeAgo } from "@/lib/utils";
import type { Warning } from "@/lib/types";
import {
  WARN_REASONS,
  acceptAnswer,
  addAnswer,
  deleteQuestion,
  questionById,
  setAnswerHidden,
  setQuestionStatus,
  statusPillOf,
  toggleAnswerUpvote,
  togglePinQuestion,
  upvoted,
  warnUser,
  warningsOf,
} from "@/lib/qa";
import { logAudit } from "@/lib/audit";
import { useToast } from "@/components/providers";
import { IdentityPrompt, useIdentity } from "@/components/identity";
import { EmptyState, PageHero, Skeleton } from "@/components/ui";

export default function QuestionDetailView({ questionId }: { questionId: string }) {
  const db = useDb();
  const router = useRouter();
  const toast = useToast();
  const auth = useAuth();
  const { person, setPerson } = useIdentity();
  const [answerBody, setAnswerBody] = useState("");
  const [askIdentity, setAskIdentity] = useState(false);
  const [warnTarget, setWarnTarget] = useState<{ key: string; name: string; email?: string } | null>(null);

  if (!db) return <QDetailSkeleton />;
  const q = questionById(db, questionId);
  if (!q) return <QMissing />;

  const meKey = person ? person.email.toLowerCase() : "";
  const isAuthor = meKey !== "" && q.authorKey === meKey;
  const isAdmin = auth.cloud && auth.user?.role === "admin";
  const canModerate = isAuthor || isAdmin;
  // Moderators (admin / executive / it-staff) can pin, hide and warn.
  const isMod = auth.cloud && (auth.user?.role === "admin" || auth.user?.role === "executive" || auth.user?.role === "it-staff");
  const modName = auth.cloud ? auth.user?.name || auth.user?.email || "Moderator" : "Moderator";
  const modEmail = auth.cloud ? auth.user?.email || "" : "";
  const modKey = modEmail.toLowerCase();

  const allAnswers = q.answers.slice().sort((a, b) => {
    if (!!a.accepted !== !!b.accepted) return a.accepted ? -1 : 1;
    if (a.upvotes !== b.upvotes) return (b.upvotes || 0) - (a.upvotes || 0);
    return a.at.localeCompare(b.at);
  });
  // Moderator-hidden answers are invisible to regular students.
  const answers = isMod ? allAnswers : allAnswers.filter((a) => !a.hidden);
  const hiddenCount = q.answers.filter((a) => a.hidden).length;
  const qWarnings = isMod ? warningsOf(db, q.authorKey) : [];
  const pill = statusPillOf(q);
  const totalUp = answers.reduce((s, a) => s + (a.upvotes || 0), 0);

  const submitAnswer = () => {
    if (!person) {
      setAskIdentity(true);
      return;
    }
    if (!answerBody.trim()) return toast.toast("Write an answer first.", "err");
    addAnswer(db, q, person, answerBody);
    logAudit("qa_answer", `Answered: ${q.title}`, "info", "", person.email);
    toast.toast("Answer posted!", "ok");
    setAnswerBody("");
  };

  const onDelete = () => {
    if (!confirm("Delete this question and all its answers?")) return;
    if (deleteQuestion(db, q.id, meKey, !!isAdmin)) {
      logAudit("qa_delete", `Deleted question: ${q.title}`, "warn", "", isAdmin ? auth.user?.email : meKey);
      toast.toast("Question deleted.", "ok");
      router.push("/questions");
    } else {
      toast.toast("Only the author or an admin can delete this.", "err");
    }
  };

  return (
    <>
      <PageHero eyebrow="Q&A board" title="💬 Question" sub="NITER students helping students — answers stay public for the next batch.">
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/questions" className="btn btn-outline btn-sm no-underline border-white/30 text-white hover:bg-white/10">
            ← All questions
          </Link>
        </div>
      </PageHero>

      <div className="container-x py-10">
        <div className="mx-auto max-w-3xl">
          {/* question */}
          <div className="card p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${pill.cls}`}>{pill.label}</span>
              <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-muted">{q.category}</span>
              {q.anonymous && (
                <span className="rounded-full border border-dashed border-line px-2.5 py-1 text-[11px] font-semibold text-muted">🎭 Anonymous</span>
              )}
              {q.pinned && (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                  📌 Pinned{q.pinnedBy ? ` by ${q.pinnedBy}` : ""}
                </span>
              )}
              {isMod && (
                <button
                  className="btn btn-ghost btn-sm ml-auto"
                  onClick={() => {
                    const next = togglePinQuestion(db, q, modKey, modName, true);
                    if (next === null) return;
                    logAudit("qa_pin", `${next ? "Pinned" : "Unpinned"} question: ${q.title}`, "info", "", modEmail || modKey);
                    toast.toast(next ? "Question pinned — it now sits at the top of the board." : "Question unpinned.", "ok");
                  }}
                >
                  {q.pinned ? "📌 Unpin" : "📌 Pin"}
                </button>
              )}
              {isMod && (
                <button className="btn btn-ghost btn-sm" onClick={() => setWarnTarget({ key: q.authorKey, name: q.authorName, email: q.authorKey })}>
                  ⚠️ Warn
                </button>
              )}
              {canModerate && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    const next = q.status === "closed" ? "open" : "closed";
                    setQuestionStatus(db, q, next, meKey, !!isAdmin);
                    logAudit("qa_close", `${next === "closed" ? "Closed" : "Reopened"} question: ${q.title}`, next === "closed" ? "warn" : "info", "", isAdmin ? auth.user?.email : meKey);
                    toast.toast(next === "closed" ? "Question closed to new answers." : "Question reopened.", "ok");
                  }}
                >
                  {q.status === "closed" ? "Reopen" : "🔒 Close"}
                </button>
              )}
              {canModerate && (
                <button className="btn btn-danger btn-sm" onClick={onDelete}>
                  Delete
                </button>
              )}
            </div>
            <h1 className="m-0 mt-3 text-[22px] font-bold text-ink">{q.title}</h1>
            <p className="m-0 mt-1 text-[12.5px] text-muted">
              {q.authorName} · {relativeAgo(q.at)} · {answers.length} answer{answers.length === 1 ? "" : "s"}
              {totalUp > 0 ? ` · ${totalUp} ▲` : ""}
              {isMod && qWarnings.length > 0 && (
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    qWarnings.length >= 2
                      ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                  }`}
                  title={qWarnings.map((w) => `${w.reason} — ${relativeAgo(w.at)}`).join(" · ")}
                >
                  {qWarnings.length >= 2 ? "🚩 Repeat offender" : "⚠️ 1 warning"}
                </span>
              )}
            </p>
            {q.body && (
              <p className="m-0 mt-4 whitespace-pre-line rounded-lg border border-line bg-surface-2/40 p-4 text-[14.5px] leading-relaxed text-ink/90">
                {q.body}
              </p>
            )}
            {q.status === "closed" && (
              <p className="m-0 mt-4 rounded-md bg-surface-2 px-3 py-2 text-[12.5px] text-muted">
                🔒 This question is closed to new answers.
              </p>
            )}
          </div>

          {/* warn form (moderators) */}
          {warnTarget && (
            <div className="mt-6">
              <WarnForm
                target={warnTarget}
                existing={warningsOf(db, warnTarget.key)}
                onCancel={() => setWarnTarget(null)}
                onSubmit={(reason, note) => {
                  const w = warnUser(db, warnTarget, reason, note, modKey, modName, modEmail, true);
                  if (w) {
                    logAudit("qa_warn", `Warned ${warnTarget.name || warnTarget.key}: ${reason}`, "warn", note || "", modEmail || modKey);
                    toast.toast("Warning issued — repeat offenders get flagged on the board.", "ok");
                  }
                  setWarnTarget(null);
                }}
              />
            </div>
          )}

          {/* answers */}
          <div className="mt-8">
            <h2 className="m-0 text-[17px] font-bold text-ink">
              Answers <span className="text-muted">({answers.length})</span>
            </h2>
            <p className="m-0 mt-1 text-[12px] text-muted">
              Helpful answers earn XP — each upvote <b className="text-ink">+5</b> (max 25 per answer), an
              accepted best answer <b className="text-ink">+30</b>. No self-upvotes, and Q&amp;A XP is capped at
              150/month, so points always come from other students.
            </p>
            {isMod && hiddenCount > 0 && (
              <p className="m-0 mt-2 text-[12px] font-semibold text-red-600/90 dark:text-red-400">
                🙈 {hiddenCount} answer{hiddenCount === 1 ? "" : "s"} hidden by moderators — visible to staff only.
              </p>
            )}
            <div className="mt-4 space-y-4">
              {answers.length ? (
                answers.map((a) => {
                  const mine = meKey !== "" && a.authorKey === meKey;
                  const voted = upvoted(a.id);
                  const aWarnings = isMod ? warningsOf(db, a.authorKey) : [];
                  return (
                    <div
                      key={a.id}
                      className={`card p-5 ${
                        a.hidden
                          ? "border-2 border-red-200 opacity-80 dark:border-red-500/30"
                          : a.accepted
                            ? "border-2 border-emerald-300 dark:border-emerald-500/50"
                            : ""
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-bold text-ink">{a.authorName}</span>
                        <span className="text-[12px] text-muted">{relativeAgo(a.at)}</span>
                        {a.accepted && (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                            ★ Best answer
                          </span>
                        )}
                        {a.hidden && (
                          <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-700 dark:bg-red-500/15 dark:text-red-300">
                            🙈 Hidden by moderator
                          </span>
                        )}
                        {isMod && aWarnings.length >= 2 && (
                          <span
                            className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-700 dark:bg-red-500/15 dark:text-red-300"
                            title={aWarnings.map((w) => `${w.reason} — ${relativeAgo(w.at)}`).join(" · ")}
                          >
                            🚩 {aWarnings.length} warnings
                          </span>
                        )}
                        <div className="ml-auto flex items-center gap-2">
                          {mine ? (
                            <span
                              className="rounded-md bg-surface-2 px-2.5 py-1.5 text-[12px] font-bold text-muted"
                              title="You can't upvote your own answer"
                            >
                              ▲ {a.upvotes || 0}
                            </span>
                          ) : (
                            <button
                              className={`btn btn-outline btn-sm ${voted ? "!border-gold !text-gold" : ""}`}
                              onClick={() => {
                                if (!toggleAnswerUpvote(db, q, a.id, meKey)) {
                                  toast.toast("You can't upvote your own answer.", "err");
                                  return;
                                }
                                logAudit("qa_upvote", `Upvoted an answer on: ${q.title}`, "info", "", person?.email || "");
                              }}
                              aria-pressed={voted}
                            >
                              ▲ {a.upvotes || 0}
                            </button>
                          )}
                          {isAuthor && (
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => {
                                acceptAnswer(db, q, a.id, meKey);
                                logAudit("qa_accept", a.accepted ? `Unmarked best answer on: ${q.title}` : `Accepted best answer on: ${q.title}`, "info", "", meKey);
                                toast.toast(a.accepted ? "Best answer unmarked." : "Marked as the best answer!", "ok");
                              }}
                            >
                              {a.accepted ? "Unmark best" : "★ Best answer"}
                            </button>
                          )}
                          {isMod && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                const wasHidden = a.hidden;
                                setAnswerHidden(db, q, a.id, !wasHidden, modKey, modName, true);
                                logAudit("qa_hide", `${wasHidden ? "Unhid" : "Hidden"} an answer on: ${q.title}`, wasHidden ? "info" : "warn", "", modEmail || modKey);
                                toast.toast(wasHidden ? "Answer restored for everyone." : "Answer hidden — students can no longer see it.", "ok");
                              }}
                            >
                              {a.hidden ? "👁 Restore" : "🙈 Hide"}
                            </button>
                          )}
                          {isMod && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => setWarnTarget({ key: a.authorKey, name: a.authorName, email: a.authorKey })}
                            >
                              ⚠️ Warn
                            </button>
                          )}
                          {mine && !a.accepted && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                deleteAnswerLocal(q.id, a.id, meKey);
                                toast.toast("Answer removed.", "ok");
                              }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="m-0 mt-3 whitespace-pre-line text-[14px] leading-relaxed text-ink/90">{a.body}</p>
                    </div>
                  );
                })
              ) : (
                <EmptyState icon="💡">No answers yet — be the first to help!</EmptyState>
              )}
            </div>
          </div>

          {/* answer box */}
          <div className="card mt-8 p-5">
            <h2 className="m-0 text-[16px] font-bold text-ink">✍️ Your answer</h2>
            {person ? (
              <form
                className="mt-3 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitAnswer();
                }}
              >
                <textarea
                  className="textarea w-full"
                  rows={4}
                  placeholder="Share what you know — a senior's experience is gold here."
                  value={answerBody}
                  onChange={(e) => setAnswerBody(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" disabled={q.status === "closed"}>
                  {q.status === "closed" ? "Closed to answers" : "Post answer"}
                </button>
              </form>
            ) : (
              <>
                <p className="m-0 mt-2 text-[13px] text-muted">Sign in to answer — it takes one quick step.</p>
                <button className="btn btn-primary mt-3" onClick={() => setAskIdentity(true)}>
                  Answer this question
                </button>
                {askIdentity && (
                  <IdentityPrompt
                    onIdentity={(p) => {
                      setPerson(p);
                      setAskIdentity(false);
                    }}
                    onCancel={() => setAskIdentity(false)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/** Delete one of your own answers (author only). */
function deleteAnswerLocal(qid: string, answerId: string, actorKey: string) {
  mutate((d) => {
    const t = d.questions.find((x) => x.id === qid);
    if (!t) return;
    t.answers = t.answers.filter((a) => !(a.id === answerId && a.authorKey === actorKey));
  });
}

/** Inline moderator form to warn a Q&A participant (author or answerer). */
function WarnForm({
  target,
  existing,
  onCancel,
  onSubmit,
}: {
  target: { key: string; name: string; email?: string };
  existing: Warning[];
  onCancel: () => void;
  onSubmit: (reason: string, note: string) => void;
}) {
  const [reason, setReason] = useState<string>(WARN_REASONS[0]);
  const [note, setNote] = useState("");
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-500/25 dark:bg-amber-500/5">
      <p className="m-0 text-[13.5px] font-bold text-ink">⚠️ Warn {target.name || target.key}</p>
      {existing.length > 0 && (
        <p className="m-0 mt-1 text-[12px] text-amber-800 dark:text-amber-300">
          Already warned {existing.length}×: {existing.map((w) => w.reason).join(", ")}
          {existing.length >= 2 ? " — repeat offender" : ""}
        </p>
      )}
      <div className="mt-3 space-y-2.5">
        <select className="select w-full" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Warning reason">
          {WARN_REASONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <textarea
          className="textarea w-full"
          rows={2}
          placeholder="Private note for the record (optional) — visible only to moderators."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          aria-label="Warning note"
        />
      </div>
      <div className="mt-3 flex gap-2">
        <button
          className="btn btn-sm"
          style={{ background: "#FFB606", color: "#002147", borderColor: "#FFB606" }}
          onClick={() => onSubmit(reason, note)}
        >
          Issue warning
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function QMissing() {
  return (
    <div className="container-x py-16 text-center">
      <div className="text-5xl">🤔</div>
      <h1 className="mt-3 text-xl font-bold text-ink">Question not found</h1>
      <p className="text-muted">This question doesn't exist or was removed.</p>
      <Link href="/questions" className="btn btn-primary mt-4 no-underline">
        Browse the Q&A board
      </Link>
    </div>
  );
}

function QDetailSkeleton() {
  return (
    <div className="container-x py-10">
      <Skeleton className="h-6 w-64" />
      <div className="mx-auto mt-8 max-w-3xl">
        <Skeleton className="h-40" />
        <Skeleton className="mt-4 h-28" />
        <Skeleton className="mt-4 h-28" />
      </div>
    </div>
  );
}
