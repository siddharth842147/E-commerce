import { createElement } from "react";
import { inngest } from "@/lib/inngest/client";
import { dispatchNotification } from "@/services/notification.service";
import OTPEmail from "@/components/emails/OTPEmail";
import { siteConfig } from "@/config/site";

/**
 * notification/otp
 *
 * Delivers an OTP code on opted-in channels.
 *
 * NOTE: This function is ready; wire it by calling
 *   inngest.send({ name: "notification/otp", data: { userId, otp } })
 * from the OTP generation flow when phone/email verification is added.
 *
 * Retries: if a send fails transiently the step retries up to 3 times.
 * OTPs are short-lived; consider setting a low TTL on the event if duplicate
 * delivery after expiry is unacceptable.
 */
export const otpFunction = inngest.createFunction(
  { id: "notification-otp", retries: 3, triggers: [{ event: "notification/otp" }] },
  async ({ event, step }) => {
    const { userId, otp } = event.data as { userId: string; otp: string };

    await step.run("send-otp", async () => {
      await dispatchNotification({
        userId,
        eventType: "notification/otp",
        data: {
          email: {
            subject: `Your ${siteConfig.name} verification code`,
            react: createElement(OTPEmail, { otp }),
            templateId: "otp",
          },
          sms: {
            // MSG91 DLT-approved template — {otp} is the variable.
            message: `Your ${siteConfig.name} OTP is ${otp}. Valid for 10 minutes. Do not share it.`,
            templateId: "otp",
          },
          whatsapp: {
            // Template "otp_verification" must be approved in Meta Business Manager.
            template: "otp_verification",
            params: [otp],
            templateId: "otp_verification",
          },
        },
      });
    });
  }
);
