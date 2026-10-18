import { Suspense } from "react";
import type { Metadata } from "next";
import { getCategories } from "@/actions/categories";
import { getProducts } from "@/actions/products";
import { Skeleton } from "@/components/ui/skeleton";
import {
  QuickNavChips,
  Hero,
  CategoryGrid,
  FlashDeals,
  FeaturedProducts,
  PromoBanner,
} from "@/components/home";

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

// ─── Skeletons ───────────────────────────────────────────────────────────────

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

function DealsSkeleton() {
  return (
    <div className="max-w-[1360px] mx-auto px-margin py-space-xl">
      <Skeleton className="h-24 w-full rounded-3xl mb-space-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[380px] rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

function FeaturedSkeleton() {
  return (
    <div className="max-w-[1360px] mx-auto px-margin py-space-xl">
      <div className="flex justify-between items-end mb-space-lg">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <Skeleton className="h-10 w-80 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[420px] rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

// ─── Dynamic Server Components ──────────────────────────────────────────────

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

async function DynamicFlashDeals() {
  const res = await getProducts({ limit: 5, isActive: true });
  const products = res.success ? res.data.items : [];
  return <FlashDeals products={products} />;
}

async function DynamicFeaturedProducts() {
  const [allRes, bestsellersRes, dropsRes] = await Promise.all([
    getProducts({ limit: 8, isActive: true }),
    getProducts({ isFeatured: true, limit: 8, isActive: true }),
    getProducts({ sortBy: "newest", limit: 8, isActive: true }),
  ]);

  return (
    <FeaturedProducts
      allProducts={allRes.success ? allRes.data.items : []}
      bestsellers={bestsellersRes.success ? bestsellersRes.data.items : []}
      newDrops={dropsRes.success ? dropsRes.data.items : []}
    />
  );
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

      {/* 4. Flash Deals Strip with Live Timer */}
      <Suspense fallback={<DealsSkeleton />}>
        <DynamicFlashDeals />
      </Suspense>

      {/* 5. Trending & Featured Picks with Filter Tabs */}
      <Suspense fallback={<FeaturedSkeleton />}>
        <DynamicFeaturedProducts />
      </Suspense>

      {/* 6. Great Festive Sale Promo Banner */}
      <PromoBanner />
    </div>
  );
}
