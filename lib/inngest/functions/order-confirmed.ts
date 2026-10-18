import { createElement } from "react";
import { inngest } from "@/lib/inngest/client";
import { dispatchNotification } from "@/services/notification.service";
import OrderConfirmedEmail from "@/components/emails/OrderConfirmedEmail";
import { generateInvoicePDF } from "@/lib/invoice/generate-invoice";
import { db } from "@/db";
import { profiles, orders, orderItems, payments, notificationsLog } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { siteConfig } from "@/config/site";

/**
 * notification/order.confirmed
 *
 * Fired when an order transitions to "confirmed" status (Razorpay verify,
 * webhook payment.captured, or COD placement). Sends an order confirmation
 * on all opted-in channels, with a PDF invoice attached to the email.
 *
 * Idempotency: before sending on each channel the function checks whether a
 * "sent" row already exists for this orderId+eventType+channel in
 * notifications_log to avoid duplicate notifications when both the verify
 * route and the webhook fire for the same order.
 */
export async function triggerOrderConfirmedNotifications(
  userId: string,
  orderId: string
): Promise<void> {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!order) return;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const [payment] = await db
    .select({ method: payments.method })
    .from(payments)
    .where(eq(payments.orderId, orderId))
    .limit(1);

  const [profile] = await db
    .select({ fullName: profiles.fullName, email: profiles.email, phone: profiles.phone })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  const trackingUrl = `${siteConfig.url}/orders/${orderId}`;
  const addr = (order.shippingAddress ?? {}) as {
    recipientName?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    phone?: string;
  };

  const invoicePdfBuffer = await generateInvoicePDF({
    invoiceNumber: order.id,
    orderDate: order.createdAt,
    customerName: profile?.fullName ?? profile?.email ?? "Customer",
    shippingAddress: {
      recipientName: addr.recipientName ?? "Customer",
      addressLine1: addr.addressLine1 ?? "",
      addressLine2: addr.addressLine2,
      city: addr.city ?? "",
      state: addr.state ?? "",
      postalCode: addr.postalCode ?? "",
      phone: addr.phone ?? profile?.phone ?? "",
    },
    items: items.map((i) => ({
      productName: i.productName,
      variantTitle: i.variantTitle,
      sku: i.sku,
      quantity: i.quantity,
      unitPrice: `₹${Number(i.unitPrice).toFixed(2)}`,
      total: `₹${Number(i.total).toFixed(2)}`,
    })),
    subtotal: `₹${Number(order.subtotal).toFixed(2)}`,
    discount: `₹${Number(order.discountAmount).toFixed(2)}`,
    tax: `₹${Number(order.taxAmount).toFixed(2)}`,
    shipping: `₹${Number(order.shippingAmount).toFixed(2)}`,
    total: `₹${Number(order.total).toFixed(2)}`,
    paymentMethod: payment?.method ?? "online",
    orderStatus: order.status,
  });

  await dispatchNotification({
    userId,
    eventType: "notification/order.confirmed",
    data: {
      email: {
        subject: `Order confirmed — ${orderId.slice(0, 8).toUpperCase()}`,
        react: createElement(OrderConfirmedEmail, {
          orderId: orderId.slice(0, 8).toUpperCase(),
          customerName: profile?.fullName ?? undefined,
          total: `₹${Number(order.total).toFixed(2)}`,
          items: items.map((i) => ({
            name: i.productName,
            quantity: i.quantity,
            price: `₹${Number(i.unitPrice).toFixed(2)}`,
          })),
          trackingUrl,
        }),
        templateId: "order_confirmed",
        attachments: [
          {
            content: invoicePdfBuffer,
            filename: `invoice-${orderId.slice(0, 8).toUpperCase()}.pdf`,
            contentType: "application/pdf",
          },
        ],
      },
      sms: {
        message: `Your ${siteConfig.name} order #${orderId.slice(0, 8).toUpperCase()} has been confirmed. Total: ₹${Number(order.total).toFixed(2)}. Track at ${trackingUrl}`,
        templateId: "order_confirmed",
      },
      whatsapp: {
        template: "order_confirmed",
        params: [
          orderId.slice(0, 8).toUpperCase(),
          `₹${Number(order.total).toFixed(2)}`,
          trackingUrl,
        ],
        templateId: "order_confirmed",
      },
    },
  });
}

export const orderConfirmedFunction = inngest.createFunction(
  {
    id: "notification-order-confirmed",
    retries: 3,
    triggers: [{ event: "notification/order.confirmed" }],
  },
  async ({ event, step }) => {
    const { userId, orderId } = event.data as {
      userId: string;
      orderId: string;
    };

    await step.run("send-order-confirmed", async () => {
      await triggerOrderConfirmedNotifications(userId, orderId);
    });
  }
);
