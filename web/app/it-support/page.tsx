import type { Metadata } from "next";
import { ComplaintView } from "@/components/views/complaints";

export const metadata: Metadata = {
  title: "IT Complaint Box",
  description: "Report campus IT issues — WiFi, computer labs, portal problems, hardware and more.",
};

export default function Page() {
  return <ComplaintView isIt />;
}
