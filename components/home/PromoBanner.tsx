"use client";

import { useState } from "react";
import Link from "next/link";
import { showCartToast } from "@/components/shared/CartToast";

export function PromoBanner() {
  const [copied, setCopied] = useState(false);
  const couponCode = "FESTIVE15";

  const handleCopy = () => {
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    showCartToast(
      "Coupon Copied!",
      `Code ${couponCode} copied. Apply at checkout for 15% OFF!`
    );
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section className="w-full py-space-xl bg-surface">
      <div className="max-w-[1360px] mx-auto px-margin">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-primary via-tertiary to-secondary-container p-8 md:p-14 text-white shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Subtle background decorative shapes */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-60 h-60 rounded-full bg-white/5 blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md">
              <span className="material-symbols-outlined text-[16px] text-amber-300">
                celebration
              </span>
              <span className="font-label-sm text-label-sm uppercase font-bold tracking-wider text-white">
                Festive Special Edition
              </span>
            </div>

            <h2 className="font-display-hero-mobile md:font-display-hero md:text-[44px] md:leading-[52px] font-extrabold tracking-tight">
              Upgrade Your Home &amp; Wardrobe:
              <br />
              The Great Festive Sale
            </h2>

            <p className="font-body-lg text-body-lg text-white/90">
              Up to 50% OFF across top collections + Extra 15% Instant Savings with verified coupon code.
            </p>

            {/* Coupon Code Pill with Copy Micro-interaction */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white font-label-md text-label-md transition-all active:scale-95"
                id="copy-coupon-btn"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {copied ? "check_circle" : "content_copy"}
                </span>
                <span>
                  Use Code: <strong className="tracking-wider">{couponCode}</strong>
                </span>
                {copied && (
                  <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold animate-in fade-in">
                    Copied!
                  </span>
                )}
              </button>
              <span className="font-body-sm text-[12px] text-white/80">
                Valid on orders above ₹1,499
              </span>
            </div>
          </div>

          <div className="relative z-10 shrink-0">
            <Link
              href="/shop"
              className="px-8 py-4 rounded-2xl bg-white text-on-surface font-label-md text-label-md font-bold shadow-xl hover:bg-surface-container-low transition-all hover:scale-105 inline-flex items-center gap-2"
            >
              <span>Explore Exclusive Deals</span>
              <span className="material-symbols-outlined text-[20px] text-primary">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
