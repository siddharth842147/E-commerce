"use server";

import { getUser } from "@/lib/auth";
import { getCart } from "@/actions/cart";
import { validateCoupon } from "@/services/coupon.service";
import { ok, err, type ApiResponse } from "@/lib/api-response";

export interface CouponPreview {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  discountAmount: number;
}

/**
 * Server action to preview a coupon discount against the current cart subtotal.
 * Used by the checkout page to show the discount before placing the order.
 */
export async function previewCoupon(
  code: string
): Promise<ApiResponse<CouponPreview>> {
  if (!code.trim()) return err("Please enter a coupon code");

  const cartRes = await getCart();
  if (!cartRes.success) return err("Failed to load cart");

  const cart = cartRes.data;
  if (cart.length === 0) return err("Cart is empty");

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const user = await getUser();

  const result = await validateCoupon(code.trim().toUpperCase(), subtotal, user?.id ?? null);
  if (!result.valid || !result.coupon) {
    return err(result.error ?? "Invalid coupon code");
  }

  const coupon = result.coupon;
  let discountAmount: number;

  if (coupon.discountType === "percentage") {
    discountAmount = (subtotal * parseFloat(coupon.discountValue)) / 100;
  } else {
    discountAmount = parseFloat(coupon.discountValue);
    if (discountAmount > subtotal) discountAmount = subtotal;
  }

  return ok({
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount,
  });
}
