# Products and categories API layer

Server actions and route handlers wiring Zod-validated mutations to Drizzle ORM, with Supabase Storage for image uploads. Public reads (product list, filters, slug lookup, category list) are unauthenticated; all writes go through `requireAdmin()` in the server actions. The route handlers are thin shells that forward `FormData` to the actions and map the `ApiResponse` discriminated union to HTTP status codes. Watch for: **image path tracking gap in `removeProductImage`** (caller must supply the correct storage path; the API never validates this) and **old images orphaned in storage on product update** (confirmed).

**Verdict**: NEEDS_CHANGES

---

## High-level view

All admin mutations are gated by `requireAdmin()` called at the top of each server action, not in the route handlers — so the enforcement is consistent but invisible at the HTTP layer. The route handlers for `DELETE /api/products/:id` and `DELETE /api/categories/:id` carry no `try/catch`, meaning an unhandled throw from `deleteProduct`/`deleteCategory` will propagate as an uncaught exception rather than a structured `ApiError` JSON response.

The `queryProducts` service is cleanly structured: `inArray` is used for the batch variant fetch (not `sql.raw`), the count and page queries share the same `where` clause, and the category sub-query resolves the slug before the main query. One gap: when `categorySlug` is given but no matching category is found, the slug filter is silently dropped and the query returns all products instead of returning an empty page or a 404.

Image management has two gaps that compose badly. On product update, newly uploaded images are appended to `existingImages` passed by the caller — but old images that fall off the `existingImages` list are never removed from Supabase Storage, leaking blobs. In `removeProductImage`, the caller is responsible for passing the correct `imagePath` (the storage path, not the public URL); there is no server-side lookup to derive the path from the URL, so a wrong path silently succeeds on the DB side while leaving the blob in place.

The `fieldErrors` casts (`as Record<string, string[]>`) are consistent and correct. `lib/validations.ts` appends re-exports without overwriting the original common schemas. The naming conflict is resolved: `deleteProductImage` is the imported storage function; the exported server action is `removeProductImage`. No `e: any` catch patterns are present.

---

<details>
<summary>Issues (4)</summary>

1. **Orphaned storage blobs on update** — `updateProduct` uploads new images and appends them to the `existingImages` list, but images dropped from `existingImages` by the caller are never deleted from Supabase Storage. Call `deleteProductImage` for each URL present in the current DB record but absent from `keepImages` before writing the update.

2. **Silent category filter drop** — In `queryProducts`, when `categorySlug` is provided but no matching category exists, the filter is silently skipped and all products are returned. Either return an empty paginated result when the slug is unknown, or surface an error to the caller.

3. **Unguarded DELETE routes** — `DELETE /api/products/:id` and `DELETE /api/categories/:id` have no `try/catch`. The server actions themselves are safe, but any unexpected throw (e.g. DB connection loss) will produce a 500 with no JSON body instead of a structured `ApiError`. Wrap these handlers the same way the `PUT` handlers are.

4. **`removeProductImage` path trust** — The function accepts `imagePath` from the caller with no server-side derivation or validation. A mismatched path causes the blob to persist while the URL is removed from the DB array. Derive the path from the stored URL server-side (the path is the suffix after the bucket's public URL prefix) rather than accepting it as a caller-supplied parameter.

</details>

---

<details>
<summary>Details</summary>

### Auth enforcement at the action layer, not the route layer

The route handlers contain no auth logic. The route handlers (`PUT /api/products/:id`, `DELETE /api/products/:id`) are reachable as plain HTTP endpoints, and when `requireAdmin` throws, the call will either propagate as a 500 (for uncaught DELETE routes) or be caught by the `PUT` handler's `try/catch` and returned as a generic 400 — not a 401/403. The wrong status code leaks no data but makes client-side auth handling fragile.

### Silent category filter elision in `queryProducts`

In `services/product.service.ts`, when `categorySlug` is supplied, a sub-query resolves it to an ID. If the sub-query returns no row, the `conditions.push(...)` line is never reached, the filter is absent from `where`, and all products are returned regardless of page size. A caller who passes `?categorySlug=nonexistent` gets a full product listing — a behavioral mismatch the validation layer doesn't catch because `categorySlug` is an unconstrained optional string.

### Orphaned images on product update

`updateProduct` accepts `existingImages[]` from the caller to express "keep these URLs". Any URL previously stored in `products.images` that is not in `keepImages` is simply dropped from the DB column. The corresponding Supabase Storage blob is never deleted. Over time this accumulates unreachable blobs with no cleanup path. The fix requires reading the current `images` array before the update and calling `deleteProductImage` for each URL that disappears.

### `removeProductImage` path contract

`removeProductImage(productId, imageUrl, imagePath)` calls `deleteProductImage(imagePath)` where `imagePath` is entirely caller-supplied. If the caller passes a wrong path, `deleteProductImage` succeeds (or silently fails depending on Supabase Storage behavior for missing paths), and the URL is still removed from the DB. The blob persists. The storage path is derivable from the public URL — it is the path component after the bucket prefix — so the function should compute it server-side rather than trusting the caller.

### Unguarded DELETE route handlers

Both `DELETE /api/products/:id` and `DELETE /api/categories/:id` are missing `try/catch`. The `PUT` handlers in the same files are wrapped. Any unexpected error thrown by `deleteProduct` or `deleteCategory` (DB connectivity failure, unexpected ORM error) will propagate as an unhandled exception rather than returning structured JSON.

```typescript
// Current — no catch
export async function DELETE(_request, { params }) {
  const { id } = await params;
  const result = await deleteProduct(id);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
```

Should mirror the `PUT` handler's `try/catch` wrapper.


</details>

---

<details>
<summary>File map</summary>

| File | What changed |
|------|-------------|
| `lib/api-response.ts` | New `ApiResponse<T>` discriminated union with `ok`/`err` helpers |
| `lib/validations/products.ts` | Zod schemas for product filters, create/update product, create/update variant |
| `lib/validations/categories.ts` | Zod schemas for create/update category |
| `lib/validations.ts` | Re-exports of both validation modules appended to existing common schemas |
| `lib/storage.ts` | Supabase Storage helpers: upload, delete, public URL for product images |
| `services/product.service.ts` | `queryProducts` (filtered, sorted, paginated) and `getProductBySlug` |
| `actions/products.ts` | Server actions: `getProducts`, `getProductDetail`, `createProduct`, `updateProduct`, `deleteProduct`, `createVariant`, `updateVariant`, `deleteVariant`, `removeProductImage` |
| `actions/categories.ts` | Server actions: `getCategories`, `getCategoryBySlug`, `createCategory`, `updateCategory`, `deleteCategory` |
| `app/api/products/route.ts` | `GET` (list with filters) and `POST` (create) route handlers |
| `app/api/products/[id]/route.ts` | `PUT` (update) and `DELETE` route handlers |
| `app/api/products/slug/[slug]/route.ts` | `GET` by slug route handler |
| `app/api/categories/route.ts` | `GET` (list) and `POST` (create) route handlers |
| `app/api/categories/[id]/route.ts` | `PUT` (update) and `DELETE` route handlers |
| `app/api/categories/[id]/image/route.ts` | `POST` image upload for a category |

Full diff: `git diff main -- 'lib/api-response.ts' 'lib/validations*' 'lib/storage.ts' 'services/product.service.ts' 'actions/products.ts' 'actions/categories.ts' 'app/api/products/**' 'app/api/categories/**'`

</details>
