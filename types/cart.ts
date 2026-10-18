/**
 * Cart type definitions for guest and authenticated user carts
 * 
 * Requirements:
 * - 1.1: Guest cart stored in signed cookies
 * - 2.1: Authenticated user cart stored in database
 */

/**
 * Represents a single item in the guest cart stored in signed cookies
 */
export interface GuestCartItem {
  variantId: string;
  quantity: number;
}

/**
 * Guest cart structure stored in iron-session signed cookie
 * Contains minimal data (variant IDs and quantities only)
 */
export interface GuestCart {
  items: GuestCartItem[];
}

/**
 * Enriched cart item with full product details
 * Used for both guest and authenticated users when displaying cart contents
 */
export interface CartItem {
  variantId: string;
  quantity: number;
  productId: string;
  productName: string;
  variantTitle: string;
  sku: string;
  unitPrice: number;
  images: string[];
  stock: number;
}
