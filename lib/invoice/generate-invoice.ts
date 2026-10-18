import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import InvoicePDF, { type InvoicePDFProps } from "./InvoicePDF";

export type { InvoicePDFProps } from "./InvoicePDF";

/**
 * Render an order invoice to a PDF Buffer.
 *
 * Uses `createElement` (not JSX) so this file can remain a plain `.ts` module.
 * The buffer is intended to be attached to the order confirmation email via
 * Resend's `attachments: [{ content: Buffer, filename, contentType }]`.
 *
 * Note: renderToBuffer from @react-pdf/renderer expects a React element whose
 * root is a Document component. We cast to `any` to satisfy the strict
 * DocumentProps type while keeping InvoicePDF as a standard React component.
 */
export async function generateInvoicePDF(
  orderData: InvoicePDFProps
): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(createElement(InvoicePDF, orderData) as any);
}
