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
  userCouponUnique: unique().on(table.userId, table.couponId),
}));
