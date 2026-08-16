import type { Database, Question, QuestionAnswer, QuestionStatus, Warning } from "./types";
import { mutate } from "./store";
import { personKey, uid } from "./utils";
import type { Person } from "./events";

export const QA_CATEGORIES = [
  "Academics & Courses",
  "Internships & Placements",
  "Textile / RMG Industry",
  "Clubs & Extracurriculars",
  "Career & Higher Studies",
  "Projects & Skills",
  "Campus Life",
  "Other",
] as const;

export const QA_ANONYMOUS_NAME = "Anonymous student";

export const WARN_REASONS = [
  "Spam or advertising",
  "Harassment or bullying",
  "Off-topic",
  "Misinformation",
  "Plagiarism",
  "Other",
] as const;

export function questionById(db: Database, id: string): Question | undefined {
  return (db.questions || []).find((q) => q.id === id);
}

export function displayNameOf(person: Person, anonymous: boolean): string {
  return anonymous ? QA_ANONYMOUS_NAME : person.name.trim() || person.email;
}

/** Ask a new question. Returns the created question (null if missing identity). */
export function askQuestion(
  db: Database,
  person: Person,
  q: { title: string; body: string; category: string; anonymous: boolean }
): Question | null {
  const key = personKey(person);
  if (!key) return null;
  const question: Question = {
    id: uid("q"),
    title: q.title.trim(),
    body: q.body.trim(),
    category: q.category || "Other",
    authorKey: key,
    authorName: displayNameOf(person, q.anonymous),
    anonymous: !!q.anonymous,
    at: new Date().toISOString(),
    answers: [],
    status: "open",
  };
  mutate((d) => {
    if (!Array.isArray(d.questions)) d.questions = [];
    d.questions.unshift(question);
  });
  return question;
}

/** Add an answer to a question. Returns the created answer. */
export function addAnswer(db: Database, q: Question, person: Person, body: string): QuestionAnswer | null {
  const key = personKey(person);
  if (!key || !body.trim()) return null;
  const answer: QuestionAnswer = {
    id: uid("qa"),
    authorKey: key,
    authorName: person.name.trim() || person.email,
    at: new Date().toISOString(),
    body: body.trim(),
    upvotes: 0,
    accepted: false,
  };
  mutate((d) => {
    const t = d.questions.find((x) => x.id === q.id);
    if (!t) return;
    if (!Array.isArray(t.answers)) t.answers = [];
    t.answers.push(answer);
    if (t.status === "closed") t.status = "open";
  });
  return answer;
}

/** Mark one answer as the accepted/best answer (author only), or unmark. */
export function acceptAnswer(db: Database, q: Question, answerId: string, actorKey: string) {
  mutate((d) => {
    const t = d.questions.find((x) => x.id === q.id);
    if (!t || t.authorKey !== actorKey) return;
    const target = t.answers.find((a) => a.id === answerId);
    if (!target) return;
    const nowAccepted = !target.accepted;
    t.answers.forEach((a) => (a.accepted = a.id === answerId ? nowAccepted : false));
    t.status = nowAccepted ? "answered" : t.answers.some((a) => a.accepted) ? "answered" : "open";
  });
}

/** Close or reopen a question (author or admin). */
export function setQuestionStatus(db: Database, q: Question, status: QuestionStatus, actorKey: string, isAdmin = false) {
  mutate((d) => {
    const t = d.questions.find((x) => x.id === q.id);
    if (!t || (!isAdmin && t.authorKey !== actorKey)) return;
    t.status = status;
  });
}

/** Delete a question (author or admin). Returns whether it was removed. */
export function deleteQuestion(db: Database, qid: string, actorKey: string, isAdmin: boolean): boolean {
  let removed = false;
  mutate((d) => {
    const t = d.questions.find((x) => x.id === qid);
    if (!t) return;
    if (!isAdmin && t.authorKey !== actorKey) return;
    d.questions = d.questions.filter((x) => x.id !== qid);
    removed = true;
  });
  return removed;
}

/* ---------------- upvotes ---------------- */

export function answerUpvoteKey(answerId: string): string {
  return "qa-up-" + answerId;
}

export function upvoted(answerId: string): boolean {
  try {
    return sessionStorage.getItem(answerUpvoteKey(answerId)) === "1";
  } catch {
    return false;
  }
}

/** Toggle an upvote on an answer. Self-upvotes are refused (returns false) so
 *  helpful-answer XP can't be farmed — upvotes must come from other students. */
export function toggleAnswerUpvote(db: Database, q: Question, answerId: string, voterKey: string): boolean {
  const answer = q.answers.find((a) => a.id === answerId);
  if (!answer) return false;
  if (voterKey && answer.authorKey === voterKey) return false;
  const was = upvoted(answerId);
  mutate((d) => {
    const t = d.questions.find((x) => x.id === q.id);
    if (!t) return;
    const a = t.answers.find((x) => x.id === answerId);
    if (!a) return;
    a.upvotes = Math.max(0, (a.upvotes || 0) + (was ? -1 : 1));
  });
  try {
    sessionStorage.setItem(answerUpvoteKey(answerId), was ? "0" : "1");
  } catch {
    /* ignore */
  }
  return true;
}

/* ---------------- moderation ---------------- */

/** Pin or unpin a question (staff only). Returns the new pinned state, or null
 *  if the question is gone / the actor isn't allowed. */
export function togglePinQuestion(
  db: Database,
  q: Question,
  actorKey: string,
  actorName: string,
  canModerate: boolean
): boolean | null {
  if (!canModerate) return null;
  let next: boolean | null = null;
  mutate((d) => {
    const t = d.questions.find((x) => x.id === q.id);
    if (!t) return;
    next = !t.pinned;
    t.pinned = next;
    t.pinnedAt = next ? new Date().toISOString() : "";
    t.pinnedBy = next ? actorName : "";
  });
  return next;
}

/** Hide or unhide an answer (staff only). Returns whether the target exists. */
export function setAnswerHidden(
  db: Database,
  q: Question,
  answerId: string,
  hidden: boolean,
  actorKey: string,
  actorName: string,
  canModerate: boolean
): boolean {
  if (!canModerate) return false;
  let ok = false;
  mutate((d) => {
    const t = d.questions.find((x) => x.id === q.id);
    if (!t) return;
    const a = t.answers.find((x) => x.id === answerId);
    if (!a) return;
    a.hidden = hidden;
    a.hiddenAt = hidden ? new Date().toISOString() : "";
    a.hiddenBy = hidden ? actorName : "";
    // Hiding the accepted answer un-accepts it, so a hidden spam answer never
    // keeps the question showing as "✓ Answered".
    if (hidden && a.accepted) {
      a.accepted = false;
      t.status = t.answers.some((x) => x.accepted) ? "answered" : "open";
    }
    ok = true;
  });
  return ok;
}

/** Issue a moderation warning to a Q&A participant (staff only). Returns the
 *  new warning, or null if the actor isn't allowed. */
export function warnUser(
  db: Database,
  target: { key: string; name: string; email?: string },
  reason: string,
  note: string,
  actorKey: string,
  actorName: string,
  actorEmail: string,
  canModerate: boolean
): Warning | null {
  if (!canModerate || !target.key) return null;
  const w: Warning = {
    id: uid("warn"),
    targetKey: target.key,
    targetName: target.name || target.email || target.key,
    targetEmail: target.email || target.key,
    reason: reason || "Other",
    note: note.trim() || undefined,
    issuedBy: actorName || actorEmail || actorKey,
    issuedByEmail: actorEmail || undefined,
    at: new Date().toISOString(),
  };
  mutate((d) => {
    if (!Array.isArray(d.warnings)) d.warnings = [];
    d.warnings.unshift(w);
  });
  return w;
}

/** All warnings issued to one person, newest first. */
export function warningsOf(db: Database, targetKey: string): Warning[] {
  return (db.warnings || [])
    .filter((w) => w.targetKey === targetKey)
    .sort((a, b) => b.at.localeCompare(a.at));
}

/* ---------------- listing ---------------- */

export function sortedQuestions(db: Database, status: "all" | QuestionStatus, category: string): Question[] {
  return (db.questions || [])
    .filter((q) => (status === "all" ? true : q.status === status))
    .filter((q) => (category === "all" ? true : q.category === category))
    .sort((a, b) => {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      const ta = a.pinnedAt || a.at;
      const tb = b.pinnedAt || b.at;
      return tb.localeCompare(ta);
    });
}

export function statusPillOf(q: Question): { label: string; cls: string } {
  if (q.status === "closed") return { label: "🔒 Closed", cls: "bg-surface-2 text-muted" };
  if (q.status === "answered") return { label: "✓ Answered", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300" };
  return { label: "Open", cls: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300" };
}
