import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductDetail } from "@/actions/products";
import { ProductGallery } from "@/components/shared/ProductGallery";
import { VariantSelector } from "@/components/shared/VariantSelector";
import { AddToCartButton } from "@/components/shared/AddToCartButton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductDetailClient } from "./ProductDetailClient";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(num);
}

// ─── generateMetadata (Step 9) ────────────────────────────────────────────────

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const res = await getProductDetail(slug);
  if (!res.success) return { title: "Product Not Found" };

  const product = res.data;
  const description = product.description ?? `Buy ${product.name} at Kartiva`;
  const image = (product.images as string[])[0];

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      images: image ? [{ url: image }] : [],
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProductDetailPage({ params }: Props) {
  // Next.js 16 — must await params
  const { slug } = await params;
  const res = await getProductDetail(slug);

  if (!res.success) {
    notFound();
  }

  const product = res.data;
  const images = (product.images as string[]) ?? [];
  const hasDiscount =
    product.compareAtPrice != null &&
    parseFloat(String(product.compareAtPrice)) > parseFloat(String(product.price));

  const defaultVariant = product.variants[0] ?? null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <a href="/" className="hover:text-foreground">Home</a>
        <span>/</span>
        <a href="/shop" className="hover:text-foreground">Shop</a>
        {product.category && (
          <>
            <span>/</span>
            <a href={`/shop?category=${product.category.slug}`} className="hover:text-foreground">
              {product.category.name}
            </a>
          </>
        )}
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
        {/* Gallery */}
        <div>
          <ProductGallery images={images} productName={product.name} />
        </div>

        {/* Product info */}
        <div className="flex flex-col gap-5">
          {/* Category badge */}
          {product.category && (
            <Badge variant="secondary" className="w-fit">
              {product.category.name}
            </Badge>
          )}

          {/* Name */}
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-semibold">{formatPrice(product.price)}</span>
            {hasDiscount && (
              <span className="text-base text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice!)}
              </span>
            )}
            {hasDiscount && (
              <Badge variant="destructive" className="text-xs">
                {Math.round(
                  ((parseFloat(String(product.compareAtPrice!)) -
                    parseFloat(String(product.price))) /
                    parseFloat(String(product.compareAtPrice!))) *
                    100
                )}% OFF
              </Badge>
            )}
          </div>

          <Separator />

          {/* Variant selector + add to cart — client for interactivity */}
          <ProductDetailClient
            variants={product.variants}
            defaultVariantId={defaultVariant?.id ?? ""}
          />

          <Separator />

          {/* Description */}
          {product.description && (
            <div className="prose prose-sm max-w-none text-muted-foreground">
              <h3 className="text-base font-semibold text-foreground">Description</h3>
              <p className="mt-2 text-sm leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Tags */}
          {Array.isArray(product.tags) && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(product.tags as string[]).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Reviews placeholder */}
          <Separator />
          <div>
            <h3 className="text-base font-semibold">Customer Reviews</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Reviews coming soon. Be the first to review this product.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
