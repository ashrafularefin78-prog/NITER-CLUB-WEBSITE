import type { Metadata } from "next";
import EventDetailView from "@/components/views/event-detail";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Event — NITER Clubs Portal",
    description: "Event details, RSVP and check-in on the NITER Clubs Portal.",
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <EventDetailView eventId={decodeURIComponent(id)} />;
}
