/**
 * Checkout Type Definitions
 * 
 * Defines interfaces for checkout flow including shipping address,
 * checkout data, and order calculation structures.
 * 
 * Requirements: 12.3, 11.1
 */

/**
 * Shipping address structure for order delivery
 * Requirement 12.3: Order creation requires shipping address details
 */
export interface ShippingAddress {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
}

/**
 * Checkout data submitted by customer during checkout flow
 * Includes shipping address and optional customer contact info for guest users
 */
export interface CheckoutData {
  shippingAddress: ShippingAddress;
  email?: string;
  phone?: string;
  couponCode?: string;
}

/**
 * Order calculation breakdown
 * Requirement 11.1: Order total calculation includes subtotal, discount, tax, and shipping
 * 
 * All amounts are stored as strings to match Drizzle numeric field types
 * which use string representation for precise decimal values
 */
export interface OrderCalculation {
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  shippingAmount: string;
  total: string;
}
