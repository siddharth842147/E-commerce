import { createElement } from "react";
import { inngest } from "@/lib/inngest/client";
import { dispatchNotification } from "@/services/notification.service";
import AbandonedCartEmail from "@/components/emails/AbandonedCartEmail";
import { db } from "@/db";
import { cartItems, orders, productVariants, profiles } from "@/db/schema";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { siteConfig } from "@/config/site";

/**
 * cart/abandoned.check
 *
 * Triggered when a customer adds an item to cart or begins a shopping session.
 * Waits 2 hours using Inngest step.sleep(). After 2 hours, verifies if the cart
 * still contains items and if no order was placed. If abandoned, sends a friendly
 * reminder email and WhatsApp notification with a direct checkout link and incentive.
 */
export const abandonedCartFunction = inngest.createFunction(
  {
    id: "cart-abandoned-reminder",
    retries: 2,
    triggers: [{ event: "cart/abandoned.check" }],
  },
  async ({ event, step }) => {
    const { userId } = event.data as { userId: string };

    // Step 1: Wait 2 hours before checking for cart abandonment
    await step.sleep("wait-for-2-hours", "2h");

    // Step 2: Verify cart contents and check if an order was placed
    const checkResult = await step.run("verify-cart-status", async () => {
      // 1. Fetch current items in cart
      const currentCartItems = await db
        .select({
          id: cartItems.id,
          variantId: cartItems.variantId,
          quantity: cartItems.quantity,
          price: productVariants.price,
        })
        .from(cartItems)
        .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
        .where(eq(cartItems.userId, userId));

      if (currentCartItems.length === 0) {
        return { isAbandoned: false, reason: "Cart is empty", totalItems: 0, subtotal: "0" };
      }

      // 2. Check if user completed any order in the last 2.5 hours
      const twoHoursAgo = new Date(Date.now() - 2.5 * 60 * 60 * 1000);
      const recentCompletedOrders = await db
        .select({ id: orders.id })
        .from(orders)
        .where(
          and(
            eq(orders.userId, userId),
            gte(orders.createdAt, twoHoursAgo)
          )
        )
        .limit(1);

      if (recentCompletedOrders.length > 0) {
        return { isAbandoned: false, reason: "Order already completed", totalItems: 0, subtotal: "0" };
      }

      const totalItems = currentCartItems.reduce((acc, i) => acc + i.quantity, 0);
      const subtotal = currentCartItems.reduce(
        (acc, i) => acc + parseFloat(i.price || "0") * i.quantity,
        0
      );

      return {
        isAbandoned: true,
        reason: "",
        totalItems,
        subtotal: subtotal.toFixed(2),
      };
    });

    if (!checkResult.isAbandoned) {
      return { skipped: true, reason: checkResult.reason };
    }

    // Step 3: Load customer profile
    const profile = await step.run("load-customer-profile", async () => {
      const [p] = await db
        .select({
          fullName: profiles.fullName,
          email: profiles.email,
          phone: profiles.phone,
        })
        .from(profiles)
        .where(eq(profiles.id, userId))
        .limit(1);
      return p ?? null;
    });

    if (!profile) {
      return { skipped: true, reason: "Customer profile not found" };
    }

    // Step 4: Dispatch Abandoned Cart Reminder via Email and WhatsApp
    await step.run("dispatch-reminder", async () => {
      const checkoutUrl = `${siteConfig.url}/cart`;
      const firstName = profile.fullName ? profile.fullName.split(" ")[0] : "there";

      await dispatchNotification({
        userId,
        eventType: "notification/cart.abandoned" as any,
        data: {
          email: {
            subject: `Did you forget something? Your cart at ${siteConfig.name} is waiting!`,
            react: createElement(AbandonedCartEmail, {
              name: profile.fullName || undefined,
              itemsCount: checkResult.totalItems,
              subtotal: checkResult.subtotal,
              checkoutUrl,
              couponCode: "WELCOME10",
            }),
            templateId: "cart_abandoned",
          },
          whatsapp: {
            // Meta WhatsApp template "cart_abandoned"
            template: "cart_abandoned",
            params: [
              firstName,
              String(checkResult.totalItems),
              `₹${checkResult.subtotal}`,
              checkoutUrl,
            ],
            templateId: "cart_abandoned",
          },
          sms: {
            message: `Hi ${firstName}, you left items in your cart at ${siteConfig.name}! Complete your order here: ${checkoutUrl}`,
            templateId: "cart_abandoned",
          },
        },
      });
    });

    return { sent: true, userId, itemsCount: checkResult.totalItems };
  }
);
