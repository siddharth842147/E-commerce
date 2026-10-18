import { Suspense } from "react";
import Link from "next/link";
import { PackageSearchIcon } from "lucide-react";
import { ProductCard } from "@/components/shared/ProductCard";
import { ProductGridSkeleton } from "@/components/shared/skeletons/ProductGridSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getProducts } from "@/actions/products";
import { getCategories } from "@/actions/categories";

// searchParams is dynamic — opt out of static prerender
export const instant = false;

export const metadata = {
  title: "Shop",
  description: "Browse our complete collection of products",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShopSearchParams {
  search?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
}

// ─── Filter sidebar (async — loads categories) ────────────────────────────────

async function FilterSidebar({ searchParams }: { searchParams: ShopSearchParams }) {
  const categoriesRes = await getCategories();
  const categories = categoriesRes.success ? categoriesRes.data : [];

  return (
    <form method="GET" className="flex flex-col gap-5">
      {/* Preserve search across filter changes */}
      {searchParams.search && (
        <input type="hidden" name="search" value={searchParams.search} />
      )}

      {/* Category */}
      <div className="space-y-1.5">
        <Label htmlFor="filter-category">Category</Label>
        <select
          id="filter-category"
          name="category"
          defaultValue={searchParams.category ?? ""}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Price range */}
      <div className="space-y-1.5">
        <Label>Price Range (₹)</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            name="minPrice"
            placeholder="Min"
            min={0}
            defaultValue={searchParams.minPrice ?? ""}
            className="w-full"
          />
          <Input
            type="number"
            name="maxPrice"
            placeholder="Max"
            min={0}
            defaultValue={searchParams.maxPrice ?? ""}
            className="w-full"
          />
        </div>
      </div>

      {/* Sort */}
      <div className="space-y-1.5">
        <Label htmlFor="filter-sort">Sort By</Label>
        <select
          id="filter-sort"
          name="sort"
          defaultValue={searchParams.sort ?? "newest"}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name A–Z</option>
        </select>
      </div>

      <Button type="submit" className="w-full">
        Apply Filters
      </Button>

      {/* Reset */}
      <Button variant="outline" render={<Link href="/shop" />} className="w-full">
        Clear Filters
      </Button>
    </form>
  );
}

function FilterSidebarSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-md" />
      ))}
    </div>
  );
}

// ─── Products grid (async) ────────────────────────────────────────────────────

async function ProductsGrid({ searchParams }: { searchParams: ShopSearchParams }) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const res = await getProducts({
    search: searchParams.search,
    categorySlug: searchParams.category,
    minPrice: searchParams.minPrice ? parseFloat(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? parseFloat(searchParams.maxPrice) : undefined,
    sortBy: searchParams.sort as "newest" | "price_asc" | "price_desc" | "name_asc" | "oldest" | undefined,
    page,
    isActive: true,
  });

  if (!res.success) {
    return (
      <EmptyState
        icon={PackageSearchIcon}
        title="Failed to load products"
        description={res.error}
        action={{ label: "Retry", href: "/shop" }}
      />
    );
  }

  const { items, total, totalPages } = res.data;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={PackageSearchIcon}
        title="No products found"
        description="Try adjusting your filters or search term."
        action={{ label: "Clear Filters", href: "/shop" }}
      />
    );
  }

  // Build query string for pagination links
  function buildPageUrl(p: number): string {
    const params = new URLSearchParams();
    if (searchParams.search) params.set("search", searchParams.search);
    if (searchParams.category) params.set("category", searchParams.category);
    if (searchParams.minPrice) params.set("minPrice", searchParams.minPrice);
    if (searchParams.maxPrice) params.set("maxPrice", searchParams.maxPrice);
    if (searchParams.sort) params.set("sort", searchParams.sort);
    params.set("page", String(p));
    return `/shop?${params.toString()}`;
  }

  const start = (page - 1) * 20 + 1;
  const end = Math.min(page * 20, total);

  return (
    <div className="flex flex-col gap-6">
      {/* Result count */}
      <p className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-foreground">
          {start}–{end}
        </span>{" "}
        of <span className="font-medium text-foreground">{total}</span> products
      </p>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((p) => (
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            render={page > 1 ? <Link href={buildPageUrl(page - 1)} /> : undefined}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            render={page < totalPages ? <Link href={buildPageUrl(page + 1)} /> : undefined}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface ShopPageProps {
  searchParams: Promise<ShopSearchParams>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  // Next.js 16 — must await searchParams
  const params = await searchParams;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Shop</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Explore our complete collection
        </p>
      </div>

      {/* Search bar */}
      <form method="GET" className="mb-6">
        {params.category && <input type="hidden" name="category" value={params.category} />}
        {params.minPrice && <input type="hidden" name="minPrice" value={params.minPrice} />}
        {params.maxPrice && <input type="hidden" name="maxPrice" value={params.maxPrice} />}
        {params.sort && <input type="hidden" name="sort" value={params.sort} />}

        <div className="flex gap-2">
          <Input
            type="search"
            name="search"
            placeholder="Search products…"
            defaultValue={params.search ?? ""}
            className="max-w-sm"
          />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </div>
      </form>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Filters — desktop sidebar / mobile top section */}
        <aside className="w-full shrink-0 rounded-xl border bg-card p-4 lg:w-56">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Filters
          </h2>
          <Suspense fallback={<FilterSidebarSkeleton />}>
            <FilterSidebar searchParams={params} />
          </Suspense>
        </aside>

        {/* Products */}
        <div className="min-w-0 flex-1">
          <Suspense fallback={<ProductGridSkeleton count={12} />}>
            <ProductsGrid searchParams={params} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
