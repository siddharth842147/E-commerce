import { createElement } from "react";
import { inngest } from "@/lib/inngest/client";
import { dispatchNotification } from "@/services/notification.service";
import RefundProcessedEmail from "@/components/emails/RefundProcessedEmail";
import { siteConfig } from "@/config/site";

/**
 * notification/refund.processed
 *
 * Fired when a refund is processed (admin processRefund or Razorpay
 * refund.processed webhook). Payload: { userId, orderId, amount }
 */
export const refundProcessedFunction = inngest.createFunction(
  {
    id: "notification-refund-processed",
    retries: 3,
    triggers: [{ event: "notification/refund.processed" }],
  },
  async ({ event, step }) => {
    const { userId, orderId, amount } = event.data as {
      userId: string;
      orderId: string;
      amount: string;
    };

    const orderRef = orderId.slice(0, 8).toUpperCase();
    const amountFormatted = `₹${Number(amount).toFixed(2)}`;

    await step.run("send-refund-processed", async () => {
      await dispatchNotification({
        userId,
        eventType: "notification/refund.processed",
        data: {
          email: {
            subject: `Refund processed for order ${orderRef}`,
            react: createElement(RefundProcessedEmail, {
              orderId: orderRef,
              amount: amountFormatted,
            }),
            templateId: "refund_processed",
          },
          sms: {
            message: `Your ${siteConfig.name} refund for order #${orderRef} has been processed. Amount: ${amountFormatted}. Expect it in 5-7 business days.`,
            templateId: "refund_processed",
          },
          whatsapp: {
            // Template "refund_processed" must be approved in Meta Business Manager.
            template: "refund_processed",
            params: [orderRef, amountFormatted],
            templateId: "refund_processed",
          },
        },
      });
    });
  }
);
