import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Lock, Eye, FileText, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how Kartiva collects, protects, and utilizes your personal information and cookies.",
  openGraph: {
    title: "Privacy Policy | Kartiva",
    description: "Learn how Kartiva collects, protects, and utilizes your personal information and cookies.",
    url: "/privacy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        <span>Back to Store</span>
      </Link>

      <div className="flex items-center gap-3 border-b pb-6">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Privacy Policy
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Effective Date: January 1, 2026 • Last Updated: October 18, 2026
          </p>
        </div>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none mt-8 space-y-6 text-muted-foreground text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Introduction</h2>
          <p>
            Welcome to Kartiva (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We respect your privacy and are committed to protecting personal data collected through our e-commerce platform. This policy outlines how we handle your personal information in accordance with applicable data protection regulations, including the Digital Personal Data Protection Act (DPDP Act).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Information We Collect</h2>
          <p>We collect information that you directly provide to us, including:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li><strong>Identity &amp; Contact:</strong> Full name, email address, phone number, and delivery addresses.</li>
            <li><strong>Payment &amp; Transaction Details:</strong> Order items, billing address, and transaction identifiers. Please note: all payment card details and UPI authentications are processed directly by our PCI-DSS compliant payment gateway (Razorpay) and are never stored on our servers.</li>
            <li><strong>Technical &amp; Usage:</strong> IP address, browser type, device information, operating system, and interaction logs.</li>
            <li><strong>Communications &amp; Reviews:</strong> Inquiries submitted via our contact forms, customer support tickets, and product reviews.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. How We Use Your Information</h2>
          <p>We process your personal information for lawful business purposes, including:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li>Order fulfillment, courier dispatch, and delivery tracking.</li>
            <li>Sending transactional updates via Email, SMS, and WhatsApp (e.g. order confirmation, shipment tracking, OTP authentication).</li>
            <li>Processing refunds, returns, and customer support queries.</li>
            <li>Preventing fraudulent transactions and unauthorized access.</li>
            <li>Sending marketing newsletters and personalized discounts (only with your prior opt-in consent).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Data Sharing &amp; Third Parties</h2>
          <p>
            We do not sell, rent, or trade your personal data. We disclose your data solely to trusted service providers who adhere to strict confidentiality obligations:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li><strong>Logistics &amp; Courier Partners:</strong> BlueDart, Delhivery, and Shiprocket for parcel delivery.</li>
            <li><strong>Payment Processors:</strong> Razorpay for secure checkout.</li>
            <li><strong>Cloud &amp; Communication Providers:</strong> Supabase, Resend, and Meta Cloud API for database and notifications.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Your Privacy Rights</h2>
          <p>
            You have the right to access, rectify, or request the erasure of your personal data at any time. You can manage your notification preferences directly in your <Link href="/account/notifications" className="text-primary hover:underline">Account Settings</Link> or contact our Data Grievance Officer at <a href="mailto:privacy@kartiva.dev" className="text-primary hover:underline">privacy@kartiva.dev</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
