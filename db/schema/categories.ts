import { pgTable, uuid, text, timestamp, numeric } from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  parentId: uuid("parent_id"), // self-reference intentionally without .references() to avoid circular dependency
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0"), // GST percentage (e.g., 18.00 for 18%)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
