import { type NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/db";
import { orders, orderItems, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateInvoicePDF } from "@/lib/invoice/generate-invoice";

/**
 * GET /api/orders/[orderId]/invoice
 *
 * Streams a PDF invoice for the given order. The request user must own the
 * order (or be an admin — for now, owner-only is enforced).
 *
 * Returns the PDF as an attachment download.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await params;

  try {
    // Fetch order and verify ownership
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order || order.userId !== user.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    const [payment] = await db
      .select({ method: payments.method })
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .limit(1);

    // Build shipping address from jsonb
    const addr = order.shippingAddress as {
      recipientName?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      phone?: string;
    };

    const pdfBuffer = await generateInvoicePDF({
      invoiceNumber: order.id,
      orderDate: order.createdAt,
      customerName: addr.recipientName ?? "Customer",
      shippingAddress: {
        recipientName: addr.recipientName ?? "",
        addressLine1: addr.addressLine1 ?? "",
        addressLine2: addr.addressLine2,
        city: addr.city ?? "",
        state: addr.state ?? "",
        postalCode: addr.postalCode ?? "",
        phone: addr.phone ?? "",
      },
      items: items.map((i) => ({
        productName: i.productName,
        variantTitle: i.variantTitle,
        sku: i.sku,
        quantity: i.quantity,
        unitPrice: `₹${Number(i.unitPrice).toFixed(2)}`,
        total: `₹${Number(i.total).toFixed(2)}`,
      })),
      subtotal: `₹${Number(order.subtotal).toFixed(2)}`,
      discount: `₹${Number(order.discountAmount).toFixed(2)}`,
      tax: `₹${Number(order.taxAmount).toFixed(2)}`,
      shipping: `₹${Number(order.shippingAmount).toFixed(2)}`,
      total: `₹${Number(order.total).toFixed(2)}`,
      paymentMethod: payment?.method === "cod" ? "Cash on Delivery" : "Razorpay",
      orderStatus: order.status,
    });

    const filename = `invoice-${order.id.slice(0, 8).toUpperCase()}.pdf`;

    // Slice to a plain ArrayBuffer for the Web Response API (avoids Buffer/Uint8Array BodyInit mismatch)
    const arrayBuffer = pdfBuffer.buffer.slice(
      pdfBuffer.byteOffset,
      pdfBuffer.byteOffset + pdfBuffer.byteLength
    );

    return new Response(arrayBuffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("[invoice] Failed to generate PDF:", error);
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
  }
}
