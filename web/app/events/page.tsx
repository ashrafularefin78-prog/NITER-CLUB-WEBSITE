import type { Metadata } from "next";
import EventsView from "@/components/views/events";

export const metadata: Metadata = {
  title: "Events & RSVP",
  description:
    "Every club event on one shared calendar — RSVP in a tap, check in with a door code at the entrance, and earn attendance certificates.",
};

export default function EventsPage() {
  return <EventsView />;
}
