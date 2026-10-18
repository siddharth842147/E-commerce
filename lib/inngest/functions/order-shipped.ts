import { createElement } from "react";
import { inngest } from "@/lib/inngest/client";
import { dispatchNotification } from "@/services/notification.service";
import OrderShippedEmail from "@/components/emails/OrderShippedEmail";
import { siteConfig } from "@/config/site";

/**
 * notification/order.shipped
 *
 * Fired when an admin marks an order as shipped via updateOrderStatus().
 * Payload: { userId, orderId, trackingUrl? }
 */
export const orderShippedFunction = inngest.createFunction(
  {
    id: "notification-order-shipped",
    retries: 3,
    triggers: [{ event: "notification/order.shipped" }],
  },
  async ({ event, step }) => {
    const { userId, orderId, trackingUrl } = event.data as {
      userId: string;
      orderId: string;
      trackingUrl?: string;
    };

    const orderRef = orderId.slice(0, 8).toUpperCase();
    const resolvedTrackingUrl =
      trackingUrl ?? `${siteConfig.url}/orders/${orderId}`;

    await step.run("send-order-shipped", async () => {
      await dispatchNotification({
        userId,
        eventType: "notification/order.shipped",
        data: {
          email: {
            subject: `Your order ${orderRef} has shipped`,
            react: createElement(OrderShippedEmail, {
              orderId: orderRef,
              trackingUrl: resolvedTrackingUrl,
            }),
            templateId: "order_shipped",
          },
          sms: {
            message: `Your ${siteConfig.name} order #${orderRef} has been shipped. It will arrive soon.`,
            templateId: "order_shipped",
          },
          whatsapp: {
            // Template "order_shipped" must be approved in Meta Business Manager.
            template: "order_shipped",
            params: [orderRef, resolvedTrackingUrl],
            templateId: "order_shipped",
          },
        },
      });
    });
  }
);
