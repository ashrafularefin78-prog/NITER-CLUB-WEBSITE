import type { Metadata } from "next";
import { createSeed } from "@/lib/seed";
import ClubDetailView from "@/components/views/club-detail";
import { JsonLd } from "@/components/jsonld";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const club = createSeed().clubs.find((c) => c.id === decodeURIComponent(id));
  if (!club) return { title: "Club not found" };
  return {
    title: club.name,
    description: club.tagline + " — " + club.about.slice(0, 140) + "…",
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const club = createSeed().clubs.find((c) => c.id === decodeURIComponent(id));
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const jsonLd = club
    ? {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: club.name,
        alternateName: club.short,
        url: `${base}/club/${club.id}`,
        description: club.tagline,
        email: club.email || undefined,
        logo: club.icon,
        address: { "@type": "PostalAddress", addressLocality: "Dhaka", addressCountry: "BD" },
      }
    : null;
  return (
    <>
      {jsonLd && <JsonLd data={jsonLd} />}
      <ClubDetailView clubId={decodeURIComponent(id)} />
    </>
  );
}
