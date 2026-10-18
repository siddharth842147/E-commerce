"use client";

import { cn } from "@/lib/utils";
import type { ProductVariant } from "@/types/db";

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariantId: string;
  onChange: (id: string) => void;
}

/**
 * Groups variants by each option key, then renders a button-group per key.
 * Marks selected options visually, disables out-of-stock options.
 */
export function VariantSelector({ variants, selectedVariantId, onChange }: VariantSelectorProps) {
  if (variants.length === 0) return null;

  // Collect all option keys across all variants
  const allKeys = Array.from(
    new Set(variants.flatMap((v) => Object.keys(v.options ?? {})))
  );

  if (allKeys.length === 0) {
    // Variants have no option keys — render a simple flat list
    return (
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const isSelected = variant.id === selectedVariantId;
          const outOfStock = variant.stock === 0;
          return (
            <button
              key={variant.id}
              type="button"
              disabled={outOfStock}
              onClick={() => onChange(variant.id)}
              aria-pressed={isSelected}
              aria-disabled={outOfStock}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted",
                outOfStock && "cursor-not-allowed opacity-40"
              )}
            >
              {variant.title}
            </button>
          );
        })}
      </div>
    );
  }

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);

  return (
    <div className="flex flex-col gap-4">
      {allKeys.map((optionKey) => {
        // Collect unique values for this key
        const values = Array.from(
          new Set(variants.map((v) => v.options?.[optionKey]).filter(Boolean) as string[])
        );

        const currentValue = selectedVariant?.options?.[optionKey];

        return (
          <div key={optionKey} className="space-y-2">
            <p className="text-sm font-medium capitalize">{optionKey}</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label={optionKey}>
              {values.map((value) => {
                // Find a variant that matches the current selection plus this value
                const matchingVariant = variants.find((v) => {
                  if (v.options?.[optionKey] !== value) return false;
                  // Check that other keys match the selected variant
                  for (const key of allKeys) {
                    if (key === optionKey) continue;
                    if (selectedVariant && v.options?.[key] !== selectedVariant.options?.[key]) {
                      return false;
                    }
                  }
                  return true;
                }) ?? variants.find((v) => v.options?.[optionKey] === value);

                const isSelected = currentValue === value;
                const outOfStock = matchingVariant?.stock === 0;

                return (
                  <button
                    key={value}
                    type="button"
                    disabled={outOfStock}
                    onClick={() => {
                      if (matchingVariant) onChange(matchingVariant.id);
                    }}
                    aria-pressed={isSelected}
                    aria-disabled={outOfStock}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-muted",
                      outOfStock && "cursor-not-allowed opacity-40"
                    )}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
