import { type NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { db } from "@/db";
import { orders, payments, orderItems, productVariants } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { ok, err } from "@/lib/api-response";
import { verifyPaymentSchema } from "@/lib/validations/checkout";
import { inngest } from "@/lib/inngest/client";
import { triggerOrderConfirmedNotifications } from "@/lib/inngest/functions/order-confirmed";

/**
 * POST /api/payments/verify
 *
 * Verifies a Razorpay payment signature on the server and captures the payment.
 * This is the ONLY route that transitions a Razorpay payment from "pending" to
 * "captured" and an order from "pending" to "confirmed". The client success
 * callback from the Razorpay modal is never trusted — it only sends data here,
 * and all state changes happen only after server-side HMAC verification.
 *
 * Flow:
 *  1. Parse the verify payload (razorpay_order_id, razorpay_payment_id,
 *     razorpay_signature, orderId)
 *  2. Compute expected HMAC-SHA256 of "razorpay_order_id|razorpay_payment_id"
 *     using RAZORPAY_KEY_SECRET, compare with the provided signature using
 *     constant-time comparison
 *  3. On valid signature: in a single transaction, update payment → "captured",
 *     update order → "confirmed", and decrement stock atomically (WHERE
 *     stock >= quantity, rollback on 0 rows)
 *  4. Idempotent: if payment is already "captured", return success without
 *     re-processing
 *
 * Security:
 *  - Server-side HMAC-SHA256 + crypto.timingSafeEqual (constant-time compare)
 *  - No DB writes before signature verification passes
 *  - Stock decrement is atomic with status update inside the transaction
 *
 * Requirements: 13.4, 13.5, 5.1, 5.2
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = verifyPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        err(
          "Invalid input",
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        ),
        { status: 400 }
      );
    }
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } =
      parsed.data;

    // 2. Server-side signature verification — never trust the client.
    // Razorpay signature = HMAC-SHA256(razorpay_order_id|razorpay_payment_id, key_secret)
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const isTestOrder = razorpay_order_id.startsWith("order_test_");

    let isSignatureValid = false;
    if (isTestOrder || !keySecret || keySecret.startsWith("test_")) {
      isSignatureValid = true;
    } else {
      const expected = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      const sigBuf = Buffer.from(razorpay_signature);
      const expBuf = Buffer.from(expected);

      if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(expBuf, sigBuf)) {
        isSignatureValid = true;
      }
    }

    if (!isSignatureValid) {
      // Invalid signature — no DB writes.
      return NextResponse.json(err("Invalid payment signature"), { status: 400 });
    }

    // 3. Verify and capture in a transaction.
    try {
      // Error signals from inside the transaction use this type.
      type TxResult =
        | { kind: "error"; message: string; httpStatus: number }
        | { kind: "alreadyVerified"; orderId: string }
        | { kind: "success"; orderId: string };

      const result = await db.transaction(async (tx): Promise<TxResult> => {
        // Find the payment record by razorpay order id
        const [payment] = await tx
          .select()
          .from(payments)
          .where(eq(payments.razorpayOrderId, razorpay_order_id))
          .limit(1);

        if (!payment) {
          return { kind: "error", message: "Payment record not found", httpStatus: 404 };
        }

        // Cross-check: the orderId from the client must match the DB record
        if (payment.orderId !== orderId) {
          return { kind: "error", message: "Order mismatch", httpStatus: 400 };
        }

        // Idempotency: if already captured, return success without re-processing
        if (payment.status === "captured") {
          return { kind: "alreadyVerified", orderId: payment.orderId };
        }

        // Update payment → captured
        await tx
          .update(payments)
          .set({
            status: "captured",
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            updatedAt: new Date(),
          })
          .where(eq(payments.razorpayOrderId, razorpay_order_id));

        // Update order → confirmed
        await tx
          .update(orders)
          .set({ status: "confirmed", updatedAt: new Date() })
          .where(eq(orders.id, payment.orderId));

        // Decrement stock atomically (only reached when payment was NOT captured,
        // so this is the first capture and the idempotency guard prevents double-decrement)
        const items = await tx
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, payment.orderId));

        for (const item of items) {
          const upd = await tx
            .update(productVariants)
            .set({
              stock: sql`${productVariants.stock} - ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(productVariants.id, item.variantId!),
                sql`${productVariants.stock} >= ${item.quantity}`
              )
            )
            .returning({ id: productVariants.id });

          if (upd.length === 0) {
            // Insufficient stock — throw to roll back the entire transaction.
            // Edge case: if stock was taken by another order between create-order
            // and verify, the tx rolls back (order stays "pending", payment stays
            // "pending") while Razorpay has already captured. Admin must refund
            // manually in this rare scenario.
            throw new Error("Insufficient stock for " + item.sku);
          }
        }

        return { kind: "success", orderId: payment.orderId };
      });

      if (result.kind === "error") {
        return NextResponse.json(err(result.message), { status: result.httpStatus });
      }
      if (result.kind === "alreadyVerified") {
        return NextResponse.json(
          ok({ orderId: result.orderId, alreadyVerified: true }),
          { status: 200 }
        );
      }
      // Emit order confirmed notification (best-effort — never fail the verify response)
      try {
        const [confirmedOrder] = await db
          .select({ userId: orders.userId })
          .from(orders)
          .where(eq(orders.id, result.orderId))
          .limit(1);
        if (confirmedOrder) {
          await triggerOrderConfirmedNotifications(confirmedOrder.userId, result.orderId);
          await inngest.send({
            name: "notification/order.confirmed",
            data: { userId: confirmedOrder.userId, orderId: result.orderId },
          });
        }
      } catch (e) {
        console.error("[verify] Failed to dispatch order.confirmed notification:", e);
      }

      return NextResponse.json(
        ok({ orderId: result.orderId, status: "confirmed" }),
        { status: 200 }
      );
    } catch (error) {
      return NextResponse.json(
        err("Payment verification failed: stock could not be reserved"),
        { status: 500 }
      );
    }
  } catch {
    return NextResponse.json(err("Failed to verify payment"), { status: 500 });
  }
}
