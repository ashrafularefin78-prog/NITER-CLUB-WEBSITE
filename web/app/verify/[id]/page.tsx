import type { Metadata } from "next";
import VerifyCertView from "@/components/views/verify-cert";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Verify ${id}`,
    description:
      "Confirm a participation certificate issued by the NITER Clubs Portal is genuine.",
    robots: { index: false, follow: true },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <VerifyCertView certId={decodeURIComponent(id)} />;
}
