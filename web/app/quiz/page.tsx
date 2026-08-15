import type { Metadata } from "next";
import QuizView from "@/components/views/quiz";

export const metadata: Metadata = {
  title: "Which club fits you?",
  description:
    "Answer eight quick questions and get matched to the NITER clubs that fit your interests and personality.",
};

export default function QuizPage() {
  return <QuizView />;
}
