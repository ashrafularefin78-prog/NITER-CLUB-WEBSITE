import type { Metadata } from "next";
import { createSeed } from "@/lib/seed";
import FormView from "@/components/views/form";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const form = createSeed().forms.find((f) => f.id === id);
  if (!form) return { title: "Form not found" };
  return {
    title: form.title,
    description: form.description || `Fill the ${form.title} on the NITER Clubs Portal.`,
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <FormView formId={id} />;
}
