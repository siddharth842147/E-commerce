# Implementation Plan — Kartiva Notification Service (Inngest + Resend + MSG91 + WhatsApp + PDF)

Grounded in repo exploration. Critical deviations from the original spec, confirmed by reading the INSTALLED packages and Next.js 16 docs:

- **Inngest 4.24.0 signature (BREAKING):** the installed SDK uses the 2-arg form `inngest.createFunction({ id, retries: 3, triggers: [{ event: "..." }] }, async ({ event, step }) => {...})`. The spec's documented 3-arg form `createFunction({ id, retries }, { event }, handler)` is OUTDATED for v4 and would be a TypeScript error. Use the 2-arg form. Likewise `inngest.send({ name, data })` (single payload object), not the deprecated 2-arg send.
- **Packages already installed** (inngest 4.24.0, resend 6.34.0, react-email 6.11.3, @react-email/components 1.0.12, @react-pdf/renderer 4.9.0). Do NOT reinstall. `renderToBuffer` returns `Promise<Buffer>`; Resend attachment `content` accepts a Buffer.
- **notifications_log already covers logging** (id, userId, channel, recipient, subject, templateId, payload jsonb, status enum pending/sent/failed, errorMessage, sentAt, createdAt). No dedicated eventType/providerMessageId columns exist — store both in the `payload` jsonb. No schema change to this table.
- **Notification env vars in .env.local are all EMPTY** — fill with placeholder test values. `.env.example` already documents all of them.
- **Next.js 16 renames middleware → proxy** (functionality unchanged). The existing `middleware.ts` only redirects `/account` and `/admin`, so `/api/inngest` is reachable; no proxy/middleware change is needed.
- The existing verify route and webhook both transition an order to "confirmed" and decrement stock (idempotently), so both can fire for one order. The `order.confirmed` Inngest function includes an idempotency guard (skip a channel if a `sent` log row already exists for that orderId+eventType+channel) to avoid duplicate notifications.
- **Needs verification during implementation:** the spec lists `notification/welcome` and `notification/otp` events but no server-side trigger point emits them yet (no signup/OTP flow exists in the touched files). Implement the functions and service support for them, but note that wiring them to an actual signup/OTP flow is out of scope here. Do not dismiss this — flag it.

The work decomposes into 3 sequential, buildable FEATs (FEAT-001 → FEAT-002 → FEAT-003), then a convergence loop, then finalize. Feature artifacts: `.agents/tasks/notifications/features/FEAT-00{1,2,3}.json`. Context: `.agents/tasks/notifications/context.json`.

---

## FEAT-001 — Notification sending layer (schema + service + templates + PDF + env)

- [ ] 1. Add user channel opt-in columns to the profiles schema.
      Modify db/schema/profiles.ts: import `boolean` from drizzle-orm/pg-core; add `emailNotifications: boolean("email_notifications").notNull().default(true)`, `smsNotifications: boolean("sms_notifications").notNull().default(true)`, `whatsappNotifications: boolean("whatsapp_notifications").notNull().default(true)` after `updatedAt`.
      Files: db/schema/profiles.ts
      Verify: `npx drizzle-kit generate` creates a new db/migrations/*.sql adding the three NOT NULL DEFAULT true columns.

- [ ] 2. Generate the Drizzle migration and (best-effort) apply it.
      Run `npx drizzle-kit generate`; attempt `npx drizzle-kit push` (DATABASE_URL is in .env.local). If push hangs (Supabase pooler), note the generated SQL for manual psql application.
      Files: db/migrations/*.sql (generated)
      Verify: new migration SQL exists adding the 3 columns; `npm run build` still compiles (build does not depend on push).

- [ ] 3. Create the notification service with channel dispatchers and logging.
      Create services/notification.service.ts exporting sendEmail (Resend), sendSMS (MSG91 fetch), sendWhatsApp (Meta Cloud API fetch to graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages with type 'template'), logNotification (insert notifications_log, payload jsonb = { eventType, providerMessageId }), and dispatchNotification({ userId, eventType, data }) that loads the profile, checks opt-in prefs, sends to each opted-in channel with per-channel try/catch, and logs each attempt. Use `import { db } from "@/db"`, `profiles`, `notificationsLog` from "@/db/schema", `eq`.
      Files: services/notification.service.ts
      Verify: `npm run build` (zero TS errors).

- [ ] 4. Create the 7 React Email templates with typed props and Kartiva branding.
      Create components/emails/WelcomeEmail.tsx ({ name? }), OTPEmail.tsx ({ otp }), OrderConfirmedEmail.tsx ({ orderId, customerName?, total, items[], trackingUrl }) with summary table + PDF-attachment note, OrderShippedEmail.tsx ({ orderId, trackingUrl? }), OrderDeliveredEmail.tsx ({ orderId }), OrderCancelledEmail.tsx ({ orderId, stockRestored }), RefundProcessedEmail.tsx ({ orderId, amount, timeline }). Use @react-email/components (Html, Head, Body, Container, Section, Text, Heading, Button, Hr, Link, Table, Row, Column) and config/site.ts branding.
      Files: components/emails/*.tsx (7 files)
      Verify: `npm run build`.

- [ ] 5. Create the PDF invoice component and generator.
      Create lib/invoice/InvoicePDF.tsx (InvoicePDF component using @react-pdf/renderer Document/Page/Text/View/StyleSheet; typed InvoicePDFProps: invoiceNumber, orderDate, customerName, shippingAddress, items[], subtotal/discount/tax/shipping/total strings, paymentMethod, orderStatus) and lib/invoice/generate-invoice.ts (generateInvoicePDF(orderData): Promise<Buffer> via renderToBuffer(<InvoicePDF {...orderData}/>); re-export InvoicePDFProps).
      Files: lib/invoice/InvoicePDF.tsx, lib/invoice/generate-invoice.ts
      Verify: `npm run build`.

- [ ] 6. Fill the empty notification env vars in .env.local with placeholder test values.
      Set RESEND_API_KEY, RESEND_FROM_EMAIL, MSG91_AUTH_KEY, MSG91_SENDER_ID, MSG91_TEMPLATE_ID, WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY to placeholders; do not overwrite any existing non-notification values. Confirm .env.example is already complete.
      Files: .env.local (modify), .env.example (verify)
      Verify: `npm run build` and `npm run test` (existing tests pass; this FEAT adds no tests).

## FEAT-002 — Inngest client + route + 7 functions (depends on FEAT-001)

- [ ] 7. Create the Inngest client and the public webhook route.
      lib/inngest/client.ts: `export const inngest = new Inngest({ id: "kartiva" })` (auto-reads INNGEST_EVENT_KEY/INNGEST_SIGNING_KEY from env). app/api/inngest/route.ts: `export const { GET, POST, PUT } = serve({ client: inngest, functions })` from "inngest/next". Public, no auth.
      Files: lib/inngest/client.ts, app/api/inngest/route.ts
      Verify: `npm run build`.

- [ ] 8. Create the 7 Inngest functions using the installed 2-arg createFunction form with per-channel step.run().
      One file per event in lib/inngest/functions/: welcome (notification/welcome {userId}), otp (notification/otp {userId, otp}), order-confirmed (notification/order.confirmed {userId, orderId}; loads order+items, generates PDF in a step.run, attaches to email, idempotency guard per channel), order-shipped (notification/order.shipped {userId, orderId}), order-delivered (notification/order.delivered {userId, orderId}), order-cancelled (notification/order.cancelled {userId, orderId}), refund-processed (notification/refund.processed {userId, orderId, amount}). Each: `{ id, retries: 3, triggers: [{ event }] }`; step.run load-profile, then per opted-in channel a step.run send+log (try/catch, log failed on error, rethrow for Inngest step retry). lib/inngest/functions/index.ts re-exports `functions` array (with a comment that WhatsApp template names must be created in Meta Business Manager).
      Files: lib/inngest/functions/welcome.ts, otp.ts, order-confirmed.ts, order-shipped.ts, order-delivered.ts, order-cancelled.ts, refund-processed.ts, index.ts
      Verify: `npm run build` (validates 2-arg createFunction signatures and all imports).

## FEAT-003 — Order-lifecycle triggers + preference actions (depends on FEAT-002)

- [ ] 9. Add Zod validation schemas for preferences and order status.
      Create lib/validations/notifications.ts: updateNotificationPreferencesSchema ({ email, sms, whatsapp } booleans) and updateOrderStatusSchema ({ orderId uuid, status enum ['shipped','delivered','cancelled'] }) with inferred types.
      Files: lib/validations/notifications.ts
      Verify: `npm run build`.

- [ ] 10. Emit notification/order.confirmed from the payment verify route.
       In app/api/payments/verify/route.ts, after a successful capture (not on alreadyVerified), fetch the order's userId and `await inngest.send({ name: "notification/order.confirmed", data: { userId, orderId } })` wrapped in try/catch (log, never throw). Import the inngest client. Keep existing logic/comments.
       Files: app/api/payments/verify/route.ts
       Verify: `npm run build`.

- [ ] 11. Emit confirmed/cancelled/refund from the Razorpay webhook.
       In app/api/payments/webhook/route.ts, after each handler's transaction commits (outside the db.transaction callback), emit (all try/catch, never throw): handlePaymentCaptured → order.confirmed; handlePaymentFailed → order.cancelled { stockRestored: true }; handleRefundProcessed → refund.processed { amount }. Each fetches userId (and amount for refund) from the order/payment. Import the inngest client. Keep all existing handlers/idempotency/signature verification intact.
       Files: app/api/payments/webhook/route.ts
       Verify: `npm run build`, `npm run test`.

- [ ] 12. Emit notification/order.confirmed from placeCodOrder.
       In actions/checkout.ts placeCodOrder, after the transaction + cart clear and before return, `await inngest.send({ name: "notification/order.confirmed", data: { userId, orderId: order.id } })` wrapped in try/catch. `userId` and `order.id` in scope. Import the inngest client. Do not change existing transaction/COD logic.
       Files: actions/checkout.ts
       Verify: `npm run build`.

- [ ] 13. Emit notification/refund.processed from processRefund and add updateOrderStatus.
       In actions/admin.ts: (a) after processRefund's transaction, emit refund.processed { userId: order.userId, orderId, amount: String(payment.amount) } (try/catch). (b) Add `updateOrderStatus(orderId, status)` gated by requireAdmin, Zod-validated with updateOrderStatusSchema; for 'cancelled' run a db.transaction that sets status 'cancelled', restores stock (increment variant stock per order_item, mirroring the webhook), and rolls back coupon usage if used; for 'shipped'/'delivered' just update status; after the tx emit the matching event (order.shipped / order.delivered / order.cancelled { stockRestored: true }) via try/catch, revalidatePath('/admin/orders'), return ok({ orderId, status }). Import eq, sql, schema, inngest client.
       Files: actions/admin.ts
       Verify: `npm run build`.

- [ ] 14. Add the notification-preference server actions.
       Create actions/notifications.ts (`"use server"`): getNotificationPreferences() (requireAuth, select profile, return { email, sms, whatsapp }) and updateNotificationPreferences(input) (requireAuth, Zod-parse updateNotificationPreferencesSchema, update the profiles opt-in columns + updatedAt, return new values). Use ApiResponse wrapper.
       Files: actions/notifications.ts
       Verify: `npm run build`, `npm run test` (existing tests still pass).

## Convergence — cross-FEAT integration verification + review

- [ ] 15. Run full build + tests, fix seams between FEATs (triggers wiring all 3 layers), then pass review.
       Run `npm run build` and `npm run test`; verify the full notification flow compiles and existing tests pass; fix any integration errors at the seams (verify/webhook/checkout/admin triggers → inngest client → functions → service/templates/PDF). Then the reviewer writes `.agents/tasks/notifications/review.json` with `{"verdict":"APPROVED"}` or `{"verdict":"CHANGES_REQUESTED"}`.
       Files: all touched files
       Verify: `npm run build` zero errors; `npm run test` all pass; review.json verdict APPROVED.

## Finalize

- [ ] 16. Finalize: ensure the Drizzle migration is generated/applied (or noted), env placeholders set, and the build/tests are green.
       Files: db/migrations/*.sql, .env.local
       Verify: `npm run build` and `npm run test` both green.
