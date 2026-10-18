"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { ok, err, type ApiResponse } from "@/lib/api-response";
import type { Address } from "@/types/db";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
] as const;

function parseAddressForm(formData: FormData) {
  const label = (formData.get("label") as string) ?? "Home";
  const addressLine1 = (formData.get("addressLine1") as string) ?? "";
  const addressLine2 = (formData.get("addressLine2") as string) || null;
  const city = (formData.get("city") as string) ?? "";
  const state = (formData.get("state") as string) ?? "";
  const postalCode = (formData.get("postalCode") as string) ?? "";
  const isDefault = formData.get("isDefault") === "true" || formData.get("isDefault") === "on";

  const errors: string[] = [];
  if (!addressLine1.trim()) errors.push("Address line 1 is required");
  if (!city.trim()) errors.push("City is required");
  if (!state.trim()) errors.push("State is required");
  if (!/^\d{6}$/.test(postalCode)) errors.push("Postal code must be 6 digits");

  return { data: { label, addressLine1, addressLine2, city, state, postalCode, isDefault }, errors };
}

/**
 * Returns all addresses for the authenticated user
 */
export async function getAddresses(): Promise<ApiResponse<Address[]>> {
  const user = await requireAuth();
  try {
    const rows = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, user.id))
      .orderBy(addresses.createdAt);
    return ok(rows);
  } catch {
    return err("Failed to fetch addresses");
  }
}

/**
 * Creates a new address for the authenticated user
 */
export async function createAddress(formData: FormData): Promise<ApiResponse<Address>> {
  const user = await requireAuth();
  const { data, errors } = parseAddressForm(formData);
  if (errors.length > 0) return err(errors[0]);

  try {
    // If new address is default, unset all existing defaults first
    if (data.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, user.id));
    }

    const [address] = await db
      .insert(addresses)
      .values({
        userId: user.id,
        label: data.label,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 ?? undefined,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: "IN",
        isDefault: data.isDefault,
      })
      .returning();

    revalidatePath("/account/addresses");
    return ok(address);
  } catch {
    return err("Failed to create address");
  }
}

/**
 * Updates an existing address belonging to the authenticated user
 */
export async function updateAddress(id: string, formData: FormData): Promise<ApiResponse<Address>> {
  const user = await requireAuth();
  const { data, errors } = parseAddressForm(formData);
  if (errors.length > 0) return err(errors[0]);

  try {
    // If updating to default, unset others first
    if (data.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(and(eq(addresses.userId, user.id), eq(addresses.isDefault, true)));
    }

    const [updated] = await db
      .update(addresses)
      .set({
        label: data.label,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 ?? undefined,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        isDefault: data.isDefault,
        updatedAt: new Date(),
      })
      .where(and(eq(addresses.id, id), eq(addresses.userId, user.id)))
      .returning();

    if (!updated) return err("Address not found");

    revalidatePath("/account/addresses");
    return ok(updated);
  } catch {
    return err("Failed to update address");
  }
}

/**
 * Deletes an address belonging to the authenticated user
 */
export async function deleteAddress(id: string): Promise<ApiResponse<null>> {
  const user = await requireAuth();

  try {
    const [deleted] = await db
      .delete(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, user.id)))
      .returning();

    if (!deleted) return err("Address not found");

    revalidatePath("/account/addresses");
    return ok(null);
  } catch {
    return err("Failed to delete address");
  }
}

/**
 * Sets the given address as the default for the authenticated user
 */
export async function setDefaultAddress(id: string): Promise<ApiResponse<null>> {
  const user = await requireAuth();

  try {
    // Unset all defaults
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(eq(addresses.userId, user.id));

    // Set the chosen address as default
    const [updated] = await db
      .update(addresses)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(and(eq(addresses.id, id), eq(addresses.userId, user.id)))
      .returning();

    if (!updated) return err("Address not found");

    revalidatePath("/account/addresses");
    return ok(null);
  } catch {
    return err("Failed to set default address");
  }
}

export { INDIAN_STATES };
