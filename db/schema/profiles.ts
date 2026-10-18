import { pgTable, uuid, text, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["customer", "admin"]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // references auth.users(id)
  email: text("email").notNull(),
  fullName: text("full_name"),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  role: roleEnum("role").notNull().default("customer"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  // Channel opt-in preferences — default to true so existing rows stay opted-in
  emailNotifications: boolean("email_notifications").notNull().default(true),
  smsNotifications: boolean("sms_notifications").notNull().default(true),
  whatsappNotifications: boolean("whatsapp_notifications").notNull().default(true),
});
