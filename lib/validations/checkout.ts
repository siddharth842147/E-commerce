import { z } from "zod";

/**
 * Checkout Validation Schemas
 * 
 * Zod schemas for validating shipping address and checkout data.
 * Ensures data integrity during checkout flow.
 * 
 * Requirements: 12.3, 20.2
 */

/**
 * Normalizes Indian phone numbers by stripping country prefixes (+91, 91, 0)
 * and non-digit characters while preserving raw 10-digit numbers or invalid inputs.
 */
export function normalizeIndianPhone(val: string): string {
  const digits = val.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }
  return digits;
}

/**
 * Shipping address validation schema
 * Requirement 12.3: Order creation requires shipping address with recipient name, 
 * phone, address fields, city, state, and postal code
 */
export const shippingAddressSchema = z.object({
  recipientName: z
    .string()
    .min(2, "Recipient name must be at least 2 characters")
    .max(255, "Recipient name must not exceed 255 characters"),
  
  phone: z
    .string()
    .transform(normalizeIndianPhone)
    .pipe(
      z
        .string()
        .regex(
          /^[6-9]\d{9}$/,
          "Phone number must be a valid Indian mobile number (10 digits starting with 6-9)"
        )
    ),
  
  addressLine1: z
    .string()
    .min(1, "Address line 1 is required")
    .max(500, "Address line 1 must not exceed 500 characters"),
  
  addressLine2: z
    .string()
    .max(500, "Address line 2 must not exceed 500 characters")
    .optional(),
  
  city: z
    .string()
    .min(1, "City is required")
    .max(100, "City must not exceed 100 characters"),
  
  state: z
    .string()
    .min(1, "State is required")
    .max(100, "State must not exceed 100 characters"),
  
  postalCode: z
    .string()
    .regex(/^\d{6}$/, "Postal code must be exactly 6 digits"),
});

/**
 * Checkout data validation schema
 * Requirement 20.2: Guest users must provide email, phone, and shipping address during checkout
 * 
 * Includes shipping address, optional email and phone for guest users, and optional coupon code
 */
export const checkoutSchema = z.object({
  shippingAddress: shippingAddressSchema,
  
  email: z
    .string()
    .nullish()
    .transform((val) => (!val || !val.trim() ? undefined : val.trim()))
    .pipe(z.string().email("Invalid email address").optional()),
  
  phone: z
    .string()
    .nullish()
    .transform((val) => (!val || !val.trim() ? undefined : normalizeIndianPhone(val)))
    .pipe(
      z
        .string()
        .regex(
          /^[6-9]\d{9}$/,
          "Phone number must be a valid Indian mobile number (10 digits starting with 6-9)"
        )
        .optional()
    ),
  
  couponCode: z
    .string()
    .min(1)
    .max(50)
    .optional(),

  // Payment method is OPTIONAL so existing callers/tests that omit it still parse.
  // New checkout flows select "razorpay" (gateway) or "cod" (cash on delivery).
  paymentMethod: z.enum(["razorpay", "cod"]).optional(),
});

/**
 * Create-order request schema
 * Extends checkout data with an optional client-supplied cart fallback (`items`).
 * When `items` is absent, the server resolves the cart from the session/cookie
 * via getCart(). Used by the Razorpay create-order route and the COD action.
 */
export const createOrderSchema = checkoutSchema.extend({
  items: z
    .array(
      z.object({
        variantId: z.string().uuid("Invalid variant ID format"),
        quantity: z
          .number()
          .int("Quantity must be an integer")
          .positive("Quantity must be positive"),
      })
    )
    .optional(),
});

/**
 * Payment verification schema
 * Razorpay returns these from the checkout modal handler; the server verifies
 * the signature against RAZORPAY_KEY_SECRET before trusting any of them.
 */
export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, "razorpay_order_id is required"),
  razorpay_payment_id: z.string().min(1, "razorpay_payment_id is required"),
  razorpay_signature: z.string().min(1, "razorpay_signature is required"),
  orderId: z.string().uuid("Invalid order ID format"),
});

// Export inferred types
export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
export type CheckoutDataInput = z.infer<typeof checkoutSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
