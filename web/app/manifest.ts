import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NITER Clubs Portal",
    short_name: "NITER Clubs",
    description: "Notices, forms and memberships for every club at NITER.",
    start_url: "/",
    display: "standalone",
    background_color: "#002147",
    theme_color: "#002147",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
