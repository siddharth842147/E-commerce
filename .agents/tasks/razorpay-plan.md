# Implementation Plan — Razorpay Payment Integration

Next.js 16.4.2 (app router, Turbopack), Drizzle ORM (postgres-js), Supabase Postgres, Zod 4, iron-session. Razorpay SDK `razorpay@2.9.8` already installed (`import Razorpay from "razorpay"`).

## Grounding notes (read before implementing)

- **Next.js 16 route handlers** (verified in `node_modules/next/dist/docs/.../15-route-handlers.md` and `.../file-conventions/route.md`): export `async function POST(request: Request)` (or `NextRequest`). Read JSON body with `await request.json()`; read **raw body** for webhook HMAC with `await request.text()`, then `JSON.parse` separately. No `bodyParser` config needed. POST handlers are never cached. "Middleware" is renamed to "proxy" — irrelevant here; do not create a `proxy.ts`.
- **Existing API route convention** (`app/api/products/route.ts`, `app/api/categories/[id]/route.ts`): handlers import `{ type NextRequest, NextResponse }` and `err` from `@/lib/api-response`, delegate to a server action or inline logic, and return `NextResponse.json(result, { status: result.success ? 2xx : 4xx/5xx })`. We follow this and use the `ok()`/`err()` `ApiResponse` wrapper for all route responses.
- **Server actions**: `actions/*.ts` start with `"use server"` at file top. They can be imported and called directly from route handlers (see `app/api/products/route.ts` calling `getProducts`).
- **Do NOT modify any `db/schema/*` file** (no migrations). **Do NOT modify `createRazorpayOrder`** in `services/checkout.service.ts` — reuse it as-is. You MAY add new helper functions to files in the deliverable list, but stay within the 7 deliverable files.

## Reused function signatures (exact, from files already read)

- `services/checkout.service.ts`:
  - `createRazorpayOrder(orderId: string, amount: number): Promise<RazorpayOrderResult>` — initializes Razorpay with `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET`, creates order with `amount` converted to paise. `RazorpayOrderResult = { id: string; entity: string; amount: number; currency: string; receipt: string; status: string }` (the returned `.amount` is in **paise**).
  - `validateCartStock(cartItems: CartItem[]): Promise<{ valid: boolean; unavailableItems?: string[] }>`
  - `calculateOrderTotals(cartItems: CartItem[], coupon?: Coupon): Promise<OrderCalculation>` — `OrderCalculation` fields are all **strings**: `subtotal, discountAmount, taxAmount, shippingAmount, total` (total is rupees).
  - `calculateDiscount`, `calculateTax`, `calculateShipping` are internal; `calculateOrderTotals` composes them.
- `services/coupon.service.ts`: `validateCoupon(code: string, cartSubtotal: number, userId?: string | null): Promise<{ valid: boolean; coupon?: Coupon; error?: string }>`. `Coupon = { id, code, discountType: "percentage"|"fixed", discountValue, minOrderAmount, usedCount, maxUses, isActive, expiresAt, ... }`.
- `actions/cart.ts`: `getCart(): Promise<ApiResponse<CartItem[]>>` (server action; reads cookie/DB cart, hydrates).
- `actions/checkout.ts`: `createGuestProfile(email: string, phone?: string | null): Promise<typeof profiles.$inferSelect>` (returns profile with `.id`); `enrichCartWithTaxRates(cartItems): Promise<ValidatedCart>`.
- `services/cart.service.ts`: `clearUserCart(userId: string): Promise<void>`, `clearGuestCart(): Promise<void>`, `hydrateGuestCart(items: GuestCartItem[]): Promise<CartItem[]>` (use only if you accept client-supplied items).
- `lib/auth.ts`: `getUser()` → Supabase `User | null`; `requireAdmin()` → profile (redirects if not admin); `requireAuth()` → user.
- `lib/api-response.ts`: `ok<T>(data: T): ApiSuccess<T>`; `err(error: string, fieldErrors?: Record<string,string[]>): ApiError`; `ApiResponse<T> = ApiSuccess<T> | ApiError`.
- `db` exported from `@/db`. Schema exports from `@/db/schema`: `orders`, `orderItems`, `payments`, `productVariants`, `coupons`, `userCouponUsage`, `profiles`.
- Drizzle helpers: `eq`, `and`, `inArray`, `sql` from `drizzle-orm`. Transactions: `await db.transaction(async (tx) => { /* use tx like db */ })` (verified on `drizzle-orm/postgres-js` session type).

## Gaps found during exploration (decisions made)

1. **`RAZORPAY_WEBHOOK_SECRET` is NOT in `.env.local`** (only `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` are present). The webhook route reads it via `process.env.RAZORPAY_WEBHOOK_SECRET`. Build/typecheck is unaffected (env is read at runtime), but the webhook will reject all signatures until the user adds the test webhook secret from the Razorpay dashboard. **Action for implementer:** leave a clear code comment stating this env var is required for webhooks; do not hardcode a value. Do not fail the build over it.
2. **Client-facing key**: the create-order route must return `process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID` (the `NEXT_PUBLIC_`-prefixed key that exists in `.env.local`), NOT `RAZORPAY_KEY_ID`. Razorpay key IDs are safe to expose client-side; only `RAZORPAY_KEY_SECRET` stays server-side.
3. **Stock decrement on payment success is mandated by the original requirement ("reduce stock only after payment success … inside a database transaction") but is omitted from the per-route spec text for verify and webhook.** Decision: decrement stock inside the verify route transaction AND inside the webhook `payment.captured` handler, both guarded by an idempotency check (only when transitioning payment `pending`→`captured`). Whichever fires first does the decrement; the other sees `status === "captured"` and skips. This satisfies the requirement without double-decrement.
4. **`refund.processed` webhook does NOT restore stock** per the spec (the admin `processRefund` action restores stock when it initiates the refund). Decision: follow the spec; `refund.processed` only flips statuses idempotently. Known limitation: a refund initiated directly in the Razorpay dashboard (not via the admin action) will not restore stock — acceptable per spec; document in a code comment.
5. **COD payment `status: "captured"`**: spec says set the payments record `status: "captured"` for COD. Rationale (document in code): COD has no gateway; the order is confirmed on placement, so the "payment" is treated as captured at that moment and stock is decremented immediately.
6. **Coupon usage tracking**: `userCouponUsage` requires `userId` (NOT NULL). Guests have no stable user id, so coupon usage is tracked only for authenticated users. For guests, skip the `userCouponUsage` insert (still increment `coupons.usedCount` is skipped too for guests to keep them consistent — guests cannot enforce per-user limits anyway). Decision: track coupon usage (insert junction + increment `usedCount`) **only when an authenticated user** placed the order.
7. **No FEAT restructuring**: this is one tightly-coupled feature (create-order writes the payment record that verify/webhook read; the client calls the routes; COD and refund share order/order-item/stock logic). It does not decompose into independently-verifiable features, so the existing implement→review loop runs this plan as a unit.

## Security invariants (apply to EVERY route/action below)

- **Never trust client success.** The Razorpay modal `handler` only POSTs `{razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId}` to `/api/payments/verify`. All order/payment state changes happen only after server-side signature verification.
- **HMAC-SHA256 + constant-time compare.** Use `import crypto from "node:crypto"`: `const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex")`; compare with `crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received))` after confirming equal lengths (mismatched lengths → invalid, do not call `timingSafeEqual`).
- **Idempotency.** Before mutating, `SELECT` current payment/order status; if already in the target state, return success and skip the mutation. Document the approach in a comment in each handler.
- **Drizzle transactions** for every multi-table write: `await db.transaction(async (tx) => { ... })`.
- **Stock decrement uses `WHERE stock >= quantity`** and checks affected rows; 0 rows → `throw` to roll back. Stock restore (increment) needs no guard.
- **Secrets stay server-side.** Only `NEXT_PUBLIC_RAZORPAY_KEY_ID` is sent to the client. `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are server-only.
- **Admin gating.** `processRefund` calls `requireAdmin()` first.

---

# Implementation Plan

- [ ] 1. Add payment + verification Zod schemas to `lib/validations/checkout.ts` (foundation; everything depends on it).
      Add to the existing `checkoutSchema` a new optional `paymentMethod: z.enum(["razorpay", "cod"]).optional()` (keep it OPTIONAL so the existing tests in `lib/validations/checkout.test.ts` — which never send `paymentMethod` — still pass). Add two new exported schemas:
      - `createOrderSchema = checkoutSchema.extend({ items: z.array(z.object({ variantId: z.string().min(1), quantity: z.number().int().positive() })).optional() })` — used by the create-order route (`items` is the optional client-supplied cart fallback).
      - `verifyPaymentSchema = z.object({ razorpay_order_id: z.string().min(1), razorpay_payment_id: z.string().min(1), razorpay_signature: z.string().min(1), orderId: z.string().uuid() })`.
      Export inferred types `CheckoutDataInput` (already), plus `CreateOrderInput = z.infer<typeof createOrderSchema>` and `VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>`.
      Files: `lib/validations/checkout.ts`
      Verify: `npm run test -- lib/validations/checkout.test.ts` — all existing checkout schema tests still pass (the new optional field does not break them). Then `npm run build` continues to typecheck after later items.

- [ ] 2. Add the `placeCodOrder` server action to `actions/checkout.ts` (append; do not remove existing exports).
      Signature: `export async function placeCodOrder(input: CreateOrderInput): Promise<ApiResponse<{ orderId: string }>>`. Flow (all in ONE `db.transaction(async (tx) => {...})` except cart fetch + clear):
      1. Parse `input` with `createOrderSchema.safeParse`; on failure return `err("Invalid input", fieldErrors)`.
      2. Get cart: if `input.items` is a non-empty array, `const cart = await hydrateGuestCart(input.items)`; else `const res = await getCart(); if (!res.success) return err(res.error); const cart = res.data;`. If `cart.length === 0` return `err("Cart is empty")`.
      3. `const stockRes = await validateCartStock(cart); if (!stockRes.valid) return err("Out of stock: " + (stockRes.unavailableItems?.join(", ") ?? ""))`.
      4. `const user = await getUser();` if `!user` require `input.email` (return `err("Email required for guest checkout")` if missing). Resolve `userId`: `user ? user.id : (await createGuestProfile(input.email, input.phone)).id`.
      5. Validate coupon if `input.couponCode`: `const sub = cart.reduce((s,i)=>s+i.unitPrice*i.quantity,0); const c = await validateCoupon(input.couponCode, sub, user?.id ?? null); if (!c.valid) return err(c.error); const coupon = c.coupon;` else `coupon = undefined`.
      6. `const totals = await calculateOrderTotals(cart, coupon);` (totals fields are strings; `Number(totals.total)` is rupees).
      7. Inside `db.transaction(async (tx) => {`:
         - `const [order] = await tx.insert(orders).values({ id: crypto.randomUUID(), userId, couponId: coupon?.id ?? null, status: "confirmed", subtotal: totals.subtotal, discountAmount: totals.discountAmount, shippingAmount: totals.shippingAmount, taxAmount: totals.taxAmount, total: totals.total, shippingAddress: input.shippingAddress, notes: null }).returning();`
         - Insert order items: `await tx.insert(orderItems).values(cart.map(i => ({ orderId: order.id, variantId: i.variantId, productName: i.productName, variantTitle: i.variantTitle, sku: i.sku, unitPrice: String(i.unitPrice.toFixed(2)), quantity: i.quantity, total: String((i.unitPrice*i.quantity).toFixed(2)) })))`.
         - Decrement stock atomically: for each cart item, `const upd = await tx.update(productVariants).set({ stock: sql\`${productVariants.stock} - ${i.quantity}\`, updatedAt: new Date() }).where(and(eq(productVariants.id, i.variantId), sql\`${productVariants.stock} >= ${i.quantity}\`)).returning({ id: productVariants.id }); if (upd.length === 0) throw new Error("Insufficient stock for " + i.sku);` (throwing rolls back the whole tx).
         - Insert payment: `await tx.insert(payments).values({ orderId: order.id, razorpayOrderId: \`COD-${order.id}\`, amount: totals.total, currency: "INR", status: "captured", method: "cod", metadata: null })`.
         - Track coupon (authed users only): `if (coupon && user) { await tx.insert(userCouponUsage).values({ userId: user.id, couponId: coupon.id, orderId: order.id }); await tx.update(coupons).set({ usedCount: sql\`${coupons.usedCount} + 1\` }).where(eq(coupons.id, coupon.id)); }`.
      8. Clear cart: `if (user) await clearUserCart(user.id); else await clearGuestCart();`
      9. `revalidatePath("/"); return ok({ orderId: order.id });`. Wrap the whole body in try/catch returning `err("Failed to place order. Please try again.")`.
      Imports to add at top of `actions/checkout.ts`: `orders, orderItems, payments, productVariants, coupons, userCouponUsage` from `@/db/schema`; `and, sql` from `drizzle-orm`; `getCart` from `@/actions/cart`; `validateCartStock, calculateOrderTotals` from `@/services/checkout.service`; `validateCoupon` from `@/services/coupon.service`; `getUser` from `@/lib/auth`; `ok, err, ApiResponse` from `@/lib/api-response`; `clearUserCart, clearGuestCart, hydrateGuestCart` from `@/services/cart.service`; `createOrderSchema` from `@/lib/validations/checkout`; `revalidatePath` from `next/cache`.
      Files: `actions/checkout.ts`
      Verify: `npm run build` compiles; `npm run test` still green (no new tests added).

- [ ] 3. Create `app/api/payments/create-order/route.ts` — Razorpay order creation.
      Export `async function POST(request: NextRequest)`. Flow:
      1. `const body = await request.json();` then `const parsed = createOrderSchema.safeParse(body);` on failure return `NextResponse.json(err("Invalid input", parsed.error.flatten().fieldErrors as Record<string,string[]>), { status: 400 })`.
      2. Get cart: if `parsed.data.items?.length`, `const cart = await hydrateGuestCart(parsed.data.items);` else `const res = await getCart(); if (!res.success) return NextResponse.json(err(res.error), { status: 400 }); const cart = res.data;`. If `cart.length === 0` return `err("Cart is empty")` (status 400).
      3. `const stockRes = await validateCartStock(cart);` if invalid return 400 `err` with unavailable SKUs.
      4. `const user = await getUser();` resolve `userId`: if `user` use `user.id`; else require `parsed.data.email` (400 if missing) and `await createGuestProfile(parsed.data.email, parsed.data.phone)` → `.id`.
      5. Coupon: if `parsed.data.couponCode`, `const sub = cart.reduce((s,i)=>s+i.unitPrice*i.quantity,0); const c = await validateCoupon(parsed.data.couponCode, sub, user?.id ?? null); if (!c.valid) return NextResponse.json(err(c.error), { status: 400 }); const coupon = c.coupon;` else `undefined`.
      6. `const totals = await calculateOrderTotals(cart, coupon);` `const amountRupees = Number(totals.total);`
      7. **Create the Razorpay order FIRST (network call outside any DB transaction):** `const orderId = crypto.randomUUID(); const rzp = await createRazorpayOrder(orderId, amountRupees);` (`rzp.id` = razorpay order id, `rzp.amount` = paise). Wrap in try/catch → on failure return 500 `err("Failed to create payment order")`.
      8. Persist in ONE transaction `await db.transaction(async (tx) => {`:
         - Insert order with `id: orderId, userId, couponId: coupon?.id ?? null, status: "pending"`, the `totals` strings, `shippingAddress: parsed.data.shippingAddress`, `notes: null`.
         - Insert orderItems (same mapping as item 2).
         - Insert payment: `orderId, razorpayOrderId: rzp.id, amount: totals.total, currency: "INR", status: "pending", method: "razorpay", metadata: null`.
      9. Return `NextResponse.json(ok({ orderId, razorpayOrderId: rzp.id, amount: rzp.amount, currency: rzp.currency, keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID }), { status: 200 })`.
      Imports: `{ type NextRequest, NextResponse }` from `next/server`; `err, ok` from `@/lib/api-response`; `db` from `@/db`; `orders, orderItems, payments, productVariants` (and `coupons`/`userCouponUsage` only if used here — not needed) from `@/db/schema`; `createOrderSchema` from `@/lib/validations/checkout`; `createRazorpayOrder, validateCartStock, calculateOrderTotals` from `@/services/checkout.service`; `validateCoupon` from `@/services/coupon.service`; `getCart` from `@/actions/cart`; `createGuestProfile` from `@/actions/checkout`; `getUser` from `@/lib/auth`; `hydrateGuestCart` from `@/services/cart.service`.
      Files: `app/api/payments/create-order/route.ts` (new)
      Verify: `npm run build` compiles (route is type-checked).

- [ ] 4. Create `app/api/payments/verify/route.ts` — server-side signature verification + capture.
      Export `async function POST(request: NextRequest)`. Flow:
      1. `const body = await request.json(); const parsed = verifyPaymentSchema.safeParse(body);` on failure return 400 `err("Invalid input")`.
      2. Compute `const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!).update(\`${parsed.data.razorpay_order_id}|${parsed.data.razorpay_payment_id}\`).digest("hex");` `const sigBuf = Buffer.from(parsed.data.razorpay_signature); const expBuf = Buffer.from(expected);` If `sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(expBuf, sigBuf)` return `NextResponse.json(err("Invalid payment signature"), { status: 400 })` — **no DB writes**.
      3. `import crypto from "node:crypto"` at top.
      4. Transaction `await db.transaction(async (tx) => {`:
         - `const [payment] = await tx.select().from(payments).where(eq(payments.razorpayOrderId, parsed.data.razorpay_order_id)).limit(1);` if `!payment` return 404 `err("Payment record not found")` (outside/after tx).
         - Cross-check: if `payment.orderId !== parsed.data.orderId` return 400 `err("Order mismatch")`.
         - **Idempotency:** if `payment.status === "captured"` return `ok({ orderId: payment.orderId, alreadyVerified: true })` (200) without further writes.
         - `await tx.update(payments).set({ status: "captured", razorpayPaymentId: parsed.data.razorpay_payment_id, razorpaySignature: parsed.data.razorpay_signature, updatedAt: new Date() }).where(eq(payments.razorpayOrderId, parsed.data.razorpay_order_id));`
         - `await tx.update(orders).set({ status: "confirmed", updatedAt: new Date() }).where(eq(orders.id, payment.orderId));`
         - Decrement stock (idempotent because we only reach here when payment was not captured): fetch `const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, payment.orderId));` for each item `const upd = await tx.update(productVariants).set({ stock: sql\`${productVariants.stock} - ${item.quantity}\`, updatedAt: new Date() }).where(and(eq(productVariants.id, item.variantId), sql\`${productVariants.stock} >= ${item.quantity}\`)).returning({ id: productVariants.id }); if (upd.length === 0) throw new Error("Insufficient stock for " + item.sku);`
       5. Return `NextResponse.json(ok({ orderId: payment.orderId, status: "confirmed" }), { status: 200 })`.
       Note the rare race: if stock was taken by another order between create-order and verify, the transaction rolls back (order stays `pending`, payment stays `pending`) while Razorpay already captured — admin must refund manually. Document in a comment.
      Imports: `{ type NextRequest, NextResponse }`, `crypto` from `node:crypto`, `{ eq, and, sql }` from `drizzle-orm`, `db`, `{ orders, payments, orderItems, productVariants }` from `@/db/schema`, `{ ok, err }` from `@/lib/api-response`, `verifyPaymentSchema` from `@/lib/validations/checkout`.
      Files: `app/api/payments/verify/route.ts` (new)
      Verify: `npm run build` compiles.

- [ ] 5. Create `app/api/payments/webhook/route.ts` — Razorpay webhook (raw-body signature verification, idempotent handlers).
      Export `async function POST(request: NextRequest)`. Flow:
      1. `const raw = await request.text();` (raw body for HMAC). `const sigHeader = request.headers.get("x-razorpay-signature");`
      2. `const secret = process.env.RAZORPAY_WEBHOOK_SECRET;` If `!secret` return 500 (config error) — comment that this env var is required. If `!sigHeader` return 401.
      3. `const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");` constant-time compare with `sigHeader`; on mismatch return 401 (do not process).
      4. `const event = JSON.parse(raw);` `const type = event.event;` `const entity = event.payload?.payment?.entity ?? event.payload?.refund?.entity;`
      5. Dispatch in try/catch (each handler in its OWN `db.transaction`):
         - **`payment.captured`**: `razorpayOrderId = entity.order_id; razorpayPaymentId = entity.id;` tx: select payment by `razorpayOrderId`; if `!payment` → 200 ack (Razorpay retries; or order not ours); if `payment.status === "captured"` → 200 (idempotent skip); else update payment → `captured` (set `razorpayPaymentId`, `method: entity.method ?? null`), update order → `confirmed`, decrement stock (same `WHERE stock >= qty` + 0-rows-throw pattern as item 4).
         - **`payment.failed`**: `razorpayOrderId = entity.order_id;` tx: select payment by `razorpayOrderId`; if order already `cancelled` → 200 skip; else update payment → `failed`, update order → `cancelled`, **restore stock**: fetch orderItems, for each `await tx.update(productVariants).set({ stock: sql\`${productVariants.stock} + ${item.quantity}\`, updatedAt: new Date() }).where(eq(productVariants.id, item.variantId));`
         - **`refund.processed`**: `razorpayPaymentId = entity.payment_id;` tx: select payment by `razorpayPaymentId`; if `!payment` → 200 ack; if `payment.status === "refunded"` → 200 skip; else update payment → `refunded`, update order → `refunded`. **No stock restore here** (admin `processRefund` already restored it when initiating) — comment this.
         - Unknown event → 200 ack.
      6. **Return 200 for all valid-signature outcomes** (success, idempotent skip, unknown event, and handler errors after logging) so Razorpay does not retry-storm; return 401 only for invalid signature. (Per spec: "Return 200 always.") Comment this rationale.
      Imports: `{ type NextRequest, NextResponse }`, `crypto` from `node:crypto`, `{ eq, and, sql }` from `drizzle-orm`, `db`, `{ orders, payments, orderItems, productVariants }` from `@/db/schema`.
      Files: `app/api/payments/webhook/route.ts` (new)
      Verify: `npm run build` compiles.

- [ ] 6. Create `actions/admin.ts` — admin refund server action.
      File starts with `"use server";`. Export `export async function processRefund(orderId: string): Promise<ApiResponse<{ refunded: boolean }>>`. Flow:
      1. `await requireAdmin();` (gates access; redirects non-admins).
      2. `const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);` if `!order` return `err("Order not found")`.
      3. If `order.status` not in `["confirmed","shipped","delivered"]` return `err("Order cannot be refunded in its current state")`.
      4. `const [payment] = await db.select().from(payments).where(eq(payments.orderId, orderId)).limit(1);` if `!payment` return `err("Payment record not found")`.
      5. Idempotency: if `payment.status === "refunded"` return `err("Refund already processed")`.
      6. Determine COD vs Razorpay: `const isCod = payment.razorpayOrderId.startsWith("COD-");`
         - If **not COD**: require `payment.razorpayPaymentId` (else `err("No payment id to refund")`). `const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! });` `const refundAmount = Math.round(Number(payment.amount) * 100);` `await razorpay.payments.refund(payment.razorpayPaymentId, { amount: refundAmount });` (wrap; on failure return `err("Razorpay refund failed: " + message)`).
         - If **COD**: skip the Razorpay API call entirely (comment: COD refunds are manual cash settlements; we record the refund state and restore stock here).
      7. ONE `db.transaction(async (tx) => {`:
         - Update payment → `refunded`; update order → `refunded`.
         - Restore stock: fetch `orderItems` by `orderId`; for each `await tx.update(productVariants).set({ stock: sql\`${productVariants.stock} + ${item.quantity}\`, updatedAt: new Date() }).where(eq(productVariants.id, item.variantId));`
         - Coupon cleanup: `if (order.couponId) { await tx.delete(userCouponUsage).where(eq(userCouponUsage.orderId, orderId)); await tx.update(coupons).set({ usedCount: sql\`GREATEST(${coupons.usedCount} - 1, 0)\` }).where(eq(coupons.id, order.couponId)); }` (use `GREATEST` to avoid negative count).
       8. `revalidatePath("/admin/orders"); return ok({ refunded: true });` wrap in try/catch returning `err("Failed to process refund")`.
      Imports: `"use server";`, `Razorpay` from `razorpay`, `{ eq, sql }` from `drizzle-orm`, `revalidatePath` from `next/cache`, `db`, `{ orders, payments, orderItems, productVariants, coupons, userCouponUsage }` from `@/db/schema`, `requireAdmin` from `@/lib/auth`, `ok, err, ApiResponse` from `@/lib/api-response`.
      Files: `actions/admin.ts` (new)
      Verify: `npm run build` compiles.

- [ ] 7. Create `lib/checkout-client.ts` — client-side checkout module.
      Start the file with `"use client";` (explicitly a client module; the spec says only "do NOT mark it as a server module" — `use client` is correct and safe). Export:
      - `export interface CheckoutClientResult { success: boolean; orderId?: string; error?: string; }`
      - `export interface InitiateRazorpayOptions { shippingAddress: ShippingAddress; email?: string; phone?: string; couponCode?: string; items?: { variantId: string; quantity: number }[]; name?: string; description?: string; prefill?: { name?: string; email?: string; contact?: string }; }`
      - `export async function initiateRazorpayCheckout(options: InitiateRazorpayOptions): Promise<CheckoutClientResult>`:
        1. `const createRes = await fetch("/api/payments/create-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ shippingAddress: options.shippingAddress, email: options.email, phone: options.phone, couponCode: options.couponCode, items: options.items }) });` parse JSON; if `!ok` or `!createRes.data` return `{ success: false, error: createRes.error ?? "Failed to create order" }`.
        2. Load SDK: `await loadRazorpayScript();` (helper that injects `https://checkout.razorpay.com/v1/checkout.js` once and resolves when `window.Razorpay` exists; reject on timeout).
        3. Wrap the modal in a `Promise<CheckoutClientResult>`: `new window.Razorpay({ key: createRes.data.keyId, amount: createRes.data.amount, currency: createRes.data.currency, order_id: createRes.data.razorpayOrderId, name: options.name ?? "Kartiva", description: options.description, prefill: options.prefill, handler: async (response) => { ... }, modal: { ondismiss: () => resolve({ success: false, error: "Payment cancelled" }) } }).open();`
        4. Inside `handler`: **the client success is NOT trusted.** POST `{ razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature, orderId: createRes.data.orderId }` to `/api/payments/verify`. `const v = await verifyRes.json();` `resolve(v.success ? { success: true, orderId: createRes.data.orderId } : { success: false, error: v.error ?? "Payment verification failed" });`. On fetch error `resolve({ success: false, error: "Could not verify payment" })`.
      - `export async function placeCodOrderAction(input: { shippingAddress: ShippingAddress; email?: string; phone?: string; couponCode?: string; items?: { variantId: string; quantity: number }[]; }): Promise<ApiResponse<{ orderId: string }>>` — thin client wrapper: `import { placeCodOrder } from "@/actions/checkout"; return placeCodOrder(input);`.
      Import `ShippingAddress` from `@/types/checkout`. Do NOT import any server-only modules (db, razorpay, crypto).
      Files: `lib/checkout-client.ts` (new)
      Verify: `npm run build` compiles; the client module typechecks and bundles for the client.

- [ ] 8. Final verification — whole feature.
      - `npm run build` from `c:\E-Commerce` — zero TypeScript errors (expect the pre-existing "middleware deprecated, use proxy" warning if a `proxy.ts`/`middleware.ts` existed elsewhere; not our concern).
      - `npm run test` (vitest --run) — `lib/validations/checkout.test.ts`, `lib/validations/cart.test.ts`, `services/cart.service.guest.test.ts` all pass.
      - Re-read each of the 7 created/modified files and confirm it matches this spec (signatures, security invariants, idempotency, transactions, `WHERE stock >= quantity`, secrets server-side).
      - Confirm no schema file was modified and `createRazorpayOrder` was not changed.
      Files: (read-only verification, no edits)
      Verify: the two commands above pass.

## Notes for the reviewer / loop

- Do NOT add tests (user did not ask for them). Do NOT modify `db/schema/*` or `createRazorpayOrder`.
- The webhook will return 500 until the user adds `RAZORPAY_WEBHOOK_SECRET` to `.env.local`; this is expected and not a build failure.
- Stop contract for the review loop: reviewer writes `c:\E-Commerce\.agents\tasks\razorpay-review.json` with `{"verdict":"APPROVED"}` when the 7 deliverables match this plan and both verification commands pass.
