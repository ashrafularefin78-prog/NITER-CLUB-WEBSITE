import type { Metadata } from "next";
import QuestionDetailView from "@/components/views/question-detail";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Question — NITER Q&A",
    description: "A student question on the NITER Clubs Portal Q&A board.",
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <QuestionDetailView questionId={decodeURIComponent(id)} />;
}
