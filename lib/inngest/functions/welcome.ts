import { createElement } from "react";
import { inngest } from "@/lib/inngest/client";
import { dispatchNotification } from "@/services/notification.service";
import WelcomeEmail from "@/components/emails/WelcomeEmail";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { siteConfig } from "@/config/site";

/**
 * notification/welcome
 *
 * Triggered when a new user account is created. Sends a welcome message on
 * all opted-in channels.
 *
 * NOTE: The trigger wiring (emitting this event from the signup flow) is
 * outside the current scope — no signup server action exists in the codebase
 * yet. The function is fully implemented and ready; call
 *   inngest.send({ name: "notification/welcome", data: { userId } })
 * from the authentication success path when one is added.
 */
export const welcomeFunction = inngest.createFunction(
  { id: "notification-welcome", retries: 3, triggers: [{ event: "notification/welcome" }] },
  async ({ event, step }) => {
    const { userId } = event.data as { userId: string };

    // Step 1: load profile
    const profile = await step.run("load-profile", async () => {
      const [p] = await db
        .select({ fullName: profiles.fullName })
        .from(profiles)
        .where(eq(profiles.id, userId))
        .limit(1);
      return p ?? null;
    });

    // Step 2: send welcome notifications on all opted-in channels
    await step.run("send-welcome", async () => {
      await dispatchNotification({
        userId,
        eventType: "notification/welcome",
        data: {
          email: {
            subject: `Welcome to ${siteConfig.name}`,
            react: createElement(WelcomeEmail, {
              name: profile?.fullName ?? undefined,
            }),
            templateId: "welcome",
          },
          sms: {
            message: `Welcome to ${siteConfig.name}! Your account has been created successfully.`,
            templateId: "welcome",
          },
          whatsapp: {
            // Template "welcome" must be created and approved in Meta Business Manager.
            template: "welcome",
            params: [profile?.fullName ?? "there"],
            templateId: "welcome",
          },
        },
      });
    });
  }
);
