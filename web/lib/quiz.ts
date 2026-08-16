import type { Club, Database } from "./types";

export interface QuizOption {
  label: string;
  tags: string[];
}

export interface QuizQuestion {
  q: string;
  options: QuizOption[];
}

/** A short, campus-flavoured interest quiz. Every answer maps to club tags, so
 *  a student's picks score against each club's personality. */
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    q: "You have a free Saturday afternoon on campus. What pulls you in?",
    options: [
      { label: "Building something that works — an app, a bot, a circuit", tags: ["coding", "robotics"] },
      { label: "Learning how the world works — science fair, observatory night", tags: ["science", "research"] },
      { label: "Polishing my CV or practicing for interviews", tags: ["career", "networking"] },
      { label: "Shooting or editing a short film", tags: ["film", "photography"] },
    ],
  },
  {
    q: "Pick the project that genuinely excites you.",
    options: [
      { label: "A hackathon app finished in 24 hours", tags: ["coding", "tech"] },
      { label: "A science model for the annual exhibition", tags: ["science", "research"] },
      { label: "A line-following robot for the contest", tags: ["robotics", "hardware"] },
      { label: "A photo essay about campus life", tags: ["photography", "arts"] },
    ],
  },
  {
    q: "You're handed a microphone. What happens?",
    options: [
      { label: "I run the debate or give a talk", tags: ["speaking", "writing"] },
      { label: "I perform — music or drama", tags: ["music", "theatre"] },
      { label: "I interview people and write the story", tags: ["media", "writing"] },
      { label: "I hand it back and capture the moment instead", tags: ["photography", "film"] },
    ],
  },
  {
    q: "You win a 10,000 taka grant for a student project. You…",
    options: [
      { label: "Build a portfolio site and a side project", tags: ["coding", "design"] },
      { label: "Launch a small campus business", tags: ["business", "career"] },
      { label: "Organize a blood donation camp", tags: ["volunteering", "community"] },
      { label: "Buy camera or music gear for the next big event", tags: ["photography", "music"] },
    ],
  },
  {
    q: "Which challenge sounds the most fun?",
    options: [
      { label: "Teaching spoken English to juniors", tags: ["speaking", "community"] },
      { label: "Organizing an inter-department tournament", tags: ["sports", "community"] },
      { label: "Co-authoring a research paper", tags: ["research", "science"] },
      { label: "Building an IoT device that monitors the lab", tags: ["hardware", "coding"] },
    ],
  },
  {
    q: "Your ideal club meetup is…",
    options: [
      { label: "A hands-on workshop where I learn a new skill", tags: ["coding", "design"] },
      { label: "A mock interview round with honest feedback", tags: ["career", "networking"] },
      { label: "A jam session or play rehearsal", tags: ["music", "theatre"] },
      { label: "A football or volleyball practice", tags: ["sports"] },
    ],
  },
  {
    q: "Pick a superpower.",
    options: [
      { label: "Speak any language fluently", tags: ["speaking", "writing"] },
      { label: "Fix any machine or device", tags: ["hardware", "tech"] },
      { label: "Persuade anyone in a negotiation", tags: ["business", "speaking"] },
      { label: "Create something beautiful from nothing", tags: ["arts", "design"] },
    ],
  },
  {
    q: "What recharges you after a long week?",
    options: [
      { label: "Building alone in my own space", tags: ["coding", "research"] },
      { label: "A big crowd, loud games, team energy", tags: ["sports", "community"] },
      { label: "Deep conversations with a few friends", tags: ["writing", "arts"] },
      { label: "Doing something meaningful for others", tags: ["volunteering", "community"] },
    ],
  },
];

export interface QuizMatch {
  club: Club;
  score: number;
  pct: number;
  matchedTags: string[];
}

/** Score every club against the given answers (option index per question).
 *  Returns matches sorted best-first; `pct` is relative to the top club. */
export function quizMatches(db: Database, answers: number[]): QuizMatch[] {
  const picked = new Set<string>();
  QUIZ_QUESTIONS.forEach((qq, i) => {
    const opt = qq.options[answers[i]];
    if (opt) opt.tags.forEach((t) => picked.add(t));
  });
  const results: QuizMatch[] = [];
  (db.clubs || []).forEach((club) => {
    const tags = club.tags || [];
    const matched = [...picked].filter((t) => tags.includes(t));
    if (!matched.length) return;
    results.push({ club, score: matched.length, pct: 0, matchedTags: matched });
  });
  const top = results.reduce((m, r) => Math.max(m, r.score), 0);
  if (!top) return [];
  return results
    .map((r) => ({ ...r, pct: Math.round((r.score / top) * 100) }))
    .sort((a, b) => b.score - a.score || a.club.name.localeCompare(b.club.name));
}
