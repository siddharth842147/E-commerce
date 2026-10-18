/**
 * Kartiva Inngest functions — notification service
 *
 * All 7 functions are exported here and registered with the Inngest route
 * handler in app/api/inngest/route.ts.
 *
 * WhatsApp template names used across these functions:
 *   welcome, otp_verification, order_confirmed, order_shipped,
 *   order_delivered, order_cancelled, refund_processed
 *
 * These templates MUST be created and approved in Meta Business Manager
 * (WhatsApp Business → Message Templates) before they can be used in
 * production. In sandbox/development mode you can test with pre-approved
 * templates like "hello_world".
 *
 * MSG91 template IDs are referenced via the MSG91_TEMPLATE_ID env var in the
 * notification service. For per-event templates, extend sendSMS() to accept a
 * templateId override.
 */

export { welcomeFunction } from "./welcome";
export { otpFunction } from "./otp";
export { orderConfirmedFunction } from "./order-confirmed";
export { orderShippedFunction } from "./order-shipped";
export { orderDeliveredFunction } from "./order-delivered";
export { orderCancelledFunction } from "./order-cancelled";
export { refundProcessedFunction } from "./refund-processed";

import { welcomeFunction } from "./welcome";
import { otpFunction } from "./otp";
import { orderConfirmedFunction } from "./order-confirmed";
import { orderShippedFunction } from "./order-shipped";
import { orderDeliveredFunction } from "./order-delivered";
import { orderCancelledFunction } from "./order-cancelled";
import { refundProcessedFunction } from "./refund-processed";

/** Array of all functions to register with the Inngest serve handler. */
export const functions = [
  welcomeFunction,
  otpFunction,
  orderConfirmedFunction,
  orderShippedFunction,
  orderDeliveredFunction,
  orderCancelledFunction,
  refundProcessedFunction,
];
