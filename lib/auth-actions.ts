"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const emailLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const emailSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
});

const phoneOtpSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{9,14}$/),
});

const verifyOtpSchema = z.object({
  phone: z.string(),
  token: z.string().length(6),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
});

const updatePasswordSchema = z.object({
  password: z.string().min(8),
});

export type AuthResult = { error?: string; success?: boolean };

export async function signInWithEmail(formData: FormData): Promise<AuthResult> {
  const parsed = emailLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  redirect("/account");
}

export async function signUpWithEmail(formData: FormData): Promise<AuthResult> {
  const parsed = emailSignupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();

  // If service role key is present, use admin API to create and auto-confirm user.
  // This bypasses Supabase's built-in SMTP rate limits (which cap free tier at 3-4 emails/hour).
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createClient: createSupabaseAdmin } = await import("@supabase/supabase-js");
      const admin = createSupabaseAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      const { data: adminData, error: adminError } = await admin.auth.admin.createUser({
        email: parsed.data.email,
        password: parsed.data.password,
        email_confirm: true,
        user_metadata: { full_name: parsed.data.fullName },
      });

      if (adminError) {
        return { error: adminError.message };
      }

      // Ensure profile exists in public.profiles table
      if (adminData.user) {
        await supabase.from("profiles").upsert({
          id: adminData.user.id,
          email: parsed.data.email,
          full_name: parsed.data.fullName,
          role: "customer",
          updated_at: new Date().toISOString(),
        });
      }

      // Automatically sign in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (signInError) {
        return { success: true };
      }

      redirect("/account");
    } catch (e: any) {
      if (e?.digest?.startsWith?.("NEXT_REDIRECT")) {
        throw e;
      }
      console.error("Admin user creation error:", e);
      return { error: e?.message || "Failed to create account" };
    }
  }

  // Fallback to standard signUp
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName } },
  });
  if (error) return { error: error.message };

  return { success: true };
}

export async function sendPhoneOtp(formData: FormData): Promise<AuthResult> {
  const parsed = phoneOtpSchema.safeParse({ phone: formData.get("phone") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone: parsed.data.phone });
  if (error) return { error: error.message };

  return { success: true };
}

export async function verifyPhoneOtp(formData: FormData): Promise<AuthResult> {
  const parsed = verifyOtpSchema.safeParse({
    phone: formData.get("phone"),
    token: formData.get("token"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    phone: parsed.data.phone,
    token: parsed.data.token,
    type: "sms",
  });
  if (error) return { error: error.message };

  redirect("/account");
}

export async function resetPassword(formData: FormData): Promise<AuthResult> {
  const parsed = resetPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });
  if (error) return { error: error.message };

  return { success: true };
}

export async function updatePassword(formData: FormData): Promise<AuthResult> {
  const parsed = updatePasswordSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };

  redirect("/account");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
