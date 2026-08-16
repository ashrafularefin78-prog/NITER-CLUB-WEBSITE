import type { Metadata } from "next";
import LeaderboardView from "@/components/views/leaderboard";

export const metadata: Metadata = {
  title: "Contribution Leaderboard",
  description:
    "XP, badges and rankings for NITER club members — earned from real activity like attendance, applications and memberships.",
};

export default function LeaderboardPage() {
  return <LeaderboardView />;
}
