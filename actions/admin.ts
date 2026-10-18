"use server";

import { revalidatePath } from "next/cache";
import Razorpay from "razorpay";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  orders,
  payments,
  orderItems,
  productVariants,
  coupons,
  userCouponUsage,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { ok, err, type ApiResponse } from "@/lib/api-response";
import { inngest } from "@/lib/inngest/client";
import {
  updateOrderStatusSchema,
  type UpdateOrderStatusInput,
} from "@/lib/validations/notifications";

/**
 * Processes a refund for an order.
 *
 * Admin-only server action. Handles both Razorpay and COD orders:
 *  - Razorpay: calls razorpay.payments.refund() to initiate the refund at the
 *    gateway, then updates payment → "refunded", order → "refunded", restores
 *    stock, and rolls back coupon usage — all in a single transaction.
 *  - COD: skips the Razorpay API call (COD refunds are manual cash
 *    settlements) but still records the refund state and restores stock.
 *
 * Idempotent: if the payment is already "refunded", returns an error without
 * re-processing.
 *
 * Gated by requireAdmin() — redirects non-admin users to the homepage.
 *
 * Requirements: 5.3, 5.4, 7.5, 7.6
 */
export async function processRefund(
  orderId: string
): Promise<ApiResponse<{ refunded: boolean }>> {
  // 1. Gate access — admin only
  await requireAdmin();

  try {
    // 2. Fetch the order
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return err("Order not found");
    }

    // 3. Validate order is in a refundable state
    if (!["confirmed", "shipped", "delivered"].includes(order.status)) {
      return err("Order cannot be refunded in its current state");
    }

    // 4. Fetch the payment record
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .limit(1);

    if (!payment) {
      return err("Payment record not found");
    }

    // 5. Idempotency check
    if (payment.status === "refunded") {
      return err("Refund already processed");
    }

    // 6. Determine COD vs Razorpay
    const isCod = payment.razorpayOrderId.startsWith("COD-");

    if (!isCod) {
      // Razorpay refund: call the gateway API to initiate the refund
      if (!payment.razorpayPaymentId) {
        return err("No payment id to refund");
      }

      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
      });

      const refundAmount = Math.round(Number(payment.amount) * 100); // paise

      try {
        await razorpay.payments.refund(payment.razorpayPaymentId, {
          amount: refundAmount,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return err("Razorpay refund failed: " + message);
      }
    }
    // COD: skip the Razorpay API call — refunds are manual cash settlements.
    // We still record the refund state and restore stock below.

    // 7. Update payment, order, stock, and coupon in ONE transaction
    await db.transaction(async (tx) => {
      // Update payment → refunded
      await tx
        .update(payments)
        .set({ status: "refunded", updatedAt: new Date() })
        .where(eq(payments.id, payment.id));

      // Update order → refunded
      await tx
        .update(orders)
        .set({ status: "refunded", updatedAt: new Date() })
        .where(eq(orders.id, orderId));

      // Restore stock (increment — no guard needed)
      const items = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      for (const item of items) {
        await tx
          .update(productVariants)
          .set({
            stock: sql`${productVariants.stock} + ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(productVariants.id, item.variantId!));
      }

      // Coupon cleanup: delete usage record and decrement usedCount
      if (order.couponId) {
        await tx
          .delete(userCouponUsage)
          .where(eq(userCouponUsage.orderId, orderId));

        // Use GREATEST to prevent negative count
        await tx
          .update(coupons)
          .set({ usedCount: sql`GREATEST(${coupons.usedCount} - 1, 0)` })
          .where(eq(coupons.id, order.couponId));
      }
    });

    // 8. Emit refund notification event (best-effort — never fail the action)
    try {
      await inngest.send({
        name: "notification/refund.processed",
        data: {
          userId: order.userId,
          orderId,
          amount: String(payment.amount),
        },
      });
    } catch (e) {
      console.error("[admin] Failed to emit refund.processed notification:", e);
    }

    revalidatePath("/admin/orders");
    return ok({ refunded: true });
  } catch (error) {
    console.error("Failed to process refund:", error);
    return err("Failed to process refund");
  }
}

/**
 * Updates an order's status (shipped, delivered, or cancelled) and emits the
 * corresponding notification event.
 *
 * Admin-only. Cancellation runs inside a transaction that also restores stock
 * and rolls back coupon usage (mirroring the payment.failed webhook).
 *
 * Gated by requireAdmin().
 */
export async function updateOrderStatus(
  input: UpdateOrderStatusInput
): Promise<ApiResponse<{ orderId: string; status: string }>> {
  await requireAdmin();

  const parsed = updateOrderStatusSchema.safeParse(input);
  if (!parsed.success) {
    return err(
      "Invalid input",
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    );
  }

  const { orderId, status } = parsed.data;

  try {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) return err("Order not found");

    if (status === "cancelled") {
      // Cancellation: restore stock and roll back coupon in one transaction
      await db.transaction(async (tx) => {
        await tx
          .update(orders)
          .set({ status: "cancelled", updatedAt: new Date() })
          .where(eq(orders.id, orderId));

        const items = await tx
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, orderId));

        for (const item of items) {
          await tx
            .update(productVariants)
            .set({
              stock: sql`${productVariants.stock} + ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(productVariants.id, item.variantId!));
        }

        if (order.couponId) {
          await tx
            .delete(userCouponUsage)
            .where(eq(userCouponUsage.orderId, orderId));
          await tx
            .update(coupons)
            .set({ usedCount: sql`GREATEST(${coupons.usedCount} - 1, 0)` })
            .where(eq(coupons.id, order.couponId));
        }
      });
    } else {
      // shipped / delivered — simple status update
      await db
        .update(orders)
        .set({ status, updatedAt: new Date() })
        .where(eq(orders.id, orderId));
    }

    // Emit the matching notification event (best-effort)
    try {
      const eventName =
        status === "shipped"
          ? "notification/order.shipped"
          : status === "delivered"
            ? "notification/order.delivered"
            : "notification/order.cancelled";

      await inngest.send({
        name: eventName,
        data: {
          userId: order.userId,
          orderId,
          ...(status === "cancelled" ? { stockRestored: true } : {}),
        },
      });
    } catch (e) {
      console.error(
        `[admin] Failed to emit ${status} notification for order ${orderId}:`,
        e
      );
    }

    revalidatePath("/admin/orders");
    return ok({ orderId, status });
  } catch (error) {
    console.error("Failed to update order status:", error);
    return err("Failed to update order status");
  }
}
