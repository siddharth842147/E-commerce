# Requirements Document

## Introduction

This document specifies the requirements for the cart, checkout, and order management feature of the Kartiva e-commerce platform. The feature enables customers to add products to a shopping cart, apply discount coupons, complete checkout with payment processing through Razorpay, and manage order lifecycle including returns. The system must handle both authenticated users and guest shoppers, apply category-specific GST rates, enforce shipping rules, prevent overselling through stock validation, and track coupon usage per user.

## Glossary

- **Cart_System**: The shopping cart management subsystem responsible for storing and manipulating cart items
- **Guest_Cart**: A shopping cart associated with an unauthenticated user, stored in signed cookies
- **User_Cart**: A shopping cart associated with an authenticated user, stored in the cart_items database table
- **Checkout_System**: The subsystem responsible for processing checkout flow, validating orders, and calculating totals
- **Payment_System**: The Razorpay integration subsystem handling payment order creation, verification, and webhook processing
- **Order_System**: The subsystem managing order records, status transitions, and order lifecycle
- **Coupon_System**: The discount coupon validation and application subsystem
- **Stock_System**: The inventory tracking subsystem that prevents overselling
- **Tax_Calculator**: The component responsible for calculating category-specific GST amounts
- **Shipping_Calculator**: The component responsible for calculating shipping charges based on order value
- **Authenticated_User**: A user with valid Supabase authentication session
- **Guest_User**: An unauthenticated visitor identified by signed cookie session
- **Product_Variant**: A specific SKU of a product with defined stock, price, and options
- **Order_Total**: The final amount payable including subtotal, tax, shipping, and discount
- **Stock_Level**: The available quantity of a Product_Variant
- **Razorpay_Order**: A payment order created in Razorpay system
- **Payment_Signature**: The cryptographic signature returned by Razorpay for verification
- **Order_Status**: The current state of an order (pending, confirmed, processing, shipped, delivered, cancelled, refunded, returned)
- **Shipping_Threshold**: The order subtotal value (₹500) above which shipping is free

## Requirements

### Requirement 1: Guest Cart Management

**User Story:** As a guest user, I want to add products to my cart and have them persist across sessions, so that I can shop without creating an account immediately.

#### Acceptance Criteria

1.1 WHEN a Guest_User adds a Product_Variant to cart, THE Cart_System SHALL store the cart data in a signed cookie with 30-day expiry

1.2 WHEN a Guest_User modifies cart quantity, THE Cart_System SHALL update the signed cookie with the new quantity

1.3 WHEN a Guest_User removes a Product_Variant from cart, THE Cart_System SHALL delete that item from the signed cookie

1.4 WHEN a Guest_User returns to the site within 30 days, THE Cart_System SHALL restore the cart contents from the signed cookie

1.5 THE Cart_System SHALL validate the signed cookie signature before reading cart data

1.6 IF a signed cookie signature is invalid, THEN THE Cart_System SHALL discard the cookie and initialize an empty cart

### Requirement 2: Authenticated User Cart Management

**User Story:** As an authenticated user, I want my cart to be stored in my account, so that I can access it from any device.

#### Acceptance Criteria

2.1 WHEN an Authenticated_User adds a Product_Variant to cart, THE Cart_System SHALL insert a record into the cart_items table

2.2 WHEN an Authenticated_User modifies cart quantity, THE Cart_System SHALL update the quantity field in the cart_items table

2.3 WHEN an Authenticated_User removes a Product_Variant from cart, THE Cart_System SHALL delete the corresponding cart_items record

2.4 WHEN an Authenticated_User views their cart, THE Cart_System SHALL retrieve all cart_items records for that user

### Requirement 3: Cart Merging on Login

**User Story:** As a guest user who logs in, I want my existing user cart to be preserved, so that I don't lose items I previously added to my account.

#### Acceptance Criteria

3.1 WHEN a Guest_User with a Guest_Cart authenticates successfully, THE Cart_System SHALL discard the Guest_Cart

3.2 WHEN a Guest_User with a Guest_Cart authenticates successfully, THE Cart_System SHALL load the User_Cart from the cart_items table

3.3 THE Cart_System SHALL NOT merge Guest_Cart items with User_Cart items

### Requirement 4: Stock Validation

**User Story:** As a customer, I want to be prevented from ordering out-of-stock items, so that I don't experience order cancellations due to unavailability.

#### Acceptance Criteria

4.1 WHEN a customer adds a Product_Variant to cart, THE Cart_System SHALL verify that the Stock_Level is greater than zero

4.2 IF a Product_Variant has zero Stock_Level, THEN THE Cart_System SHALL reject the add-to-cart request with an out-of-stock message

4.3 WHEN a customer increases cart quantity, THE Cart_System SHALL verify that the requested quantity does not exceed the Stock_Level

4.4 IF the requested quantity exceeds the Stock_Level, THEN THE Cart_System SHALL reject the update and return the available stock quantity

4.5 WHEN the Checkout_System processes an order, THE Stock_System SHALL verify that all cart items have sufficient Stock_Level before order creation

4.6 IF any cart item exceeds available Stock_Level during checkout, THEN THE Checkout_System SHALL reject the order and display which items are unavailable

### Requirement 5: Stock Reservation

**User Story:** As a customer completing checkout, I want stock to be reserved for my order, so that I don't lose items while making payment.

#### Acceptance Criteria

5.1 WHEN the Order_System creates an order record, THE Stock_System SHALL decrement the Stock_Level for each Product_Variant by the ordered quantity

5.2 THE Stock_System SHALL perform the stock decrement operation atomically with order creation

5.3 WHEN an order transitions to "cancelled" status, THE Stock_System SHALL increment the Stock_Level for each Product_Variant by the cancelled quantity

5.4 WHEN an order transitions to "returned" status, THE Stock_System SHALL increment the Stock_Level for each Product_Variant by the returned quantity

### Requirement 6: Coupon Validation

**User Story:** As a customer, I want to apply discount coupons to my order, so that I can reduce the total cost.

#### Acceptance Criteria

6.1 WHEN a customer applies a coupon code, THE Coupon_System SHALL verify that the code exists in the coupons table

6.2 IF the coupon code does not exist, THEN THE Coupon_System SHALL reject the coupon with an "invalid code" message

6.3 WHEN a coupon code exists, THE Coupon_System SHALL verify that the is_active field is true

6.4 IF is_active is false, THEN THE Coupon_System SHALL reject the coupon with an "expired or inactive" message

6.5 WHEN a coupon is active, THE Coupon_System SHALL verify that the current timestamp is before the expires_at timestamp

6.6 IF the current timestamp is after expires_at, THEN THE Coupon_System SHALL reject the coupon with an "expired" message

6.7 WHERE a coupon has a min_order_amount, THE Coupon_System SHALL verify that the cart subtotal meets or exceeds that amount

6.8 IF the cart subtotal is below min_order_amount, THEN THE Coupon_System SHALL reject the coupon with a minimum order requirement message

6.9 WHERE a coupon has a max_uses value, THE Coupon_System SHALL verify that usedCount is less than max_uses

6.10 IF usedCount equals or exceeds max_uses, THEN THE Coupon_System SHALL reject the coupon with an "usage limit reached" message

### Requirement 7: Per-User Coupon Tracking

**User Story:** As a store owner, I want to prevent customers from reusing single-use coupons, so that discounts are applied fairly.

#### Acceptance Criteria

7.1 WHEN a customer applies a coupon, THE Coupon_System SHALL query the user_coupon_usage table for that user_id and coupon_id combination

7.2 IF a user_coupon_usage record exists for that combination, THEN THE Coupon_System SHALL reject the coupon with an "already used" message

7.3 WHEN an order is confirmed with a coupon, THE Coupon_System SHALL insert a record into user_coupon_usage with the user_id, coupon_id, and order_id

7.4 WHEN an order is confirmed with a coupon, THE Coupon_System SHALL increment the usedCount field in the coupons table

7.5 WHEN an order with a coupon is cancelled, THE Coupon_System SHALL delete the corresponding user_coupon_usage record

7.6 WHEN an order with a coupon is cancelled, THE Coupon_System SHALL decrement the usedCount field in the coupons table

### Requirement 8: Discount Calculation

**User Story:** As a customer, I want my discount to be calculated correctly based on the coupon type, so that I receive the expected savings.

#### Acceptance Criteria

8.1 WHERE a coupon has discount_type "percentage", THE Checkout_System SHALL calculate discount_amount as (subtotal * discount_value / 100)

8.2 WHERE a coupon has discount_type "percentage" and the calculated discount exceeds the subtotal, THE Checkout_System SHALL cap discount_amount at the subtotal value

8.3 WHERE a coupon has discount_type "fixed", THE Checkout_System SHALL set discount_amount equal to discount_value

8.4 WHERE a coupon has discount_type "fixed" and discount_value exceeds the subtotal, THE Checkout_System SHALL cap discount_amount at the subtotal value

8.5 WHEN no coupon is applied, THE Checkout_System SHALL set discount_amount to zero

### Requirement 9: Category-Specific Tax Calculation

**User Story:** As a customer, I want GST to be calculated based on product categories, so that the correct tax amount is charged.

#### Acceptance Criteria

9.1 THE Tax_Calculator SHALL retrieve the tax_rate from the categories table for each Product_Variant's category

9.2 THE Tax_Calculator SHALL calculate the tax amount for each Product_Variant as (unit_price * quantity * tax_rate / 100)

9.3 THE Tax_Calculator SHALL sum all line item tax amounts to produce the total tax_amount

9.4 THE Checkout_System SHALL store the calculated tax_amount in the orders table

9.5 IF a category has no tax_rate defined, THEN THE Tax_Calculator SHALL use a tax_rate of zero for that category

### Requirement 10: Shipping Calculation

**User Story:** As a customer, I want shipping costs to be calculated based on my order value, so that I understand the delivery charges.

#### Acceptance Criteria

10.1 WHEN the order subtotal is less than the Shipping_Threshold, THE Shipping_Calculator SHALL set shipping_amount to ₹50.00

10.2 WHEN the order subtotal equals or exceeds the Shipping_Threshold, THE Shipping_Calculator SHALL set shipping_amount to ₹0.00

10.3 THE Checkout_System SHALL store the calculated shipping_amount in the orders table

### Requirement 11: Order Total Calculation

**User Story:** As a customer, I want the final order total to reflect all charges and discounts, so that I know exactly what I'm paying.

#### Acceptance Criteria

11.1 THE Checkout_System SHALL calculate subtotal as the sum of (unit_price * quantity) for all cart items

11.2 THE Checkout_System SHALL calculate Order_Total as (subtotal - discount_amount + tax_amount + shipping_amount)

11.3 THE Checkout_System SHALL store subtotal, discount_amount, tax_amount, shipping_amount, and total in the orders table

11.4 THE Checkout_System SHALL ensure that Order_Total is never negative

### Requirement 12: Order Creation

**User Story:** As a customer, I want to place an order with my shipping details, so that my purchase is recorded and products can be delivered.

#### Acceptance Criteria

12.1 WHEN a customer initiates checkout, THE Checkout_System SHALL validate that the cart contains at least one item

12.2 IF the cart is empty, THEN THE Checkout_System SHALL reject checkout with an "empty cart" message

12.3 WHEN creating an order, THE Order_System SHALL require a shipping_address containing recipient name, phone, address lines, city, state, and postal code

12.4 THE Order_System SHALL store the order record with status "pending"

12.5 THE Order_System SHALL create order_items records for each cart item with product_name, variant_title, sku, unit_price, quantity, and total

12.6 WHEN an order is created for an Authenticated_User, THE Cart_System SHALL delete all cart_items records for that user

12.7 WHEN an order is created for a Guest_User, THE Cart_System SHALL clear the Guest_Cart cookie

### Requirement 13: Razorpay Order Creation

**User Story:** As a customer, I want a payment order to be created with Razorpay, so that I can complete payment securely.

#### Acceptance Criteria

13.1 WHEN an order is created, THE Payment_System SHALL call the Razorpay API to create a Razorpay_Order with the Order_Total amount in INR

13.2 THE Payment_System SHALL store the returned razorpay_order_id in the payments table

13.3 THE Payment_System SHALL set the payment status to "pending"

13.4 THE Payment_System SHALL return the razorpay_order_id to the client for payment UI initialization

13.5 IF the Razorpay API call fails, THEN THE Payment_System SHALL rollback the order creation and return an error message

### Requirement 14: Payment Signature Verification

**User Story:** As a system, I want to verify Razorpay payment signatures, so that fraudulent payment confirmations are rejected.

#### Acceptance Criteria

14.1 WHEN the client submits payment completion data, THE Payment_System SHALL receive razorpay_order_id, razorpay_payment_id, and razorpay_signature

14.2 THE Payment_System SHALL compute the expected signature using HMAC SHA256 with the Razorpay key secret and the concatenation of razorpay_order_id and razorpay_payment_id

14.3 THE Payment_System SHALL compare the computed signature with the received Payment_Signature

14.4 IF the signatures match, THEN THE Payment_System SHALL update the payment status to "captured"

14.5 IF the signatures do not match, THEN THE Payment_System SHALL update the payment status to "failed" and reject the payment

14.6 WHEN payment status is updated to "captured", THE Order_System SHALL update the order status to "confirmed"

14.7 THE Payment_System SHALL store razorpay_payment_id and razorpay_signature in the payments table

### Requirement 15: Payment Webhook Handling

**User Story:** As a system, I want to receive Razorpay webhook notifications, so that payment status updates are processed even if the client connection fails.

#### Acceptance Criteria

15.1 WHEN a Razorpay webhook is received, THE Payment_System SHALL verify the webhook signature using the Razorpay webhook secret

15.2 IF the webhook signature is invalid, THEN THE Payment_System SHALL reject the webhook with HTTP 400 status

15.3 WHEN a "payment.captured" webhook is received with valid signature, THE Payment_System SHALL update the payment status to "captured"

15.4 WHEN a "payment.failed" webhook is received with valid signature, THE Payment_System SHALL update the payment status to "failed"

15.5 WHEN a payment status is updated via webhook, THE Order_System SHALL update the corresponding order status

15.6 THE Payment_System SHALL respond to valid webhooks with HTTP 200 status

### Requirement 16: Order Status Transitions

**User Story:** As an admin, I want to update order status as fulfillment progresses, so that customers can track their orders.

#### Acceptance Criteria

16.1 THE Order_System SHALL support status transitions from "pending" to "confirmed"

16.2 THE Order_System SHALL support status transitions from "confirmed" to "processing"

16.3 THE Order_System SHALL support status transitions from "processing" to "shipped"

16.4 THE Order_System SHALL support status transitions from "shipped" to "delivered"

16.5 THE Order_System SHALL support status transitions from any status except "delivered" or "returned" to "cancelled"

16.6 THE Order_System SHALL support status transitions from "delivered" to "returned"

16.7 THE Order_System SHALL support status transitions from "confirmed" or "cancelled" to "refunded"

16.8 WHEN an order status is updated, THE Order_System SHALL update the updated_at timestamp

### Requirement 17: Order Return Handling

**User Story:** As a customer, I want to return delivered orders, so that I can get a refund for unsatisfactory purchases.

#### Acceptance Criteria

17.1 WHEN an order with status "delivered" is marked as returned, THE Order_System SHALL update the order status to "returned"

17.2 WHEN an order transitions to "returned" status, THE Stock_System SHALL restore the stock quantities for all order items

17.3 WHEN an order transitions to "returned" status, THE Payment_System SHALL initiate a refund process

### Requirement 18: Order Viewing for Customers

**User Story:** As a customer, I want to view my order history, so that I can track past purchases and current orders.

#### Acceptance Criteria

18.1 WHEN an Authenticated_User requests their orders, THE Order_System SHALL retrieve all orders where user_id matches the authenticated user

18.2 THE Order_System SHALL return orders with all order_items, payment status, and order status

18.3 THE Order_System SHALL order results by created_at timestamp in descending order

18.4 THE Order_System SHALL apply row-level security to ensure users can only view their own orders

### Requirement 19: Order Viewing for Admins

**User Story:** As an admin, I want to view all orders, so that I can manage fulfillment and customer service.

#### Acceptance Criteria

19.1 WHEN an Authenticated_User with role "admin" requests orders, THE Order_System SHALL retrieve all orders regardless of user_id

19.2 THE Order_System SHALL support filtering orders by status

19.3 THE Order_System SHALL support filtering orders by date range

19.4 THE Order_System SHALL return orders with customer details, order_items, and payment information

### Requirement 20: Guest User Limitations

**User Story:** As a guest user, I want to be able to checkout without an account, so that I can make quick purchases.

#### Acceptance Criteria

20.1 THE Checkout_System SHALL allow Guest_User to proceed to checkout with a Guest_Cart

20.2 THE Checkout_System SHALL require Guest_User to provide email, phone, and shipping address during checkout

20.3 WHEN a Guest_User completes an order, THE Order_System SHALL create a profile record with role "customer" if the email does not exist

20.4 THE Checkout_System SHALL NOT allow Guest_User to apply coupons that require usage tracking

20.5 THE Order_System SHALL NOT allow Guest_User to view order history
