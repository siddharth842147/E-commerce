# Implementation Plan: Cart, Checkout, and Order Management

## Overview

This implementation plan covers the complete cart, checkout, and order management feature for the Kartiva e-commerce platform. The feature supports both authenticated and guest users, integrates Razorpay payment processing, enforces atomic stock management, and provides comprehensive order lifecycle management. All code will be implemented in TypeScript following the existing Next.js 15 App Router patterns, Drizzle ORM conventions, and Supabase authentication patterns already established in the codebase.

## Tasks

- [x] 1. Install required npm packages and set up environment variables
  - Install `iron-session` package for guest cart signed cookies
  - Install `razorpay` package for payment integration
  - Add `SESSION_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` to `.env.example` with documentation
  - _Requirements: 1.1, 13.1_

- [x] 2. Create database schema modifications
  - [x] 2.1 Add tax_rate column to categories schema
    - Modify `db/schema/categories.ts` to add `taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0")`
    - _Requirements: 9.1_
  
  - [x] 2.2 Create user_coupon_usage table schema
    - Create `db/schema/user_coupon_usage.ts` with userId, couponId, orderId, usedAt, and unique constraint on (userId, couponId)
    - Export from `db/schema/index.ts`
    - _Requirements: 7.1, 7.3_
  
  - [x] 2.3 Extend orderStatusEnum to include "returned"
    - Modify `db/schema/orders.ts` to add "returned" to the status enum array
    - _Requirements: 16.6, 17.1_
  
  - [x] 2.4 Verify and update payments table schema
    - Ensure `db/schema/payments.ts` has razorpayOrderId, razorpayPaymentId, razorpaySignature, status, amount, currency fields
    - Add any missing fields following existing patterns
    - _Requirements: 13.2, 14.7_
  
  - [x] 2.5 Generate and apply database migration
    - Run `npm run db:generate` to create migration file
    - Run `npm run db:push` or `npm run db:migrate` to apply changes
    - _Requirements: All schema changes_

- [x] 3. Create TypeScript type definitions
  - [x] 3.1 Create cart type definitions
    - Create `types/cart.ts` with GuestCartItem, GuestCart, and CartItem interfaces
    - Match structure from design document
    - _Requirements: 1.1, 2.1_
  
  - [x] 3.2 Create checkout type definitions
    - Create `types/checkout.ts` with ShippingAddress, CheckoutData, and OrderCalculation interfaces
    - Match structure from design document
    - _Requirements: 12.3, 11.1_

- [x] 4. Implement validation schemas
  - [x] 4.1 Create checkout validation schemas
    - Create `lib/validations/checkout.ts` with shippingAddressSchema and checkoutSchema using Zod
    - Include validation rules for recipient name, phone, address fields, city, state, postal code (6 digits)
    - _Requirements: 12.3, 20.2_
  
  - [x] 4.2 Create cart operation validation schemas
    - Create `lib/validations/cart.ts` with addToCartSchema and updateCartSchema using Zod
    - Validate variantId (UUID) and quantity (positive integer)
    - _Requirements: 1.1, 2.1_

- [ ] 5. Implement Cart Service
  - [x] 5.1 Create guest cart operations in CartService
    - Create `services/cart.service.ts` with iron-session configuration (30-day TTL, httpOnly, secure in production)
    - Implement getGuestCart(), addToGuestCart(), updateGuestCartQuantity(), removeFromGuestCart(), clearGuestCart()
    - Use signed cookies with SESSION_SECRET for tamper protection
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  
  - [x] 5.2 Write property test for guest cart round-trip preservation
    - **Property 1: Guest Cart Cookie Round-Trip Preservation**
    - **Validates: Requirements 1.1, 1.4**
  
  - [x] 5.3 Write property test for signature validation
    - **Property 2: Signature Validation Rejects Tampered Cookies**
    - **Validates: Requirements 1.5, 1.6**
  
  - [-] 5.4 Create authenticated user cart operations in CartService
    - Implement getUserCart(), addToUserCart(), updateUserCartQuantity(), removeFromUserCart(), clearUserCart()
    - Use Drizzle ORM with cart_items table queries
    - Handle duplicate variant additions by incrementing quantity
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 5.5 Write property test for user cart database round-trip preservation
    - **Property 3: User Cart Database Round-Trip Preservation**
    - **Validates: Requirements 2.1, 2.4**
  
  - [-] 5.6 Implement stock validation helper in CartService
    - Implement validateStock(variantId, requestedQuantity) function
    - Query product_variants table for current stock level
    - Return { valid: boolean, availableStock?: number }
    - _Requirements: 4.1, 4.3_
  
  - [x] 5.7 Write property test for stock validation preventing zero-stock additions
    - **Property 5: Stock Validation Prevents Zero-Stock Additions**
    - **Validates: Requirements 4.1, 4.2, 4.3**
  
  - [-] 5.8 Implement cart hydration helper for guest carts
    - Implement hydrateGuestCart(items: GuestCartItem[]): Promise<CartItem[]>
    - Join with product_variants and products to get full cart details
    - Return enriched CartItem array with product names, prices, images
    - _Requirements: 1.4_

- [~] 6. Checkpoint - Verify cart service implementation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Cart Actions
  - [x] 7.1 Create addToCart server action
    - Create `actions/cart.ts` with addToCart() server action
    - Validate input with addToCartSchema, check stock availability, call CartService methods
    - Differentiate between guest and authenticated users using getCurrentUser()
    - Return ApiResponse<null> with appropriate error messages
    - Call revalidatePath("/cart")
    - _Requirements: 1.1, 2.1, 4.1, 4.2_
  
  - [x] 7.2 Create updateCartItemQuantity and removeFromCart server actions
    - Implement updateCartItemQuantity() with stock validation
    - Implement removeFromCart() for both guest and authenticated users
    - Return ApiResponse<null>, revalidate "/cart" path
    - _Requirements: 1.2, 1.3, 2.2, 2.3, 4.3, 4.4_
  
  - [x] 7.3 Create getCart server action
    - Implement getCart() to retrieve cart items for current user
    - For guest users, hydrate guest cart with product details
    - For authenticated users, query cart_items with product joins
    - Return ApiResponse<CartItem[]>
    - _Requirements: 1.4, 2.4_
  
  - [x] 7.4 Create discardGuestCartOnLogin server action
    - Implement discardGuestCartOnLogin() to clear guest cart cookie after authentication
    - Called from login success flow to enforce guest cart discard policy
    - _Requirements: 3.1_
  
  - [x] 7.5 Write property test for guest cart discarded on login
    - **Property 4: Guest Cart Discarded on Login**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 8. Implement Coupon Validation Helpers
  - [x] 8.1 Create coupon validation service
    - Create `services/coupon.service.ts` with validateCoupon() function
    - Check coupon existence, isActive flag, expiresAt timestamp
    - Validate minOrderAmount against cart subtotal
    - Check maxUses against usedCount
    - Query user_coupon_usage table for per-user tracking (authenticated users only)
    - Return { valid: boolean, coupon?: Coupon, error?: string }
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 7.1, 7.2_
  
  - [x] 8.2 Write property test for coupon validation enforcing all constraints
    - **Property 9: Coupon Validation Enforces All Constraints**
    - **Validates: Requirements 6.1, 6.3, 6.5, 6.7, 6.9**
  
  - [x] 8.3 Write property test for per-user coupon usage preventing reuse
    - **Property 10: Per-User Coupon Usage Prevents Reuse**
    - **Validates: Requirements 7.2**

- [x] 9. Implement Checkout Service
  - [x] 9.1 Create stock validation for checkout
    - Create `services/checkout.service.ts` with validateCartStock() function
    - For each cart item, verify product_variants.stock >= requested quantity
    - Return { valid: boolean, unavailableItems?: string[] } with SKU list
    - _Requirements: 4.5, 4.6_
  
  - [x] 9.2 Implement discount calculation logic
    - Implement calculateDiscount(subtotal, coupon) helper function
    - For "percentage" type: (subtotal * discount_value / 100), capped at subtotal
    - For "fixed" type: discount_value, capped at subtotal
    - Return discount amount as number
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [x] 9.3 Write property test for percentage discount calculation
    - **Property 15: Percentage Discount Calculation**
    - **Validates: Requirements 8.1, 8.2**
  
  - [x] 9.4 Write property test for fixed discount calculation
    - **Property 16: Fixed Discount Calculation**
    - **Validates: Requirements 8.3, 8.4**
  
  - [x] 9.5 Write property test for zero discount without coupon
    - **Property 17: Zero Discount Without Coupon**
    - **Validates: Requirements 8.5**
  
  - [x] 9.6 Implement tax calculation logic
    - Implement calculateTax(cartItems) helper function
    - For each line item, join with categories to get tax_rate
    - Calculate line tax as (unit_price * quantity * tax_rate / 100)
    - Sum all line item taxes to get total tax amount
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [x] 9.7 Write property test for tax calculation formula
    - **Property 18: Tax Calculation Formula**
    - **Validates: Requirements 9.2**
  
  - [x] 9.8 Write property test for total tax sum
    - **Property 19: Total Tax is Sum of Line Taxes**
    - **Validates: Requirements 9.3**
  
  - [x] 9.9 Implement shipping calculation logic
    - Implement calculateShipping(subtotal) helper function
    - If subtotal < ₹500, return ₹50
    - If subtotal >= ₹500, return ₹0
    - _Requirements: 10.1, 10.2_
  
  - [x] 9.10 Write property test for shipping cost below threshold
    - **Property 21: Shipping Cost Below Threshold**
    - **Validates: Requirements 10.1**
  
  - [x] 9.11 Write property test for free shipping above threshold
    - **Property 22: Free Shipping Above Threshold**
    - **Validates: Requirements 10.2**
  
  - [x] 9.12 Implement order totals calculation
    - Implement calculateOrderTotals(validatedCart, coupon?) function
    - Calculate subtotal as sum of (unit_price * quantity)
    - Apply discount calculation, tax calculation, shipping calculation
    - Calculate total as (subtotal - discount + tax + shipping), ensure non-negative
    - Return OrderCalculation object with all amounts
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [x] 9.13 Write property test for subtotal calculation formula
    - **Property 24: Subtotal Calculation Formula**
    - **Validates: Requirements 11.1**
  
  - [x] 9.14 Write property test for order total calculation formula
    - **Property 25: Order Total Calculation Formula**
    - **Validates: Requirements 11.2**
  
  - [x] 9.15 Write property test for order total never negative
    - **Property 27: Order Total is Never Negative**
    - **Validates: Requirements 11.4**

- [~] 10. Checkpoint - Verify calculation logic
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement Razorpay Integration
  - [x] 11.1 Create Razorpay order creation helper
    - In `services/checkout.service.ts`, implement createRazorpayOrder(orderId, amount) function
    - Initialize Razorpay client with RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET
    - Call razorpay.orders.create() with amount in paise (amount * 100), currency "INR", receipt as orderId
    - Return Razorpay order object with id field
    - Handle errors with try-catch, throw descriptive error
    - _Requirements: 13.1, 13.2_
  
  - [ ] 11.2 Implement atomic order creation with stock reservation
    - Implement createOrderWithStockReservation() function in CheckoutService
    - Wrap in db.transaction() for atomicity
    - Insert order record with status "pending" and all calculated amounts
    - For each cart item, insert order_items record and decrement product_variants.stock using SQL expression
    - Use WHERE constraint `stock >= quantity` to prevent negative stock
    - If stock update affects 0 rows, throw "Insufficient stock" error to rollback transaction
    - Track coupon usage: insert user_coupon_usage record, increment coupons.usedCount
    - Call createRazorpayOrder() within transaction
    - Insert payments record with razorpayOrderId, status "pending", amount, currency "INR"
    - Return { orderId, razorpayOrderId }
    - _Requirements: 5.1, 5.2, 7.3, 7.4, 12.4, 12.5, 13.2, 13.3, 13.4_
  
  - [~] 11.3 Write property test for stock decrement atomicity
    - **Property 6: Stock Decrement is Atomic with Order Creation**
    - **Validates: Requirements 5.1, 5.2**
  
  - [~] 11.4 Write property test for coupon usage tracking on confirmation
    - **Property 11: Coupon Usage Tracking is Created on Order Confirmation**
    - **Validates: Requirements 7.3**
  
  - [~] 11.5 Write property test for coupon used count increment
    - **Property 12: Coupon Used Count Increments on Order Confirmation**
    - **Validates: Requirements 7.4**
  
  - [~] 11.6 Write property test for initial order status
    - **Property 30: Initial Order Status is Pending**
    - **Validates: Requirements 12.4**
  
  - [~] 11.7 Write property test for initial payment status
    - **Property 34: Initial Payment Status is Pending**
    - **Validates: Requirements 13.3**

- [ ] 12. Implement Checkout Actions
  - [x] 12.1 Create guest user profile creation helper
    - In `actions/checkout.ts`, implement createGuestProfile(email, phone) function
    - Check if profile exists with email, return existing profile if found
    - Otherwise, insert new profile with role "customer", email, phone
    - Return profile object
    - _Requirements: 20.3_
  
  - [x] 12.2 Create enrichCartWithTaxRates helper
    - Implement enrichCartWithTaxRates(cartItems) function
    - Join cart items with categories table to fetch tax_rate for each variant's category
    - Return ValidatedCart structure with tax rates included
    - _Requirements: 9.1_
  
  - [~] 12.3 Implement checkout server action
    - Create checkout() server action in `actions/checkout.ts`
    - Validate input with checkoutSchema
    - Get current user or create guest profile from email/phone
    - Fetch cart items (user or hydrated guest cart)
    - Validate cart is not empty
    - Validate stock availability for all items
    - Validate coupon if provided
    - Enrich cart with tax rates
    - Calculate order totals
    - Call createOrderWithStockReservation()
    - Clear cart (user or guest)
    - Revalidate "/cart" and "/orders" paths
    - Return ApiResponse<{ orderId, razorpayOrderId }>
    - _Requirements: 12.1, 12.2, 12.6, 12.7, 13.4, 13.5, 20.1, 20.2_
  
  - [~] 12.4 Write property test for empty cart validation
    - **Property 28: Empty Cart Validation**
    - **Validates: Requirements 12.1, 12.2**
  
  - [~] 12.5 Write property test for shipping address validation
    - **Property 29: Shipping Address Validation**
    - **Validates: Requirements 12.3**
  
  - [~] 12.6 Write property test for order items matching cart items
    - **Property 31: Order Items Match Cart Items**
    - **Validates: Requirements 12.5**
  
  - [~] 12.7 Write property test for cart cleared after order creation
    - **Property 32: Cart Cleared After Order Creation**
    - **Validates: Requirements 12.6**
  
  - [~] 12.8 Write property test for guest cart cleared after order creation
    - **Property 33: Guest Cart Cleared After Order Creation**
    - **Validates: Requirements 12.7**

- [~] 13. Checkpoint - Verify checkout flow
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Implement Payment Verification
  - [~] 14.1 Create payment signature verification helper
    - Create `lib/razorpay.ts` with verifyPaymentSignature() function
    - Compute HMAC SHA256 signature of "razorpay_order_id|razorpay_payment_id" using RAZORPAY_KEY_SECRET
    - Compare computed signature with received razorpay_signature
    - Return boolean indicating match
    - _Requirements: 14.2, 14.3_
  
  - [~] 14.2 Write property test for payment signature HMAC computation
    - **Property 35: Payment Signature HMAC Computation**
    - **Validates: Requirements 14.2**
  
  - [~] 14.3 Create verifyPayment server action
    - Create `actions/payments.ts` with verifyPayment() server action
    - Accept { razorpay_order_id, razorpay_payment_id, razorpay_signature }
    - Call verifyPaymentSignature() to validate signature
    - Update payments table: set razorpayPaymentId, razorpaySignature, status ("captured" if valid, "failed" if invalid)
    - If valid, update orders table: set status to "confirmed"
    - Revalidate "/orders" path
    - Return ApiResponse<null>
    - _Requirements: 14.1, 14.4, 14.5, 14.6, 14.7_
  
  - [~] 14.4 Write property test for valid signature capturing payment
    - **Property 36: Valid Signature Captures Payment**
    - **Validates: Requirements 14.4**
  
  - [~] 14.5 Write property test for invalid signature failing payment
    - **Property 37: Invalid Signature Fails Payment**
    - **Validates: Requirements 14.5**
  
  - [~] 14.6 Write property test for payment capture confirming order
    - **Property 38: Payment Capture Confirms Order**
    - **Validates: Requirements 14.6**

- [ ] 15. Implement Payment Webhook Handler
  - [~] 15.1 Create webhook signature verification helper
    - In `lib/razorpay.ts`, implement verifyWebhookSignature(body, signature) function
    - Compute HMAC SHA256 of raw request body using RAZORPAY_WEBHOOK_SECRET
    - Compare with received signature
    - Return boolean
    - _Requirements: 15.1_
  
  - [~] 15.2 Create webhook API route handler
    - Create `app/api/payments/webhook/route.ts` with POST handler
    - Read raw request body and x-razorpay-signature header
    - Verify webhook signature, return 400 if invalid
    - Parse webhook event JSON
    - Handle "payment.captured" event: update payment status to "captured", update order status to "confirmed"
    - Handle "payment.failed" event: update payment status to "failed"
    - Return 200 response for valid webhooks
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_
  
  - [~] 15.3 Write property test for webhook signature validation
    - **Property 39: Webhook Signature Validation**
    - **Validates: Requirements 15.1, 15.2**
  
  - [~] 15.4 Write property test for captured webhook updating payment status
    - **Property 40: Captured Webhook Updates Payment Status**
    - **Validates: Requirements 15.3**
  
  - [~] 15.5 Write property test for failed webhook updating payment status
    - **Property 41: Failed Webhook Updates Payment Status**
    - **Validates: Requirements 15.4**
  
  - [~] 15.6 Write property test for webhook payment status synchronizing order status
    - **Property 42: Webhook Payment Status Synchronizes Order Status**
    - **Validates: Requirements 15.5**

- [ ] 16. Implement Order Service
  - [~] 16.1 Create order query functions
    - Create `services/order.service.ts` with getOrderById(orderId, userId?) function
    - Query orders table with joins to order_items and payments
    - Filter by userId if provided (for customer view)
    - Implement getUserOrders(userId) to query all orders for a user, ordered by created_at DESC
    - Implement getAllOrders(filters?) for admin view with optional status and date range filters
    - _Requirements: 18.1, 18.2, 18.3, 19.1, 19.2, 19.3, 19.4_
  
  - [~] 16.2 Write property test for user order query filtering by user ID
    - **Property 45: User Order Query Filters by User ID**
    - **Validates: Requirements 18.1**
  
  - [~] 16.3 Write property test for order query returning complete data
    - **Property 46: Order Query Returns Complete Data**
    - **Validates: Requirements 18.2**
  
  - [~] 16.4 Write property test for order query sorted by creation date
    - **Property 47: Order Query Sorted by Creation Date Descending**
    - **Validates: Requirements 18.3**
  
  - [~] 16.5 Implement order status update with stock restoration
    - Implement updateOrderStatus(orderId, status) function
    - Wrap in db.transaction()
    - Update orders table with new status and updated_at timestamp
    - If status is "cancelled" or "returned", query order_items and restore stock by incrementing product_variants.stock
    - If status is "cancelled" or "returned" and order has coupon, delete user_coupon_usage record and decrement coupons.usedCount
    - Return updated order
    - _Requirements: 5.3, 5.4, 7.5, 7.6, 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8, 17.1, 17.2_
  
  - [~] 16.6 Write property test for order cancellation restoring stock
    - **Property 7: Order Cancellation Restores Stock**
    - **Validates: Requirements 5.3**
  
  - [~] 16.7 Write property test for order return restoring stock
    - **Property 8: Order Return Restores Stock**
    - **Validates: Requirements 5.4**
  
  - [~] 16.8 Write property test for coupon usage tracking removed on cancellation
    - **Property 13: Coupon Usage Tracking is Removed on Cancellation**
    - **Validates: Requirements 7.5**
  
  - [~] 16.9 Write property test for coupon used count decremented on cancellation
    - **Property 14: Coupon Used Count Decrements on Cancellation**
    - **Validates: Requirements 7.6**
  
  - [~] 16.10 Write property test for order state machine transitions
    - **Property 43: Order State Machine Transitions**
    - **Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7**
  
  - [~] 16.11 Write property test for order status update changing timestamp
    - **Property 44: Order Status Update Changes Timestamp**
    - **Validates: Requirements 16.8**

- [ ] 17. Implement Order Actions
  - [~] 17.1 Create customer order actions
    - Create `actions/orders.ts` with getMyOrders() server action
    - Use requireAuth() to ensure authenticated user
    - Call OrderService.getUserOrders(user.id)
    - Return ApiResponse<Order[]>
    - Implement getOrderDetails(orderId) with user-scoped query
    - _Requirements: 18.1, 18.2, 18.3, 18.4_
  
  - [~] 17.2 Create admin order actions
    - Implement getAdminOrders(filters?) server action
    - Use requireAdmin() to ensure admin role
    - Call OrderService.getAllOrders() with optional filters (status, startDate, endDate)
    - Return ApiResponse<Order[]>
    - _Requirements: 19.1, 19.2, 19.3, 19.4_
  
  - [~] 17.3 Write property test for admin seeing all orders
    - **Property 48: Admin Sees All Orders**
    - **Validates: Requirements 19.1**
  
  - [~] 17.4 Write property test for admin order filtering by status
    - **Property 49: Admin Order Filtering by Status**
    - **Validates: Requirements 19.2**
  
  - [~] 17.5 Write property test for admin order filtering by date range
    - **Property 50: Admin Order Filtering by Date Range**
    - **Validates: Requirements 19.3**
  
  - [~] 17.6 Write property test for admin order query returning complete data
    - **Property 51: Admin Order Query Returns Complete Data**
    - **Validates: Requirements 19.4**
  
  - [~] 17.7 Create admin order status update action
    - Implement updateOrderStatus(orderId, status) server action
    - Use requireAdmin() to ensure admin role
    - Call OrderService.updateOrderStatus()
    - Revalidate "/admin/orders" and "/orders/{orderId}" paths
    - Return ApiResponse<null>
    - _Requirements: 16.1-16.8_

- [~] 18. Checkpoint - Verify order management
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Integration and wiring
  - [~] 19.1 Integrate cart actions with frontend
    - Verify cart actions are exported from `actions/cart.ts`
    - Test cart operations work with both guest and authenticated sessions
    - Verify stock validation prevents overselling
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 4.1, 4.3_
  
  - [~] 19.2 Integrate checkout flow with frontend
    - Verify checkout action creates orders with correct totals
    - Test coupon application and validation
    - Verify Razorpay order creation returns orderId for payment UI
    - _Requirements: 12.1, 12.3, 13.1, 13.4_
  
  - [~] 19.3 Integrate payment verification with frontend
    - Verify payment signature verification works with Razorpay responses
    - Test order status transitions to "confirmed" after payment capture
    - _Requirements: 14.1, 14.4, 14.6_
  
  - [~] 19.4 Integrate order management with frontend
    - Verify customer can view their order history
    - Test admin order listing and filtering
    - Test admin order status updates trigger stock restoration
    - _Requirements: 18.1, 19.1, 19.2, 16.5_
  
  - [~] 19.5 Write integration tests for checkout flow
    - Test complete flow from cart to order creation
    - Test guest and authenticated user paths
    - Test coupon application scenarios
    - _Requirements: All checkout requirements_
  
  - [~] 19.6 Write integration tests for payment flow
    - Test Razorpay order creation (use test mode)
    - Test payment verification with valid and invalid signatures
    - Test webhook processing
    - _Requirements: All payment requirements_

- [~] 20. Final checkpoint - Complete feature verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- All implementation tasks must be completed to satisfy requirements
- The feature uses existing Next.js 15 patterns (Server Actions, App Router)
- Database operations use Drizzle ORM following existing schema conventions
- All server actions return `ApiResponse<T>` from `lib/api-response.ts`
- Authentication uses existing `lib/auth.ts` helpers (getCurrentUser, requireAuth, requireAdmin)
- Guest cart uses iron-session with 30-day signed cookies for security
- Order creation with stock reservation is atomic via database transactions
- Payment integration uses Razorpay test mode during development
- Property tests validate universal correctness properties across randomized inputs
- Unit tests cover specific examples, edge cases, and error conditions
- Each task references specific requirements for traceability

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1", "2.1", "2.2", "2.3", "2.4", "3.1", "3.2"]
    },
    {
      "id": 1,
      "tasks": ["2.5", "4.1", "4.2"]
    },
    {
      "id": 2,
      "tasks": ["5.1", "5.4", "5.6", "5.8"]
    },
    {
      "id": 3,
      "tasks": ["5.2", "5.3", "5.5", "5.7", "7.1", "7.2", "7.3"]
    },
    {
      "id": 4,
      "tasks": ["7.4", "7.5", "8.1"]
    },
    {
      "id": 5,
      "tasks": ["8.2", "8.3", "9.1", "9.2", "9.6", "9.9", "9.12"]
    },
    {
      "id": 6,
      "tasks": ["9.3", "9.4", "9.5", "9.7", "9.8", "9.10", "9.11", "9.13", "9.14", "9.15", "11.1", "12.1", "12.2"]
    },
    {
      "id": 7,
      "tasks": ["11.2"]
    },
    {
      "id": 8,
      "tasks": ["11.3", "11.4", "11.5", "11.6", "11.7", "12.3"]
    },
    {
      "id": 9,
      "tasks": ["12.4", "12.5", "12.6", "12.7", "12.8", "14.1"]
    },
    {
      "id": 10,
      "tasks": ["14.2", "14.3", "15.1"]
    },
    {
      "id": 11,
      "tasks": ["14.4", "14.5", "14.6", "15.2"]
    },
    {
      "id": 12,
      "tasks": ["15.3", "15.4", "15.5", "15.6", "16.1", "16.5"]
    },
    {
      "id": 13,
      "tasks": ["16.2", "16.3", "16.4", "16.6", "16.7", "16.8", "16.9", "16.10", "16.11", "17.1", "17.2"]
    },
    {
      "id": 14,
      "tasks": ["17.3", "17.4", "17.5", "17.6", "17.7"]
    },
    {
      "id": 15,
      "tasks": ["19.1", "19.2", "19.3", "19.4"]
    },
    {
      "id": 16,
      "tasks": ["19.5", "19.6"]
    }
  ]
}
```
