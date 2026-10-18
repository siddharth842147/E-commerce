"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { ok, err, type ApiResponse } from "@/lib/api-response";
import { addToCartSchema, updateCartSchema } from "@/lib/validations/cart";
import type { CartItem } from "@/types/cart";
import {
  addToGuestCart,
  addToUserCart,
  clearGuestCart,
  getGuestCart,
  getUserCart,
  hydrateGuestCart,
  removeFromGuestCart,
  removeFromUserCart,
  updateGuestCartQuantity,
  updateUserCartQuantity,
  validateStock,
} from "@/services/cart.service";

/**
 * Adds a product variant to the cart (guest or authenticated user)
 * Requirements: 1.1, 2.1, 4.1, 4.2
 * 
 * @param variantId - The UUID of the product variant
 * @param quantity - The quantity to add
 * @returns ApiResponse<null> indicating success or error
 */
export async function addToCart(
  variantId: string,
  quantity: number
): Promise<ApiResponse<null>> {
  // Validate input
  const parsed = addToCartSchema.safeParse({ variantId, quantity });
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return err("Invalid input", {
      ...(fieldErrors.variantId && { variantId: fieldErrors.variantId }),
      ...(fieldErrors.quantity && { quantity: fieldErrors.quantity.map(String) }),
    });
  }

  // Validate stock availability
  const stockCheck = await validateStock(variantId, quantity);
  if (!stockCheck.valid) {
    return err(
      `Insufficient stock. Only ${stockCheck.availableStock} items available.`
    );
  }

  // Get current user to determine cart type
  const user = await getUser();

  try {
    if (user) {
      // Authenticated user - add to database cart
      await addToUserCart(user.id, variantId, quantity);
    } else {
      // Guest user - add to cookie-based cart
      await addToGuestCart(variantId, quantity);
    }

    revalidatePath("/cart");
    return ok(null);
  } catch (error) {
    console.error("Failed to add to cart:", error);
    return err("Failed to add item to cart. Please try again.");
  }
}

/**
 * Updates the quantity of a cart item
 * Requirements: 1.2, 2.2, 4.3, 4.4
 * 
 * @param variantId - The UUID of the product variant
 * @param quantity - The new quantity
 * @returns ApiResponse<null> indicating success or error
 */
export async function updateCartItemQuantity(
  variantId: string,
  quantity: number
): Promise<ApiResponse<null>> {
  // Validate input
  const parsed = updateCartSchema.safeParse({ variantId, quantity });
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return err("Invalid input", {
      ...(fieldErrors.variantId && { variantId: fieldErrors.variantId }),
      ...(fieldErrors.quantity && { quantity: fieldErrors.quantity.map(String) }),
    });
  }

  // Validate stock availability for the new quantity
  const stockCheck = await validateStock(variantId, quantity);
  if (!stockCheck.valid) {
    return err(
      `Insufficient stock. Only ${stockCheck.availableStock} items available.`
    );
  }

  // Get current user to determine cart type
  const user = await getUser();

  try {
    if (user) {
      // Authenticated user - update database cart
      await updateUserCartQuantity(user.id, variantId, quantity);
    } else {
      // Guest user - update cookie-based cart
      await updateGuestCartQuantity(variantId, quantity);
    }

    revalidatePath("/cart");
    return ok(null);
  } catch (error) {
    console.error("Failed to update cart item:", error);
    return err("Failed to update cart item. Please try again.");
  }
}

/**
 * Removes a product variant from the cart
 * Requirements: 1.3, 2.3
 * 
 * @param variantId - The UUID of the product variant to remove
 * @returns ApiResponse<null> indicating success or error
 */
export async function removeFromCart(
  variantId: string
): Promise<ApiResponse<null>> {
  // Get current user to determine cart type
  const user = await getUser();

  try {
    if (user) {
      // Authenticated user - remove from database cart
      await removeFromUserCart(user.id, variantId);
    } else {
      // Guest user - remove from cookie-based cart
      await removeFromGuestCart(variantId);
    }

    revalidatePath("/cart");
    return ok(null);
  } catch (error) {
    console.error("Failed to remove cart item:", error);
    return err("Failed to remove item from cart. Please try again.");
  }
}

/**
 * Retrieves all cart items for the current user (guest or authenticated)
 * Requirements: 1.4, 2.4
 * 
 * For guest users: hydrates cart with product details from database
 * For authenticated users: fetches from database and returns enriched cart
 * 
 * @returns ApiResponse<CartItem[]> with enriched cart items
 */
export async function getCart(): Promise<ApiResponse<CartItem[]>> {
  const user = await getUser();

  try {
    if (user) {
      // Authenticated user - fetch from database
      const dbCart = await getUserCart(user.id);
      
      // Hydrate user cart with product details
      if (dbCart.length === 0) {
        return ok([]);
      }
      
      const guestCartFormat = dbCart.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      }));
      
      const hydratedCart = await hydrateGuestCart(guestCartFormat);
      return ok(hydratedCart);
    } else {
      // Guest user - get from cookies and hydrate
      const guestCart = await getGuestCart();
      const hydratedCart = await hydrateGuestCart(guestCart.items);
      return ok(hydratedCart);
    }
  } catch (error) {
    console.error("Failed to retrieve cart:", error);
    return err("Failed to retrieve cart. Please try again.");
  }
}

/**
 * Discards the guest cart after user login
 * Requirements: 3.1
 * 
 * Called from the login success flow to clear the guest cart cookie.
 * This enforces the policy of discarding guest cart items on login
 * rather than merging them with the user's existing cart.
 * 
 * @returns ApiResponse<null> indicating success
 */
export async function discardGuestCartOnLogin(): Promise<ApiResponse<null>> {
  try {
    await clearGuestCart();
    revalidatePath("/cart");
    return ok(null);
  } catch (error) {
    console.error("Failed to discard guest cart:", error);
    return err("Failed to clear guest cart. Please try again.");
  }
}
