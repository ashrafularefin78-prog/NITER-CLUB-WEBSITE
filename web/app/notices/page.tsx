import type { Metadata } from "next";
import NoticesView from "@/components/views/notices";

export const metadata: Metadata = {
  title: "Notices",
  description: "All club notices at NITER — events, registrations, workshops and announcements.",
};

export default function Page() {
  return <NoticesView />;
}
