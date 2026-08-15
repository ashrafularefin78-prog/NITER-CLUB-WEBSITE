"use client";

import Link from "next/link";
import { useState } from "react";
import type { QuestionStatus } from "@/lib/types";
import { useDb } from "@/lib/store";
import { relativeAgo } from "@/lib/utils";
import { QA_CATEGORIES, askQuestion, sortedQuestions, statusPillOf } from "@/lib/qa";
import { logAudit } from "@/lib/audit";
import { useToast } from "@/components/providers";
import { IdentityPrompt, useIdentity } from "@/components/identity";
import { EmptyState, PageHero, Skeleton } from "@/components/ui";

const STATUS_TABS: { key: "all" | QuestionStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "answered", label: "Answered" },
  { key: "closed", label: "Closed" },
];

export default function QuestionsView() {
  const db = useDb();
  const [status, setStatus] = useState<"all" | QuestionStatus>("all");
  const [category, setCategory] = useState("all");

  if (!db) return <QuestionsSkeleton />;

  const list = sortedQuestions(db, status, category);

  return (
    <>
      <PageHero
        eyebrow="Students"
        title="💬 Q&A board"
        sub="Ask anything — courses, internships, the textile/RMG industry, which clubs are worth joining. Anyone can answer; questions can be posted anonymously."
      />

      <div className="container-x py-10">
        <div className="mb-6">
          <AskBox />
        </div>

        <div className="tabs" role="tablist" aria-label="Question status">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={status === t.key}
              className={`tab ${status === t.key ? "active" : ""}`}
              onClick={() => setStatus(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setCategory("all")}
            className={`rounded-full border px-3 py-1 text-[12.5px] font-semibold transition ${
              category === "all" ? "border-navy bg-navy text-white dark:border-gold dark:bg-gold dark:text-navy" : "border-hairline text-muted hover:border-navy"
            }`}
          >
            All topics
          </button>
          {QA_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(category === c ? "all" : c)}
              className={`rounded-full border px-3 py-1 text-[12.5px] font-semibold transition ${
                category === c ? "border-navy bg-navy text-white dark:border-gold dark:bg-gold dark:text-navy" : "border-hairline text-muted hover:border-navy"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div key={status + category} className="anim-fade-up mt-6 space-y-3">
          {list.length ? (
            list.map((q) => {
              const pill = statusPillOf(q);
              const visible = q.answers.filter((a) => !a.hidden);
              const totalUp = visible.reduce((s, a) => s + (a.upvotes || 0), 0);
              return (
                <Link key={q.id} href={`/questions/${q.id}`} className="card block p-5 no-underline transition hover:border-navy/30 hover:shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${pill.cls}`}>{pill.label}</span>
                    <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-muted">{q.category}</span>
                    {q.anonymous && (
                      <span className="rounded-full border border-dashed border-line px-2.5 py-1 text-[11px] font-semibold text-muted">
                        🎭 Anonymous
                      </span>
                    )}
                    {q.pinned && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                        📌 Pinned
                      </span>
                    )}
                  </div>
                  <h2 className="m-0 mt-2.5 text-[16.5px] font-bold text-ink">{q.title}</h2>
                  {q.body && <p className="m-0 mt-1 line-clamp-2 text-[13.5px] text-muted">{q.body}</p>}
                  <p className="m-0 mt-2.5 text-[12px] text-muted">
                    {q.authorName} · {relativeAgo(q.at)} · {visible.length} answer{visible.length === 1 ? "" : "s"}
                    {totalUp > 0 ? ` · ${totalUp} ▲` : ""}
                  </p>
                </Link>
              );
            })
          ) : (
            <EmptyState icon="💬">
              No questions{status !== "all" ? ` with status “${status}”` : ""}
              {category !== "all" ? ` in “${category}”` : ""} yet — be the first to ask!
            </EmptyState>
          )}
        </div>

        <p className="mt-8 text-[12px] leading-relaxed text-muted">
          💡 Be specific and kind. Answered questions stay public so juniors find them for years — that&apos;s
          the point of a knowledge base instead of a chat group.
        </p>
      </div>
    </>
  );
}

/* ---------------- ask box (identity-gated) ---------------- */

function AskBox() {
  const db = useDb()!;
  const toast = useToast();
  const { person, setPerson } = useIdentity();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<string>(QA_CATEGORIES[0]);
  const [anonymous, setAnonymous] = useState(false);

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-hairline bg-surface-card p-4">
        <p className="m-0 text-[13.5px] text-muted">
          Stuck on an assignment? Curious about internships or the RMG industry? Ask the people who&apos;ve been
          there — juniors benefit every time someone answers.
        </p>
        <button
          className="btn ml-auto no-underline"
          style={{ background: "#FFB606", color: "#002147", borderColor: "#FFB606" }}
          onClick={() => setOpen(true)}
        >
          ✍️ Ask a question
        </button>
      </div>
    );
  }

  const submit = () => {
    if (!person) return;
    if (!title.trim()) return toast.toast("Give your question a title.", "err");
    if (!body.trim()) return toast.toast("Add some detail so people can actually answer.", "err");
    const q = askQuestion(db, person, { title, body, category, anonymous });
    if (!q) return;
    logAudit("qa_ask", `Asked: ${q.title}`, "info", q.category, person.email);
    toast.toast(anonymous ? "Question posted anonymously." : "Question posted!", "ok");
    setOpen(false);
    setTitle("");
    setBody("");
    setAnonymous(false);
  };

  return (
    <div className="max-w-2xl rounded-xl border border-hairline bg-surface-card p-5">
      {!person ? (
        <>
          <p className="m-0 text-[14px] font-bold text-ink">First, who are you?</p>
          <p className="m-0 mt-1 text-[12.5px] text-muted">
            One quick step — you can still choose to post anonymously after.
          </p>
          <div className="mt-3">
            <IdentityPrompt
              onIdentity={(p) => {
                setPerson(p);
              }}
              onCancel={() => setOpen(false)}
            />
          </div>
        </>
      ) : (
        <form
          className="space-y-3 text-left"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            className="input w-full"
            placeholder="Your question — e.g. “How do RMG internship applications usually work?”"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Question title"
          />
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <textarea
              className="textarea w-full"
              rows={3}
              placeholder="Add context — what you've tried, what you're confused about…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              aria-label="Question details"
            />
            <select className="select" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
              {QA_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold">
              <input type="checkbox" className="h-4 w-4 accent-gold" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
              🎭 Post anonymously (your name stays hidden)
            </label>
            <div className="ml-auto flex gap-2">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-sm" style={{ background: "#FFB606", color: "#002147", borderColor: "#FFB606" }}>
                Post question
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

function QuestionsSkeleton() {
  return (
    <div className="container-x py-14">
      <Skeleton className="h-10 w-80" />
      <div className="mt-8 space-y-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    </div>
  );
}
