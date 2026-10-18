import type { Metadata } from "next";
import Link from "next/link";
import { RotateCcw, Clock, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy",
  description: "Guidelines and timelines for order cancellations, returns, and refunds on Kartiva.",
  openGraph: {
    title: "Cancellation & Refund Policy | Kartiva",
    description: "Guidelines and timelines for order cancellations, returns, and refunds on Kartiva.",
    url: "/refund-policy",
  },
};

export default function RefundPolicyPage() {
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
          <RotateCcw className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Cancellation &amp; Refund Policy
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Transparent, hassle-free returns within 7 days of delivery.
          </p>
        </div>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none mt-8 space-y-6 text-muted-foreground text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Order Cancellation</h2>
          <p>
            You may cancel an order free of charge at any time prior to shipment dispatch. Once an order has entered the &quot;Shipped&quot; state and a tracking AWB has been issued by our logistics courier, the order cannot be cancelled in transit and must be handled via our standard return process upon delivery.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Return Eligibility Window</h2>
          <p>
            We offer a <strong>7-day replacement and return window</strong> from the date of package delivery. To be eligible for a return:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li>The item must be in its original, unused condition with all original brand tags, warranty cards, manuals, and packaging intact.</li>
            <li>In cases of damaged goods, wrong items received, or missing accessories, you must notify customer support within 48 hours of delivery along with unboxing photos/video.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Non-Returnable Products</h2>
          <p>
            Due to hygiene, safety, and health standards, certain categories cannot be returned once opened, including:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li>Underwear, socks, and intimate apparel.</li>
            <li>Personal care items, cosmetics, and fragrances with broken security seals.</li>
            <li>Digital downloadable goods, gift cards, and software licenses.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Refund Processing Timelines</h2>
          <p>
            Once a return is received at our fulfillment warehouse and quality inspected, your refund will be processed immediately:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li><strong>Prepaid Orders (Cards, Net Banking, UPI):</strong> Refunds are initiated through Razorpay to the original source payment method within 24 to 48 hours. Banks typically credit the amount within 5 to 7 business days.</li>
            <li><strong>Cash on Delivery (COD) Orders:</strong> Refunds are transferred via direct NEFT / IMPS bank transfer or instant UPI payout within 2 business days after collecting verified account details.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. How to Initiate a Return</h2>
          <p>
            To initiate a return or exchange, navigate to your <Link href="/account/orders" className="text-primary hover:underline">My Orders</Link> section and select &quot;Request Return&quot;, or email our support desk at <a href="mailto:support@kartiva.dev" className="text-primary hover:underline">support@kartiva.dev</a> with your Order ID.
          </p>
        </section>
      </div>
    </div>
  );
}
