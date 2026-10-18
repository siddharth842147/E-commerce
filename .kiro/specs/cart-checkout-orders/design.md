# Design Document

## Introduction

This document specifies the technical design for the cart, checkout, and order management feature of the Kartiva e-commerce platform. The design implements shopping cart functionality for both authenticated and guest users, coupon validation and application, category-specific GST calculation, Razorpay payment integration, stock management with atomicity guarantees, and comprehensive order lifecycle management.

## Overview

The cart-checkout-orders feature implements a comprehensive e-commerce transaction flow for the Kartiva platform. It supports both authenticated and guest users, integrates with Razorpay for payment processing, enforces stock management with atomicity guarantees, and provides complete order lifecycle management from cart to delivery.

## Architecture

The feature is organized into five primary subsystems that interact through well-defined interfaces:

1. **Cart Management Layer** - Handles cart operations for both authenticated users (database-backed) and guest users (cookie-backed)
2. **Checkout Processing Layer** - Validates carts, calculates totals with tax and shipping, applies coupons, and orchestrates order creation
3. **Payment Integration Layer** - Manages Razorpay order creation, signature verification, and webhook processing
4. **Order Management Layer** - Handles order lifecycle, status transitions, and order queries
5. **Stock Management Layer** - Ensures atomic stock operations and prevents overselling

### Technology Stack

- **Framework**: Next.js 15 App Router with Server Actions
- **Database**: PostgreSQL via Supabase with Drizzle ORM
- **Authentication**: Supabase Auth with helper functions in `lib/auth.ts`
- **Payment Gateway**: Razorpay (orders.create, signature verification, webhooks)
- **Session Management**: iron-session for guest cart signed cookies
- **Validation**: Zod schemas in `lib/validations/`
- **API Pattern**: ApiResponse<T> wrapper (ok/err) from `lib/api-response.ts`

## Data Models

### Schema Modifications

#### 1. categories.tax_rate (New Column)

```typescript
// db/schema/categories.ts
export const categories = pgTable("categories", {
  // ... existing fields
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0"), // GST percentage (e.g., 18.00 for 18%)
});
```

#### 2. user_coupon_usage (New Table)

```typescript
// db/schema/user_coupon_usage.ts
import { pgTable, uuid, timestamp, unique } from "drizzle-orm/pg-core";
import { profiles } from "./profiles";
import { coupons } from "./coupons";
import { orders } from "./orders";

export const userCouponUsage = pgTable("user_coupon_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  couponId: uuid("coupon_id").notNull().references(() => coupons.id, { onDelete: "cascade" }),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  usedAt: timestamp("used_at").notNull().defaultNow(),
}, (table) => ({
  uniqueUserCoupon: unique().on(table.userId, table.couponId),
}));
```

#### 3. orderStatusEnum Extension

```typescript
// db/schema/orders.ts
export const orderStatusEnum = pgEnum("order_status", [
  "pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded", "returned" // added "returned"
]);
```

#### 4. payments Table (Verify/Extend)

```typescript
// db/schema/payments.ts
import { pgTable, uuid, text, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { orders } from "./orders";

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending", "captured", "failed", "refunded"
]);

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  razorpayOrderId: text("razorpay_order_id").notNull().unique(),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpaySignature: text("razorpay_signature"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("INR"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

## Components and Interfaces

### 1. Cart Service (`services/cart.service.ts`)

Provides unified cart operations for both guest and authenticated users.

```typescript
import { db } from "@/db";
import { cartItems, productVariants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import type { CartItem, GuestCart } from "@/types/cart";

const GUEST_CART_COOKIE = "guest_cart";
const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET!,
  cookieName: GUEST_CART_COOKIE,
  ttl: 60 * 60 * 24 * 30, // 30 days
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
  },
};

// Guest Cart Operations
export async function getGuestCart(): Promise<GuestCart> {
  const session = await getIronSession<GuestCart>(cookies(), SESSION_OPTIONS);
  return session.items ? { items: session.items } : { items: [] };
}

export async function addToGuestCart(variantId: string, quantity: number): Promise<void> {
  const session = await getIronSession<GuestCart>(cookies(), SESSION_OPTIONS);
  const items = session.items || [];
  const existingIndex = items.findIndex(item => item.variantId === variantId);
  
  if (existingIndex >= 0) {
    items[existingIndex].quantity += quantity;
  } else {
    items.push({ variantId, quantity });
  }
  
  session.items = items;
  await session.save();
}

export async function updateGuestCartQuantity(variantId: string, quantity: number): Promise<void> {
  const session = await getIronSession<GuestCart>(cookies(), SESSION_OPTIONS);
  const items = session.items || [];
  const existingIndex = items.findIndex(item => item.variantId === variantId);
  
  if (existingIndex >= 0) {
    items[existingIndex].quantity = quantity;
  }
  
  session.items = items;
  await session.save();
}

export async function removeFromGuestCart(variantId: string): Promise<void> {
  const session = await getIronSession<GuestCart>(cookies(), SESSION_OPTIONS);
  session.items = (session.items || []).filter(item => item.variantId !== variantId);
  await session.save();
}

export async function clearGuestCart(): Promise<void> {
  const session = await getIronSession<GuestCart>(cookies(), SESSION_OPTIONS);
  session.items = [];
  await session.save();
}

// Authenticated User Cart Operations
export async function getUserCart(userId: string): Promise<CartItem[]> {
  return await db
    .select()
    .from(cartItems)
    .where(eq(cartItems.userId, userId))
    .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id));
}

export async function addToUserCart(userId: string, variantId: string, quantity: number): Promise<void> {
  const existing = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.userId, userId), eq(cartItems.variantId, variantId)))
    .limit(1);
  
  if (existing.length > 0) {
    await db
      .update(cartItems)
      .set({ 
        quantity: existing[0].quantity + quantity,
        updatedAt: new Date(),
      })
      .where(eq(cartItems.id, existing[0].id));
  } else {
    await db.insert(cartItems).values({ userId, variantId, quantity });
  }
}

export async function updateUserCartQuantity(userId: string, variantId: string, quantity: number): Promise<void> {
  await db
    .update(cartItems)
    .set({ quantity, updatedAt: new Date() })
    .where(and(eq(cartItems.userId, userId), eq(cartItems.variantId, variantId)));
}

export async function removeFromUserCart(userId: string, variantId: string): Promise<void> {
  await db
    .delete(cartItems)
    .where(and(eq(cartItems.userId, userId), eq(cartItems.variantId, variantId)));
}

export async function clearUserCart(userId: string): Promise<void> {
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
}

// Stock Validation
export async function validateStock(variantId: string, requestedQuantity: number): Promise<{ valid: boolean; availableStock?: number }> {
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
```

### 2. Cart Actions (`actions/cart.ts`)

Server actions exposing cart operations to the client.

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { ok, err, type ApiResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import * as CartService from "@/services/cart.service";
import { z } from "zod";

const addToCartSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

const updateCartSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export async function addToCart(data: unknown): Promise<ApiResponse<null>> {
  const parsed = addToCartSchema.safeParse(data);
  if (!parsed.success) {
    return err("Invalid input", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }
  
  const { variantId, quantity } = parsed.data;
  
  // Validate stock
  const stockCheck = await CartService.validateStock(variantId, quantity);
  if (!stockCheck.valid) {
    return err(`Only ${stockCheck.availableStock} units available in stock`);
  }
  
  try {
    const user = await getCurrentUser();
    
    if (user) {
      await CartService.addToUserCart(user.id, variantId, quantity);
    } else {
      await CartService.addToGuestCart(variantId, quantity);
    }
    
    revalidatePath("/cart");
    return ok(null);
  } catch (_e) {
    return err("Failed to add item to cart");
  }
}

export async function updateCartItemQuantity(data: unknown): Promise<ApiResponse<null>> {
  const parsed = updateCartSchema.safeParse(data);
  if (!parsed.success) {
    return err("Invalid input", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }
  
  const { variantId, quantity } = parsed.data;
  
  // Validate stock
  const stockCheck = await CartService.validateStock(variantId, quantity);
  if (!stockCheck.valid) {
    return err(`Only ${stockCheck.availableStock} units available in stock`);
  }
  
  try {
    const user = await getCurrentUser();
    
    if (user) {
      await CartService.updateUserCartQuantity(user.id, variantId, quantity);
    } else {
      await CartService.updateGuestCartQuantity(variantId, quantity);
    }
    
    revalidatePath("/cart");
    return ok(null);
  } catch (_e) {
    return err("Failed to update cart item");
  }
}

export async function removeFromCart(variantId: string): Promise<ApiResponse<null>> {
  try {
    const user = await getCurrentUser();
    
    if (user) {
      await CartService.removeFromUserCart(user.id, variantId);
    } else {
      await CartService.removeFromGuestCart(variantId);
    }
    
    revalidatePath("/cart");
    return ok(null);
  } catch (_e) {
    return err("Failed to remove item from cart");
  }
}

export async function getCart(): Promise<ApiResponse<CartItem[]>> {
  try {
    const user = await getCurrentUser();
    
    let items: CartItem[];
    if (user) {
      items = await CartService.getUserCart(user.id);
    } else {
      const guestCart = await CartService.getGuestCart();
      // Hydrate guest cart with product details
      items = await CartService.hydrateGuestCart(guestCart.items);
    }
    
    return ok(items);
  } catch (_e) {
    return err("Failed to fetch cart");
  }
}

// Called after successful login to discard guest cart
export async function discardGuestCartOnLogin(): Promise<ApiResponse<null>> {
  try {
    await CartService.clearGuestCart();
    return ok(null);
  } catch (_e) {
    return err("Failed to clear guest cart");
  }
}
```

### 3. Checkout Service (`services/checkout.service.ts`)

Handles checkout validation, calculation, and order creation with atomic stock operations.

```typescript
import { db } from "@/db";
import { orders, orderItems, payments, productVariants, categories, coupons, userCouponUsage } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import type { CheckoutData, OrderCalculation, ShippingAddress } from "@/types/checkout";

const SHIPPING_THRESHOLD = 500; // ₹500
const SHIPPING_COST = 50; // ₹50

export interface ValidatedCart {
  items: Array<{
    variantId: string;
    productName: string;
    variantTitle: string;
    sku: string;
    unitPrice: number;
    quantity: number;
    taxRate: number;
    stock: number;
  }>;
}

// Validate cart items have sufficient stock
export async function validateCartStock(cartItems: Array<{ variantId: string; quantity: number }>): Promise<{ valid: boolean; unavailableItems?: string[] }> {
  const unavailable: string[] = [];
  
  for (const item of cartItems) {
    const [variant] = await db
      .select({ sku: productVariants.sku, stock: productVariants.stock })
      .from(productVariants)
      .where(eq(productVariants.id, item.variantId))
      .limit(1);
    
    if (!variant || variant.stock < item.quantity) {
      unavailable.push(variant?.sku || item.variantId);
    }
  }
  
  return unavailable.length === 0 
    ? { valid: true }
    : { valid: false, unavailableItems: unavailable };
}

// Validate and apply coupon
export async function validateCoupon(
  couponCode: string,
  userId: string | null,
  subtotal: number
): Promise<{ valid: boolean; coupon?: typeof coupons.$inferSelect; error?: string }> {
  const [coupon] = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, couponCode))
    .limit(1);
  
  if (!coupon) {
    return { valid: false, error: "Invalid coupon code" };
  }
  
  if (!coupon.isActive) {
    return { valid: false, error: "Coupon is expired or inactive" };
  }
  
  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    return { valid: false, error: "Coupon has expired" };
  }
  
  if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
    return { valid: false, error: `Minimum order amount of ₹${coupon.minOrderAmount} required` };
  }
  
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, error: "Coupon usage limit reached" };
  }
  
  // Check per-user usage for authenticated users
  if (userId) {
    const [usage] = await db
      .select()
      .from(userCouponUsage)
      .where(and(
        eq(userCouponUsage.userId, userId),
        eq(userCouponUsage.couponId, coupon.id)
      ))
      .limit(1);
    
    if (usage) {
      return { valid: false, error: "You have already used this coupon" };
    }
  }
  
  return { valid: true, coupon };
}

// Calculate order totals
export async function calculateOrderTotals(
  validatedCart: ValidatedCart,
  coupon?: typeof coupons.$inferSelect
): Promise<OrderCalculation> {
  // Calculate subtotal
  const subtotal = validatedCart.items.reduce((sum, item) => {
    return sum + (item.unitPrice * item.quantity);
  }, 0);
  
  // Calculate discount
  let discountAmount = 0;
  if (coupon) {
    if (coupon.discountType === "percentage") {
      discountAmount = Math.min((subtotal * Number(coupon.discountValue)) / 100, subtotal);
    } else if (coupon.discountType === "fixed") {
      discountAmount = Math.min(Number(coupon.discountValue), subtotal);
    }
  }
  
  // Calculate tax per line item, then sum
  const taxAmount = validatedCart.items.reduce((sum, item) => {
    const lineTax = (item.unitPrice * item.quantity * item.taxRate) / 100;
    return sum + lineTax;
  }, 0);
  
  // Calculate shipping
  const shippingAmount = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  
  // Calculate total (never negative)
  const total = Math.max(0, subtotal - discountAmount + taxAmount + shippingAmount);
  
  return {
    subtotal,
    discountAmount,
    taxAmount,
    shippingAmount,
    total,
  };
}

// Create order with atomic stock decrement
export async function createOrderWithStockReservation(
  userId: string,
  validatedCart: ValidatedCart,
  calculation: OrderCalculation,
  shippingAddress: ShippingAddress,
  couponId?: string
): Promise<{ orderId: string; razorpayOrderId: string }> {
  return await db.transaction(async (tx) => {
    // 1. Create order record
    const [order] = await tx
      .insert(orders)
      .values({
        userId,
        couponId: couponId || null,
        status: "pending",
        subtotal: calculation.subtotal.toFixed(2),
        discountAmount: calculation.discountAmount.toFixed(2),
        taxAmount: calculation.taxAmount.toFixed(2),
        shippingAmount: calculation.shippingAmount.toFixed(2),
        total: calculation.total.toFixed(2),
        shippingAddress,
      })
      .returning();
    
    // 2. Create order items and decrement stock atomically
    for (const item of validatedCart.items) {
      // Insert order item
      await tx.insert(orderItems).values({
        orderId: order.id,
        productName: item.productName,
        variantTitle: item.variantTitle,
        sku: item.sku,
        unitPrice: item.unitPrice.toFixed(2),
        quantity: item.quantity,
        total: (item.unitPrice * item.quantity).toFixed(2),
      });
      
      // Decrement stock
      const result = await tx
        .update(productVariants)
        .set({ 
          stock: sql`${productVariants.stock} - ${item.quantity}`,
          updatedAt: new Date(),
        })
        .where(and(
          eq(productVariants.id, item.variantId),
          sql`${productVariants.stock} >= ${item.quantity}` // Prevent negative stock
        ))
        .returning({ id: productVariants.id });
      
      // If update didn't affect any rows, stock was insufficient
      if (result.length === 0) {
        throw new Error(`Insufficient stock for SKU: ${item.sku}`);
      }
    }
    
    // 3. Track coupon usage if applicable
    if (couponId && userId) {
      await tx.insert(userCouponUsage).values({
        userId,
        couponId,
        orderId: order.id,
      });
      
      await tx
        .update(coupons)
        .set({ 
          usedCount: sql`${coupons.usedCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(coupons.id, couponId));
    }
    
    // 4. Create Razorpay order (external API call)
    const razorpayOrder = await createRazorpayOrder(order.id, calculation.total);
    
    // 5. Create payment record
    await tx.insert(payments).values({
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      status: "pending",
      amount: calculation.total.toFixed(2),
      currency: "INR",
    });
    
    return { orderId: order.id, razorpayOrderId: razorpayOrder.id };
  });
}

// Razorpay Integration
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

async function createRazorpayOrder(orderId: string, amount: number) {
  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: "INR",
      receipt: orderId,
      notes: {
        order_id: orderId,
      },
    });
    return order;
  } catch (error) {
    throw new Error("Failed to create Razorpay order");
  }
}
```

### 4. Checkout Actions (`actions/checkout.ts`)

Server actions for checkout flow.

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { ok, err, type ApiResponse } from "@/lib/api-response";
import { requireAuth, getCurrentUser } from "@/lib/auth";
import * as CheckoutService from "@/services/checkout.service";
import * as CartService from "@/services/cart.service";
import { checkoutSchema } from "@/lib/validations/checkout";
import type { CheckoutData } from "@/types/checkout";

export async function checkout(data: unknown): Promise<ApiResponse<{ orderId: string; razorpayOrderId: string }>> {
  const parsed = checkoutSchema.safeParse(data);
  if (!parsed.success) {
    return err("Invalid checkout data", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }
  
  const checkoutData = parsed.data;
  
  try {
    // Get user (or create profile for guest)
    let user = await getCurrentUser();
    if (!user && checkoutData.email) {
      // Create guest user profile
      user = await createGuestProfile(checkoutData.email, checkoutData.phone);
    }
    
    if (!user) {
      return err("User authentication required");
    }
    
    // Get cart items
    const cartItems = user.id 
      ? await CartService.getUserCart(user.id)
      : await CartService.hydrateGuestCart((await CartService.getGuestCart()).items);
    
    if (cartItems.length === 0) {
      return err("Cart is empty");
    }
    
    // Validate stock availability
    const stockValidation = await CheckoutService.validateCartStock(
      cartItems.map(item => ({ variantId: item.variantId, quantity: item.quantity }))
    );
    
    if (!stockValidation.valid) {
      return err(`Items unavailable: ${stockValidation.unavailableItems?.join(", ")}`);
    }
    
    // Validate coupon if provided
    let coupon;
    if (checkoutData.couponCode) {
      const couponValidation = await CheckoutService.validateCoupon(
        checkoutData.couponCode,
        user.id,
        calculateSubtotal(cartItems)
      );
      
      if (!couponValidation.valid) {
        return err(couponValidation.error || "Invalid coupon");
      }
      
      coupon = couponValidation.coupon;
    }
    
    // Prepare validated cart with tax rates
    const validatedCart = await enrichCartWithTaxRates(cartItems);
    
    // Calculate totals
    const calculation = await CheckoutService.calculateOrderTotals(validatedCart, coupon);
    
    // Create order (atomic transaction)
    const { orderId, razorpayOrderId } = await CheckoutService.createOrderWithStockReservation(
      user.id,
      validatedCart,
      calculation,
      checkoutData.shippingAddress,
      coupon?.id
    );
    
    // Clear cart
    if (user.id) {
      await CartService.clearUserCart(user.id);
    } else {
      await CartService.clearGuestCart();
    }
    
    revalidatePath("/cart");
    revalidatePath("/orders");
    
    return ok({ orderId, razorpayOrderId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    return err(message);
  }
}

async function enrichCartWithTaxRates(cartItems: any[]): Promise<CheckoutService.ValidatedCart> {
  // Fetch tax rates from categories and enrich cart items
  // Implementation details...
}

function calculateSubtotal(cartItems: any[]): number {
  return cartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
}

async function createGuestProfile(email: string, phone: string): Promise<any> {
  // Create profile record with role "customer"
  // Implementation details...
}
```

### 5. Payment Actions (`actions/payments.ts`)

Server actions for payment verification.

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { ok, err, type ApiResponse } from "@/lib/api-response";
import { db } from "@/db";
import { payments, orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function verifyPayment(data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<ApiResponse<null>> {
  try {
    // Compute expected signature
    const text = `${data.razorpay_order_id}|${data.razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(text)
      .digest("hex");
    
    const isValid = expectedSignature === data.razorpay_signature;
    
    // Update payment status
    const [payment] = await db
      .update(payments)
      .set({
        razorpayPaymentId: data.razorpay_payment_id,
        razorpaySignature: data.razorpay_signature,
        status: isValid ? "captured" : "failed",
        updatedAt: new Date(),
      })
      .where(eq(payments.razorpayOrderId, data.razorpay_order_id))
      .returning();
    
    if (!payment) {
      return err("Payment record not found");
    }
    
    // Update order status if payment captured
    if (isValid) {
      await db
        .update(orders)
        .set({ status: "confirmed", updatedAt: new Date() })
        .where(eq(orders.id, payment.orderId));
    }
    
    revalidatePath("/orders");
    
    return isValid ? ok(null) : err("Payment verification failed");
  } catch (_e) {
    return err("Failed to verify payment");
  }
}
```

### 6. Payment Webhook Handler (`app/api/payments/webhook/route.ts`)

API route for Razorpay webhooks.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");
    
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }
    
    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");
    
    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
    
    const event = JSON.parse(body);
    
    // Handle payment events
    if (event.event === "payment.captured") {
      const razorpayOrderId = event.payload.payment.entity.order_id;
      const razorpayPaymentId = event.payload.payment.entity.id;
      
      const [payment] = await db
        .update(payments)
        .set({
          razorpayPaymentId,
          status: "captured",
          updatedAt: new Date(),
        })
        .where(eq(payments.razorpayOrderId, razorpayOrderId))
        .returning();
      
      if (payment) {
        await db
          .update(orders)
          .set({ status: "confirmed", updatedAt: new Date() })
          .where(eq(orders.id, payment.orderId));
      }
    } else if (event.event === "payment.failed") {
      const razorpayOrderId = event.payload.payment.entity.order_id;
      
      const [payment] = await db
        .update(payments)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(payments.razorpayOrderId, razorpayOrderId))
        .returning();
    }
    
    return NextResponse.json({ status: "ok" });
  } catch (_e) {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
```

### 7. Order Service (`services/order.service.ts`)

Handles order queries and status updates.

```typescript
import { db } from "@/db";
import { orders, orderItems, payments, profiles, productVariants, coupons, userCouponUsage } from "@/db/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import type { OrderStatus } from "@/db/schema";

export async function getOrderById(orderId: string, userId?: string) {
  const query = db
    .select()
    .from(orders)
    .where(userId ? and(eq(orders.id, orderId), eq(orders.userId, userId)) : eq(orders.id, orderId))
    .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
    .leftJoin(payments, eq(orders.id, payments.orderId))
    .limit(1);
  
  return await query;
}

export async function getUserOrders(userId: string) {
  return await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
    .leftJoin(payments, eq(orders.id, payments.orderId))
    .orderBy(desc(orders.createdAt));
}

export async function getAllOrders(filters?: {
  status?: OrderStatus;
  startDate?: Date;
  endDate?: Date;
}) {
  let query = db
    .select()
    .from(orders)
    .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
    .leftJoin(payments, eq(orders.id, payments.orderId))
    .leftJoin(profiles, eq(orders.userId, profiles.id));
  
  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(orders.status, filters.status));
  }
  if (filters?.startDate) {
    conditions.push(gte(orders.createdAt, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(orders.createdAt, filters.endDate));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return await query.orderBy(desc(orders.createdAt));
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  return await db.transaction(async (tx) => {
    const [order] = await tx
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();
    
    // Handle stock restoration for cancelled/returned orders
    if (status === "cancelled" || status === "returned") {
      const items = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));
      
      for (const item of items) {
        // Find variant by SKU and restore stock
        const [variant] = await tx
          .select()
          .from(productVariants)
          .where(eq(productVariants.sku, item.sku))
          .limit(1);
        
        if (variant) {
          await tx
            .update(productVariants)
            .set({
              stock: sql`${productVariants.stock} + ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(productVariants.id, variant.id));
        }
      }
      
      // Restore coupon usage
      if (order.couponId) {
        await tx
          .delete(userCouponUsage)
          .where(eq(userCouponUsage.orderId, orderId));
        
        await tx
          .update(coupons)
          .set({
            usedCount: sql`${coupons.usedCount} - 1`,
            updatedAt: new Date(),
          })
          .where(eq(coupons.id, order.couponId));
      }
    }
    
    return order;
  });
}
```

### 8. Order Actions (`actions/orders.ts`)

Server actions for order operations.

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { ok, err, type ApiResponse } from "@/lib/api-response";
import { requireAuth, requireAdmin, getCurrentUser } from "@/lib/auth";
import * as OrderService from "@/services/order.service";
import type { OrderStatus } from "@/db/schema";

export async function getMyOrders(): Promise<ApiResponse<any[]>> {
  const user = await requireAuth();
  
  try {
    const orders = await OrderService.getUserOrders(user.id);
    return ok(orders);
  } catch (_e) {
    return err("Failed to fetch orders");
  }
}

export async function getOrderDetails(orderId: string): Promise<ApiResponse<any>> {
  const user = await getCurrentUser();
  
  try {
    const order = await OrderService.getOrderById(orderId, user?.id);
    
    if (!order) {
      return err("Order not found");
    }
    
    return ok(order);
  } catch (_e) {
    return err("Failed to fetch order");
  }
}

export async function getAdminOrders(filters?: {
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<any[]>> {
  await requireAdmin();
  
  try {
    const processedFilters = {
      status: filters?.status,
      startDate: filters?.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters?.endDate ? new Date(filters.endDate) : undefined,
    };
    
    const orders = await OrderService.getAllOrders(processedFilters);
    return ok(orders);
  } catch (_e) {
    return err("Failed to fetch orders");
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<ApiResponse<null>> {
  await requireAdmin();
  
  try {
    await OrderService.updateOrderStatus(orderId, status);
    revalidatePath("/admin/orders");
    revalidatePath(`/orders/${orderId}`);
    return ok(null);
  } catch (_e) {
    return err("Failed to update order status");
  }
}
```

## Validation Schemas

### Checkout Validation (`lib/validations/checkout.ts`)

```typescript
import { z } from "zod";

export const shippingAddressSchema = z.object({
  recipientName: z.string().min(1, "Recipient name is required"),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, "Invalid phone number"),
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().regex(/^\d{6}$/, "Invalid postal code"),
});

export const checkoutSchema = z.object({
  email: z.string().email().optional(), // Required for guests
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/).optional(), // Required for guests
  shippingAddress: shippingAddressSchema,
  couponCode: z.string().optional(),
});
```

## Type Definitions

### Cart Types (`types/cart.ts`)

```typescript
export interface GuestCartItem {
  variantId: string;
  quantity: number;
}

export interface GuestCart {
  items: GuestCartItem[];
}

export interface CartItem {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  variantTitle: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  stock: number;
  imageUrl?: string;
}
```

### Checkout Types (`types/checkout.ts`)

```typescript
export interface ShippingAddress {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface CheckoutData {
  email?: string;
  phone?: string;
  shippingAddress: ShippingAddress;
  couponCode?: string;
}

export interface OrderCalculation {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  total: number;
}
```

## Error Handling

All server actions follow the ApiResponse<T> pattern:
- Success: `{ success: true, data: T }`
- Error: `{ success: false, error: string, fieldErrors?: Record<string, string[]> }`

Common error scenarios:
1. **Out of Stock**: "Only X units available in stock"
2. **Invalid Coupon**: Specific message based on validation failure
3. **Empty Cart**: "Cart is empty"
4. **Payment Failed**: "Payment verification failed"
5. **Order Not Found**: "Order not found"

## Security Considerations

1. **Guest Cart Cookie**: Signed with iron-session to prevent tampering
2. **Payment Signature**: HMAC SHA256 verification with Razorpay key secret
3. **Webhook Signature**: Separate webhook secret for webhook verification
4. **Row-Level Security**: Orders query filtered by user_id for non-admin users
5. **Admin Operations**: Protected by `requireAdmin()` middleware
6. **Stock Operations**: Atomic with `sql` constraint to prevent negative stock
7. **Coupon Validation**: Per-user tracking prevents duplicate usage

## Performance Considerations

1. **Database Transactions**: All order creation operations wrapped in transactions
2. **Stock Queries**: Use WHERE constraints to prevent race conditions
3. **Index Recommendations**:
   - `cart_items(user_id, variant_id)`
   - `user_coupon_usage(user_id, coupon_id)`
   - `orders(user_id, created_at)`
   - `payments(razorpay_order_id)`
4. **Cookie Size**: Guest cart stores only variantId + quantity (minimal payload)

## Testing Strategy

The feature will be tested using both example-based unit tests and property-based tests:
- **Unit tests**: Specific examples, edge cases, integration points
- **Property tests**: Universal properties across randomized inputs (minimum 100 iterations)
- **Integration tests**: Razorpay API calls, webhook handling, database transactions

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Guest Cart Cookie Round-Trip Preservation

*For any* guest cart contents, storing the cart in a signed cookie and then restoring it should preserve all cart items with their exact quantities.

**Validates: Requirements 1.1, 1.4**

### Property 2: Signature Validation Rejects Tampered Cookies

*For any* guest cart cookie with an invalid signature, the cart system should discard the cookie and initialize an empty cart.

**Validates: Requirements 1.5, 1.6**

### Property 3: User Cart Database Round-Trip Preservation

*For any* authenticated user and cart items, inserting cart items into the database and then querying the cart should return all items with exact quantities.

**Validates: Requirements 2.1, 2.4**

### Property 4: Guest Cart Discarded on Login

*For any* guest cart and authenticated user, after successful login, the guest cart should be discarded and the user's database cart should be loaded.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 5: Stock Validation Prevents Zero-Stock Additions

*For any* product variant with zero stock level, attempting to add it to the cart should be rejected.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 6: Stock Decrement is Atomic with Order Creation

*For any* order creation attempt, if the order creation fails, the stock levels should remain unchanged.

**Validates: Requirements 5.1, 5.2**

### Property 7: Order Cancellation Restores Stock

*For any* confirmed order, cancelling that order should restore stock levels to their pre-order values.

**Validates: Requirements 5.3**

### Property 8: Order Return Restores Stock

*For any* delivered order, marking it as returned should restore stock levels to their pre-order values.

**Validates: Requirements 5.4**

### Property 9: Coupon Validation Enforces All Constraints

*For any* coupon, validation should verify existence, active status, expiration date, minimum order amount, and usage limits before accepting it.

**Validates: Requirements 6.1, 6.3, 6.5, 6.7, 6.9**

### Property 10: Per-User Coupon Usage Prevents Reuse

*For any* authenticated user and coupon combination, if the user has already used the coupon, attempting to apply it again should be rejected.

**Validates: Requirements 7.2**

### Property 11: Coupon Usage Tracking is Created on Order Confirmation

*For any* order confirmed with a coupon, a user_coupon_usage record should exist with the correct user_id, coupon_id, and order_id.

**Validates: Requirements 7.3**

### Property 12: Coupon Used Count Increments on Order Confirmation

*For any* coupon used in an order, confirming the order should increment the coupon's usedCount by exactly 1.

**Validates: Requirements 7.4**

### Property 13: Coupon Usage Tracking is Removed on Cancellation

*For any* order with a coupon that is cancelled, the corresponding user_coupon_usage record should be deleted.

**Validates: Requirements 7.5**

### Property 14: Coupon Used Count Decrements on Cancellation

*For any* coupon used in a cancelled order, the coupon's usedCount should decrement by exactly 1.

**Validates: Requirements 7.6**

### Property 15: Percentage Discount Calculation

*For any* order subtotal and percentage coupon, the discount amount should equal (subtotal × discount_value / 100), capped at the subtotal.

**Validates: Requirements 8.1, 8.2**

### Property 16: Fixed Discount Calculation

*For any* order subtotal and fixed-amount coupon, the discount amount should equal the discount_value, capped at the subtotal.

**Validates: Requirements 8.3, 8.4**

### Property 17: Zero Discount Without Coupon

*For any* order without a coupon, the discount amount should be zero.

**Validates: Requirements 8.5**

### Property 18: Tax Calculation Formula

*For any* cart line item, the tax amount should equal (unit_price × quantity × tax_rate / 100).

**Validates: Requirements 9.2**

### Property 19: Total Tax is Sum of Line Taxes

*For any* multi-item cart, the total tax amount should equal the sum of individual line item tax amounts.

**Validates: Requirements 9.3**

### Property 20: Tax Calculation Round-Trip Preservation

*For any* order, the tax amount stored in the orders table should equal the calculated tax amount.

**Validates: Requirements 9.4**

### Property 21: Shipping Cost Below Threshold

*For any* order subtotal less than ₹500, the shipping amount should be ₹50.

**Validates: Requirements 10.1**

### Property 22: Free Shipping Above Threshold

*For any* order subtotal equal to or exceeding ₹500, the shipping amount should be ₹0.

**Validates: Requirements 10.2**

### Property 23: Shipping Calculation Round-Trip Preservation

*For any* order, the shipping amount stored in the orders table should equal the calculated shipping amount.

**Validates: Requirements 10.3**

### Property 24: Subtotal Calculation Formula

*For any* cart, the subtotal should equal the sum of (unit_price × quantity) for all cart items.

**Validates: Requirements 11.1**

### Property 25: Order Total Calculation Formula

*For any* order amounts, the total should equal (subtotal - discount_amount + tax_amount + shipping_amount).

**Validates: Requirements 11.2**

### Property 26: Order Amounts Round-Trip Preservation

*For any* order, all stored amounts (subtotal, discount_amount, tax_amount, shipping_amount, total) should match the calculated values.

**Validates: Requirements 11.3**

### Property 27: Order Total is Never Negative

*For any* order with extreme discount scenarios, the total amount should always be greater than or equal to zero.

**Validates: Requirements 11.4**

### Property 28: Empty Cart Validation

*For any* checkout attempt with an empty cart, the checkout should be rejected with an "empty cart" message.

**Validates: Requirements 12.1, 12.2**

### Property 29: Shipping Address Validation

*For any* order creation attempt, a valid shipping address containing recipientName, phone, addressLine1, city, state, and postalCode should be required.

**Validates: Requirements 12.3**

### Property 30: Initial Order Status is Pending

*For any* newly created order, the status should be "pending".

**Validates: Requirements 12.4**

### Property 31: Order Items Match Cart Items

*For any* cart and created order, the order_items records should match the cart items in product details, quantities, and prices.

**Validates: Requirements 12.5**

### Property 32: Cart Cleared After Order Creation

*For any* authenticated user who creates an order, all cart_items records for that user should be deleted.

**Validates: Requirements 12.6**

### Property 33: Guest Cart Cleared After Order Creation

*For any* guest user who creates an order, the guest cart cookie should be empty.

**Validates: Requirements 12.7**

### Property 34: Initial Payment Status is Pending

*For any* newly created payment, the status should be "pending".

**Validates: Requirements 13.3**

### Property 35: Payment Signature HMAC Computation

*For any* razorpay_order_id and razorpay_payment_id pair, the computed signature should equal HMAC-SHA256(order_id|payment_id, key_secret).

**Validates: Requirements 14.2**

### Property 36: Valid Signature Captures Payment

*For any* payment with a valid signature, the payment status should be updated to "captured".

**Validates: Requirements 14.4**

### Property 37: Invalid Signature Fails Payment

*For any* payment with an invalid signature, the payment status should be updated to "failed" and the payment should be rejected.

**Validates: Requirements 14.5**

### Property 38: Payment Capture Confirms Order

*For any* payment that transitions to "captured" status, the corresponding order status should transition to "confirmed".

**Validates: Requirements 14.6**

### Property 39: Webhook Signature Validation

*For any* Razorpay webhook, only webhooks with valid signatures should be processed; invalid signatures should receive HTTP 400.

**Validates: Requirements 15.1, 15.2**

### Property 40: Captured Webhook Updates Payment Status

*For any* "payment.captured" webhook with valid signature, the payment status should be updated to "captured".

**Validates: Requirements 15.3**

### Property 41: Failed Webhook Updates Payment Status

*For any* "payment.failed" webhook with valid signature, the payment status should be updated to "failed".

**Validates: Requirements 15.4**

### Property 42: Webhook Payment Status Synchronizes Order Status

*For any* payment status update via webhook, the corresponding order status should be updated accordingly.

**Validates: Requirements 15.5**

### Property 43: Order State Machine Transitions

*For any* order in a given status, only valid state transitions as defined in the state machine should be allowed (pending→confirmed, confirmed→processing, processing→shipped, shipped→delivered, delivered→returned, any_except_delivered_or_returned→cancelled, confirmed_or_cancelled→refunded).

**Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7**

### Property 44: Order Status Update Changes Timestamp

*For any* order status transition, the updated_at timestamp should be modified.

**Validates: Requirements 16.8**

### Property 45: User Order Query Filters by User ID

*For any* authenticated user requesting their orders, only orders where user_id matches the authenticated user should be returned.

**Validates: Requirements 18.1**

### Property 46: Order Query Returns Complete Data

*For any* order query, the returned data should include all order_items, payment status, and order status.

**Validates: Requirements 18.2**

### Property 47: Order Query Sorted by Creation Date Descending

*For any* order query result, the orders should be sorted by created_at timestamp in descending order.

**Validates: Requirements 18.3**

### Property 48: Admin Sees All Orders

*For any* authenticated user with role "admin", requesting orders should return all orders regardless of user_id.

**Validates: Requirements 19.1**

### Property 49: Admin Order Filtering by Status

*For any* admin order query with a status filter, only orders matching that status should be returned.

**Validates: Requirements 19.2**

### Property 50: Admin Order Filtering by Date Range

*For any* admin order query with a date range filter, only orders within that date range should be returned.

**Validates: Requirements 19.3**

### Property 51: Admin Order Query Returns Complete Data

*For any* admin order query, the returned data should include customer details, order_items, and payment information.

**Validates: Requirements 19.4**

### Property 52: Guest Checkout Requires Contact Information

*For any* guest user checkout, email, phone, and shipping address should be required.

**Validates: Requirements 20.2**

### Property 53: Guest Order Creates Profile for New Email

*For any* guest user completing an order with an email that doesn't exist in profiles, a new profile record with role "customer" should be created.

**Validates: Requirements 20.3**

## Migration Plan

1. **Phase 1: Schema Changes**
   - Add `tax_rate` column to categories table
   - Create `user_coupon_usage` table
   - Extend `order_status` enum to include "returned"
   - Verify payments table has all required columns

2. **Phase 2: Service Layer**
   - Implement `CartService` with guest and user cart operations
   - Implement `CheckoutService` with validation and calculation logic
   - Implement `OrderService` with query and status update logic

3. **Phase 3: Actions and API Routes**
   - Implement cart actions (`actions/cart.ts`)
   - Implement checkout actions (`actions/checkout.ts`)
   - Implement payment actions (`actions/payments.ts`)
   - Implement order actions (`actions/orders.ts`)
   - Implement webhook handler (`app/api/payments/webhook/route.ts`)

4. **Phase 4: Frontend Integration**
   - Build cart page with add/remove/update functionality
   - Build checkout page with coupon application
   - Integrate Razorpay payment UI
   - Build order history page
   - Build admin order management dashboard

5. **Phase 5: Testing**
   - Write property-based tests for all correctness properties
   - Write unit tests for edge cases and examples
   - Integration tests with Razorpay test mode
   - End-to-end checkout flow tests
