import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider, ToastProvider } from "@/components/providers";
import { SiteFooter, SiteHeader } from "@/components/layout";
import { AuthProvider } from "@/lib/auth";

/* Poppins is the single typeface across the whole site (05-DESIGN.md):
   weights 400/500/600/700 only, generous line heights for EN + BN. */
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NITER Clubs Portal — One portal for every club",
    template: "%s — NITER Clubs Portal",
  },
  description:
    "Notices, forms and memberships for every club at the National Institute of Textile Engineering and Research (NITER).",
  applicationName: "NITER Clubs Portal",
  keywords: ["NITER", "clubs", "notices", "forms", "Bangladesh", "student portal", "extracurricular"],
  openGraph: {
    type: "website",
    title: "NITER Clubs Portal — One portal for every club",
    description:
      "Notices, forms and memberships for every club at NITER. Club executives can post notices and publish membership forms in seconds.",
    siteName: "NITER Clubs Portal",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "NITER Clubs Portal",
    description: "Notices, forms and memberships for every club at NITER.",
  },
};

export const viewport: Viewport = {
  themeColor: "#002147",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={poppins.variable}>
      <body className="font-sans">
        <Script id="theme-init" strategy="beforeInteractive">
          {`try{if(localStorage.getItem("niter-theme")==="dark"){document.documentElement.setAttribute("data-theme","dark");}else if(!localStorage.getItem("niter-theme")&&window.matchMedia("(prefers-color-scheme: dark)").matches){document.documentElement.setAttribute("data-theme","dark");}}catch(e){}`}
        </Script>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <a
                href="#main"
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[110] focus:rounded-lg focus:bg-gold focus:px-4 focus:py-2 focus:text-navy"
              >
                Skip to content
              </a>
              <SiteHeader />
              <main id="main">{children}</main>
              <SiteFooter />
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
