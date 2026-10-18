import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone, MapPin, Clock, MessageSquare, ArrowLeft } from "lucide-react";
import { ContactFormClient } from "./ContactFormClient";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Kartiva customer support for inquiries, order assistance, and returns.",
  openGraph: {
    title: "Contact Us | Kartiva",
    description: "Get in touch with Kartiva customer support for inquiries, order assistance, and returns.",
    url: "/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        <span>Back to Store</span>
      </Link>

      <div className="flex flex-col gap-2 border-b pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Contact Customer Support
        </h1>
        <p className="text-sm text-muted-foreground">
          Have a question about an order, shipment, or product? Our support team is here to assist you.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 mt-8">
        {/* Support Channels & Info */}
        <div className="flex flex-col gap-4 lg:col-span-1">
          <div className="rounded-xl border bg-card p-4 shadow-sm flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Mail className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">Email Support</span>
              <a
                href="mailto:support@kartiva.dev"
                className="text-xs text-primary hover:underline mt-0.5"
              >
                support@kartiva.dev
              </a>
              <span className="text-[11px] text-muted-foreground mt-0.5">Response within 24 hours</span>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-sm flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Phone className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">Phone &amp; WhatsApp</span>
              <a
                href="tel:+918049123456"
                className="text-xs text-primary hover:underline mt-0.5"
              >
                +91 (80) 4912 3456
              </a>
              <span className="text-[11px] text-muted-foreground mt-0.5">Mon – Sat, 9:00 AM – 7:00 PM IST</span>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-sm flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MapPin className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">Corporate Headquarters</span>
              <span className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Kartiva Retail Pvt. Ltd.<br />
                Indiranagar 100ft Road, Sector 2<br />
                Bengaluru, Karnataka 560038, India
              </span>
            </div>
          </div>

          <div className="rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground flex flex-col gap-1.5">
            <span className="font-semibold text-foreground">Quick Tip</span>
            <p className="leading-relaxed">
              If inquiring about an existing order, please include your 8-digit Order ID for expedited resolution.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <ContactFormClient />
        </div>
      </div>
    </div>
  );
}
