import type { MetadataRoute } from "next";
import { createSeed } from "@/lib/seed";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const db = createSeed();
  const lastModified = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified },
    { url: `${BASE}/notices`, lastModified },
    { url: `${BASE}/clubs`, lastModified },
    { url: `${BASE}/portal`, lastModified },
    { url: `${BASE}/it-support`, lastModified },
    { url: `${BASE}/it-desk`, lastModified },
  ];
  const clubRoutes: MetadataRoute.Sitemap = db.clubs.map((c) => ({
    url: `${BASE}/club/${c.id}`,
    lastModified,
  }));
  const formRoutes: MetadataRoute.Sitemap = db.forms.map((f) => ({
    url: `${BASE}/form/${f.id}`,
    lastModified,
  }));
  return [...staticRoutes, ...clubRoutes, ...formRoutes];
}
