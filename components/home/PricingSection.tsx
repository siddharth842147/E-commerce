"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingPlan {
  id: string;
  name: string;
  badge?: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  highlighted?: boolean;
  ctaText: string;
  ctaHref: string;
  features: string[];
}

const PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Shopper Free",
    description: "Standard shopping perks for occasional everyday purchases.",
    monthlyPrice: 0,
    annualPrice: 0,
    ctaText: "Start Shopping Free",
    ctaHref: "/shop",
    features: [
      "Free standard shipping on orders above ₹999",
      "Standard access to seasonal Flash Deals",
      "7-day standard return window",
      "Standard customer support via email",
      "Standard order tracking notifications",
    ],
  },
  {
    id: "plus",
    name: "Kartiva Plus",
    badge: "Most Popular",
    description: "For frequent shoppers who want priority dispatch and zero delivery charges.",
    monthlyPrice: 49,
    annualPrice: 499,
    highlighted: true,
    ctaText: "Join Kartiva Plus",
    ctaHref: "/shop?membership=plus",
    features: [
      "Unlimited free delivery on orders above ₹199",
      "2-hour early access to all Flash Deals",
      "15-day extended return window with instant pickup",
      "2% cashback points on all completed orders",
      "Zero convenience fee on COD & Net Banking",
      "Dedicated WhatsApp customer support concierge",
    ],
  },
  {
    id: "elite",
    name: "VIP Elite",
    badge: "VIP Exclusive",
    description: "The ultimate shopping membership with personal concierge and luxury perks.",
    monthlyPrice: 149,
    annualPrice: 1499,
    ctaText: "Become VIP Elite",
    ctaHref: "/shop?membership=elite",
    features: [
      "100% Free express next-day delivery on all orders",
      "12-hour exclusive preview for Festive Drops",
      "30-day no-questions-asked doorstep returns",
      "5% unlimited cashback points credited instantly",
      "Free festive gift boxes & birthday surprise gift",
      "Personal shopping advisor and 24/7 VIP hotline",
    ],
  },
];

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section
      className="w-full py-space-xl bg-surface-container-low/40 relative overflow-hidden"
      aria-labelledby="pricing-heading"
    >
      {/* Background ambient lighting */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[360px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-margin relative z-10">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4 border border-primary/20">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span>Kartiva Club Membership</span>
          </div>

          <h2
            id="pricing-heading"
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface font-heading leading-tight"
          >
            Upgrade your shopping with Kartiva Club
          </h2>

          <p className="mt-3 text-sm sm:text-base text-on-surface-variant max-w-2xl leading-relaxed">
            Enjoy zero shipping fees, early flash sale reservations, and member cashbacks. Choose the plan tailored to your lifestyle.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-8 flex items-center gap-3 bg-surface-container-lowest p-1.5 rounded-full border border-outline-variant/30 shadow-sm">
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all min-h-[36px] flex items-center justify-center",
                !isAnnual
                  ? "bg-primary text-white shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
              aria-pressed={!isAnnual}
            >
              Monthly Billing
            </button>

            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all min-h-[36px] flex items-center gap-2",
                isAnnual
                  ? "bg-primary text-white shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
              aria-pressed={isAnnual}
            >
              <span>Annual Billing</span>
              <span className="rounded-full bg-secondary-container/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-secondary-container">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {PLANS.map((plan) => {
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            const periodLabel = price === 0 ? "forever" : isAnnual ? "/ year" : "/ month";

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col justify-between rounded-3xl p-6 sm:p-8 transition-all duration-300",
                  plan.highlighted
                    ? "bg-surface-container-lowest border-2 border-primary shadow-xl shadow-primary/10 ring-4 ring-primary/5 lg:-translate-y-2"
                    : "bg-surface-container-lowest border border-outline-variant/30 shadow-sm hover:shadow-md hover:border-outline-variant/60"
                )}
              >
                {/* Popular / VIP Badge */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span
                      className={cn(
                        "rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5",
                        plan.highlighted
                          ? "bg-primary text-white"
                          : "bg-tertiary-container text-white"
                      )}
                    >
                      <Sparkles className="h-3 w-3" aria-hidden="true" />
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div>
                  {/* Plan Name & Pitch */}
                  <div className="mb-5">
                    <h3 className="text-xl font-bold text-on-surface font-heading">
                      {plan.name}
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-sm text-on-surface-variant leading-relaxed min-h-[40px]">
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6 flex items-baseline gap-1.5 pb-6 border-b border-outline-variant/20">
                    <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface font-heading">
                      ₹{price.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-on-surface-variant">
                      {periodLabel}
                    </span>
                  </div>

                  {/* Features List */}
                  <div className="mb-8 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                      Included Benefits:
                    </p>
                    <ul className="space-y-3" role="list">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-on-surface">
                          <span
                            className={cn(
                              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                              plan.highlighted
                                ? "bg-primary/15 text-primary"
                                : "bg-surface-container text-on-surface-variant"
                            )}
                            aria-hidden="true"
                          >
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </span>
                          <span className="leading-snug">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Call to Action Button */}
                <div className="pt-2">
                  <Link
                    href={plan.ctaHref}
                    className={cn(
                      "flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98]",
                      plan.highlighted
                        ? "bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20"
                        : "bg-surface-container text-on-surface hover:bg-surface-container-highest"
                    )}
                    aria-label={`${plan.ctaText} for ${plan.name}`}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Confidence Assurance Footer */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm text-on-surface-variant text-center">
          <div className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <span>30-day money-back guarantee</span>
          </div>
          <span className="hidden sm:inline text-outline-variant" aria-hidden="true">
            •
          </span>
          <span>No long-term lock-in, cancel anytime from your account settings</span>
          <span className="hidden sm:inline text-outline-variant" aria-hidden="true">
            •
          </span>
          <span>Instant doorstep benefits activation</span>
        </div>
      </div>
    </section>
  );
}
