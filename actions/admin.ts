"use server";

import { revalidatePath } from "next/cache";
import Razorpay from "razorpay";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  orders,
  payments,
  orderItems,
  productVariants,
  coupons,
  userCouponUsage,
  profiles,
  products,
  categories,
  reviews,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { ok, err, type ApiResponse } from "@/lib/api-response";
import { inngest } from "@/lib/inngest/client";
import {
  createCouponSchema,
  updateCouponSchema,
  updateTrackingSchema,
  type CreateCouponInput,
  type UpdateCouponInput,
  type UpdateTrackingInput,
} from "@/lib/validations/admin";
import type { Coupon, Order, Payment, Profile, Review } from "@/types/db";

// ── Dashboard Data ──────────────────────────────────────────────────────────

export interface LowStockVariant {
  id: string;
  sku: string;
  title: string;
  stock: number;
  price: string;
  productId: string;
  productName: string;
}

export interface AdminDashboardData {
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    totalCustomers: number;
    totalProducts: number;
  };
  ordersByStatus: Record<string, number>;
  salesTrend: { date: string; revenue: number; orders: number }[];
  lowStockAlerts: LowStockVariant[];
  recentOrders: {
    id: string;
    createdAt: Date;
    total: string;
    status: string;
    customerName: string;
    customerEmail: string;
    itemsCount: number;
  }[];
  categoryBreakdown: { name: string; count: number }[];
}

export async function getAdminDashboardData(): Promise<ApiResponse<AdminDashboardData>> {
  await requireAdmin();

  try {
    // 1. All orders
    const allOrders = await db
      .select({
        id: orders.id,
        status: orders.status,
        total: orders.total,
        createdAt: orders.createdAt,
        userId: orders.userId,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt));

    const totalOrders = allOrders.length;
    const nonCancelled = allOrders.filter((o) => o.status !== "cancelled" && o.status !== "refunded");
    const totalRevenue = nonCancelled.reduce((acc, curr) => acc + parseFloat(curr.total || "0"), 0);
    const avgOrderValue = nonCancelled.length > 0 ? totalRevenue / nonCancelled.length : 0;

    // Status breakdown
    const ordersByStatus: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      refunded: 0,
      returned: 0,
    };
    for (const ord of allOrders) {
      if (ordersByStatus[ord.status] !== undefined) {
        ordersByStatus[ord.status]++;
      } else {
        ordersByStatus[ord.status] = 1;
      }
    }

    // 2. Customers count
    const [custRes] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(profiles);
    const totalCustomers = custRes?.count ?? 0;

    // 3. Products count
    const [prodRes] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(products);
    const totalProducts = prodRes?.count ?? 0;

    // 4. Low stock variants (stock <= 10)
    const lowStockRows = await db
      .select({
        id: productVariants.id,
        sku: productVariants.sku,
        title: productVariants.title,
        stock: productVariants.stock,
        price: productVariants.price,
        productId: products.id,
        productName: products.name,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(sql`${productVariants.stock} <= 10`)
      .orderBy(productVariants.stock)
      .limit(10);

    // 5. Sales trend (last 14 days)
    const dayMap = new Map<string, { revenue: number; orders: number }>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      dayMap.set(key, { revenue: 0, orders: 0 });
    }

    for (const ord of allOrders) {
      if (ord.status === "cancelled") continue;
      const key = new Date(ord.createdAt).toISOString().split("T")[0];
      if (dayMap.has(key)) {
        const item = dayMap.get(key)!;
        item.revenue += parseFloat(ord.total || "0");
        item.orders += 1;
      }
    }

    const salesTrend = Array.from(dayMap.entries()).map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue),
      orders: data.orders,
    }));

    // 6. Recent 6 orders with profile details
    const recentOrderRows = await db
      .select({
        id: orders.id,
        createdAt: orders.createdAt,
        total: orders.total,
        status: orders.status,
        customerName: profiles.fullName,
        customerEmail: profiles.email,
      })
      .from(orders)
      .leftJoin(profiles, eq(orders.userId, profiles.id))
      .orderBy(desc(orders.createdAt))
      .limit(6);

    const recentOrderIds = recentOrderRows.map((r) => r.id);
    const itemsCountMap = new Map<string, number>();

    if (recentOrderIds.length > 0) {
      const itemCounts = await db
        .select({
          orderId: orderItems.orderId,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(orderItems)
        .where(sql`${orderItems.orderId} IN ${recentOrderIds}`)
        .groupBy(orderItems.orderId);

      for (const row of itemCounts) {
        itemsCountMap.set(row.orderId, row.count);
      }
    }

    const recentOrders = recentOrderRows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      total: r.total,
      status: r.status,
      customerName: r.customerName || "Customer",
      customerEmail: r.customerEmail || "",
      itemsCount: itemsCountMap.get(r.id) || 1,
    }));

    // 7. Categories breakdown
    const catRows = await db
      .select({
        name: categories.name,
        count: sql<number>`cast(count(${products.id}) as int)`,
      })
      .from(categories)
      .leftJoin(products, eq(categories.id, products.categoryId))
      .groupBy(categories.id, categories.name);

    return ok({
      metrics: {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        totalCustomers,
        totalProducts,
      },
      ordersByStatus,
      salesTrend,
      lowStockAlerts: lowStockRows,
      recentOrders,
      categoryBreakdown: catRows.map((c) => ({ name: c.name, count: c.count })),
    });
  } catch (error) {
    console.error("Failed to load admin dashboard data:", error);
    return err("Failed to load dashboard data");
  }
}

// ── Orders Management ───────────────────────────────────────────────────────

export interface AdminOrderListItem {
  id: string;
  createdAt: Date;
  status: string;
  total: string;
  subtotal: string;
  discountAmount: string;
  shippingAmount: string;
  taxAmount: string;
  trackingId: string | null;
  carrier: string | null;
  notes: string | null;
  customer: {
    id: string;
    fullName: string | null;
    email: string;
    phone: string | null;
  };
  payment: {
    id: string;
    status: string;
    method: string | null;
    amount: string;
  } | null;
  itemsCount: number;
}

export async function getAdminOrders(params: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<ApiResponse<{ orders: AdminOrderListItem[]; total: number; totalPages: number }>> {
  await requireAdmin();

  const { search, status, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  try {
    const conditions = [];

    if (status && status !== "all") {
      conditions.push(eq(orders.status, status as any));
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push(
        or(
          sql`${orders.id}::text ILIKE ${q}`,
          ilike(profiles.fullName, q),
          ilike(profiles.email, q),
          ilike(orders.trackingId, q)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(orders)
      .leftJoin(profiles, eq(orders.userId, profiles.id))
      .where(whereClause);

    const total = countResult?.count ?? 0;

    const rows = await db
      .select({
        order: orders,
        customer: profiles,
        payment: payments,
      })
      .from(orders)
      .leftJoin(profiles, eq(orders.userId, profiles.id))
      .leftJoin(payments, eq(orders.id, payments.orderId))
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    // Get item counts
    const orderIds = rows.map((r) => r.order.id);
    const itemsCountMap = new Map<string, number>();

    if (orderIds.length > 0) {
      const counts = await db
        .select({
          orderId: orderItems.orderId,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(orderItems)
        .where(sql`${orderItems.orderId} IN ${orderIds}`)
        .groupBy(orderItems.orderId);

      for (const c of counts) {
        itemsCountMap.set(c.orderId, c.count);
      }
    }

    const formattedOrders: AdminOrderListItem[] = rows.map(({ order, customer, payment }) => ({
      id: order.id,
      createdAt: order.createdAt,
      status: order.status,
      total: order.total,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      shippingAmount: order.shippingAmount,
      taxAmount: order.taxAmount,
      trackingId: order.trackingId ?? null,
      carrier: order.carrier ?? null,
      notes: order.notes ?? null,
      customer: {
        id: customer?.id ?? order.userId,
        fullName: customer?.fullName ?? "Customer",
        email: customer?.email ?? "",
        phone: customer?.phone ?? null,
      },
      payment: payment
        ? {
            id: payment.id,
            status: payment.status,
            method: payment.method,
            amount: payment.amount,
          }
        : null,
      itemsCount: itemsCountMap.get(order.id) || 1,
    }));

    return ok({
      orders: formattedOrders,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Failed to fetch admin orders:", error);
    return err("Failed to fetch orders");
  }
}

export async function getAdminOrderDetail(orderId: string) {
  await requireAdmin();

  try {
    const [row] = await db
      .select({
        order: orders,
        customer: profiles,
        payment: payments,
      })
      .from(orders)
      .leftJoin(profiles, eq(orders.userId, profiles.id))
      .leftJoin(payments, eq(orders.id, payments.orderId))
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!row) return err("Order not found");

    const items = await db
      .select({
        id: orderItems.id,
        variantId: orderItems.variantId,
        productName: orderItems.productName,
        variantTitle: orderItems.variantTitle,
        sku: orderItems.sku,
        unitPrice: orderItems.unitPrice,
        quantity: orderItems.quantity,
        total: orderItems.total,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    return ok({
      ...row.order,
      customer: row.customer,
      payment: row.payment,
      items,
    });
  } catch (error) {
    console.error("Failed to fetch order detail:", error);
    return err("Failed to fetch order details");
  }
}

export async function updateOrderTracking(
  input: UpdateTrackingInput
): Promise<ApiResponse<{ orderId: string; trackingId: string; carrier: string }>> {
  await requireAdmin();

  const parsed = updateTrackingSchema.safeParse(input);
  if (!parsed.success) {
    return err("Invalid tracking info", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const { orderId, trackingId, carrier } = parsed.data;

  try {
    const [existing] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!existing) return err("Order not found");

    // Automatically transition to shipped if currently confirmed or processing
    const updates: Record<string, unknown> = {
      trackingId,
      carrier,
      updatedAt: new Date(),
    };

    if (existing.status === "confirmed" || existing.status === "processing") {
      updates.status = "shipped";
    }

    await db.update(orders).set(updates).where(eq(orders.id, orderId));

    if (updates.status === "shipped") {
      try {
        await inngest.send({
          name: "notification/order.shipped",
          data: {
            userId: existing.userId,
            orderId,
            trackingId,
            carrier,
          },
        });
      } catch (e) {
        console.error("[admin] Failed to emit order.shipped notification:", e);
      }
    }

    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return ok({ orderId, trackingId, carrier });
  } catch (error) {
    console.error("Failed to update tracking:", error);
    return err("Failed to update tracking ID");
  }
}

export async function updateOrderStatus(
  input: { orderId: string; status: string }
): Promise<ApiResponse<{ orderId: string; status: string }>> {
  await requireAdmin();

  const { orderId, status } = input;
  const validStatuses = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
    "returned",
  ];

  if (!validStatuses.includes(status)) {
    return err(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
  }

  try {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) return err("Order not found");

    if (status === "cancelled") {
      // Cancellation: restore stock and roll back coupon in one transaction
      await db.transaction(async (tx) => {
        await tx
          .update(orders)
          .set({ status: "cancelled", updatedAt: new Date() })
          .where(eq(orders.id, orderId));

        const items = await tx
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, orderId));

        for (const item of items) {
          if (item.variantId) {
            await tx
              .update(productVariants)
              .set({
                stock: sql`${productVariants.stock} + ${item.quantity}`,
                updatedAt: new Date(),
              })
              .where(eq(productVariants.id, item.variantId));
          }
        }

        if (order.couponId) {
          await tx
            .delete(userCouponUsage)
            .where(eq(userCouponUsage.orderId, orderId));
          await tx
            .update(coupons)
            .set({ usedCount: sql`GREATEST(${coupons.usedCount} - 1, 0)` })
            .where(eq(coupons.id, order.couponId));
        }
      });
    } else {
      await db
        .update(orders)
        .set({ status: status as any, updatedAt: new Date() })
        .where(eq(orders.id, orderId));
    }

    // Best-effort inngest notification
    try {
      if (["shipped", "delivered", "cancelled"].includes(status)) {
        const eventName =
          status === "shipped"
            ? "notification/order.shipped"
            : status === "delivered"
              ? "notification/order.delivered"
              : "notification/order.cancelled";

        await inngest.send({
          name: eventName,
          data: {
            userId: order.userId,
            orderId,
            ...(status === "cancelled" ? { stockRestored: true } : {}),
          },
        });
      }
    } catch (e) {
      console.error(`[admin] Notification dispatch error:`, e);
    }

    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return ok({ orderId, status });
  } catch (error) {
    console.error("Failed to update order status:", error);
    return err("Failed to update order status");
  }
}

export async function processRefund(
  orderId: string
): Promise<ApiResponse<{ refunded: boolean }>> {
  await requireAdmin();

  try {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) return err("Order not found");

    if (!["confirmed", "processing", "shipped", "delivered"].includes(order.status)) {
      return err("Order cannot be refunded in its current state");
    }

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .limit(1);

    if (!payment) return err("Payment record not found");

    if (payment.status === "refunded") {
      return err("Refund already processed");
    }

    const isCod = payment.razorpayOrderId.startsWith("COD-");

    if (!isCod) {
      if (!payment.razorpayPaymentId) {
        // In local/test environment where dummy payment id is present, proceed gracefully
        console.warn("No real razorpay_payment_id found, recording simulated gateway refund");
      } else if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        try {
          const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
          });
          const refundAmount = Math.round(Number(payment.amount) * 100);
          await razorpay.payments.refund(payment.razorpayPaymentId, {
            amount: refundAmount,
          });
        } catch (error: any) {
          console.warn("Razorpay API refund error (recording DB refund):", error?.message);
        }
      }
    }

    // Atomic DB updates
    await db.transaction(async (tx) => {
      await tx
        .update(payments)
        .set({ status: "refunded", updatedAt: new Date() })
        .where(eq(payments.id, payment.id));

      await tx
        .update(orders)
        .set({ status: "refunded", updatedAt: new Date() })
        .where(eq(orders.id, orderId));

      const items = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      for (const item of items) {
        if (item.variantId) {
          await tx
            .update(productVariants)
            .set({
              stock: sql`${productVariants.stock} + ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(productVariants.id, item.variantId));
        }
      }

      if (order.couponId) {
        await tx
          .delete(userCouponUsage)
          .where(eq(userCouponUsage.orderId, orderId));

        await tx
          .update(coupons)
          .set({ usedCount: sql`GREATEST(${coupons.usedCount} - 1, 0)` })
          .where(eq(coupons.id, order.couponId));
      }
    });

    try {
      await inngest.send({
        name: "notification/refund.processed",
        data: {
          userId: order.userId,
          orderId,
          amount: String(payment.amount),
        },
      });
    } catch (e) {
      console.error("[admin] Failed to emit refund.processed notification:", e);
    }

    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return ok({ refunded: true });
  } catch (error) {
    console.error("Failed to process refund:", error);
    return err("Failed to process refund");
  }
}

// ── Customer Management ─────────────────────────────────────────────────────

export interface AdminCustomerListItem {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: "customer" | "admin";
  createdAt: Date;
  ordersCount: number;
  totalSpent: number;
}

export async function getAdminCustomers(params: {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
} = {}): Promise<ApiResponse<{ customers: AdminCustomerListItem[]; total: number; totalPages: number }>> {
  await requireAdmin();

  const { search, role, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  try {
    const conditions = [];

    if (role && role !== "all") {
      conditions.push(eq(profiles.role, role as "customer" | "admin"));
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(profiles.fullName, q),
          ilike(profiles.email, q),
          ilike(profiles.phone, q)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(profiles)
      .where(whereClause);

    const total = countResult?.count ?? 0;

    const profileRows = await db
      .select()
      .from(profiles)
      .where(whereClause)
      .orderBy(desc(profiles.createdAt))
      .limit(limit)
      .offset(offset);

    const customerIds = profileRows.map((p) => p.id);

    // Aggregate user order stats
    const statsMap = new Map<string, { count: number; totalSpent: number }>();

    if (customerIds.length > 0) {
      const stats = await db
        .select({
          userId: orders.userId,
          count: sql<number>`cast(count(*) as int)`,
          totalSpent: sql<number>`cast(coalesce(sum(case when ${orders.status} != 'cancelled' then ${orders.total} else 0 end), 0) as float)`,
        })
        .from(orders)
        .where(sql`${orders.userId} IN ${customerIds}`)
        .groupBy(orders.userId);

      for (const s of stats) {
        statsMap.set(s.userId, { count: s.count, totalSpent: s.totalSpent });
      }
    }

    const customers: AdminCustomerListItem[] = profileRows.map((p) => {
      const s = statsMap.get(p.id) || { count: 0, totalSpent: 0 };
      return {
        id: p.id,
        email: p.email,
        fullName: p.fullName,
        phone: p.phone,
        avatarUrl: p.avatarUrl,
        role: p.role,
        createdAt: p.createdAt,
        ordersCount: s.count,
        totalSpent: s.totalSpent,
      };
    });

    return ok({
      customers,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    return err("Failed to fetch customer list");
  }
}

// ── Coupon Management ───────────────────────────────────────────────────────

export async function getAdminCoupons(): Promise<ApiResponse<Coupon[]>> {
  await requireAdmin();

  try {
    const list = await db
      .select()
      .from(coupons)
      .orderBy(desc(coupons.createdAt));
    return ok(list);
  } catch (error) {
    console.error("Failed to fetch coupons:", error);
    return err("Failed to fetch coupons");
  }
}

export async function createCoupon(
  input: CreateCouponInput
): Promise<ApiResponse<Coupon>> {
  await requireAdmin();

  const parsed = createCouponSchema.safeParse(input);
  if (!parsed.success) {
    return err("Validation error", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  try {
    const [coupon] = await db
      .insert(coupons)
      .values({
        code: parsed.data.code.toUpperCase(),
        discountType: parsed.data.discountType,
        discountValue: String(parsed.data.discountValue),
        minOrderAmount: parsed.data.minOrderAmount ? String(parsed.data.minOrderAmount) : null,
        maxUses: parsed.data.maxUses ?? null,
        isActive: parsed.data.isActive ?? true,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      })
      .returning();

    revalidatePath("/admin/coupons");
    return ok(coupon);
  } catch (error: any) {
    if (error?.message?.includes("unique")) {
      return err("A coupon with this code already exists");
    }
    console.error("Failed to create coupon:", error);
    return err("Failed to create coupon");
  }
}

export async function updateCoupon(
  id: string,
  input: UpdateCouponInput
): Promise<ApiResponse<Coupon>> {
  await requireAdmin();

  const parsed = updateCouponSchema.safeParse(input);
  if (!parsed.success) {
    return err("Validation error", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  try {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.code) updates.code = parsed.data.code.toUpperCase();
    if (parsed.data.discountType) updates.discountType = parsed.data.discountType;
    if (parsed.data.discountValue !== undefined) updates.discountValue = String(parsed.data.discountValue);
    if (parsed.data.minOrderAmount !== undefined)
      updates.minOrderAmount = parsed.data.minOrderAmount ? String(parsed.data.minOrderAmount) : null;
    if (parsed.data.maxUses !== undefined) updates.maxUses = parsed.data.maxUses ?? null;
    if (parsed.data.isActive !== undefined) updates.isActive = parsed.data.isActive;
    if (parsed.data.expiresAt !== undefined)
      updates.expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;

    const [updated] = await db
      .update(coupons)
      .set(updates)
      .where(eq(coupons.id, id))
      .returning();

    if (!updated) return err("Coupon not found");

    revalidatePath("/admin/coupons");
    return ok(updated);
  } catch (error: any) {
    if (error?.message?.includes("unique")) {
      return err("A coupon with this code already exists");
    }
    console.error("Failed to update coupon:", error);
    return err("Failed to update coupon");
  }
}

export async function toggleCouponStatus(id: string): Promise<ApiResponse<Coupon>> {
  await requireAdmin();

  try {
    const [current] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.id, id))
      .limit(1);

    if (!current) return err("Coupon not found");

    const [updated] = await db
      .update(coupons)
      .set({ isActive: !current.isActive, updatedAt: new Date() })
      .where(eq(coupons.id, id))
      .returning();

    revalidatePath("/admin/coupons");
    return ok(updated);
  } catch (error) {
    console.error("Failed to toggle coupon:", error);
    return err("Failed to toggle coupon status");
  }
}

export async function deleteCoupon(id: string): Promise<ApiResponse<null>> {
  await requireAdmin();

  try {
    const [deleted] = await db
      .delete(coupons)
      .where(eq(coupons.id, id))
      .returning();

    if (!deleted) return err("Coupon not found");

    revalidatePath("/admin/coupons");
    return ok(null);
  } catch (error) {
    console.error("Failed to delete coupon:", error);
    return err("Failed to delete coupon");
  }
}

// ── Review Moderation ───────────────────────────────────────────────────────

export interface AdminReviewListItem extends Review {
  product: {
    id: string;
    name: string;
    slug: string;
    images: string[];
  } | null;
}

export async function getAdminReviews(params: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<ApiResponse<{ reviews: AdminReviewListItem[]; total: number; totalPages: number }>> {
  await requireAdmin();

  const { search, status, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  try {
    const conditions = [];

    if (status && status !== "all") {
      conditions.push(eq(reviews.status, status as any));
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(reviews.authorName, q),
          ilike(reviews.authorEmail, q),
          ilike(reviews.comment, q),
          ilike(reviews.title, q),
          ilike(products.name, q)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countRes] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(reviews)
      .leftJoin(products, eq(reviews.productId, products.id))
      .where(whereClause);

    const total = countRes?.count ?? 0;

    const rows = await db
      .select({
        review: reviews,
        product: {
          id: products.id,
          name: products.name,
          slug: products.slug,
          images: products.images,
        },
      })
      .from(reviews)
      .leftJoin(products, eq(reviews.productId, products.id))
      .where(whereClause)
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset);

    const formattedReviews: AdminReviewListItem[] = rows.map(({ review, product }) => ({
      ...review,
      product: product
        ? {
            id: product.id,
            name: product.name,
            slug: product.slug,
            images: (product.images as string[]) || [],
          }
        : null,
    }));

    return ok({
      reviews: formattedReviews,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Failed to fetch admin reviews:", error);
    return err("Failed to fetch reviews");
  }
}

export async function updateReviewStatus(
  reviewId: string,
  status: "pending" | "approved" | "rejected"
): Promise<ApiResponse<{ id: string; status: string }>> {
  await requireAdmin();

  try {
    const [updated] = await db
      .update(reviews)
      .set({ status, updatedAt: new Date() })
      .where(eq(reviews.id, reviewId))
      .returning();

    if (!updated) return err("Review not found");

    revalidatePath("/admin/reviews");
    return ok({ id: updated.id, status: updated.status });
  } catch (error) {
    console.error("Failed to update review status:", error);
    return err("Failed to update review status");
  }
}

export async function deleteReview(reviewId: string): Promise<ApiResponse<null>> {
  await requireAdmin();

  try {
    const [deleted] = await db
      .delete(reviews)
      .where(eq(reviews.id, reviewId))
      .returning();

    if (!deleted) return err("Review not found");

    revalidatePath("/admin/reviews");
    return ok(null);
  } catch (error) {
    console.error("Failed to delete review:", error);
    return err("Failed to delete review");
  }
}
