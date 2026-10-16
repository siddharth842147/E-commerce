"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { productVariants, products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { ok, err, type ApiResponse } from "@/lib/api-response";
import {
  createProductSchema,
  createVariantSchema,
  productFiltersSchema,
  updateProductSchema,
  updateVariantSchema,
} from "@/lib/validations/products";
import {
  uploadProductImage,
  deleteProductImage,
} from "@/lib/storage";
import { queryProducts, getProductBySlug } from "@/services/product.service";
import type { ProductVariant } from "@/types/db";
import type { PaginatedProducts, ProductWithVariants } from "@/services/product.service";

/**
 * Derives the Supabase Storage path from a public URL.
 * The public URL format is:  <SUPABASE_URL>/storage/v1/object/public/<bucket>/<path>
 * We extract everything after the bucket name as the storage path.
 */
function deriveStoragePath(publicUrl: string): string | null {
  try {
    const BUCKET = "product-images";
    const marker = `/object/public/${BUCKET}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return null;
    return publicUrl.slice(idx + marker.length);
  } catch {
    return null;
  }
}

// ── Public ─────────────────────────────────────────────────────────────────

export async function getProducts(
  rawFilters: Record<string, unknown> = {}
): Promise<ApiResponse<PaginatedProducts>> {
  const parsed = productFiltersSchema.safeParse(rawFilters);
  if (!parsed.success) {
    return err("Invalid filters", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }
  try {
    const data = await queryProducts(parsed.data);
    return ok(data);
  } catch (_e) {
    return err("Failed to fetch products");
  }
}

export async function getProductDetail(slug: string): Promise<ApiResponse<ProductWithVariants>> {
  try {
    const product = await getProductBySlug(slug);
    if (!product) return err("Product not found");
    return ok(product);
  } catch (_e) {
    return err("Failed to fetch product");
  }
}

// ── Admin ──────────────────────────────────────────────────────────────────

export async function createProduct(formData: FormData): Promise<ApiResponse<ProductWithVariants>> {
  await requireAdmin();

  const parsed = createProductSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice") || undefined,
    tags: formData.getAll("tags"),
    isActive: formData.get("isActive") ?? true,
    isFeatured: formData.get("isFeatured") ?? false,
  });

  if (!parsed.success) {
    return err("Validation failed", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  try {
    const [product] = await db
      .insert(products)
      .values({
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description,
        categoryId: parsed.data.categoryId ?? null,
        price: String(parsed.data.price),
        compareAtPrice: parsed.data.compareAtPrice != null ? String(parsed.data.compareAtPrice) : null,
        tags: parsed.data.tags ?? [],
        isActive: parsed.data.isActive ?? true,
        isFeatured: parsed.data.isFeatured ?? false,
      })
      .returning();

    const imageFiles = formData.getAll("images") as File[];
    const imageUrls: string[] = [];

    for (const file of imageFiles) {
      if (file && file.size > 0) {
        const upload = await uploadProductImage(file, product.id);
        if (upload.success) imageUrls.push(upload.data.url);
      }
    }

    if (imageUrls.length > 0) {
      await db
        .update(products)
        .set({ images: imageUrls })
        .where(eq(products.id, product.id));
      product.images = imageUrls;
    }

    revalidatePath("/");
    revalidatePath("/admin/products");
    return ok({ ...product, variants: [], category: null });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("unique")) return err("A product with this slug already exists");
    return err("Failed to create product");
  }
}

export async function updateProduct(
  id: string,
  formData: FormData
): Promise<ApiResponse<ProductWithVariants>> {
  await requireAdmin();

  const raw: Record<string, unknown> = {};
  if (formData.get("name")) raw.name = formData.get("name");
  if (formData.get("slug")) raw.slug = formData.get("slug");
  if (formData.get("description") !== null) raw.description = formData.get("description") || undefined;
  if (formData.get("categoryId") !== null) raw.categoryId = formData.get("categoryId") || undefined;
  if (formData.get("price")) raw.price = formData.get("price");
  if (formData.get("compareAtPrice") !== null) raw.compareAtPrice = formData.get("compareAtPrice") || undefined;
  if (formData.getAll("tags").length) raw.tags = formData.getAll("tags");
  if (formData.get("isActive") !== null) raw.isActive = formData.get("isActive");
  if (formData.get("isFeatured") !== null) raw.isFeatured = formData.get("isFeatured");

  const parsed = updateProductSchema.safeParse(raw);
  if (!parsed.success) {
    return err("Validation failed", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  try {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.price !== undefined) updates.price = String(parsed.data.price);
    if (parsed.data.compareAtPrice !== undefined)
      updates.compareAtPrice =
        parsed.data.compareAtPrice != null ? String(parsed.data.compareAtPrice) : null;

    const { price: _p, compareAtPrice: _c, ...rest } = parsed.data;
    Object.assign(updates, rest);

    const imageFiles = formData.getAll("images") as File[];
    const newUrls: string[] = [];
    for (const file of imageFiles) {
      if (file && file.size > 0) {
        const upload = await uploadProductImage(file, id);
        if (upload.success) newUrls.push(upload.data.url);
      }
    }

    const keepImages = formData.getAll("existingImages") as string[];

    // Delete blobs that were dropped from the images list (finding: orphaned storage blobs)
    if (keepImages.length > 0 || newUrls.length > 0) {
      const [current] = await db
        .select({ images: products.images })
        .from(products)
        .where(eq(products.id, id))
        .limit(1);

      if (current) {
        const currentImages = (current.images as string[]) ?? [];
        const orphaned = currentImages.filter((u) => !keepImages.includes(u));
        for (const url of orphaned) {
          const path = deriveStoragePath(url);
          if (path) await deleteProductImage(path);
        }
      }

      updates.images = [...keepImages, ...newUrls];
    }

    const [updated] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();

    if (!updated) return err("Product not found");

    revalidatePath("/");
    revalidatePath(`/products/${updated.slug}`);
    revalidatePath("/admin/products");

    const full = await getProductBySlug(updated.slug);
    return ok(full ?? { ...updated, variants: [], category: null });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("unique")) return err("A product with this slug already exists");
    return err("Failed to update product");
  }
}

export async function deleteProduct(id: string): Promise<ApiResponse<null>> {
  await requireAdmin();

  try {
    const [deleted] = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();
    if (!deleted) return err("Product not found");

    revalidatePath("/");
    revalidatePath("/admin/products");
    return ok(null);
  } catch (_e) {
    return err("Failed to delete product");
  }
}

// ── Variants ───────────────────────────────────────────────────────────────

export async function createVariant(
  productId: string,
  formData: FormData
): Promise<ApiResponse<ProductVariant>> {
  await requireAdmin();

  const parsed = createVariantSchema.safeParse({
    sku: formData.get("sku"),
    title: formData.get("title"),
    options: JSON.parse((formData.get("options") as string) || "{}"),
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice") || undefined,
    stock: formData.get("stock"),
    isActive: formData.get("isActive") ?? true,
  });

  if (!parsed.success) {
    return err("Validation failed", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  try {
    const [variant] = await db
      .insert(productVariants)
      .values({
        productId,
        sku: parsed.data.sku,
        title: parsed.data.title,
        options: parsed.data.options ?? {},
        price: String(parsed.data.price),
        compareAtPrice:
          parsed.data.compareAtPrice != null ? String(parsed.data.compareAtPrice) : null,
        stock: parsed.data.stock ?? 0,
        isActive: parsed.data.isActive ?? true,
      })
      .returning();

    revalidatePath("/admin/products");
    return ok(variant);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("unique")) return err("A variant with this SKU already exists");
    return err("Failed to create variant");
  }
}

export async function updateVariant(
  variantId: string,
  formData: FormData
): Promise<ApiResponse<ProductVariant>> {
  await requireAdmin();

  const raw: Record<string, unknown> = {};
  if (formData.get("sku")) raw.sku = formData.get("sku");
  if (formData.get("title")) raw.title = formData.get("title");
  if (formData.get("options")) raw.options = JSON.parse(formData.get("options") as string);
  if (formData.get("price")) raw.price = formData.get("price");
  if (formData.get("compareAtPrice") !== null)
    raw.compareAtPrice = formData.get("compareAtPrice") || undefined;
  if (formData.get("stock") !== null) raw.stock = formData.get("stock");
  if (formData.get("isActive") !== null) raw.isActive = formData.get("isActive");

  const parsed = updateVariantSchema.safeParse(raw);
  if (!parsed.success) {
    return err("Validation failed", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.price !== undefined) updates.price = String(parsed.data.price);
  if (parsed.data.compareAtPrice !== undefined)
    updates.compareAtPrice =
      parsed.data.compareAtPrice != null ? String(parsed.data.compareAtPrice) : null;

  const { price: _p, compareAtPrice: _c, ...rest } = parsed.data;
  Object.assign(updates, rest);

  try {
    const [variant] = await db
      .update(productVariants)
      .set(updates)
      .where(eq(productVariants.id, variantId))
      .returning();
    if (!variant) return err("Variant not found");

    revalidatePath("/admin/products");
    return ok(variant);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("unique")) return err("A variant with this SKU already exists");
    return err("Failed to update variant");
  }
}

export async function deleteVariant(variantId: string): Promise<ApiResponse<null>> {
  await requireAdmin();

  try {
    const [deleted] = await db
      .delete(productVariants)
      .where(eq(productVariants.id, variantId))
      .returning();
    if (!deleted) return err("Variant not found");

    revalidatePath("/admin/products");
    return ok(null);
  } catch (_e) {
    return err("Failed to delete variant");
  }
}

export async function removeProductImage(
  productId: string,
  imageUrl: string,
): Promise<ApiResponse<null>> {
  await requireAdmin();

  try {
    // Derive the storage path server-side from the public URL — never trust a caller-supplied path
    const storagePath = deriveStoragePath(imageUrl);
    if (storagePath) {
      await deleteProductImage(storagePath);
    }

    const [product] = await db
      .select({ images: products.images })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (product) {
      const remaining = (product.images as string[]).filter((u) => u !== imageUrl);
      await db
        .update(products)
        .set({ images: remaining })
        .where(eq(products.id, productId));
    }

    revalidatePath("/admin/products");
    return ok(null);
  } catch (_e) {
    return err("Failed to delete image");
  }
}
