import { db } from "@/db";
import { productVariants, products, categories } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import Razorpay from "razorpay";
import type { CartItem } from "@/types/cart";
import type { OrderCalculation } from "@/types/checkout";
import type { Coupon } from "./coupon.service";

/**
 * Stock validation result for checkout
 */
export interface StockValidationResult {
  valid: boolean;
  unavailableItems?: string[]; // SKU list of out-of-stock items
}

/**
 * Razorpay order creation result
 */
export interface RazorpayOrderResult {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

/**
 * Validates that all cart items have sufficient stock for checkout
 * Requirements: 4.5, 4.6
 * 
 * @param cartItems - Array of cart items to validate
 * @returns StockValidationResult indicating validity and unavailable item SKUs
 */
export async function validateCartStock(
  cartItems: CartItem[]
): Promise<StockValidationResult> {
  if (cartItems.length === 0) {
    return { valid: true };
  }

  const variantIds = cartItems.map((item) => item.variantId);

  // Query current stock levels for all variants
  const variants = await db
    .select({
      id: productVariants.id,
      sku: productVariants.sku,
      stock: productVariants.stock,
    })
    .from(productVariants)
    .where(inArray(productVariants.id, variantIds));

  // Create a map for quick lookup
  const stockMap = new Map(
    variants.map((v) => [v.id, { sku: v.sku, stock: v.stock }])
  );

  // Check each cart item against current stock
  const unavailableItems: string[] = [];

  for (const item of cartItems) {
    const stockInfo = stockMap.get(item.variantId);
    if (!stockInfo || stockInfo.stock < item.quantity) {
      unavailableItems.push(stockInfo?.sku || item.sku);
    }
  }

  if (unavailableItems.length > 0) {
    return {
      valid: false,
      unavailableItems,
    };
  }

  return { valid: true };
}

/**
 * Calculates discount amount based on coupon type
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 * 
 * @param subtotal - Cart subtotal before discount
 * @param coupon - Optional coupon to apply (undefined if no coupon)
 * @returns Discount amount (0 if no coupon)
 */
export function calculateDiscount(
  subtotal: number,
  coupon?: Coupon
): number {
  // 8.5 - No coupon applied
  if (!coupon) {
    return 0;
  }

  const discountValue = Number(coupon.discountValue);

  if (coupon.discountType === "percentage") {
    // 8.1, 8.2 - Percentage discount, capped at subtotal
    const discount = (subtotal * discountValue) / 100;
    return Math.min(discount, subtotal);
  } else {
    // 8.3, 8.4 - Fixed discount, capped at subtotal
    return Math.min(discountValue, subtotal);
  }
}

/**
 * Calculates GST tax for all cart items based on category tax rates
 * Requirements: 9.1, 9.2, 9.3
 * 
 * @param cartItems - Array of enriched cart items
 * @returns Total tax amount
 */
export async function calculateTax(cartItems: CartItem[]): Promise<number> {
  if (cartItems.length === 0) {
    return 0;
  }

  // Get product IDs to look up categories
  const productIds = [...new Set(cartItems.map((item) => item.productId))];

  // 9.1 - Retrieve tax_rate from categories table for each product's category
  const productCategories = await db
    .select({
      productId: products.id,
      taxRate: categories.taxRate,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(inArray(products.id, productIds));

  // Create a map for quick lookup
  const taxRateMap = new Map(
    productCategories.map((pc) => [
      pc.productId,
      Number(pc.taxRate) || 0, // 9.5 - default to 0 if no tax_rate
    ])
  );

  // 9.2, 9.3 - Calculate tax for each line item and sum
  let totalTax = 0;

  for (const item of cartItems) {
    const taxRate = taxRateMap.get(item.productId) || 0;
    const lineTax = (item.unitPrice * item.quantity * taxRate) / 100;
    totalTax += lineTax;
  }

  return totalTax;
}

/**
 * Calculates shipping cost based on subtotal threshold
 * Requirements: 10.1, 10.2
 * 
 * @param subtotal - Cart subtotal
 * @returns Shipping amount (₹50 if below ₹500, ₹0 otherwise)
 */
export function calculateShipping(subtotal: number): number {
  const SHIPPING_THRESHOLD = 500;
  const SHIPPING_COST = 50;

  // 10.1 - Below threshold: charge shipping
  if (subtotal < SHIPPING_THRESHOLD) {
    return SHIPPING_COST;
  }

  // 10.2 - At or above threshold: free shipping
  return 0;
}

/**
 * Calculates complete order totals including all charges and discounts
 * Requirements: 11.1, 11.2, 11.3, 11.4
 * 
 * @param cartItems - Array of enriched cart items
 * @param coupon - Optional validated coupon
 * @returns OrderCalculation with all amounts as strings for database storage
 */
export async function calculateOrderTotals(
  cartItems: CartItem[],
  coupon?: Coupon
): Promise<OrderCalculation> {
  // 11.1 - Calculate subtotal
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  // Calculate discount
  const discountAmount = calculateDiscount(subtotal, coupon);

  // Calculate tax
  const taxAmount = await calculateTax(cartItems);

  // Calculate shipping
  const shippingAmount = calculateShipping(subtotal);

  // 11.2, 11.4 - Calculate total, ensure non-negative
  const total = Math.max(
    0,
    subtotal - discountAmount + taxAmount + shippingAmount
  );

  // 11.3 - Return all amounts as strings for database storage
  return {
    subtotal: subtotal.toFixed(2),
    discountAmount: discountAmount.toFixed(2),
    taxAmount: taxAmount.toFixed(2),
    shippingAmount: shippingAmount.toFixed(2),
    total: total.toFixed(2),
  };
}

/**
 * Creates a Razorpay order for payment processing
 * Requirements: 13.1, 13.2
 * 
 * @param orderId - The database order ID to use as receipt
 * @param amount - The order total amount in rupees
 * @returns Razorpay order object with id for payment processing
 * @throws Error if Razorpay API call fails
 */
export async function createRazorpayOrder(
  orderId: string,
  amount: number
): Promise<RazorpayOrderResult> {
  try {
    // 13.1 - Initialize Razorpay client
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    // 13.2 - Create Razorpay order
    // Amount must be in paise (smallest currency unit), currency is INR
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert rupees to paise
      currency: "INR",
      receipt: orderId,
    });

    return razorpayOrder as RazorpayOrderResult;
  } catch (error) {
    console.error("Failed to create Razorpay order:", error);
    throw new Error(
      `Razorpay order creation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
