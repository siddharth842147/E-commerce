"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { ok, err, type ApiResponse } from "@/lib/api-response";
import { createCategorySchema, updateCategorySchema } from "@/lib/validations/categories";
import { uploadProductImage } from "@/lib/storage";
import type { Category } from "@/types/db";

// ── Public ─────────────────────────────────────────────────────────────────

export async function getCategories(): Promise<ApiResponse<Category[]>> {
  try {
    const rows = await db.select().from(categories).orderBy(categories.name);
    return ok(rows);
  } catch (_e) {
    return err("Failed to fetch categories");
  }
}

export async function getCategoryBySlug(slug: string): Promise<ApiResponse<Category>> {
  try {
    const [row] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);
    if (!row) return err("Category not found");
    return ok(row);
  } catch (_e) {
    return err("Failed to fetch category");
  }
}

// ── Admin ──────────────────────────────────────────────────────────────────

export async function createCategory(formData: FormData): Promise<ApiResponse<Category>> {
  await requireAdmin();

  const parsed = createCategorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || undefined,
    parentId: formData.get("parentId") || undefined,
  });
  if (!parsed.success) {
    return err("Validation failed", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const imageFile = formData.get("image") as File | null;

  try {
    const [category] = await db.insert(categories).values(parsed.data).returning();

    if (imageFile && imageFile.size > 0) {
      const upload = await uploadProductImage(imageFile, category.id);
      if (upload.success) {
        await db
          .update(categories)
          .set({ imageUrl: upload.data.url })
          .where(eq(categories.id, category.id));
        category.imageUrl = upload.data.url;
      }
    }

    revalidatePath("/");
    revalidatePath("/admin/categories");
    return ok(category);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("unique")) return err("A category with this slug already exists");
    return err("Failed to create category");
  }
}

export async function updateCategory(id: string, formData: FormData): Promise<ApiResponse<Category>> {
  await requireAdmin();

  const parsed = updateCategorySchema.safeParse({
    name: formData.get("name") || undefined,
    slug: formData.get("slug") || undefined,
    description: formData.get("description") || undefined,
    parentId: formData.get("parentId") || undefined,
  });
  if (!parsed.success) {
    return err("Validation failed", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const imageFile = formData.get("image") as File | null;

  try {
    const updates: Record<string, unknown> = {
      ...parsed.data,
      updatedAt: new Date(),
    };

    if (imageFile && imageFile.size > 0) {
      const upload = await uploadProductImage(imageFile, id);
      if (upload.success) updates.imageUrl = upload.data.url;
    }

    const [updated] = await db
      .update(categories)
      .set(updates)
      .where(eq(categories.id, id))
      .returning();

    if (!updated) return err("Category not found");

    revalidatePath("/");
    revalidatePath("/admin/categories");
    return ok(updated);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("unique")) return err("A category with this slug already exists");
    return err("Failed to update category");
  }
}

export async function deleteCategory(id: string): Promise<ApiResponse<null>> {
  await requireAdmin();

  try {
    const [deleted] = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();
    if (!deleted) return err("Category not found");

    revalidatePath("/");
    revalidatePath("/admin/categories");
    return ok(null);
  } catch (_e) {
    return err("Failed to delete category");
  }
}
