import type { Metadata } from "next";
import StudentsView from "@/components/views/students";

export const metadata: Metadata = {
  title: "Student directory — NITER Clubs Portal",
  description:
    "The official B.Sc. CSE 2025-2026 student directory — search students by name or NITER student ID.",
};

export default function StudentsPage() {
  return <StudentsView />;
}
