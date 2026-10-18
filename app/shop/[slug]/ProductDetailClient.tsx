"use client";

import { useState } from "react";
import { VariantSelector } from "@/components/shared/VariantSelector";
import { AddToCartButton } from "@/components/shared/AddToCartButton";
import type { ProductVariant } from "@/types/db";

interface ProductDetailClientProps {
  variants: ProductVariant[];
  defaultVariantId: string;
}

function formatPrice(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(num);
}

export function ProductDetailClient({ variants, defaultVariantId }: ProductDetailClientProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(defaultVariantId);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? variants[0];

  if (!selectedVariant) {
    return (
      <p className="text-sm text-muted-foreground">
        No variants available for this product.
      </p>
    );
  }

  const hasVariantPriceOverride =
    selectedVariant.price !== null &&
    selectedVariant.price !== undefined;

  return (
    <div className="flex flex-col gap-4">
      {/* Per-variant price (if different from product price) */}
      {hasVariantPriceOverride && (
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold">{formatPrice(selectedVariant.price)}</span>
          {selectedVariant.compareAtPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(selectedVariant.compareAtPrice)}
            </span>
          )}
        </div>
      )}

      {/* SKU */}
      {selectedVariant.sku && (
        <p className="text-xs text-muted-foreground">
          SKU: <span className="font-mono">{selectedVariant.sku}</span>
        </p>
      )}

      {/* Variant selector */}
      {variants.length > 1 && (
        <VariantSelector
          variants={variants}
          selectedVariantId={selectedVariantId}
          onChange={setSelectedVariantId}
        />
      )}

      {/* Stock info */}
      {selectedVariant.stock > 0 && selectedVariant.stock <= 5 && (
        <p className="text-xs font-medium text-destructive">
          Only {selectedVariant.stock} left in stock!
        </p>
      )}

      {/* Add to cart */}
      <AddToCartButton
        variantId={selectedVariant.id}
        stock={selectedVariant.stock}
      />
    </div>
  );
}
