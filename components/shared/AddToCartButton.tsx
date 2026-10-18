"use client";

import { useState, useTransition } from "react";
import { ShoppingCartIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { QuantitySelector } from "@/components/shared/QuantitySelector";
import { addToCart } from "@/actions/cart";

interface AddToCartButtonProps {
  variantId: string;
  stock: number;
}

export function AddToCartButton({ variantId, stock }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();

  const outOfStock = stock === 0;

  function handleAddToCart() {
    startTransition(async () => {
      const res = await addToCart(variantId, quantity);
      if (res.success) {
        toast.success("Added to cart");
      } else {
        toast.error(res.error);
      }
    });
  }

  if (outOfStock) {
    return (
      <Button disabled className="w-full" size="lg">
        Out of Stock
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Quantity</span>
        <QuantitySelector
          value={quantity}
          min={1}
          max={stock}
          onChange={setQuantity}
        />
      </div>
      <Button
        size="lg"
        className="w-full"
        onClick={handleAddToCart}
        disabled={isPending}
      >
        <ShoppingCartIcon className="mr-2 size-4" />
        {isPending ? "Adding…" : "Add to Cart"}
      </Button>
    </div>
  );
}
