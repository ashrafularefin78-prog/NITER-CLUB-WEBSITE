import type { Metadata } from "next";
import QuestionsView from "@/components/views/questions";

export const metadata: Metadata = {
  title: "Q&A Board",
  description:
    "Ask anything and get answers from NITER students — courses, internships, the textile/RMG industry, clubs and more. Postable anonymously.",
};

export default function QuestionsPage() {
  return <QuestionsView />;
}
