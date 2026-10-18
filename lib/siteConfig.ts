export const siteConfig = {
  name: "Kartiva",
  tagline: "Everything you love, delivered fast.",
  description:
    "Discover curated collections of Books, Fashion, cutting-edge Electronics, Home aesthetics, and Fitness gear tailored for modern India.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005",
  ogImage: "/og-image.jpg",
  currentYear: 2026,
  announcement: {
    enabled: true,
    badgeText: "Festive Special",
    offerText: "Flat ₹200 OFF on orders above ₹1,499",
    couponCode: "KARTIVA200",
    shippingNote: "Free Shipping on orders above ₹499",
  },
  delivery: {
    cityHighlight: "Delhi, Mumbai & Bengaluru",
    badgeTitle: "Fast Delivery",
    badgeSubtitle: "Direct to your doorstep",
    pincodeCoverageText: "Express delivery across serviceable pin codes",
    freeShippingThreshold: 499,
  },
  promoBanner: {
    badge: "Special Edition",
    title: "Upgrade Your Home & Wardrobe: Season Deals",
    description: "Up to 50% OFF across top collections + Extra savings with UPI and cards.",
    couponCode: "WELCOME10",
    couponTerms: "Valid on all prepaid orders",
    ctaText: "Explore Exclusive Deals",
  },
  valueProps: [
    {
      icon: "bolt",
      title: "Swift Express Delivery",
      description: "Quick dispatch with end-to-end tracking on every order.",
    },
    {
      icon: "verified",
      title: "100% Genuine & Secure",
      description: "Authentic products with secure UPI, Card and NetBanking payments.",
    },
    {
      icon: "published_with_changes",
      title: "7-Day Easy Returns",
      description: "Hassle-free reverse pickups and direct refund to your payment source.",
    },
    {
      icon: "support_agent",
      title: "Dedicated Support",
      description: "Quick assistance via email and chat for all order inquiries.",
    },
  ],
  testimonials: [
    {
      quote: "Kartiva's delivery was swift and pristine. The books arrived beautifully packaged within 24 hours.",
      name: "Priya S.",
      city: "Bengaluru",
      rating: 5,
      avatar: "/images/testimonials/avatar-1.jpg",
    },
    {
      quote: "Found great deals on audio accessories. The Razorpay checkout was seamless and delivery was right on time.",
      name: "Rohan M.",
      city: "Mumbai",
      rating: 5,
      avatar: "/images/testimonials/avatar-2.jpg",
    },
    {
      quote: "The home decor items look fantastic in real life. Great customer support and hassle-free service.",
      name: "Ananya N.",
      city: "Kochi",
      rating: 5,
      avatar: "/images/testimonials/avatar-3.jpg",
    },
  ],
  footer: {
    copyrightNotice: "© 2026 Kartiva Retail India. All rights reserved.",
    paymentBadges: ["UPI", "RuPay", "VISA", "Mastercard", "NetBanking"],
  },
};
