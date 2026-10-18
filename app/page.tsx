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

// ─── Category Card ────────────────────────────────────────────────────────────

function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/shop?category=${category.slug}`}
      className="group flex shrink-0 flex-col items-center gap-2 rounded-xl border bg-card p-3 shadow-sm transition-shadow hover:shadow-md sm:p-4"
    >
      <div className="relative size-16 overflow-hidden rounded-full bg-muted sm:size-20">
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt={category.name}
            fill
            sizes="80px"
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ShoppingBagIcon className="size-6 text-muted-foreground" />
          </div>
        )}
      </div>
      <span className="text-center text-xs font-medium leading-tight sm:text-sm">
        {category.name}
      </span>
    </Link>
  );
}

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

// ─── Async sections (each wrapped in Suspense by caller) ─────────────────────

async function CategoriesSection() {
  const res = await getCategories();
  const categories = res.success ? res.data : [];
  if (categories.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-4 sm:overflow-visible md:grid-cols-6 lg:grid-cols-8">
      {categories.map((cat) => (
        <CategoryCard key={cat.id} category={cat} />
      ))}
    </div>
  );
}

function CategoriesSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-4 sm:overflow-visible md:grid-cols-6 lg:grid-cols-8">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex shrink-0 flex-col items-center gap-2 p-3">
          <Skeleton className="size-16 rounded-full sm:size-20" />
          <Skeleton className="h-4 w-16" />
        </div>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="flex flex-col gap-12 pb-16 sm:gap-16">
      {/* Hero */}
      <section className="relative flex min-h-[420px] flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-foreground to-foreground/80 px-4 py-20 text-center sm:min-h-[520px] sm:py-32">
        <div className="relative z-10 flex flex-col items-center gap-6">
          <span className="rounded-full bg-primary-foreground/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary-foreground/80">
            New Season Arrivals
          </span>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl">
            Discover Your Style with <span className="text-primary-foreground">Kartiva</span>
          </h1>
          <p className="max-w-md text-base text-primary-foreground/70 sm:text-lg">
            Curated collections of premium products, delivered to your doorstep.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="bg-primary-foreground text-foreground hover:bg-primary-foreground/90"
              render={<Link href="/shop" />}
            >
              Shop Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              render={<Link href="/shop?sort=newest" />}
            >
              New Arrivals
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Shop by Category</h2>
          <Button variant="link" size="sm" render={<Link href="/shop" />}>
            View all
          </Button>
        </div>
        <Suspense fallback={<CategoriesSkeleton />}>
          <CategoriesSection />
        </Suspense>
      </section>

      {/* New Arrivals */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">New Arrivals</h2>
          <Button variant="link" size="sm" render={<Link href="/shop?sort=newest" />}>
            View all
          </Button>
        </div>
        <Suspense fallback={<ProductGridSkeleton count={8} />}>
          <NewArrivalsSection />
        </Suspense>
      </section>

      {/* Best Sellers */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Best Sellers</h2>
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
