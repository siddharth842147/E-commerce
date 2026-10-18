import { db } from "@/db";
import { coupons, userCouponUsage } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export interface Coupon {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  minOrderAmount: string | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ValidateCouponResult {
  valid: boolean;
  coupon?: Coupon;
  error?: string;
}

/**
 * Validates a coupon code for a given cart subtotal and user
 * Requirements: 6.1-6.10, 7.1-7.2
 * 
 * @param code - The coupon code to validate
 * @param cartSubtotal - The cart subtotal amount (before discount)
 * @param userId - Optional user ID for authenticated user tracking (null for guests)
 * @returns ValidateCouponResult indicating validity, coupon data, or error message
 */
export async function validateCoupon(
  code: string,
  cartSubtotal: number,
  userId?: string | null
): Promise<ValidateCouponResult> {
  // 6.1 - Check coupon existence
  const [coupon] = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, code))
    .limit(1);

  // 6.2 - Coupon does not exist
  if (!coupon) {
    return {
      valid: false,
      error: "Invalid coupon code",
    };
  }

  // 6.3, 6.4 - Check is_active flag
  if (!coupon.isActive) {
    return {
      valid: false,
      error: "This coupon is expired or inactive",
    };
  }

  // 6.5, 6.6 - Check expiration date
  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    return {
      valid: false,
      error: "This coupon has expired",
    };
  }

  // 6.7, 6.8 - Check minimum order amount
  if (coupon.minOrderAmount) {
    const minAmount = Number(coupon.minOrderAmount);
    if (cartSubtotal < minAmount) {
      return {
        valid: false,
        error: `Minimum order amount of ₹${minAmount.toFixed(2)} required for this coupon`,
      };
    }
  }

  // 6.9, 6.10 - Check max uses
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return {
      valid: false,
      error: "This coupon has reached its usage limit",
    };
  }

  // 7.1, 7.2 - Check per-user usage (authenticated users only)
  if (userId) {
    const [existingUsage] = await db
      .select()
      .from(userCouponUsage)
      .where(
        and(
          eq(userCouponUsage.userId, userId),
          eq(userCouponUsage.couponId, coupon.id)
        )
      )
      .limit(1);

    if (existingUsage) {
      return {
        valid: false,
        error: "You have already used this coupon",
      };
    }
  }

  // All validations passed
  return {
    valid: true,
    coupon: {
      ...coupon,
      discountType: coupon.discountType as "percentage" | "fixed",
    },
  };
}
