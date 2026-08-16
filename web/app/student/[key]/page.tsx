import type { Metadata } from "next";
import StudentProfileView from "@/components/views/student-profile";

interface Props {
  params: Promise<{ key: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key } = await params;
  const name = key ? decodeURIComponent(key).replace(/^local-/, "") : "";
  return {
    title: name ? `${name} — profile — NITER Clubs Portal` : "Student profile — NITER Clubs Portal",
    description: "A NITER student's public profile — clubs, memberships and applications.",
  };
}

export default async function Page({ params }: Props) {
  const { key } = await params;
  return <StudentProfileView studentKey={key} />;
}
