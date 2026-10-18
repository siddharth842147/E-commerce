import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/lib/siteConfig";
import { AddToCartHeroButton } from "./AddToCartHeroButton";

interface HeroProps {
  featuredProduct?: {
    id: string;
    variantId?: string;
    name: string;
    price: number;
    compareAtPrice?: number | null;
    imageUrl?: string;
    categoryName?: string;
  };
}

export function Hero({ featuredProduct }: HeroProps) {
  const product = featuredProduct || {
    id: "hero-featured",
    name: "Acoustic Elite Pro NC-90",
    price: 3499,
    compareAtPrice: 5999,
    imageUrl: "/images/hero/headphones.svg",
    categoryName: "Audio & Acoustics",
  };

  const discountPercent = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 42;

  const savings = product.compareAtPrice
    ? product.compareAtPrice - product.price
    : 2500;

  return (
    <section className="relative w-full max-w-[1360px] mx-auto px-margin py-space-xl overflow-hidden">
      {/* Ambient Backdrop Aura Orbs */}
      <div className="absolute -top-16 -left-16 w-96 h-96 rounded-full bg-primary-fixed blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-[480px] h-[480px] rounded-full bg-secondary-fixed blur-3xl opacity-50 pointer-events-none" />

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
        {/* Left Column */}
        <div className="lg:col-span-7 flex flex-col items-start gap-space-md z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-lowest shadow-sm">
            <span className="material-symbols-outlined text-[16px] text-secondary-container">
              auto_awesome
            </span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface font-bold">
              New Season Arrivals
            </span>
          </div>

          <h1 className="font-display-hero text-display-hero font-extrabold text-on-surface tracking-tight leading-none">
            Everything you love,<br />
            <span className="bg-gradient-to-r from-primary-container via-tertiary-container to-secondary-container bg-clip-text text-transparent">
              delivered fast.
            </span>
          </h1>

          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
            {siteConfig.description}
          </p>

          {/* CTA Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="#featured"
              className="group px-7 py-3.5 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md flex items-center gap-2 shadow-lg hover:shadow-primary-container/40 transition-all hover:scale-[1.02]"
            >
              <span>Shop Now</span>
              <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">
                arrow_forward
              </span>
            </Link>

            <Link
              href="/shop?sort=newest"
              className="px-7 py-3.5 rounded-xl bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm border border-border hover:bg-surface-container-low transition-all hover:scale-[1.01]"
            >
              View New Arrivals
            </Link>
          </div>

          {/* Trust Badges Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 w-full max-w-lg">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface-container-lowest shadow-sm">
              <span className="material-symbols-outlined text-primary text-[22px]">
                local_shipping
              </span>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-surface leading-tight font-bold">
                  Free Delivery
                </span>
                <span className="font-body-sm text-[11px] text-on-surface-variant">
                  On orders over ₹{siteConfig.delivery.freeShippingThreshold}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface-container-lowest shadow-sm">
              <span className="material-symbols-outlined text-secondary-container text-[22px]">
                verified_user
              </span>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-surface leading-tight font-bold">
                  100% Secure
                </span>
                <span className="font-body-sm text-[11px] text-on-surface-variant">
                  UPI &amp; Card Protect
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface-container-lowest shadow-sm">
              <span className="material-symbols-outlined text-tertiary text-[22px]">
                published_with_changes
              </span>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-surface leading-tight font-bold">
                  7-Day Returns
                </span>
                <span className="font-body-sm text-[11px] text-on-surface-variant">
                  Hassle-free pickups
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Showcase with Floating Accents */}
        <div className="lg:col-span-5 relative flex items-center justify-center py-6">
          {/* Floating Delivery Tag (Top Right) */}
          <div className="absolute -top-4 -right-2 md:top-2 md:right-0 z-20 bg-surface-container-lowest/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[24px]">electric_bolt</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-label-sm text-label-sm font-bold text-on-surface">
                  {siteConfig.delivery.badgeTitle}
                </span>
              </div>
              <p className="font-body-sm text-[11px] text-on-surface-variant">
                {siteConfig.delivery.cityHighlight}
              </p>
            </div>
          </div>

          {/* Main Hero Card */}
          <div className="relative w-full max-w-[420px] bg-surface-container-lowest rounded-3xl p-6 shadow-2xl transition-transform hover:-translate-y-1 duration-300">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-surface-container mb-5 group">
              <Image
                src={product.imageUrl || "/images/hero/headphones.svg"}
                alt={product.name}
                width={500}
                height={500}
                unoptimized={Boolean(product.imageUrl?.endsWith(".svg") || !product.imageUrl)}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                priority
              />
              <span className="absolute top-3 left-3 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-label-sm text-label-sm uppercase font-bold tracking-wider shadow-sm">
                Top Seller
              </span>
              <button
                type="button"
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-surface-container-lowest/90 backdrop-blur-md flex items-center justify-center text-on-surface hover:text-secondary shadow-md transition-colors"
                aria-label="Add to wishlist"
              >
                <span className="material-symbols-outlined text-[20px]">favorite</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">
                {product.categoryName || "Audio & Acoustics"}
              </span>
              <div className="flex items-center gap-1 bg-surface-container-low px-2 py-0.5 rounded-md">
                <span
                  className="material-symbols-outlined text-[16px] text-amber-500 fill-1"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
                <span className="font-label-md text-label-md font-bold text-on-surface">4.9</span>
                <span className="font-body-sm text-[11px] text-on-surface-variant">(2,840)</span>
              </div>
            </div>

            <h3 className="font-headline-md text-headline-md font-bold text-on-surface mb-3 line-clamp-1">
              {product.name}
            </h3>

            <div className="flex items-center justify-between pt-2">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-price-hero text-price-hero text-on-surface font-extrabold">
                    ₹{product.price.toLocaleString("en-IN")}
                  </span>
                  {product.compareAtPrice && (
                    <span className="font-body-md text-body-md text-on-surface-variant line-through">
                      ₹{product.compareAtPrice.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                <span className="font-label-sm text-label-sm text-emerald-600 font-bold">
                  Save ₹{savings.toLocaleString("en-IN")} ({discountPercent}% OFF)
                </span>
              </div>

              <AddToCartHeroButton
                variantId={product.variantId}
                productName={product.name}
                price={product.price}
              />
            </div>
          </div>

          {/* Floating Bestseller Card (Bottom Left) */}
          <Link
            href="/shop?category=books"
            className="absolute -bottom-6 -left-4 md:bottom-2 md:-left-6 z-20 bg-surface-container-lowest/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl flex items-center gap-3 max-w-[260px] hover:scale-105 transition-transform"
          >
            <div className="w-12 h-14 rounded-lg bg-surface-container overflow-hidden shrink-0 relative">
              <Image
                src="/images/hero/bestsellers.svg"
                alt="Indian Bestseller Books"
                width={100}
                height={120}
                unoptimized
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-secondary-container font-extrabold">
                FLAT 40% OFF
              </span>
              <span className="font-label-md text-label-md text-on-surface font-bold leading-snug">
                Indian Bestsellers
              </span>
              <span className="font-body-sm text-[11px] text-on-surface-variant">
                Curated collections
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
