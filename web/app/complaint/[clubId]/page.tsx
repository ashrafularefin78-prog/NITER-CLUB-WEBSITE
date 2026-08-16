import type { Metadata } from "next";
import { createSeed } from "@/lib/seed";
import { ComplaintView } from "@/components/views/complaints";

interface Props {
  params: Promise<{ clubId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { clubId } = await params;
  const club = createSeed().clubs.find((c) => c.id === decodeURIComponent(clubId));
  return { title: club ? `Complaint box — ${club.name}` : "Complaint box" };
}

export default async function Page({ params }: Props) {
  const { clubId } = await params;
  return <ComplaintView clubId={decodeURIComponent(clubId)} />;
}
