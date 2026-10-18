import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Category, ProductVariant } from "@/types/db";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: string | number;
  compareAtPrice?: string | number | null;
  images: string[];
  variants?: ProductVariant[];
  category?: Category | null;
  className?: string;
}

function formatPrice(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(num);
}

export function ProductCard({
  name,
  slug,
  price,
  compareAtPrice,
  images,
  className,
}: ProductCardProps) {
  const imageSrc = images[0] ?? null;
  const hasDiscount = compareAtPrice != null && parseFloat(String(compareAtPrice)) > parseFloat(String(price));

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      {/* Product image */}
      <Link href={`/shop/${slug}`} className="relative block aspect-square overflow-hidden bg-muted" tabIndex={-1} aria-hidden="true">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
            <span className="text-sm">No image</span>
          </div>
        )}
      </Link>

      {/* Product details */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={`/shop/${slug}`} className="line-clamp-2 text-sm font-medium leading-tight hover:underline">
          {name}
        </Link>

        {/* Pricing */}
        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-base font-semibold">{formatPrice(price)}</span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(compareAtPrice!)}
            </span>
          )}
        </div>

        <Button size="sm" className="mt-2 w-full" render={<Link href={`/shop/${slug}`} />}>
          View Product
        </Button>
      </div>
    </article>
  );
}
