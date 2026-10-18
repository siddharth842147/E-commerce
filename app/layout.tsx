import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { CartProviderServer } from "@/components/shared/CartProviderServer";
import { siteConfig } from "@/config/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
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
