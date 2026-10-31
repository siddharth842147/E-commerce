"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { showCartToast } from "@/components/shared/CartToast";

export function PromoBanner() {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const couponCode = "FESTIVE15";

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(couponCode);
        setCopied(true);
        showCartToast(
          "Coupon Copied!",
          `Code ${couponCode} copied. Apply at checkout for 15% OFF!`
        );
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopied(false), 2500);
      } else {
        showCartToast(
          "Coupon Code",
          `Use code ${couponCode} at checkout for 15% OFF!`
        );
      }
    } catch {
      showCartToast(
        "Coupon Code",
        `Use code ${couponCode} at checkout for 15% OFF!`
      );
    }
  };

  return (
    <section className="w-full py-space-xl bg-surface">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-margin">
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-r from-primary via-tertiary to-secondary-container p-5 sm:p-8 md:p-14 text-white shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 sm:gap-8">
          {/* Subtle background decorative shapes */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-60 h-60 rounded-full bg-white/5 blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md">
              <span className="material-symbols-outlined text-[16px] text-amber-300" aria-hidden="true">
                celebration
              </span>
              <span className="font-label-sm text-xs sm:text-label-sm uppercase font-bold tracking-wider text-white">
                Festive Special Edition
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-[44px] md:leading-[52px] font-extrabold tracking-tight">
              Upgrade Your Home &amp; Wardrobe:
              <br />
              The Great Festive Sale
            </h2>

            <p className="font-body-md sm:font-body-lg text-body-md sm:text-body-lg text-white/90">
              Up to 50% OFF across top collections + Extra 15% Instant Savings with verified coupon code.
            </p>

            {/* Coupon Code Pill with Copy Micro-interaction */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-2">
              <button
                onClick={handleCopy}
                aria-label={`Copy coupon code ${couponCode}`}
                className="inline-flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white font-label-md text-xs sm:text-label-md transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
                id="copy-coupon-btn"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
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
              <span className="font-body-sm text-[11px] sm:text-[12px] text-white/80">
                Valid on orders above ₹1,499
              </span>
            </div>
          </div>

          <div className="relative z-10 shrink-0 w-full sm:w-auto">
            <Link
              href="/shop"
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-white text-on-surface font-label-md text-sm sm:text-label-md font-bold shadow-xl hover:bg-surface-container-low transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary inline-flex items-center justify-center gap-2"
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
