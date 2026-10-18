"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  profiles,
  products,
  categories,
  orders,
  orderItems,
  payments,
  productVariants,
  coupons,
  userCouponUsage,
} from "@/db/schema";
import { eq, inArray, and, sql } from "drizzle-orm";
import type { CartItem } from "@/types/cart";
import { ok, err, type ApiResponse } from "@/lib/api-response";
import { getUser } from "@/lib/auth";
import { getCart } from "@/actions/cart";
import {
  validateCartStock,
  calculateOrderTotals,
} from "@/services/checkout.service";
import { validateCoupon, type Coupon } from "@/services/coupon.service";
import {
  clearUserCart,
  clearGuestCart,
  hydrateGuestCart,
} from "@/services/cart.service";
import { createOrderSchema, type CreateOrderInput } from "@/lib/validations/checkout";
import { inngest } from "@/lib/inngest/client";
import { triggerOrderConfirmedNotifications } from "@/lib/inngest/functions/order-confirmed";

/**
 * Enriched cart item with tax rate information
 */
export interface ValidatedCartItem extends CartItem {
  taxRate: number;
}

export type ValidatedCart = ValidatedCartItem[];

/**
 * Creates or retrieves a guest user profile for checkout
 * Requirements: 20.3
 * 
 * @param email - Guest user email address
 * @param phone - Guest user phone number (optional)
 * @returns Profile object with id, email, role, etc.
 */
export async function createGuestProfile(
  email: string,
  phone?: string | null
): Promise<typeof profiles.$inferSelect> {
  // Check if profile already exists with this email
  const [existingProfile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.email, email))
    .limit(1);

  if (existingProfile) {
    return existingProfile;
  }

  // Create new guest profile
  const [newProfile] = await db
    .insert(profiles)
    .values({
      id: crypto.randomUUID(), // Generate UUID for guest profile
      email,
      phone: phone || null,
      role: "customer",
    })
    .returning();

  return newProfile;
}

/**
 * Enriches cart items with category tax rates for tax calculation
 * Requirements: 9.1
 * 
 * @param cartItems - Array of cart items to enrich
 * @returns ValidatedCart with tax rates included
 */
export async function enrichCartWithTaxRates(
  cartItems: CartItem[]
): Promise<ValidatedCart> {
  if (cartItems.length === 0) {
    return [];
  }

  // Get unique product IDs
  const productIds = [...new Set(cartItems.map((item) => item.productId))];

  // Join with categories to get tax rates
  const productTaxRates = await db
    .select({
      productId: products.id,
      taxRate: categories.taxRate,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(inArray(products.id, productIds));

  // Create a map for quick lookup
  const taxRateMap = new Map(
    productTaxRates.map((pt) => [
      pt.productId,
      Number(pt.taxRate) || 0, // Default to 0 if no tax rate
    ])
  );

  // Enrich cart items with tax rates
  return cartItems.map((item) => ({
    ...item,
    taxRate: taxRateMap.get(item.productId) || 0,
  }));
}

/**
 * Places a Cash on Delivery (COD) order.
 *
 * COD bypasses the Razorpay gateway entirely. Because there is no payment
 * authorization step, the order is confirmed on placement (not on payment
 * capture), so:
 *  - the order is created with status "confirmed",
 *  - the payments record uses a COD-<orderId> marker as razorpayOrderId and is
 *    marked "captured" (documented choice: COD has no gateway; the order is
 *    confirmed on placement, so the "payment" is treated as captured then),
 *  - stock is decremented immediately inside the transaction.
 *
 * Coupon usage is tracked (junction insert + usedCount increment) for
 * authenticated users only; guests have no stable userId, so per-user limits
 * are not enforceable and tracking is skipped.
 *
 * @param input - Checkout data (validated against createOrderSchema)
 * @returns ApiResponse<{ orderId: string }>
 */
export async function placeCodOrder(
  input: CreateOrderInput
): Promise<ApiResponse<{ orderId: string }>> {
  // 1. Validate input against the schema (Zod)
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<
      string,
      string[]
    >;
    return err("Invalid input", fieldErrors);
  }
  const data = parsed.data;

  try {
    // 2. Resolve the cart: prefer client-supplied items, else read the stored cart.
    let cart: CartItem[];
    if (data.items && data.items.length > 0) {
      cart = await hydrateGuestCart(data.items);
    } else {
      const res = await getCart();
      if (!res.success) return err(res.error);
      cart = res.data;
    }
    if (cart.length === 0) return err("Cart is empty");

    // 3. Validate stock availability before placing the order.
    const stockRes = await validateCartStock(cart);
    if (!stockRes.valid) {
      return err(
        "Out of stock: " + (stockRes.unavailableItems?.join(", ") ?? "")
      );
    }

    // 4. Resolve the user; guests must provide an email.
    const user = await getUser();
    let userId: string;
    if (user) {
      userId = user.id;
    } else {
      if (!data.email) return err("Email required for guest checkout");
      const profile = await createGuestProfile(data.email, data.phone);
      userId = profile.id;
    }

    // 5. Validate the coupon (if provided) against the cart subtotal.
    let coupon: Coupon | undefined;
    if (data.couponCode) {
      const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      const couponRes = await validateCoupon(
        data.couponCode,
        subtotal,
        user?.id ?? null
      );
      if (!couponRes.valid) return err(couponRes.error ?? "Invalid coupon");
      coupon = couponRes.coupon;
    }

    // 6. Calculate order totals (all amounts returned as strings).
    const totals = await calculateOrderTotals(cart, coupon);

    // 7. Persist order + items + stock decrement + payment in ONE transaction.
    // Throwing inside the transaction rolls back every write below.
    const order = await db.transaction(async (tx) => {
      const [newOrder] = await tx
        .insert(orders)
        .values({
          id: crypto.randomUUID(),
          userId,
          couponId: coupon?.id ?? null,
          status: "confirmed",
          subtotal: totals.subtotal,
          discountAmount: totals.discountAmount,
          shippingAmount: totals.shippingAmount,
          taxAmount: totals.taxAmount,
          total: totals.total,
          shippingAddress: data.shippingAddress,
          notes: null,
        })
        .returning();

      await tx.insert(orderItems).values(
        cart.map((i) => ({
          orderId: newOrder.id,
          variantId: i.variantId,
          productName: i.productName,
          variantTitle: i.variantTitle,
          sku: i.sku,
          unitPrice: i.unitPrice.toFixed(2),
          quantity: i.quantity,
          total: (i.unitPrice * i.quantity).toFixed(2),
        }))
      );

      // Decrement stock atomically using WHERE stock >= quantity.
      // Returning 0 rows means insufficient stock -> throw to roll back the tx.
      for (const item of cart) {
        const upd = await tx
          .update(productVariants)
          .set({
            stock: sql`${productVariants.stock} - ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(productVariants.id, item.variantId),
              sql`${productVariants.stock} >= ${item.quantity}`
            )
          )
          .returning({ id: productVariants.id });
        if (upd.length === 0) {
          throw new Error("Insufficient stock for " + item.sku);
        }
      }

      // COD payment record: no gateway, treated as captured at placement.
      await tx.insert(payments).values({
        orderId: newOrder.id,
        razorpayOrderId: `COD-${newOrder.id}`,
        amount: totals.total,
        currency: "INR",
        status: "captured",
        method: "cod",
        metadata: null,
      });

      // Track coupon usage for authenticated users only.
      if (coupon && user) {
        await tx.insert(userCouponUsage).values({
          userId: user.id,
          couponId: coupon.id,
          orderId: newOrder.id,
        });
        await tx
          .update(coupons)
          .set({ usedCount: sql`${coupons.usedCount} + 1` })
          .where(eq(coupons.id, coupon.id));
      }

      return newOrder;
    });

    // 8. Clear the cart after a successful order.
    if (user) await clearUserCart(user.id);
    else await clearGuestCart();

    // 9. Emit order confirmed notification (best-effort — never fail the action)
    try {
      await triggerOrderConfirmedNotifications(userId, order.id);
      await inngest.send({
        name: "notification/order.confirmed",
        data: { userId, orderId: order.id },
      });
    } catch (e) {
      console.error("[checkout] Failed to emit order.confirmed notification:", e);
    }

    // 10. Revalidate and return the new order id.
    revalidatePath("/");
    return ok({ orderId: order.id });
  } catch (error) {
    console.error("Failed to place COD order:", error);
    return err("Failed to place order. Please try again.");
  }
}
