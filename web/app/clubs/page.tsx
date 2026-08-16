import type { Metadata } from "next";
import ClubsView from "@/components/views/clubs";

export const metadata: Metadata = {
  title: "All clubs",
  description: "Every club at NITER in one place — find your community.",
};

export default function Page() {
  return <ClubsView />;
}
