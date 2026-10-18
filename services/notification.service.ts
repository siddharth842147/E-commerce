/**
 * Notification sending layer.
 *
 * Channel primitives (Resend email, MSG91 SMS, Meta Cloud API WhatsApp),
 * a notifications_log writer, and a preference-aware dispatcher. This layer is
 * self-contained and consumed by the Inngest functions (background jobs).
 *
 * All sending happens server-side. Keys are read from process.env at call time
 * so module import never touches secrets.
 */
import type { ReactElement } from "react";
import { Resend } from "resend";
import { db } from "@/db";
import { notificationsLog, profiles } from "@/db/schema";
import {
  notificationChannelEnum,
  notificationStatusEnum,
} from "@/db/schema";
import { eq } from "drizzle-orm";

/** Allowed notification channels (mirrors the notification_channel enum). */
export type NotificationChannel =
  (typeof notificationChannelEnum.enumValues)[number];

/** Allowed notification statuses (mirrors the notification_status enum). */
export type NotificationStatus =
  (typeof notificationStatusEnum.enumValues)[number];

/** Standard result returned by every channel sender. */
export interface ChannelSendResult {
  success: boolean;
  /** Provider message id (Resend email id / MSG91 id / Meta wamid). */
  providerMessageId?: string;
  error?: string;
}

/** Email attachment payload. `content` is a Buffer (e.g. a generated PDF). */
export interface EmailAttachment {
  content: Buffer;
  filename: string;
  contentType?: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  react: ReactElement;
  attachments?: EmailAttachment[];
}

/**
 * Send a transactional email via Resend.
 * `data.id` from Resend is the provider message id.
 */
export async function sendEmail({
  to,
  subject,
  react,
  attachments,
}: SendEmailParams): Promise<ChannelSendResult> {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to,
      subject,
      react,
      attachments,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, providerMessageId: data?.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

interface SendSMSParams {
  to: string;
  message: string;
}

/**
 * Send an SMS via the MSG91 REST API (POST).
 * Uses MSG91_AUTH_KEY, MSG91_SENDER_ID and MSG91_TEMPLATE_ID env vars.
 */
export async function sendSMS({ to, message }: SendSMSParams): Promise<ChannelSendResult> {
  try {
    const response = await fetch("https://api.msg91.com/api/v5/sms/send", {
      method: "POST",
      headers: {
        "authkey": process.env.MSG91_AUTH_KEY!,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender_id: process.env.MSG91_SENDER_ID!,
        template_id: process.env.MSG91_TEMPLATE_ID!,
        message,
        mobiles: to,
      }),
    });

    if (!response.ok) {
      return { success: false, error: `MSG91 request failed: ${response.status}` };
    }

    const body = (await response.json()) as {
      type?: string;
      message?: string;
      _id?: string;
    };

    if (body.type === "success") {
      return {
        success: true,
        providerMessageId: body._id ?? body.message,
      };
    }
    return { success: false, error: body.message ?? "MSG91 send failed" };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

interface SendWhatsAppParams {
  to: string;
  template: string;
  params: string[];
}

/**
 * Send a WhatsApp template message via the Meta Cloud API.
 * POSTs to graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages with
 * type 'template'. The Meta message id (wamid) is the provider message id.
 */
export async function sendWhatsApp({
  to,
  template,
  params,
}: SendWhatsAppParams): Promise<ChannelSendResult> {
  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN!}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: template,
            language: { code: "en" },
            components: [
              {
                type: "body",
                parameters: params.map((p) => ({ type: "text", text: p })),
              },
            ],
          },
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return {
        success: false,
        error: `WhatsApp request failed: ${response.status} ${text}`,
      };
    }

    const body = (await response.json()) as {
      messages?: { id?: string }[];
    };
    const messageId = body.messages?.[0]?.id;
    return { success: true, providerMessageId: messageId };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

interface LogNotificationParams {
  userId: string | null;
  channel: NotificationChannel;
  eventType: string;
  recipient: string;
  status: Extract<NotificationStatus, "sent" | "failed">;
  subject?: string;
  templateId?: string;
  providerMessageId?: string;
  error?: string;
}

/**
 * Insert an attempt row into notifications_log.
 * `eventType` and `providerMessageId` are stored inside the `payload` jsonb
 * (the table has no dedicated columns for them). Best-effort: a logging
 * failure is swallowed so it never breaks the notification dispatch flow.
 */
export async function logNotification(params: LogNotificationParams): Promise<void> {
  try {
    await db.insert(notificationsLog).values({
      userId: params.userId,
      channel: params.channel,
      recipient: params.recipient,
      status: params.status,
      subject: params.subject,
      templateId: params.templateId,
      errorMessage: params.error,
      sentAt: params.status === "sent" ? new Date() : null,
      payload: {
        eventType: params.eventType,
        providerMessageId: params.providerMessageId,
      },
    });
  } catch (e) {
    // Audit log is best-effort; never surface a logging failure to the caller.
    console.error("[notification.service] logNotification failed:", e);
  }
}

/** Email channel content prepared by the caller (Inngest functions). */
export interface DispatchEmailPayload {
  subject: string;
  react: ReactElement;
  templateId?: string;
  attachments?: EmailAttachment[];
}

/** SMS channel content prepared by the caller. */
export interface DispatchSmsPayload {
  message: string;
  templateId?: string;
}

/** WhatsApp channel content prepared by the caller. */
export interface DispatchWhatsappPayload {
  template: string;
  params: string[];
  templateId?: string;
}

/** Channel payloads for a single dispatch. Only provided channels are sent. */
export interface DispatchData {
  email?: DispatchEmailPayload;
  sms?: DispatchSmsPayload;
  whatsapp?: DispatchWhatsappPayload;
}

interface DispatchNotificationParams {
  userId: string;
  eventType: string;
  data: DispatchData;
}

/**
 * Send a notification to every opted-in channel for a user.
 *
 * Loads the user's profile (email, phone, opt-in prefs), then for each channel
 * that is BOTH opted-in AND has content in `data`, calls the matching sender
 * and writes a notifications_log row. Each channel is isolated in its own
 * try/catch so a failure on one channel never stops the others. Opted-out
 * channels (or channels with no content) are simply skipped.
 */
export async function dispatchNotification({
  userId,
  eventType,
  data,
}: DispatchNotificationParams): Promise<void> {
  const [profile] = await db
    .select({
      email: profiles.email,
      phone: profiles.phone,
      emailNotifications: profiles.emailNotifications,
      smsNotifications: profiles.smsNotifications,
      whatsappNotifications: profiles.whatsappNotifications,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile) return;

  // --- Email channel ---
  if (profile.emailNotifications && profile.email && data.email) {
    const emailPayload = data.email;
    try {
      const result = await sendEmail({
        to: profile.email,
        subject: emailPayload.subject,
        react: emailPayload.react,
        attachments: emailPayload.attachments,
      });
      await logNotification({
        userId,
        channel: "email",
        eventType,
        recipient: profile.email,
        status: result.success ? "sent" : "failed",
        subject: emailPayload.subject,
        templateId: emailPayload.templateId,
        providerMessageId: result.providerMessageId,
        error: result.error,
      });
    } catch (e) {
      await logNotification({
        userId,
        channel: "email",
        eventType,
        recipient: profile.email,
        status: "failed",
        subject: emailPayload.subject,
        templateId: emailPayload.templateId,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  // --- SMS channel ---
  if (profile.smsNotifications && profile.phone && data.sms) {
    const smsPayload = data.sms;
    try {
      const result = await sendSMS({
        to: profile.phone,
        message: smsPayload.message,
      });
      await logNotification({
        userId,
        channel: "sms",
        eventType,
        recipient: profile.phone,
        status: result.success ? "sent" : "failed",
        templateId: smsPayload.templateId,
        providerMessageId: result.providerMessageId,
        error: result.error,
      });
    } catch (e) {
      await logNotification({
        userId,
        channel: "sms",
        eventType,
        recipient: profile.phone,
        status: "failed",
        templateId: smsPayload.templateId,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  // --- WhatsApp channel ---
  if (profile.whatsappNotifications && profile.phone && data.whatsapp) {
    const waPayload = data.whatsapp;
    try {
      const result = await sendWhatsApp({
        to: profile.phone,
        template: waPayload.template,
        params: waPayload.params,
      });
      await logNotification({
        userId,
        channel: "whatsapp",
        eventType,
        recipient: profile.phone,
        status: result.success ? "sent" : "failed",
        templateId: waPayload.templateId,
        providerMessageId: result.providerMessageId,
        error: result.error,
      });
    } catch (e) {
      await logNotification({
        userId,
        channel: "whatsapp",
        eventType,
        recipient: profile.phone,
        status: "failed",
        templateId: waPayload.templateId,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
}
