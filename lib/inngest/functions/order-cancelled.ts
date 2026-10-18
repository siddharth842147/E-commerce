import { createElement } from "react";
import { inngest } from "@/lib/inngest/client";
import { dispatchNotification } from "@/services/notification.service";
import OrderCancelledEmail from "@/components/emails/OrderCancelledEmail";
import { siteConfig } from "@/config/site";

/**
 * notification/order.cancelled
 *
 * Fired when an order is cancelled (payment.failed webhook or admin
 * updateOrderStatus). Payload: { userId, orderId, stockRestored? }
 */
export const orderCancelledFunction = inngest.createFunction(
  {
    id: "notification-order-cancelled",
    retries: 3,
    triggers: [{ event: "notification/order.cancelled" }],
  },
  async ({ event, step }) => {
    const { userId, orderId, stockRestored = true } = event.data as {
      userId: string;
      orderId: string;
      stockRestored?: boolean;
    };

    const orderRef = orderId.slice(0, 8).toUpperCase();

    await step.run("send-order-cancelled", async () => {
      await dispatchNotification({
        userId,
        eventType: "notification/order.cancelled",
        data: {
          email: {
            subject: `Your order ${orderRef} has been cancelled`,
            react: createElement(OrderCancelledEmail, {
              orderId: orderRef,
              stockRestored,
            }),
            templateId: "order_cancelled",
          },
          sms: {
            message: `Your ${siteConfig.name} order #${orderRef} has been cancelled.${stockRestored ? " Stock has been restored." : ""}`,
            templateId: "order_cancelled",
          },
          whatsapp: {
            // Template "order_cancelled" must be approved in Meta Business Manager.
            template: "order_cancelled",
            params: [orderRef],
            templateId: "order_cancelled",
          },
        },
      });
    });
  }
);
