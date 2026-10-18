import { z } from "zod";

/**
 * Update notification preference input — all booleans, all optional so the
 * caller can update a subset of channels.
 */
export const updateNotificationPreferencesSchema = z.object({
  email: z.boolean().optional(),
  sms: z.boolean().optional(),
  whatsapp: z.boolean().optional(),
});

export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;

/**
 * Update order status input — only the transitions an admin can trigger
 * manually (shipped, delivered, cancelled). Payment-gateway-driven transitions
 * (confirmed, refunded, pending) are handled by the Razorpay routes.
 */
export const updateOrderStatusSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
  status: z.enum(["shipped", "delivered", "cancelled"]),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
