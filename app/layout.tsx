import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { CartProviderServer } from "@/components/shared/CartProviderServer";
import { siteConfig } from "@/lib/siteConfig";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — Modern Online Shopping`,
    template: `%s | ${siteConfig.name}`,
  },
  description: "Shop curated electronics, apparel, home essentials, books, and fitness gear with express pan-India delivery.",
  metadataBase: new URL(siteConfig.url),
  keywords: [
    "e-commerce",
    "online shopping India",
    "electronics",
    "fashion",
    "home and kitchen",
    "fitness gear",
    "Kartiva",
  ],
  authors: [{ name: "Kartiva Retail" }],
  creator: "Kartiva",
  publisher: "Kartiva",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — Quality Products, Delivered to Your Door`,
    description: "Shop curated electronics, apparel, home essentials, books, and fitness gear with express pan-India delivery.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: "Shop curated electronics, apparel, home essentials, books, and fitness gear with express pan-India delivery.",
    creator: "@kartiva",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

/**
 * Static nav shell shown while the server-side cart/user data loads.
 * No request-time data — purely static HTML.
 */
function NavbarShell() {
  return (
    <header className="sticky top-0 z-40 h-14 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <span className="text-xl font-bold tracking-tight">Kartiva</span>
      </div>
    </header>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-body-md bg-background text-on-surface antialiased">
        {/*
         * CartProviderServer reads cookies (getCart → cookie store).
         * Suspense lets static pages render their shell; the dynamic
         * navbar/cart state streams in on top.
         *
         * NOTE: children is NOT duplicated in the fallback — only the
         * static navbar shell is shown there so no request-time data
         * access occurs in the fallback path.
         */}
        <Suspense fallback={<NavbarShell />}>
          <CartProviderServer>
            <Navbar />
          </CartProviderServer>
        </Suspense>
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
