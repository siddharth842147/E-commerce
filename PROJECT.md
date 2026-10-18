# Kartiva

Modern e-commerce platform built with Next.js (App Router), TypeScript, Tailwind CSS, and a fully-typed stack.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router + Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + Stitch Design System Tokens + shadcn/ui |
| Animations | Framer Motion + GPU-accelerated CSS Keyframes |
| Auth & Database | Supabase (Auth + Postgres) |
| ORM | Drizzle ORM + postgres.js |
| Validation | Zod |
| Payments | Razorpay |
| Email | Resend + React Email |
| SMS / OTP | MSG91 |
| WhatsApp | Meta Cloud API |
| Media | Cloudinary + Local SVG Assets |
| Background Jobs | Inngest |

## UI & Storefront Architecture (Stitch Design System)

The storefront has been rebuilt to be pixel-faithful to the approved Stitch design (`design/stitch_home.html`):

### 1. Design Tokens & Typography
- **Colors**: Cohesive HSL/Hex palette including `primary` (#3525cd), `primary-container` (#4f46e5), `secondary` (#ae3115), `secondary-container` (#fd6a49), `surface` (#f9f9ff), `surface-container-low` (#f1f3ff), and `on-surface` (#141b2b).
- **Fonts**: Loaded via `next/font/google`:
  - `Inter` (Body and labels)
  - `Plus Jakarta Sans` (Headlines, hero titles, price typography)
- **Icons**: `Material Symbols Outlined` with local woff2 asset (`/fonts/material-symbols-outlined.woff2`) for zero-layout-shift and instant first-paint icon rendering.
- **Configurable Copy**: Centralized in [siteConfig.ts](file:///c:/E-Commerce/lib/siteConfig.ts) to prevent hardcoded marketing claims, with dynamic year support.

### 2. Homepage Components (`components/home/`)
- [AnnouncementBar](file:///c:/E-Commerce/components/layout/AnnouncementBar.tsx): Top festive promo strip with coupon code and free shipping note.
- [NavbarClient](file:///c:/E-Commerce/components/layout/NavbarClient.tsx): Sticky glassmorphism header with live search (⌘K shortcut), wishlist badge, real cart badge, user account menu, and mobile responsive drawer.
- [QuickNavChips](file:///c:/E-Commerce/components/home/QuickNavChips.tsx): Category & deal chips with delivery location indicator.
- [Hero](file:///c:/E-Commerce/components/home/Hero.tsx): Split layout with dynamic featured product from Supabase, trust badges, floating delivery badge, and floating bestseller card with gentle looping animations.
- [CategoryGrid](file:///c:/E-Commerce/components/home/CategoryGrid.tsx) & [CategoryCard](file:///c:/E-Commerce/components/home/CategoryCard.tsx): 5-column responsive gradient cards linking to `/shop?category=<slug>` with rich 3D vector illustrations.
- [FlashDeals](file:///c:/E-Commerce/components/home/FlashDeals.tsx): Live ticking countdown timer to midnight, limited stock indicator, percentage claimed bars, and instant "Grab Deal" cart actions.
- [FeaturedProducts](file:///c:/E-Commerce/components/home/FeaturedProducts.tsx): Interactive tab switching (All, Bestsellers, New Drops, Top Rated), wishlist toggle, star ratings, and real cart additions with toast notifications.
- [PromoBanner](file:///c:/E-Commerce/components/home/PromoBanner.tsx): Festive promo card with one-click copy coupon micro-interaction (`FESTIVE15`).
- [WhyKartiva](file:///c:/E-Commerce/components/home/WhyKartiva.tsx): Value propositions (Swift Delivery, 100% Genuine, 7-Day Returns, Dedicated Support).
- [Testimonials](file:///c:/E-Commerce/components/home/Testimonials.tsx): Customer ratings, review quotes, and verified buyer badges.
- [Newsletter](file:///c:/E-Commerce/components/home/Newsletter.tsx): Discount voucher subscription form with interactive submission state.
- [Footer](file:///c:/E-Commerce/components/layout/Footer.tsx): Multi-column footer with category links, customer support links, quick subscribe, copyright year, and payment rail badges (UPI, RuPay, VISA, Mastercard, NetBanking).
- [FadeUp](file:///c:/E-Commerce/components/shared/FadeUp.tsx): Scroll-triggered reveal animations via Framer Motion with `prefers-reduced-motion` compliance.

### 3. Intro Splash Screen (`components/intro/`)
- [IntroSplash](file:///c:/E-Commerce/components/intro/IntroSplash.tsx): Full-screen brand intro overlay mounted in root layout. Features time-of-day greeting (with user first name when authenticated), typewriter animation, skip controls (button, click anywhere, Escape key), scroll locking, and smooth exit transition revealing the storefront.
- [ThreeIntroScene](file:///c:/E-Commerce/components/intro/ThreeIntroScene.tsx): WebGL 3D scene built with `@react-three/fiber` and `@react-three/drei`. Features a low-poly rotating metallic shopping bag with golden "K" emblem, arched handle, and 5 orbiting product meshes (Book, Shirt with mesh distort, Audio torus, Home ceramic vase, Sports dodecahedron). Dynamic import (`ssr: false`), capped `devicePixelRatio: [1, 1.5]`, automatic WebGL capability detection, and memory cleanup on unmount.
- [CSS3DFallback](file:///c:/E-Commerce/components/intro/CSS3DFallback.tsx): Lightweight, performant 3D CSS fallback with rotating Kartiva logo shield and orbiting category chips (Books, Fashion, Audio, Home, Fitness) when WebGL is unavailable or `prefers-reduced-motion` is active.
- [IntroTyping](file:///c:/E-Commerce/components/intro/IntroTyping.tsx): Configurable character-by-character typing animation with blinking cursor and screen-reader accessibility.
- Controlled via `sessionStorage` (`kartiva_intro_seen`) with `?intro=1` URL query override for instant testing.

### 4. Product Catalog & Photography
- All 20 products across Electronics, Apparel, Home & Kitchen, Sports & Fitness, and Books are populated with multi-angle, high-resolution photography from verified studio sources, optimized via `next/image` with WebP/AVIF formats.
- [ProductGallery](file:///c:/E-Commerce/components/shared/ProductGallery.tsx): Interactive gallery with responsive primary image display and clickable thumbnail switcher.
- [ProductCard](file:///c:/E-Commerce/components/shared/ProductCard.tsx): Displays high-res product photos with hover zoom micro-interactions.
- Seed data and automated update script available via [scripts/seed.ts](file:///c:/E-Commerce/scripts/seed.ts) and [scripts/update-product-images.ts](file:///c:/E-Commerce/scripts/update-product-images.ts).

## Environment Setup

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase project URL, anon key, and service role key
3. Set `DATABASE_URL` to your Supabase Postgres connection string
4. Add API keys for Razorpay, Resend, MSG91, WhatsApp, Cloudinary, and Inngest

## Development

```bash
npm run dev        # Start dev server
npm run test       # Run Vitest test suite
npm run build      # Production build
npx drizzle-kit studio     # Open Drizzle Studio
```

Admin credentials (local dev only):
- Email: `admin@kartiva.dev`
- Password: `Admin@kartiva123`
