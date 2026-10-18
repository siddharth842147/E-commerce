import type { Metadata } from "next";
import Link from "next/link";
import { FileText, CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions governing your use of the Kartiva e-commerce platform.",
  openGraph: {
    title: "Terms of Service | Kartiva",
    description: "Terms and conditions governing your use of the Kartiva e-commerce platform.",
    url: "/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        <span>Back to Store</span>
      </Link>

      <div className="flex items-center gap-3 border-b pb-6">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FileText className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Terms of Service
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Effective Date: January 1, 2026 • Last Updated: October 18, 2026
          </p>
        </div>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none mt-8 space-y-6 text-muted-foreground text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Agreement to Terms</h2>
          <p>
            By accessing or using the Kartiva website and services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. User Accounts &amp; Security</h2>
          <p>
            When creating an account on Kartiva, you must provide accurate, current, and complete information. You are solely responsible for maintaining the confidentiality of your account credentials, passwords, and OTP verification codes. You agree to notify us immediately of any unauthorized use of your account.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Products, Pricing &amp; Availability</h2>
          <p>
            All prices are listed in Indian Rupees (INR) and are inclusive of applicable GST unless explicitly stated otherwise. We reserve the right to modify prices, discontinue products, or correct typographical errors at any time without prior notice. In the event of a pricing error on an order, we will contact you before shipment or issue a full cancellation and refund.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Payment &amp; Orders</h2>
          <p>
            We accept payments through Razorpay (UPI, Credit/Debit Cards, Net Banking) and Cash on Delivery (COD) for eligible pin codes. Orders are confirmed upon successful payment authorization or COD verification. We reserve the right to refuse or cancel any order for reasons including inventory unavailability, suspected fraud, or shipping restrictions.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Intellectual Property</h2>
          <p>
            All content on Kartiva, including text, graphics, logos, images, software, and audio clips, is the property of Kartiva Retail or its content suppliers and is protected by Indian and international copyright and trademark laws.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Governing Law &amp; Jurisdiction</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising in connection with these terms shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka.
          </p>
        </section>
      </div>
    </div>
  );
}
