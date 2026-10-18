"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { ok, err, type ApiResponse } from "@/lib/api-response";
import {
  updateNotificationPreferencesSchema,
  type UpdateNotificationPreferencesInput,
} from "@/lib/validations/notifications";

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
}

/**
 * Returns the current user's notification channel opt-in preferences.
 * Requires authentication — redirects to /login if the user is not signed in.
 */
export async function getNotificationPreferences(): Promise<
  ApiResponse<NotificationPreferences>
> {
  const user = await requireAuth();

  const [profile] = await db
    .select({
      emailNotifications: profiles.emailNotifications,
      smsNotifications: profiles.smsNotifications,
      whatsappNotifications: profiles.whatsappNotifications,
    })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile) return err("Profile not found");

  return ok({
    email: profile.emailNotifications,
    sms: profile.smsNotifications,
    whatsapp: profile.whatsappNotifications,
  });
}

/**
 * Updates the current user's notification channel opt-in preferences.
 * Requires authentication. Only the provided fields are updated; omitted
 * fields are left unchanged.
 */
export async function updateNotificationPreferences(
  input: UpdateNotificationPreferencesInput
): Promise<ApiResponse<NotificationPreferences>> {
  const user = await requireAuth();

  const parsed = updateNotificationPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return err(
      "Invalid input",
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    );
  }

  const { email, sms, whatsapp } = parsed.data;

  const updates: Partial<{
    emailNotifications: boolean;
    smsNotifications: boolean;
    whatsappNotifications: boolean;
    updatedAt: Date;
  }> = { updatedAt: new Date() };

  if (email !== undefined) updates.emailNotifications = email;
  if (sms !== undefined) updates.smsNotifications = sms;
  if (whatsapp !== undefined) updates.whatsappNotifications = whatsapp;

  const [updated] = await db
    .update(profiles)
    .set(updates)
    .where(eq(profiles.id, user.id))
    .returning({
      emailNotifications: profiles.emailNotifications,
      smsNotifications: profiles.smsNotifications,
      whatsappNotifications: profiles.whatsappNotifications,
    });

  if (!updated) return err("Profile not found");

  revalidatePath("/account/notifications");
  return ok({
    email: updated.emailNotifications,
    sms: updated.smsNotifications,
    whatsapp: updated.whatsappNotifications,
  });
}
