import type { Metadata } from "next";
import PortalView from "@/components/views/portal";

export const metadata: Metadata = {
  title: "Member Portal",
  description: "Sign in to manage your club — notices, forms, submissions and complaints.",
};

export default function Page() {
  return <PortalView />;
}
