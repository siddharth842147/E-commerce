import { pgTable, uuid, text, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

export const notificationChannelEnum = pgEnum("notification_channel", ["email", "sms", "whatsapp", "push"]);
export const notificationStatusEnum = pgEnum("notification_status", ["pending", "sent", "failed"]);

export const notificationsLog = pgTable("notifications_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "set null" }),
  channel: notificationChannelEnum("channel").notNull(),
  recipient: text("recipient").notNull(),
  subject: text("subject"),
  templateId: text("template_id"),
  payload: jsonb("payload"),
  status: notificationStatusEnum("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
