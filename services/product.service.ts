import { and, asc, desc, eq, gte, ilike, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, productVariants, products } from "@/db/schema";
import type { ProductFilters } from "@/lib/validations/products";
import type { Category, Product, ProductVariant } from "@/types/db";

export type ProductWithVariants = Product & {
  variants: ProductVariant[];
  category: Category | null;
};

export type PaginatedProducts = {
  items: ProductWithVariants[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export async function queryProducts(filters: ProductFilters): Promise<PaginatedProducts> {
  const {
    search,
    categorySlug,
    minPrice,
    maxPrice,
    isFeatured,
    isActive,
    sortBy,
    page,
    limit,
  } = filters;

  const offset = (page - 1) * limit;

  const conditions = [];

  if (isActive !== undefined) conditions.push(eq(products.isActive, isActive));
  if (isFeatured !== undefined) conditions.push(eq(products.isFeatured, isFeatured));
  if (search) conditions.push(ilike(products.name, `%${search}%`));
  if (minPrice !== undefined) conditions.push(gte(products.price, String(minPrice)));
  if (maxPrice !== undefined) conditions.push(lte(products.price, String(maxPrice)));

  if (categorySlug) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, categorySlug))
      .limit(1);
    if (!cat) {
      // Unknown slug — return empty result immediately rather than silently dropping the filter
      return { items: [], total: 0, page, limit, totalPages: 0 };
    }
    conditions.push(eq(products.categoryId, cat.id));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const orderByMap = {
    price_asc: asc(products.price),
    price_desc: desc(products.price),
    newest: desc(products.createdAt),
    oldest: asc(products.createdAt),
    name_asc: asc(products.name),
  };
  const orderBy = orderByMap[sortBy ?? "newest"];

  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(products)
    .where(where);

  const rows = await db
    .select({
      product: products,
      category: categories,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(where)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  const productIds = rows.map((r) => r.product.id);
  const variantRows: ProductVariant[] =
    productIds.length > 0
      ? await db
          .select()
          .from(productVariants)
          .where(inArray(productVariants.productId, productIds))
      : [];

  const variantsByProduct = variantRows.reduce<Record<string, ProductVariant[]>>((acc, v) => {
    if (!acc[v.productId]) acc[v.productId] = [];
    acc[v.productId].push(v);
    return acc;
  }, {});

  const items: ProductWithVariants[] = rows.map(({ product, category }) => ({
    ...product,
    category: category ?? null,
    variants: variantsByProduct[product.id] ?? [],
  }));

  return {
    items,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  };
}

export async function getProductBySlug(slug: string): Promise<ProductWithVariants | null> {
  const [row] = await db
    .select({ product: products, category: categories })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.isActive, true)))
    .limit(1);

  if (!row) return null;

  const variants = await db
    .select()
    .from(productVariants)
    .where(and(eq(productVariants.productId, row.product.id), eq(productVariants.isActive, true)));

  return { ...row.product, category: row.category ?? null, variants };
}
