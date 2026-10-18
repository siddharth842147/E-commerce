"use client";

import { useState } from "react";
import { addToCart, getCart } from "@/actions/cart";
import { useCart } from "@/components/shared/CartProvider";
import { showCartToast } from "@/components/shared/CartToast";

interface AddToCartHeroButtonProps {
  variantId?: string;
  productName: string;
  price: number;
}

export function AddToCartHeroButton({
  variantId,
  productName,
  price,
}: AddToCartHeroButtonProps) {
  const [loading, setLoading] = useState(false);
  const { setItems } = useCart();

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!variantId) {
      showCartToast(productName, `Added for ₹${price.toLocaleString("en-IN")}`);
      return;
    }

    try {
      setLoading(true);
      const res = await addToCart(variantId, 1);
      if (res.success) {
        showCartToast(productName, `Added for ₹${price.toLocaleString("en-IN")}`);
        // Refresh cart items
        const freshCart = await getCart();
        if (freshCart.success && freshCart.data) {
          setItems(freshCart.data);
        }
      } else {
        const errorMsg = typeof res.error === "string" ? res.error : "Failed to add item";
        showCartToast("Error", errorMsg);
      }
    } catch {
      showCartToast("Error", "Could not add item to cart");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAdd}
      disabled={loading}
      className="add-to-cart-btn px-4 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md flex items-center gap-1.5 shadow-md hover:bg-primary-container transition-all active:scale-95 disabled:opacity-50"
    >
      <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
      <span>{loading ? "Adding..." : "Add"}</span>
    </button>
  );
}
