"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";

export function Footer() {
  const [currentYear, setCurrentYear] = useState<number>(2026);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="w-full bg-surface-container-low border-t border-surface-container pt-space-xl pb-space-lg text-on-surface">
      <div className="max-w-[1360px] mx-auto px-margin">
        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-lg pb-space-xl border-b border-surface-container">
          {/* Brand Info (2 Columns on large screens) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-extrabold text-base">
                K
              </span>
              <span className="font-headline-md text-headline-md font-bold tracking-tight text-primary">
                {siteConfig.name}
              </span>
            </Link>

            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm leading-relaxed">
              India&apos;s premium curated direct-to-consumer destination for refined lifestyle, tech, and home aesthetics.
            </p>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                Fast Delivery across serviceable Pin Codes
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-3 py-1 bg-surface-container rounded-full font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary">
                  verified
                </span>
                100% Authentic
              </span>
              <span className="px-3 py-1 bg-surface-container rounded-full font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">
                  shield
                </span>
                Secure UPI &amp; Card Checkout
              </span>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-space-sm">
              Categories
            </h4>
            <ul className="space-y-2.5 font-body-sm text-body-sm text-on-surface-variant">
              <li>
                <Link href="/shop?category=books" className="hover:text-primary transition-colors">
                  Books &amp; Literature
                </Link>
              </li>
              <li>
                <Link href="/shop?category=clothing" className="hover:text-primary transition-colors">
                  Clothing &amp; Apparel
                </Link>
              </li>
              <li>
                <Link href="/shop?category=electronics" className="hover:text-primary transition-colors">
                  Electronics &amp; Audio
                </Link>
              </li>
              <li>
                <Link href="/shop?category=home-kitchen" className="hover:text-primary transition-colors">
                  Home &amp; Kitchen
                </Link>
              </li>
              <li>
                <Link href="/shop?category=sports" className="hover:text-primary transition-colors">
                  Sports &amp; Fitness
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-space-sm">
              Customer Care
            </h4>
            <ul className="space-y-2.5 font-body-sm text-body-sm text-on-surface-variant">
              <li>
                <Link href="/account/orders" className="hover:text-primary transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-primary transition-colors">
                  Shipping &amp; Delivery
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-primary transition-colors">
                  Refund &amp; Return Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Newsletter */}
          <div>
            <h4 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-space-sm">
              Stay Updated
            </h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm">
              Exclusive discounts, artisanal drops, and weekly offers in your inbox.
            </p>
            <div className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-surface-container"
              />
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
              >
                <span>Subscribe</span>
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            &copy; {currentYear} {siteConfig.name} Marketplace India Pvt. Ltd. All rights reserved.
          </p>

          {/* Payment Badges */}
          <div className="flex items-center gap-2">
            {siteConfig.footer.paymentBadges.map((badge) => (
              <span
                key={badge}
                className="px-2.5 py-1 bg-surface-container rounded-lg font-label-sm text-label-sm text-on-surface-variant font-bold"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
