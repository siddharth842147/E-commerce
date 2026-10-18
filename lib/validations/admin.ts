import { z } from "zod";

export const updateTrackingSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
  trackingId: z.string().min(1, "Tracking ID is required").max(100),
  carrier: z.string().min(1, "Carrier name is required").max(100),
});

export type UpdateTrackingInput = z.infer<typeof updateTrackingSchema>;

export const createCouponSchema = z.object({
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(50)
    .regex(/^[A-Z0-9-_]+$/, "Code must be uppercase alphanumeric"),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.coerce.number().positive("Discount value must be greater than 0"),
  minOrderAmount: z.coerce.number().min(0).optional().nullable(),
  maxUses: z.coerce.number().int().positive().optional().nullable(),
  isActive: z.boolean().default(true),
  expiresAt: z.string().optional().nullable(),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;

export const updateCouponSchema = createCouponSchema.partial();
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;

export const updateReviewStatusSchema = z.object({
  reviewId: z.string().uuid("Invalid review ID"),
  status: z.enum(["pending", "approved", "rejected"]),
});

export type UpdateReviewStatusInput = z.infer<typeof updateReviewStatusSchema>;
