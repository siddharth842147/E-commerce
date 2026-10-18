import { db } from "@/db";
import { productVariants, cartItems, products } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import type { GuestCart, GuestCartItem, CartItem } from "@/types/cart";

// Iron-session configuration for guest cart cookies
// Requirements: 1.1, 1.4, 1.5, 1.6
const GUEST_CART_COOKIE = "guest_cart";
const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET!,
  cookieName: GUEST_CART_COOKIE,
  ttl: 60 * 60 * 24 * 30, // 30 days in seconds
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
  },
};

/**
 * Guest Cart Operations
 * These functions use iron-session to store cart data in signed cookies
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */

/**
 * Retrieves the guest cart from signed cookies
 * Requirements: 1.4, 1.5, 1.6
 * 
 * @returns GuestCart object with items array (empty if no cart exists or signature invalid)
 */
export async function getGuestCart(): Promise<GuestCart> {
  const session = await getIronSession<GuestCart>(await cookies(), SESSION_OPTIONS);
  return session.items ? { items: session.items } : { items: [] };
}

/**
 * Adds a variant to the guest cart or increments quantity if it exists
 * Requirements: 1.1
 * 
 * @param variantId - The UUID of the product variant
 * @param quantity - The quantity to add
 */
export async function addToGuestCart(variantId: string, quantity: number): Promise<void> {
  const session = await getIronSession<GuestCart>(await cookies(), SESSION_OPTIONS);
  const items = session.items || [];
  const existingIndex = items.findIndex((item: GuestCartItem) => item.variantId === variantId);

  if (existingIndex >= 0) {
    items[existingIndex].quantity += quantity;
  } else {
    items.push({ variantId, quantity });
  }

  session.items = items;
  await session.save();
}

/**
 * Updates the quantity of a variant in the guest cart
 * Requirements: 1.2
 * 
 * @param variantId - The UUID of the product variant
 * @param quantity - The new quantity (not added, but set)
 */
export async function updateGuestCartQuantity(variantId: string, quantity: number): Promise<void> {
  const session = await getIronSession<GuestCart>(await cookies(), SESSION_OPTIONS);
  const items = session.items || [];
  const existingIndex = items.findIndex((item: GuestCartItem) => item.variantId === variantId);

  if (existingIndex >= 0) {
    items[existingIndex].quantity = quantity;
  }

  session.items = items;
  await session.save();
}

/**
 * Removes a variant from the guest cart
 * Requirements: 1.3
 * 
 * @param variantId - The UUID of the product variant to remove
 */
export async function removeFromGuestCart(variantId: string): Promise<void> {
  const session = await getIronSession<GuestCart>(await cookies(), SESSION_OPTIONS);
  session.items = (session.items || []).filter((item: GuestCartItem) => item.variantId !== variantId);
  await session.save();
}

/**
 * Clears all items from the guest cart
 * Requirements: 1.6, 3.1
 * 
 * Used when user completes checkout or logs in
 */
export async function clearGuestCart(): Promise<void> {
  const session = await getIronSession<GuestCart>(await cookies(), SESSION_OPTIONS);
  session.items = [];
  await session.save();
}

/**
 * Validates if a product variant has sufficient stock for the requested quantity
 * Requirements: 4.1, 4.3
 * 
 * @param variantId - The UUID of the product variant
 * @param requestedQuantity - The quantity to validate against stock
 * @returns Object with valid boolean and optional availableStock number
 */
export async function validateStock(
  variantId: string,
  requestedQuantity: number
): Promise<{ valid: boolean; availableStock?: number }> {
  const [variant] = await db
    .select({ stock: productVariants.stock })
    .from(productVariants)
    .where(eq(productVariants.id, variantId))
    .limit(1);

  if (!variant || variant.stock < requestedQuantity) {
    return { valid: false, availableStock: variant?.stock || 0 };
  }

  return { valid: true };
}

/**
 * Hydrates guest cart items with full product details
 * Requirements: 1.4
 * 
 * Joins with product_variants and products tables to enrich minimal guest cart data
 * with complete product information needed for display and checkout.
 * Gracefully filters out any variants that no longer exist in the database.
 * 
 * @param items - Array of GuestCartItem objects (variantId and quantity only)
 * @returns Array of enriched CartItem objects with full product details
 */
export async function hydrateGuestCart(items: GuestCartItem[]): Promise<CartItem[]> {
  if (items.length === 0) {
    return [];
  }

  // Extract all variant IDs from the cart
  const variantIds = items.map(item => item.variantId);
  
  // Query database to get full product and variant details in a single query
  const variantDetails = await db
    .select({
      variantId: productVariants.id,
      productId: products.id,
      productName: products.name,
      variantTitle: productVariants.title,
      sku: productVariants.sku,
      unitPrice: productVariants.price,
      images: products.images,
      stock: productVariants.stock,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(inArray(productVariants.id, variantIds));
  
  // Create a map for quick lookup
  const variantMap = new Map(
    variantDetails.map(detail => [detail.variantId, detail])
  );
  
  // Enrich cart items with product details, filtering out missing variants
  const enrichedItems = items
    .map(item => {
      const details = variantMap.get(item.variantId);
      if (!details) {
        // Variant no longer exists, filter it out gracefully
        return null;
      }
      
      return {
        variantId: item.variantId,
        quantity: item.quantity,
        productId: details.productId,
        productName: details.productName,
        variantTitle: details.variantTitle,
        sku: details.sku,
        unitPrice: Number(details.unitPrice),
        images: details.images as string[],
        stock: details.stock,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
  
  return enrichedItems;
}

/**
 * Authenticated User Cart Operations
 * These functions use the cart_items database table to store cart data
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

/**
 * Retrieves all cart items for an authenticated user from the database
 * Requirements: 2.4
 * 
 * @param userId - The UUID of the authenticated user
 * @returns Array of cart items with variant IDs and quantities
 */
export async function getUserCart(userId: string): Promise<Array<{ id: string; variantId: string; quantity: number; createdAt: Date; updatedAt: Date }>> {
  return await db
    .select()
    .from(cartItems)
    .where(eq(cartItems.userId, userId));
}

/**
 * Adds a variant to the user's cart or increments quantity if it exists
 * Requirements: 2.1
 * 
 * @param userId - The UUID of the authenticated user
 * @param variantId - The UUID of the product variant
 * @param quantity - The quantity to add
 */
export async function addToUserCart(userId: string, variantId: string, quantity: number): Promise<void> {
  const existing = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.userId, userId), eq(cartItems.variantId, variantId)))
    .limit(1);

  if (existing.length > 0) {
    // Variant exists, increment quantity
    await db
      .update(cartItems)
      .set({
        quantity: existing[0].quantity + quantity,
        updatedAt: new Date(),
      })
      .where(eq(cartItems.id, existing[0].id));
  } else {
    // Variant doesn't exist, insert new record
    await db.insert(cartItems).values({
      userId,
      variantId,
      quantity,
    });
  }
}

/**
 * Updates the quantity of a variant in the user's cart
 * Requirements: 2.2
 * 
 * @param userId - The UUID of the authenticated user
 * @param variantId - The UUID of the product variant
 * @param quantity - The new quantity (not added, but set)
 */
export async function updateUserCartQuantity(userId: string, variantId: string, quantity: number): Promise<void> {
  await db
    .update(cartItems)
    .set({ quantity, updatedAt: new Date() })
    .where(and(eq(cartItems.userId, userId), eq(cartItems.variantId, variantId)));
}

/**
 * Removes a variant from the user's cart
 * Requirements: 2.3
 * 
 * @param userId - The UUID of the authenticated user
 * @param variantId - The UUID of the product variant to remove
 */
export async function removeFromUserCart(userId: string, variantId: string): Promise<void> {
  await db
    .delete(cartItems)
    .where(and(eq(cartItems.userId, userId), eq(cartItems.variantId, variantId)));
}

/**
 * Clears all items from the user's cart
 * Requirements: 2.4
 * 
 * Used when user completes checkout
 * 
 * @param userId - The UUID of the authenticated user
 */
export async function clearUserCart(userId: string): Promise<void> {
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
}
