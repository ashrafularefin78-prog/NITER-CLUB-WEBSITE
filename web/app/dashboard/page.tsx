import type { Metadata } from "next";
import DashboardView from "@/components/views/dashboard";

export const metadata: Metadata = {
  title: "My Dashboard — NITER Clubs Portal",
  description:
    "Your applications, club memberships, join requests and event feed — in one place.",
};

export default function DashboardPage() {
  return <DashboardView />;
}
