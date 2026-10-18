"use client";

import Image from "next/image";
import { TrashIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { QuantitySelector } from "@/components/shared/QuantitySelector";
import { updateCartItemQuantity, removeFromCart } from "@/actions/cart";
import { cn } from "@/lib/utils";
import type { CartItem } from "@/types/cart";

interface CartItemRowProps {
  item: CartItem;
  onRemove?: () => void;
  onQuantityChange?: () => void;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
}

export function CartItemRow({ item, onRemove, onQuantityChange }: CartItemRowProps) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [isPending, startTransition] = useTransition();

  function handleQuantityChange(newQty: number) {
    setQuantity(newQty);
    startTransition(async () => {
      const res = await updateCartItemQuantity(item.variantId, newQty);
      if (!res.success) {
        setQuantity(item.quantity);
        toast.error(res.error);
      } else {
        onQuantityChange?.();
      }
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const res = await removeFromCart(item.variantId);
      if (!res.success) {
        toast.error(res.error);
      } else {
        onRemove?.();
      }
    });
  }

  const imageSrc = item.images?.[0] ?? null;

  return (
    <div
      className={cn(
        "flex gap-4 py-4",
        isPending && "pointer-events-none opacity-60"
      )}
    >
      {/* Image */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted sm:h-24 sm:w-24">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={item.productName}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-sm font-medium">{item.productName}</p>
        {item.variantTitle && (
          <p className="text-xs text-muted-foreground">{item.variantTitle}</p>
        )}
        <p className="text-sm font-semibold">{formatPrice(item.unitPrice)}</p>

        <div className="mt-auto flex items-center justify-between gap-2">
          <QuantitySelector
            value={quantity}
            min={1}
            max={item.stock}
            onChange={handleQuantityChange}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleRemove}
            aria-label={`Remove ${item.productName} from cart`}
            className="text-destructive hover:text-destructive"
          >
            <TrashIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* Line total */}
      <div className="hidden shrink-0 text-right sm:block">
        <p className="text-sm font-semibold">
          {formatPrice(item.unitPrice * quantity)}
        </p>
      </div>
    </div>
  );
}
