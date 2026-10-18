# Implementation Plan — Kartiva Products & Categories API

## Context

- **Framework**: Next.js 16 App Router, TypeScript strict mode
- **ORM**: Drizzle ORM (`drizzle-orm@^0.45.4`) with `postgres-js` driver; DB exported from `@/db`
- **Zod**: v4 (`^4.6.7`) — `safeParse().error.flatten().fieldErrors` returns `Record<string, string[] | undefined>`; cast to `Record<string, string[]>` when building error responses
- **Auth**: `requireAdmin()` from `@/lib/auth` calls `redirect("/")` — use in Server Actions; for Route Handlers use `getUser()`/`getUserProfile()` and return `NextResponse.json(err(...), { status: 403 })`
- **Supabase client**: `await createClient()` from `@/lib/supabase/server` (async)
- **Build/verify command**: `npx tsc --noEmit` (no test framework present)
- **Commit command**: `git add -A && git commit -m "feat: products and categories server actions and API routes"`

---

## TypeScript Pitfalls (implementer must read)

1. **`inArray()` for batch fetch** — use `import { inArray } from "drizzle-orm"` when fetching variants for multiple product IDs. Never use `sql.raw` with `ARRAY`.
2. **Zod v4 fieldErrors** — always cast: `parsed.error.flatten().fieldErrors as Record<string, string[]>`.
3. **Naming conflict** — in `actions/products.ts`, the local function that removes a single image from the images array must be named `removeProductImage` (not `deleteProductImage`) because `deleteProductImage` is the exported name from `@/lib/storage`.
4. **Numeric columns** — `price` and `compareAtPrice` are Drizzle `numeric` which maps to `string` in TypeScript. Pass `String(value)` when inserting/updating. Accept `number` in Zod schemas and convert at the boundary.
5. **jsonb columns** — `images` and `tags` are `jsonb` typed as `string[]`. When doing partial updates (e.g., push/filter), read the existing array, mutate it in JS, then pass the whole new array back. Type assertions (`as string[]`) may be needed on the result of `.select()`.
6. **`lib/validations/` subdirectory** — must be created (`mkdir`) before writing files into it, since it does not currently exist.
7. **Route Handler auth** — Route Handlers cannot call `redirect()`. Check auth and return a `NextResponse.json` with status 401/403 instead.
8. **`"use server"` directive** — every file under `actions/` must begin with `"use server"`.
9. **Supabase Storage service-role key** — `lib/storage.ts` must use the service-role key (`process.env.SUPABASE_SERVICE_ROLE_KEY`) via `createClient()` from `@supabase/supabase-js` (not the SSR helper) so that storage operations bypass RLS. The bucket name is `product-images`.
10. **FormData vs plain objects** — Server Actions called from Route Handlers receive plain objects; keep action signatures accepting typed plain objects (not `FormData`) so they are usable from both UI and API routes.

---

## Plan

- [ ] 1. Create `lib/api-response.ts` — shared typed response wrapper.
      Define `ApiSuccess<T>`, `ApiError`, `ApiResponse<T>` types, and `ok<T>(data, meta?)` and `err(message, errors?, code?)` factory functions.
      `ApiSuccess` carries `{ success: true; data: T; meta?: { total?: number; page?: number; pageSize?: number } }`.
      `ApiError` carries `{ success: false; message: string; errors?: Record<string, string[]>; code?: string }`.
      No imports from Drizzle or Supabase — this file is pure TypeScript.
      Files: `lib/api-response.ts`
      Verify: `npx tsc --noEmit` — no errors on this file.

- [ ] 2. Create `lib/validations/products.ts` — Zod schemas for products and variants.
      Schemas to define:
      - `productFiltersSchema`: `{ category?: string; minPrice?: number; maxPrice?: number; minRating?: number; search?: string; featured?: boolean; active?: boolean; page?: number; pageSize?: number; sortBy?: "price" | "createdAt" | "name"; sortOrder?: "asc" | "desc" }` — all optional, use `.default()` for `page: 1`, `pageSize: 20`, `sortOrder: "desc"`.
      - `createProductSchema`: requires `name` (min 2), `slug` (min 2, alphanumeric + hyphens via regex), `price` (positive number), optional `categoryId` (UUID), `description`, `compareAtPrice` (positive number), `images` (string array, default `[]`), `tags` (string array, default `[]`), `isActive` (default `true`), `isFeatured` (default `false`).
      - `updateProductSchema`: all fields from `createProductSchema` wrapped in `.partial()`.
      - `createVariantSchema`: requires `sku` (min 1), `title` (min 1), `price` (positive number); optional `compareAtPrice`, `stock` (int ≥ 0, default `0`), `options` (record of string→string, default `{}`), `isActive` (default `true`).
      - `updateVariantSchema`: all fields from `createVariantSchema` wrapped in `.partial()`.
      Export all five as named exports.
      Files: `lib/validations/products.ts`
      Verify: `npx tsc --noEmit` — no errors.

- [ ] 3. Create `lib/validations/categories.ts` — Zod schemas for categories.
      Schemas to define:
      - `createCategorySchema`: requires `name` (min 2), `slug` (min 2, same regex as products), optional `description`, `imageUrl` (URL string), `parentId` (UUID).
      - `updateCategorySchema`: all fields from `createCategorySchema` wrapped in `.partial()`.
      Export both as named exports.
      Files: `lib/validations/categories.ts`
      Verify: `npx tsc --noEmit` — no errors.

- [ ] 4. Append re-exports to `lib/validations.ts` — do NOT overwrite; add two lines at the bottom.
      Append:
      ```ts
      export * from "./validations/products";
      export * from "./validations/categories";
      ```
      The existing `emailSchema`, `phoneSchema`, `uuidSchema` exports must remain intact.
      Files: `lib/validations.ts`
      Verify: `npx tsc --noEmit` — no errors; existing content still present.

- [ ] 5. Create `lib/storage.ts` — Supabase Storage helper for the `product-images` bucket.
      Import `createClient` from `@supabase/supabase-js` (NOT the SSR helper) and instantiate with `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` so uploads bypass RLS.
      Export three functions:
      - `uploadProductImage(file: File, path: string): Promise<{ url: string }>` — uploads to `product-images` bucket; constructs and returns the public URL.
      - `deleteProductImage(path: string): Promise<void>` — removes the file at the given path from `product-images`.
      - `getPublicUrl(path: string): string` — returns the public URL without making a network call, using `storage.from("product-images").getPublicUrl(path).data.publicUrl`.
      Files: `lib/storage.ts`
      Verify: `npx tsc --noEmit` — no errors.

- [ ] 6. Create `services/product.service.ts` — Drizzle query layer (no "use server").
      Import `db` from `@/db`, schema tables from `@/db/schema`, Drizzle operators (`eq`, `ilike`, `and`, `gte`, `lte`, `desc`, `asc`, `inArray`, `count`) from `drizzle-orm`.
      Export two functions:
      - `queryProducts(filters: ProductFilters): Promise<{ products: Product[]; total: number }>` where `ProductFilters` is `z.infer<typeof productFiltersSchema>`.
        - Build `where` conditions array: `isActive = true` always; add `eq(products.categoryId, ...)` if `category` provided; `ilike(products.name, '%search%')` if `search`; `gte(products.price, String(minPrice))` / `lte(products.price, String(maxPrice))` if provided; `eq(products.isFeatured, true)` if `featured`.
        - Use `db.select().from(products).leftJoin(categories, eq(products.categoryId, categories.id)).where(and(...conditions)).orderBy(...).limit(pageSize).offset((page-1)*pageSize)`.
        - Run a parallel `db.select({ count: count() }).from(products).where(and(...conditions))` for total.
        - Return `{ products, total }`.
      - `getProductBySlug(slug: string): Promise<(Product & { variants: ProductVariant[]; category: Category | null }) | null>`
        - Fetch product by slug with `eq(products.slug, slug)`.
        - If found, fetch variants with `inArray(productVariants.productId, [product.id])`.
        - Return composed object or `null`.
      Files: `services/product.service.ts`
      Verify: `npx tsc --noEmit` — no errors.

- [ ] 7. Create `actions/categories.ts` — Server Actions for categories.
      Add `"use server"` at top. Import `db`, schema, `eq` from `drizzle-orm`, `requireAdmin`, `createCategorySchema`, `updateCategorySchema`, `ok`, `err`, `ApiResponse` from their respective modules. Import `deleteProductImage`, `uploadProductImage` from `@/lib/storage`.
      Export these async functions (all return `Promise<ApiResponse<T>>`):
      - `getCategories(): Promise<ApiResponse<Category[]>>` — `db.select().from(categories).orderBy(asc(categories.name))`.
      - `getCategoryBySlug(slug: string): Promise<ApiResponse<Category>>` — fetch by slug, return 404 err if not found.
      - `createCategory(input: unknown): Promise<ApiResponse<Category>>` — call `requireAdmin()`, validate with `createCategorySchema`, insert, return created row.
      - `updateCategory(id: string, input: unknown): Promise<ApiResponse<Category>>` — call `requireAdmin()`, validate with `updateCategorySchema`, update where `eq(categories.id, id)`, return updated row.
      - `deleteCategory(id: string): Promise<ApiResponse<{ id: string }>>` — call `requireAdmin()`, delete where `eq(categories.id, id)`, return `{ id }`.
      Files: `actions/categories.ts`
      Verify: `npx tsc --noEmit` — no errors.

- [ ] 8. Create `actions/products.ts` — Server Actions for products and variants.
      Add `"use server"` at top. Import `db`, schema tables, Drizzle operators, `requireAdmin`, all product Zod schemas, `ok`, `err`, `ApiResponse`, `queryProducts`, `getProductBySlug` (from `services/product.service`), and **`deleteProductImage`** (from `@/lib/storage`).
      Export these async functions:
      - `getProducts(filters: unknown): Promise<ApiResponse<{ products: Product[]; total: number; page: number; pageSize: number }>>` — validate with `productFiltersSchema`, call `queryProducts`, wrap result.
      - `getProductDetail(slug: string): Promise<ApiResponse<Product & { variants: ProductVariant[]; category: Category | null }>>` — call `getProductBySlug`, return 404 if null.
      - `createProduct(input: unknown): Promise<ApiResponse<Product>>` — `requireAdmin()`, validate with `createProductSchema`, convert `price`/`compareAtPrice` with `String()`, insert into `products`, return created row.
      - `updateProduct(id: string, input: unknown): Promise<ApiResponse<Product>>` — `requireAdmin()`, validate with `updateProductSchema`, update, return updated row.
      - `deleteProduct(id: string): Promise<ApiResponse<{ id: string }>>` — `requireAdmin()`, fetch product, call `deleteProductImage` on each image path, delete from DB, return `{ id }`.
      - `createVariant(productId: string, input: unknown): Promise<ApiResponse<ProductVariant>>` — `requireAdmin()`, validate with `createVariantSchema`, insert into `productVariants` with `productId`, return created row.
      - `updateVariant(id: string, input: unknown): Promise<ApiResponse<ProductVariant>>` — `requireAdmin()`, validate with `updateVariantSchema`, update, return updated row.
      - `deleteVariant(id: string): Promise<ApiResponse<{ id: string }>>` — `requireAdmin()`, delete from `productVariants`, return `{ id }`.
      - `removeProductImage(productId: string, imageUrl: string): Promise<ApiResponse<Product>>` — **NOTE: named `removeProductImage` to avoid collision with the `deleteProductImage` import from storage**. `requireAdmin()`, fetch product, filter out `imageUrl` from `images` array, extract path from URL, call `deleteProductImage(path)`, update `products.images`, return updated row.
      Files: `actions/products.ts`
      Verify: `npx tsc --noEmit` — no errors.

- [ ] 9. Create API Route Handlers — thin wrappers over the server actions.
      All route files live under `app/api/`. Route Handlers **cannot** call `redirect()`; they must check auth with `getUserProfile()` and return `NextResponse.json(err("Forbidden"), { status: 403 })` for admin-only endpoints. Pass `request.json()` as the `input` argument to actions. Catch all errors and return `NextResponse.json(err("Internal server error"), { status: 500 })`.

      **`app/api/products/route.ts`**
      - `GET`: parse `request.nextUrl.searchParams` into a plain object, call `getProducts(filters)`, return `NextResponse.json(result)`.
      - `POST`: check admin via `getUserProfile()`, parse body, call `createProduct(body)`, return appropriate status code (201 on success).

      **`app/api/products/[id]/route.ts`**
      - `PUT`: check admin, parse body, call `updateProduct(params.id, body)`, return result.
      - `DELETE`: check admin, call `deleteProduct(params.id)`, return result.

      **`app/api/products/slug/[slug]/route.ts`**
      - `GET`: call `getProductDetail(params.slug)`, return result (404 if `result.success === false`).

      **`app/api/categories/route.ts`**
      - `GET`: call `getCategories()`, return result.
      - `POST`: check admin, parse body, call `createCategory(body)`, return 201 on success.

      **`app/api/categories/[id]/route.ts`**
      - `PUT`: check admin, parse body, call `updateCategory(params.id, body)`, return result.
      - `DELETE`: check admin, call `deleteCategory(params.id)`, return result.

      **`app/api/categories/[id]/image/route.ts`**
      - `POST`: check admin, parse `multipart/form-data` with `request.formData()`, extract `file` field as `File`, call `uploadProductImage(file, \`categories/${params.id}/${file.name}\`)`, then `updateCategory(params.id, { imageUrl: url })`, return updated category.

      Files:
      - `app/api/products/route.ts`
      - `app/api/products/[id]/route.ts`
      - `app/api/products/slug/[slug]/route.ts`
      - `app/api/categories/route.ts`
      - `app/api/categories/[id]/route.ts`
      - `app/api/categories/[id]/image/route.ts`

      Verify: `npx tsc --noEmit` — no errors across all route files.

- [ ] 10. Final TypeScript check and commit.
      Run `npx tsc --noEmit` from `c:\E-Commerce`. Fix any remaining type errors (common ones: missing `await` on `createClient()`, forgotten `as Record<string, string[]>` cast on Zod fieldErrors, numeric string conversions). Once clean, run:
      ```
      git add lib/api-response.ts lib/validations/products.ts lib/validations/categories.ts lib/validations.ts lib/storage.ts services/product.service.ts actions/categories.ts actions/products.ts app/api/products/route.ts "app/api/products/[id]/route.ts" "app/api/products/slug/[slug]/route.ts" app/api/categories/route.ts "app/api/categories/[id]/route.ts" "app/api/categories/[id]/image/route.ts"
      git commit -m "feat: products & categories server actions and API routes"
      ```
      Files: all files created/modified in steps 1–9.
      Verify: `npx tsc --noEmit` exits with code 0; `git log --oneline -1` shows the commit.

---

## Dependency Order Summary

```
step 1 (api-response)
  └─ step 2 (validations/products)
  └─ step 3 (validations/categories)
       └─ step 4 (validations.ts re-exports)  [depends on 2 & 3]
step 5 (storage)  [independent of 1–4]
       └─ step 6 (product.service)            [depends on 4 for types]
       └─ step 7 (actions/categories)         [depends on 1,3,4,5]
       └─ step 8 (actions/products)           [depends on 1,2,4,5,6]
            └─ step 9 (route handlers)        [depends on 1,7,8]
                 └─ step 10 (tsc + commit)    [depends on all]
```
