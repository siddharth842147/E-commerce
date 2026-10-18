import { createElement } from "react";
import { inngest } from "@/lib/inngest/client";
import { dispatchNotification } from "@/services/notification.service";
import OrderDeliveredEmail from "@/components/emails/OrderDeliveredEmail";
import { siteConfig } from "@/config/site";

/**
 * notification/order.delivered
 *
 * Fired when an admin marks an order as delivered via updateOrderStatus().
 * Payload: { userId, orderId }
 */
export const orderDeliveredFunction = inngest.createFunction(
  {
    id: "notification-order-delivered",
    retries: 3,
    triggers: [{ event: "notification/order.delivered" }],
  },
  async ({ event, step }) => {
    const { userId, orderId } = event.data as {
      userId: string;
      orderId: string;
    };

    const orderRef = orderId.slice(0, 8).toUpperCase();

    await step.run("send-order-delivered", async () => {
      await dispatchNotification({
        userId,
        eventType: "notification/order.delivered",
        data: {
          email: {
            subject: `Your order ${orderRef} has been delivered`,
            react: createElement(OrderDeliveredEmail, { orderId: orderRef }),
            templateId: "order_delivered",
          },
          sms: {
            message: `Your ${siteConfig.name} order #${orderRef} has been delivered. Thank you for shopping!`,
            templateId: "order_delivered",
          },
          whatsapp: {
            // Template "order_delivered" must be approved in Meta Business Manager.
            template: "order_delivered",
            params: [orderRef],
            templateId: "order_delivered",
          },
        },
      });
    });
  }
);
