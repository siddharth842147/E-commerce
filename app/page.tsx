import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shared/ProductCard";
import { ProductGridSkeleton } from "@/components/shared/skeletons/ProductGridSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import type { Metadata } from "next";
import { getCategories } from "@/actions/categories";
import { getProducts } from "@/actions/products";
import type { Category } from "@/types/db";
import type { ProductWithVariants } from "@/services/product.service";
import { QuickNavChips } from "@/components/home/QuickNavChips";
import { Hero } from "@/components/home/Hero";
import { CategoryGrid } from "@/components/home/CategoryGrid";

export const metadata: Metadata = {
  title: "Kartiva — Premium Shopping Destination",
  description: "Explore top-rated electronics, fashion, lifestyle products, and home essentials with best price guarantees.",
  openGraph: {
    title: "Kartiva — Premium Shopping Destination",
    description: "Explore top-rated electronics, fashion, lifestyle products, and home essentials with best price guarantees.",
    url: "/",
    images: [{ url: "/og-home.jpg", width: 1200, height: 630, alt: "Kartiva Store" }],
  },
};

// ─── Product Grid ─────────────────────────────────────────────────────────────

function ProductGrid({ products }: { products: ProductWithVariants[] }) {
  if (products.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard
          key={p.id}
          id={p.id}
          name={p.name}
          slug={p.slug}
          price={p.price}
          compareAtPrice={p.compareAtPrice}
          images={p.images as string[]}
          variants={p.variants}
          category={p.category}
        />
      ))}
    </div>
  );
}

async function NewArrivalsSection() {
  const res = await getProducts({ sortBy: "newest", limit: 8, isActive: true });
  const items = res.success ? res.data.items : [];
  return <ProductGrid products={items} />;
}

async function BestSellersSection() {
  const res = await getProducts({ isFeatured: true, limit: 8, isActive: true });
  const items = res.success ? res.data.items : [];
  return <ProductGrid products={items} />;
}

function HeroSkeleton() {
  return (
    <div className="max-w-[1360px] mx-auto px-margin py-space-xl grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
      <div className="lg:col-span-7 space-y-4">
        <Skeleton className="h-8 w-44 rounded-full" />
        <Skeleton className="h-20 w-full max-w-lg rounded-2xl" />
        <Skeleton className="h-14 w-full max-w-md rounded-xl" />
        <div className="flex gap-4">
          <Skeleton className="h-12 w-36 rounded-xl" />
          <Skeleton className="h-12 w-44 rounded-xl" />
        </div>
      </div>
      <div className="lg:col-span-5 flex justify-center">
        <Skeleton className="h-[460px] w-full max-w-[420px] rounded-3xl" />
      </div>
    </div>
  );
}

function CategoryGridSkeleton() {
  return (
    <div className="max-w-[1360px] mx-auto px-margin py-space-xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[340px] rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

async function DynamicHero() {
  const res = await getProducts({ isFeatured: true, limit: 1, isActive: true });
  const topProduct = res.success && res.data.items.length > 0 ? res.data.items[0] : null;

  const heroFeatured = topProduct
    ? {
        id: topProduct.id,
        variantId: topProduct.variants?.[0]?.id,
        name: topProduct.name,
        price: Number(topProduct.price),
        compareAtPrice: topProduct.compareAtPrice ? Number(topProduct.compareAtPrice) : null,
        imageUrl: (topProduct.images as string[])?.[0] || "/images/hero/headphones.svg",
        categoryName: topProduct.category?.name || "Audio & Acoustics",
      }
    : undefined;

  return <Hero featuredProduct={heroFeatured} />;
}

async function DynamicCategoryGrid() {
  const res = await getCategories();
  const categories = res.success ? res.data : [];
  return <CategoryGrid categories={categories} />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="flex flex-col w-full pt-28">
      {/* 1. Quick Navigation Chips */}
      <QuickNavChips />

      {/* 2. Hero Section */}
      <Suspense fallback={<HeroSkeleton />}>
        <DynamicHero />
      </Suspense>

      {/* 3. Shop by Category */}
      <Suspense fallback={<CategoryGridSkeleton />}>
        <DynamicCategoryGrid />
      </Suspense>

      {/* New Arrivals Section */}
      <section className="mx-auto w-full max-w-[1360px] px-margin py-space-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">
              Fresh Drops
            </span>
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight mt-1">
              New Arrivals
            </h2>
          </div>
          <Button variant="link" size="sm" render={<Link href="/shop?sort=newest" />}>
            View all
          </Button>
        </div>
        <Suspense fallback={<ProductGridSkeleton count={8} />}>
          <NewArrivalsSection />
        </Suspense>
      </section>

      {/* Best Sellers Section */}
      <section className="mx-auto w-full max-w-[1360px] px-margin pb-space-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">
              Customer Favorites
            </span>
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight mt-1">
              Best Sellers
            </h2>
          </div>
          <Button variant="link" size="sm" render={<Link href="/shop?featured=true" />}>
            View all
          </Button>
        </div>
        <Suspense fallback={<ProductGridSkeleton count={8} />}>
          <BestSellersSection />
        </Suspense>
      </section>
    </div>
  );
}
