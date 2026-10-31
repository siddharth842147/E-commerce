import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category, ProductVariant } from "@/types/db";

export interface ProductCardProps {
  id?: string;
  name?: string;
  slug?: string;
  price?: string | number;
  compareAtPrice?: string | number | null;
  images?: string[];
  variants?: ProductVariant[];
  category?: Category | null;
  className?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
}

function formatPrice(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function ProductCard({
  name,
  slug,
  price,
  compareAtPrice,
  images = [],
  category,
  className,
  isLoading = false,
  isEmpty = false,
}: ProductCardProps) {
  // ─── 1. Loading State ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <article
        className={cn(
          "flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-3 sm:p-4 shadow-sm",
          className
        )}
        aria-busy="true"
        aria-label="Loading product details"
      >
        <Skeleton className="aspect-square w-full rounded-xl" />
        <div className="flex flex-1 flex-col gap-2.5 pt-3">
          <Skeleton className="h-3 w-20 rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-3/4 rounded-md" />
          <div className="mt-auto flex items-center justify-between pt-2">
            <Skeleton className="h-5 w-24 rounded-md" />
            <Skeleton className="h-4 w-12 rounded-md" />
          </div>
          <Skeleton className="mt-2 h-9 w-full rounded-xl" />
        </div>
      </article>
    );
  }

  // ─── 2. Empty State ──────────────────────────────────────────────────────────
  if (isEmpty || !name || !slug || price === undefined || price === null) {
    return (
      <article
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/30 p-6 text-center shadow-none min-h-[320px]",
          className
        )}
        aria-label="Product unavailable"
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <svg
            className="h-6 w-6 stroke-[1.5]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <h4 className="text-sm font-semibold text-foreground">Product Unavailable</h4>
        <p className="mt-1 text-xs text-muted-foreground max-w-[200px]">
          This item is currently out of stock or no longer available.
        </p>
      </article>
    );
  }

  // ─── 3. Standard Product Card ────────────────────────────────────────────────
  const imageSrc = images[0] ?? null;
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  const numCompare = compareAtPrice != null ? (typeof compareAtPrice === "string" ? parseFloat(compareAtPrice) : compareAtPrice) : null;
  const hasDiscount = numCompare != null && numCompare > numPrice;
  const discountPercent = hasDiscount
    ? Math.round(((numCompare - numPrice) / numCompare) * 100)
    : 0;

  const productUrl = `/shop/${slug || ""}`;

  return (
    <article
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-card p-3 sm:p-4 text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl",
        className
      )}
    >
      <div>
        {/* Product Image Media Container */}
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted mb-3">
          <Link
            href={productUrl}
            className="block h-full w-full rounded-xl focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-primary focus-visible:-outline-offset-2"
            tabIndex={0}
            aria-label={`View details for ${name || "Product"}`}
          >
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={name || "Product image"}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                unoptimized={Boolean(imageSrc.endsWith(".svg"))}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                <span className="text-xs font-medium">No image</span>
              </div>
            )}
          </Link>

          {/* Discount Badge */}
          {hasDiscount && (
            <span className="absolute top-2.5 left-2.5 z-10 rounded-full bg-secondary-container px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-on-secondary-container shadow-sm">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Category Eyebrow */}
        {category?.name && (
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-primary mb-1">
            {category.name}
          </span>
        )}

        {/* Product Title */}
        <Link
          href={productUrl}
          className="line-clamp-2 text-xs sm:text-sm font-semibold leading-snug text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          {name}
        </Link>
      </div>

      {/* Pricing & Call-to-Action */}
      <div className="mt-3 pt-2 border-t border-border/40">
        <div className="flex items-baseline gap-2 mb-2.5">
          <span className="text-sm sm:text-base font-extrabold text-foreground">
            {formatPrice(numPrice)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(numCompare!)}
            </span>
          )}
        </div>

        <Button
          size="sm"
          className="w-full rounded-xl font-medium shadow-sm active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          render={<Link href={productUrl} />}
        >
          <span>View Details</span>
          <svg
            className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </article>
  );
}
