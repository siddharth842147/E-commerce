import { z } from "zod";

export const productFiltersSchema = z.object({
  search: z.string().optional(),
  categorySlug: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  isFeatured: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional().default(true),
  sortBy: z.enum(["price_asc", "price_desc", "newest", "oldest", "name_asc"]).optional().default("newest"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type ProductFilters = z.infer<typeof productFiltersSchema>;

export const createProductSchema = z.object({
  name: z.string().min(2).max(255),
  slug: z.string().min(2).max(255).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional().nullable(),
  price: z.coerce.number().min(0),
  compareAtPrice: z.coerce.number().min(0).optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  isActive: z.coerce.boolean().optional().default(true),
  isFeatured: z.coerce.boolean().optional().default(false),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const createVariantSchema = z.object({
  sku: z.string().min(1).max(100),
  title: z.string().min(1).max(255),
  options: z.record(z.string(), z.string()).optional().default({}),
  price: z.coerce.number().min(0),
  compareAtPrice: z.coerce.number().min(0).optional().nullable(),
  stock: z.coerce.number().int().min(0).optional().default(0),
  isActive: z.coerce.boolean().optional().default(true),
});

export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export const updateVariantSchema = createVariantSchema.partial();
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
