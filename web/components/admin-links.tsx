"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

/** Footer "Student directory" link — visible to admins only. */
export function AdminOnlyDirectoryLink() {
  const auth = useAuth();
  if (auth.loading || auth.user?.role !== "admin") return null;
  return (
    <li>
      <Link href="/students" className="no-underline transition hover:text-gold">
        Student directory
      </Link>
    </li>
  );
}
