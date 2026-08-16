import type { Metadata } from "next";
import PassportView from "@/components/views/passport";

export const metadata: Metadata = {
  title: "Club Passport",
  description:
    "Every event you check in to stamps your NITER club passport — collect stamps across clubs and unlock the Club Hopper badge.",
};

export default function PassportPage() {
  return <PassportView />;
}
