import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Secure Checkout",
  description: "Complete your order with secure payments via Razorpay, UPI, cards, net banking, or Cash on Delivery.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Secure Checkout | Kartiva",
    description: "Complete your order with secure payments via Razorpay, UPI, cards, net banking, or Cash on Delivery.",
  },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
