import { z } from "zod";

export const addToCartSchema = z.object({
  variantId: z.string().uuid("Invalid variant ID format"),
  quantity: z.number().int("Quantity must be an integer").positive("Quantity must be positive"),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;

export const updateCartSchema = z.object({
  variantId: z.string().uuid("Invalid variant ID format"),
  quantity: z.number().int("Quantity must be an integer").positive("Quantity must be positive"),
});

export type UpdateCartInput = z.infer<typeof updateCartSchema>;
