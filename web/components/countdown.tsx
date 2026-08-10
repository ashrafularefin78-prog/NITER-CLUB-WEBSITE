"use client";

import { timeLeftText, clockTime, clockDate } from "@/lib/utils";
import { useNow } from "@/lib/store";

type Phase = "soon" | "open" | "closed";

export function Countdown({
  start,
  end,
  compact = false,
}: {
  start?: string | null;
  end?: string | null;
  compact?: boolean;
}) {
  useNow();
  const startD = start ? new Date(start) : null;
  const endD = end ? new Date(end) : null;
  const now = Date.now();

  let phase: Phase = "open";
  let target: number | null = null;
  if (startD && now < startD.getTime()) {
    phase = "soon";
    target = startD.getTime();
  } else if (endD && now > endD.getTime()) {
    phase = "closed";
  } else if (endD) {
    phase = "open";
    target = endD.getTime();
  }

  if (phase === "closed") return <span className="cd-closed">Closed</span>;
  if (target == null) return <span className="cd-open">Open</span>;
  const t = timeLeftText(target);
  const label = phase === "soon" ? (compact ? "Opens in " : "Starts in ") : compact ? "⏳ " : "Time left: ";
  return <span className={phase === "soon" ? "cd-soon" : "cd-open"}>{label + t.text}</span>;
}

export function LiveClock() {
  const now = useNow();
  return (
    <div>
      <div className="text-[26px] font-extrabold tabular-nums tracking-tight">{clockTime(now)}</div>
      <div className="mt-0.5 text-[12.5px] opacity-80">{clockDate(now)}</div>
    </div>
  );
}

export function RelativeTime({ ts }: { ts?: string | null }) {
  useNow();
  return <>{ts ? timeAgoLabel(ts) : ""}</>;
}

function timeAgoLabel(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 3600000) return "just now";
  if (diff < 86400000) return Math.floor(diff / 3600000) + "h ago";
  if (diff < 7 * 86400000) return Math.floor(diff / 86400000) + "d ago";
  return new Date(ts).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
