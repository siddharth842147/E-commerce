import type { Metadata } from "next";
import Link from "next/link";
import { Truck, MapPin, Clock, Shield, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy",
  description: "Information regarding shipping rates, pan-India delivery timelines, and courier partners.",
  openGraph: {
    title: "Shipping & Delivery Policy | Kartiva",
    description: "Information regarding shipping rates, pan-India delivery timelines, and courier partners.",
    url: "/shipping-policy",
  },
};

export default function ShippingPolicyPage() {
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
          <Truck className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Shipping &amp; Delivery Policy
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fast, secure fulfillment across 26,000+ Indian pincodes.
          </p>
        </div>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none mt-8 space-y-6 text-muted-foreground text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Shipping Coverage &amp; Logistics Partners</h2>
          <p>
            Kartiva ships across all major states and union territories in India. We partner with Tier-1 logistics networks including <strong>BlueDart, Delhivery, XpressBees, DTDC, and Shiprocket</strong> to guarantee reliable, end-to-end tracked transit.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Delivery Timelines</h2>
          <p>Orders are dispatched from our centralized fulfillment center within 24 to 48 business hours of order placement:</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mt-3 not-prose">
            <div className="rounded-xl border bg-muted/30 p-3.5 text-xs">
              <div className="font-bold text-foreground">Metro Cities</div>
              <div className="text-muted-foreground mt-1">2 to 4 business days</div>
              <div className="text-[11px] text-muted-foreground/80 mt-0.5">Mumbai, Delhi-NCR, Bengaluru, Hyderabad, Chennai, Kolkata</div>
            </div>
            <div className="rounded-xl border bg-muted/30 p-3.5 text-xs">
              <div className="font-bold text-foreground">Tier 2 &amp; Tier 3</div>
              <div className="text-muted-foreground mt-1">3 to 6 business days</div>
              <div className="text-[11px] text-muted-foreground/80 mt-0.5">State capitals and major district headquarters</div>
            </div>
            <div className="rounded-xl border bg-muted/30 p-3.5 text-xs">
              <div className="font-bold text-foreground">Remote &amp; North East</div>
              <div className="text-muted-foreground mt-1">5 to 8 business days</div>
              <div className="text-[11px] text-muted-foreground/80 mt-0.5">Jammu &amp; Kashmir, Ladakh, and North-Eastern states</div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Shipping Charges</h2>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li><strong>Free Standard Delivery:</strong> On all orders totaling ₹999 or above.</li>
            <li><strong>Flat Shipping Rate:</strong> A nominal charge of ₹99 applies on orders below ₹999 to cover courier handling and protective packaging.</li>
            <li><strong>Cash on Delivery (COD) Convenience Fee:</strong> An additional flat fee of ₹49 may apply on COD shipments.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Real-time Tracking</h2>
          <p>
            As soon as your shipment is picked up by our courier partner, you will receive an automatic dispatch notification via SMS, Email, and WhatsApp containing the courier name and unique AWB tracking code. You can also view live tracking updates anytime inside your <Link href="/account/orders" className="text-primary hover:underline">Orders Dashboard</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
