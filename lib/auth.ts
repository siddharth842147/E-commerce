import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/** Returns the authenticated user or null */
export async function getUser() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/** Returns the user's profile from the profiles table */
export async function getUserProfile() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

/** Requires authenticated session, redirects to /login if not */
export async function requireAuth() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/** Requires admin role, redirects to / if not */
export async function requireAdmin() {
  const profile = await getUserProfile();
  if (!profile || profile.role !== "admin") redirect("/");
  return profile;
}
