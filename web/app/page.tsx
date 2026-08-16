import type { Metadata } from "next";
import HomeView from "@/components/views/home";
import { JsonLd } from "@/components/jsonld";

export const metadata: Metadata = {
  title: "NITER Clubs Portal — One portal for every club",
  description:
    "Discover notices, register for events, join clubs, and fill forms — all in one place. Club executives can post notices and publish membership forms in seconds.",
};

const siteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "NITER Clubs Portal",
  alternateName: "NITER Clubs",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  description: "Notices, forms and memberships for every club at NITER.",
  inLanguage: "en",
  publisher: {
    "@type": "CollegeOrUniversity",
    name: "National Institute of Textile Engineering and Research",
    alternateName: "NITER",
  },
};

export default function Page() {
  return (
    <>
      <JsonLd data={siteJsonLd} />
      <HomeView />
    </>
  );
}
