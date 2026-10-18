import { type NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { db } from "@/db";
import { orders, payments, orderItems, productVariants } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";

/**
 * POST /api/payments/webhook
 *
 * Handles Razorpay webhook events with server-side signature verification
 * and idempotent processing.
 *
 * Events handled:
 *  - payment.captured: update payment → "captured", order → "confirmed",
 *    decrement stock (idempotent — only on pending → captured transition),
 *    emit notification/order.confirmed
 *  - payment.failed: update payment → "failed", order → "cancelled",
 *    restore stock (increment back), emit notification/order.cancelled
 *  - refund.processed: update payment → "refunded", order → "refunded",
 *    emit notification/refund.processed
 *    (does NOT restore stock — the admin processRefund action already
 *    restored it when initiating the refund)
 *
 * Security:
 *  - Raw body HMAC-SHA256 verification against RAZORPAY_WEBHOOK_SECRET
 *    using the x-razorpay-signature header and crypto.timingSafeEqual
 *  - Idempotent: each handler checks current status before mutating; if
 *    already in the target state, it skips and returns 200
 *  - Each event handler runs in its own Drizzle transaction
 *
 * Idempotency approach: before mutating, SELECT the current payment/order
 * status. If already in the target state, return 200 without re-processing.
 * This handles Razorpay's retry behavior (it retries on non-2xx responses,
 * but may also deliver duplicate events).
 *
 * IMPORTANT: RAZORPAY_WEBHOOK_SECRET must be set in .env.local for this route
 * to accept webhooks. Without it, all signatures will be rejected (500).
 * Get the test webhook secret from the Razorpay dashboard → Settings → Webhooks.
 *
 * Returns 200 for all valid-signature outcomes (success, idempotent skip,
 * unknown event, and handler errors) so Razorpay does not retry-storm.
 * Returns 401 only for invalid signatures.
 *
 * Requirements: 13.3, 5.1, 5.2, 5.3, 5.4
 */
export async function POST(request: NextRequest) {
  // 1. Read the raw body for HMAC verification (do NOT use request.json() first —
  //    the signature is computed over the exact bytes Razorpay sent).
  const raw = await request.text();
  const sigHeader = request.headers.get("x-razorpay-signature");

  // 2. Verify the webhook signature
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not set — cannot verify webhooks");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }
  if (!sigHeader) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(raw)
    .digest("hex");

  const sigBuf = Buffer.from(sigHeader);
  const expBuf = Buffer.from(expected);

  // Constant-time comparison (lengths must match first).
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(expBuf, sigBuf)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 3. Parse the event payload
  let event: RazorpayWebhookEvent;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 200 });
  }

  const eventType: string = event.event;

  // 4. Dispatch to the appropriate handler. Each handler runs in its own
  //    transaction and is idempotent (checks current status before mutating).
  //    All outcomes return 200 to prevent Razorpay retry storms.
  //    Handlers return an optional Inngest event to emit after the tx commits.
  type InngestEvent = { name: string; data: Record<string, unknown> };
  let notificationEvent: InngestEvent | null = null;

  try {
    switch (eventType) {
      case "payment.captured":
        notificationEvent = await handlePaymentCaptured(event);
        break;
      case "payment.failed":
        notificationEvent = await handlePaymentFailed(event);
        break;
      case "refund.processed":
        notificationEvent = await handleRefundProcessed(event);
        break;
      default:
        // Unknown event — acknowledge and skip
        break;
    }
  } catch (error) {
    // Log the error but still return 200 so Razorpay doesn't retry-storm.
    // The idempotency checks in each handler will handle safe retries.
    console.error(`Webhook handler error for event ${eventType}:`, error);
  }

  // Emit the Inngest notification event after the DB transaction commits.
  // Best-effort: a failure here never prevents the 200 response.
  if (notificationEvent) {
    try {
      await inngest.send(notificationEvent);
    } catch (e) {
      console.error(
        `[webhook] Failed to emit Inngest event for ${eventType}:`,
        e
      );
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

// --- Event handlers ---

/**
 * payment.captured: update payment → captured, order → confirmed, decrement stock.
 * Idempotent: if payment is already captured, skip all mutations.
 * Stock is decremented only on the pending → captured transition, so the
 * verify route and webhook can both fire without double-decrementing.
 * Returns an Inngest event to emit if a transition actually happened.
 */
async function handlePaymentCaptured(
  event: RazorpayWebhookEvent
): Promise<{ name: string; data: Record<string, unknown> } | null> {
  const entity = event.payload?.payment?.entity;
  if (!entity) return null;

  const razorpayOrderId: string = entity.order_id;
  const razorpayPaymentId: string = entity.id;

  let capturedOrderId: string | null = null;
  let capturedUserId: string | null = null;

  await db.transaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.razorpayOrderId, razorpayOrderId))
      .limit(1);

    if (!payment) {
      // Order not ours or payment record doesn't exist — acknowledge and skip
      return;
    }

    // Idempotency: if already captured, skip
    if (payment.status === "captured") return;

    // Update payment → captured
    await tx
      .update(payments)
      .set({
        status: "captured",
        razorpayPaymentId,
        method: entity.method ?? null,
        updatedAt: new Date(),
      })
      .where(eq(payments.razorpayOrderId, razorpayOrderId));

    // Update order → confirmed
    const [updatedOrder] = await tx
      .update(orders)
      .set({ status: "confirmed", updatedAt: new Date() })
      .where(eq(orders.id, payment.orderId))
      .returning({ id: orders.id, userId: orders.userId });

    if (updatedOrder) {
      capturedOrderId = updatedOrder.id;
      capturedUserId = updatedOrder.userId;
    }

    // Decrement stock atomically (WHERE stock >= quantity)
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
        throw new Error("Insufficient stock for " + item.sku);
      }
    }
  });

  if (capturedOrderId && capturedUserId) {
    return {
      name: "notification/order.confirmed",
      data: { userId: capturedUserId, orderId: capturedOrderId },
    };
  }
  return null;
}

/**
 * payment.failed: update payment → failed, order → cancelled, restore stock.
 * Idempotent: if order is already cancelled, skip all mutations.
 * Returns an Inngest event to emit if a transition actually happened.
 */
async function handlePaymentFailed(
  event: RazorpayWebhookEvent
): Promise<{ name: string; data: Record<string, unknown> } | null> {
  const entity = event.payload?.payment?.entity;
  if (!entity) return null;

  const razorpayOrderId: string = entity.order_id;

  let cancelledOrderId: string | null = null;
  let cancelledUserId: string | null = null;

  await db.transaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.razorpayOrderId, razorpayOrderId))
      .limit(1);

    if (!payment) return;

    // Idempotency: if order is already cancelled, skip
    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, payment.orderId))
      .limit(1);
    if (!order || order.status === "cancelled") return;

    // Update payment → failed
    await tx
      .update(payments)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(payments.razorpayOrderId, razorpayOrderId));

    // Update order → cancelled
    await tx
      .update(orders)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(orders.id, payment.orderId));

    cancelledOrderId = payment.orderId;
    cancelledUserId = order.userId;

    // Restore stock (increment back — no guard needed, stock can only go up)
    const items = await tx
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, payment.orderId));

    for (const item of items) {
      await tx
        .update(productVariants)
        .set({
          stock: sql`${productVariants.stock} + ${item.quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(productVariants.id, item.variantId!));
    }
  });

  if (cancelledOrderId && cancelledUserId) {
    return {
      name: "notification/order.cancelled",
      data: { userId: cancelledUserId, orderId: cancelledOrderId, stockRestored: true },
    };
  }
  return null;
}

/**
 * refund.processed: update payment → refunded, order → refunded.
 * Does NOT restore stock — the admin processRefund action already restored
 * stock when it initiated the refund. If a refund is initiated directly in
 * the Razorpay dashboard (not via the admin action), stock will NOT be
 * restored. This is a known limitation documented per spec.
 * Idempotent: if payment is already refunded, skip.
 * Returns an Inngest event to emit if a transition actually happened.
 */
async function handleRefundProcessed(
  event: RazorpayWebhookEvent
): Promise<{ name: string; data: Record<string, unknown> } | null> {
  const entity = event.payload?.refund?.entity;
  if (!entity) return null;

  const razorpayPaymentId: string = entity.payment_id;

  let refundedOrderId: string | null = null;
  let refundedUserId: string | null = null;
  let refundAmount: string | null = null;

  await db.transaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.razorpayPaymentId, razorpayPaymentId))
      .limit(1);

    if (!payment) return;

    // Idempotency: if already refunded, skip
    if (payment.status === "refunded") return;

    // Update payment → refunded
    await tx
      .update(payments)
      .set({ status: "refunded", updatedAt: new Date() })
      .where(eq(payments.id, payment.id));

    // Update order → refunded
    const [updatedOrder] = await tx
      .update(orders)
      .set({ status: "refunded", updatedAt: new Date() })
      .where(eq(orders.id, payment.orderId))
      .returning({ id: orders.id, userId: orders.userId });

    if (updatedOrder) {
      refundedOrderId = updatedOrder.id;
      refundedUserId = updatedOrder.userId;
      refundAmount = String(payment.amount);
    }
  });

  if (refundedOrderId && refundedUserId) {
    return {
      name: "notification/refund.processed",
      data: {
        userId: refundedUserId,
        orderId: refundedOrderId,
        amount: refundAmount ?? "0",
      },
    };
  }
  return null;
}

// --- Types ---

interface RazorpayWebhookEvent {
  event: string;
  payload?: {
    payment?: {
      entity: {
        id: string;
        order_id: string;
        method?: string;
        amount: number;
        currency: string;
        status: string;
      };
    };
    refund?: {
      entity: {
        id: string;
        payment_id: string;
        amount: number;
        currency: string;
        status: string;
      };
    };
  };
}
