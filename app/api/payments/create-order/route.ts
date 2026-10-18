import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, payments, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ok, err } from "@/lib/api-response";
import { getUser } from "@/lib/auth";
import { getCart } from "@/actions/cart";
import { createGuestProfile } from "@/actions/checkout";
import {
  createRazorpayOrder,
  validateCartStock,
  calculateOrderTotals,
} from "@/services/checkout.service";
import { validateCoupon, type Coupon } from "@/services/coupon.service";
import { hydrateGuestCart } from "@/services/cart.service";
import { createOrderSchema } from "@/lib/validations/checkout";
import type { CartItem } from "@/types/cart";

/**
 * POST /api/payments/create-order
 *
 * Creates a Razorpay order for the current cart. This route:
 *  1. Validates the checkout input (shipping address, coupon, etc.)
 *  2. Resolves the cart (from session/cookie or client-supplied items)
 *  3. Validates stock and coupon
 *  4. Calculates order totals
 *  5. Calls Razorpay to create an order (network call, outside any DB tx)
 *  6. Persists the order (status "pending"), order items, and a payment record
 *     (status "pending") in a single transaction
 *  7. Returns the Razorpay order id, amount (paise), currency, and the
 *     client-safe key id for the Razorpay checkout modal
 *
 * Security: This route creates the payment intent but does NOT confirm it.
 * Confirmation happens only in the verify route after server-side signature
 * verification. Stock is NOT decremented here — it is decremented in the
 * verify route (or webhook) after payment success.
 *
 * Requirements: 13.1, 13.2
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        err(
          "Invalid input",
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        ),
        { status: 400 }
      );
    }
    const data = parsed.data;

    // 2. Resolve the cart
    let cart: CartItem[];
    if (data.items && data.items.length > 0) {
      cart = await hydrateGuestCart(data.items);
    } else {
      const res = await getCart();
      if (!res.success) {
        return NextResponse.json(err(res.error), { status: 400 });
      }
      cart = res.data;
    }
    if (cart.length === 0) {
      return NextResponse.json(err("Cart is empty"), { status: 400 });
    }

    // 3. Validate stock
    const stockRes = await validateCartStock(cart);
    if (!stockRes.valid) {
      return NextResponse.json(
        err("Out of stock: " + (stockRes.unavailableItems?.join(", ") ?? "")),
        { status: 400 }
      );
    }

    // 4. Resolve user / guest profile
    const user = await getUser();
    let userId: string;
    if (user) {
      userId = user.id;
      if (data.phone) {
        await db
          .update(profiles)
          .set({ phone: data.phone, updatedAt: new Date() })
          .where(eq(profiles.id, userId));
      }
    } else {
      if (!data.email) {
        return NextResponse.json(
          err("Email required for guest checkout"),
          { status: 400 }
        );
      }
      const profile = await createGuestProfile(data.email, data.phone);
      userId = profile.id;
    }

    // 5. Validate coupon
    let coupon: Coupon | undefined;
    if (data.couponCode) {
      const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      const couponRes = await validateCoupon(
        data.couponCode,
        subtotal,
        user?.id ?? null
      );
      if (!couponRes.valid) {
        return NextResponse.json(
          err(couponRes.error ?? "Invalid coupon"),
          { status: 400 }
        );
      }
      coupon = couponRes.coupon;
    }

    // 6. Calculate order totals (all fields are strings)
    const totals = await calculateOrderTotals(cart, coupon);
    const amountRupees = Number(totals.total);

    // 7. Create the Razorpay order (network call — outside any DB transaction)
    const orderId = crypto.randomUUID();
    let rzp;
    try {
      rzp = await createRazorpayOrder(orderId, amountRupees);
    } catch {
      return NextResponse.json(
        err("Failed to create payment order"),
        { status: 500 }
      );
    }

    // 8. Persist order + items + payment in ONE transaction
    try {
      await db.transaction(async (tx) => {
        await tx.insert(orders).values({
          id: orderId,
          userId,
          couponId: coupon?.id ?? null,
          status: "pending",
          subtotal: totals.subtotal,
          discountAmount: totals.discountAmount,
          shippingAmount: totals.shippingAmount,
          taxAmount: totals.taxAmount,
          total: totals.total,
          shippingAddress: data.shippingAddress,
          notes: null,
        });

        await tx.insert(orderItems).values(
          cart.map((i) => ({
            orderId,
            variantId: i.variantId,
            productName: i.productName,
            variantTitle: i.variantTitle,
            sku: i.sku,
            unitPrice: i.unitPrice.toFixed(2),
            quantity: i.quantity,
            total: (i.unitPrice * i.quantity).toFixed(2),
          }))
        );

        await tx.insert(payments).values({
          orderId,
          razorpayOrderId: rzp.id,
          amount: totals.total,
          currency: "INR",
          status: "pending",
          method: "razorpay",
          metadata: null,
        });
      });
    } catch {
      return NextResponse.json(
        err("Failed to persist order"),
        { status: 500 }
      );
    }

    // 9. Return Razorpay order details + client-safe key id
    return NextResponse.json(
      ok({
        orderId,
        razorpayOrderId: rzp.id,
        amount: rzp.amount, // paise
        currency: rzp.currency,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "rzp_test_mock",
      }),
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      err("Failed to create order"),
      { status: 500 }
    );
  }
}
