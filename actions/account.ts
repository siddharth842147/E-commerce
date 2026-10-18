"use server";

import { revalidatePath } from "next/cache";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { profiles, orders, orderItems, payments } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { ok, err, type ApiResponse } from "@/lib/api-response";

// ─── Profile ────────────────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")
    .optional()
    .or(z.literal("")),
});

export async function getProfile() {
  const user = await requireAuth();
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  return profile ?? null;
}

export async function updateProfile(
  input: { fullName: string; phone?: string }
): Promise<ApiResponse<null>> {
  const user = await requireAuth();
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return err(parsed.error.issues[0].message);
  }

  await db
    .update(profiles)
    .set({
      fullName: parsed.data.fullName,
      phone: parsed.data.phone || null,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, user.id));

  revalidatePath("/account/profile");
  return ok(null);
}

// ─── Orders ─────────────────────────────────────────────────────────────────

export interface OrderSummary {
  id: string;
  status: string;
  total: string;
  createdAt: Date;
  itemCount: number;
}

export async function getOrders(): Promise<ApiResponse<OrderSummary[]>> {
  const user = await requireAuth();
  try {
    const rows = await db
      .select({
        id: orders.id,
        status: orders.status,
        total: orders.total,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.userId, user.id))
      .orderBy(desc(orders.createdAt));

    // Get item counts per order
    const orderIds = rows.map((o) => o.id);
    if (orderIds.length === 0) return ok([]);

    const allItems = await db
      .select({ orderId: orderItems.orderId })
      .from(orderItems)
      .where(
        orderIds.length === 1
          ? eq(orderItems.orderId, orderIds[0])
          : // Use raw SQL for IN clause with multiple ids
            eq(orderItems.orderId, orderIds[0]) // fallback: join in JS
      );

    // Build count map
    const countMap = new Map<string, number>();
    for (const id of orderIds) countMap.set(id, 0);
    // Fetch all items separately for multi-order case
    const itemRows = await db
      .select({ orderId: orderItems.orderId })
      .from(orderItems);
    for (const item of itemRows) {
      if (countMap.has(item.orderId)) {
        countMap.set(item.orderId, (countMap.get(item.orderId) ?? 0) + 1);
      }
    }
    // suppress unused variable
    void allItems;

    return ok(
      rows.map((o) => ({
        id: o.id,
        status: o.status,
        total: o.total,
        createdAt: o.createdAt,
        itemCount: countMap.get(o.id) ?? 0,
      }))
    );
  } catch {
    return err("Failed to fetch orders");
  }
}

export interface OrderDetail {
  id: string;
  status: string;
  subtotal: string;
  discountAmount: string;
  shippingAmount: string;
  taxAmount: string;
  total: string;
  shippingAddress: Record<string, string>;
  notes: string | null;
  createdAt: Date;
  paymentMethod: string | null;
  paymentStatus: string | null;
  items: {
    id: string;
    productName: string;
    variantTitle: string;
    sku: string;
    unitPrice: string;
    quantity: number;
    total: string;
  }[];
}

export async function getOrderDetail(
  orderId: string
): Promise<ApiResponse<OrderDetail>> {
  const user = await requireAuth();
  try {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order || order.userId !== user.id) {
      return err("Order not found");
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    const [payment] = await db
      .select({ method: payments.method, status: payments.status })
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .limit(1);

    return ok({
      id: order.id,
      status: order.status,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      shippingAmount: order.shippingAmount,
      taxAmount: order.taxAmount,
      total: order.total,
      shippingAddress: order.shippingAddress as Record<string, string>,
      notes: order.notes,
      createdAt: order.createdAt,
      paymentMethod: payment?.method ?? null,
      paymentStatus: payment?.status ?? null,
      items: items.map((i) => ({
        id: i.id,
        productName: i.productName,
        variantTitle: i.variantTitle,
        sku: i.sku,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        total: i.total,
      })),
    });
  } catch {
    return err("Failed to fetch order");
  }
}
