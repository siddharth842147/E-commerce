"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { showCartToast } from "@/components/shared/CartToast";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    timerRef.current = setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
      showCartToast("Subscribed!", "Check your inbox for your ₹200 voucher code.");
    }, 600);
  };

  return (
    <section className="w-full py-space-xl bg-surface-container-low" id="newsletter">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-margin">
        <div className="relative rounded-2xl sm:rounded-3xl bg-surface-container-lowest p-5 sm:p-8 md:p-12 shadow-sm border border-outline-variant/35 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-secondary-fixed text-secondary flex items-center justify-center mb-4 shadow-sm" aria-hidden="true">
            <span className="material-symbols-outlined text-[28px]">mark_email_read</span>
          </div>

          <h3 className="font-headline-lg text-headline-lg font-bold text-on-surface max-w-xl tracking-tight">
            Stay in the loop &amp; save ₹200 on your first purchase
          </h3>

          <p className="font-body-md text-body-md text-on-surface-variant max-w-lg mt-2 mb-6">
            Exclusive artisanal drops, VIP flash discount alerts, and curated lifestyle recommendations straight to your inbox.
          </p>

          {submitted ? (
            <div className="px-6 py-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2.5 font-label-md text-label-md">
              <span className="material-symbols-outlined text-[20px] text-emerald-600" aria-hidden="true">
                check_circle
              </span>
              <span>
                Thank you for subscribing! Check your inbox for your ₹200 discount code.
              </span>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-md flex flex-col sm:flex-row items-center gap-2"
              id="newsletter-form"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address..."
                aria-label="Email address for newsletter"
                className="w-full px-5 py-3.5 rounded-xl bg-surface-container-low text-on-surface font-body-sm text-body-sm border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-on-surface-variant/60 transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                aria-label="Subscribe to newsletter"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-secondary-container text-on-secondary-container font-label-md text-label-md font-bold hover:bg-secondary-container/90 transition-all duration-200 shrink-0 shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
              >
                {loading ? "Subscribing..." : "Subscribe Now"}
              </button>
            </form>
          )}

          <p className="font-body-sm text-[12px] text-on-surface-variant mt-3">
            No spam ever. Unsubscribe anytime with a single tap. Read our{" "}
            <Link
              href="/privacy"
              className="underline hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
