import type { Metadata } from "next";
import { ItDeskView } from "@/components/views/complaints";

export const metadata: Metadata = {
  title: "IT Helpdesk",
  description: "Student-reported IT issues across campus — WiFi, labs, portal and equipment.",
};

export default function Page() {
  return <ItDeskView />;
}
