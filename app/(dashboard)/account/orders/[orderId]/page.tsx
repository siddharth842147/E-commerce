import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderDetail } from "@/actions/account";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, MapPin, Package } from "lucide-react";

export const instant = false;

// Status timeline — shows progress through the order lifecycle
const STATUS_STEPS = ["pending", "confirmed", "shipped", "delivered"] as const;

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const isCancelled = ["cancelled", "refunded", "returned"].includes(currentStatus);
  const currentIdx = STATUS_STEPS.indexOf(currentStatus as (typeof STATUS_STEPS)[number]);

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <span className="h-2 w-2 rounded-full bg-destructive" />
        Order {currentStatus}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0">
      {STATUS_STEPS.map((step, idx) => {
        const done = idx <= currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`h-3 w-3 rounded-full border-2 transition-colors ${
                  done
                    ? "border-foreground bg-foreground"
                    : "border-muted-foreground bg-background"
                } ${active ? "ring-2 ring-foreground ring-offset-2" : ""}`}
                aria-label={step}
              />
              <span
                className={`text-xs capitalize ${
                  done ? "text-foreground font-medium" : "text-muted-foreground"
                }`}
              >
                {step}
              </span>
            </div>
            {idx < STATUS_STEPS.length - 1 && (
              <div
                className={`mb-4 h-0.5 w-10 sm:w-16 transition-colors ${
                  idx < currentIdx ? "bg-foreground" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface OrderDetailPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { orderId } = await params;
  const result = await getOrderDetail(orderId);

  if (!result.success) notFound();
  const order = result.data;

  const addr = order.shippingAddress;
  const orderRef = order.id.slice(0, 8).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Link href="/account/orders" className="inline-flex h-7 items-center gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] font-medium hover:bg-muted -ml-2">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to orders
            </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            Order #{orderRef}
          </h1>
          <p className="text-sm text-muted-foreground">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          <a
              href={`/api/orders/${order.id}/invoice`}
              download
              className="inline-flex h-7 items-center gap-1 rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted"
            >
              <Download className="mr-1 h-4 w-4" />
              Invoice
            </a>
        </div>
      </div>

      {/* Status timeline */}
      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Order status
        </h2>
        <StatusTimeline currentStatus={order.status} />
      </div>

      {/* Items */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Package className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">
            {order.items.length} {order.items.length === 1 ? "item" : "items"}
          </h2>
        </div>
        <div className="divide-y">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0 space-y-0.5">
                <p className="font-medium leading-snug">{item.productName}</p>
                <p className="text-sm text-muted-foreground">
                  {item.variantTitle} · SKU: {item.sku}
                </p>
                <p className="text-sm text-muted-foreground">
                  ₹{Number(item.unitPrice).toLocaleString("en-IN")} × {item.quantity}
                </p>
              </div>
              <p className="shrink-0 font-medium">
                ₹{Number(item.total).toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary + Address */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Order totals */}
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <h2 className="font-semibold">Order summary</h2>
          <Separator />
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{Number(order.subtotal).toLocaleString("en-IN")}</span>
            </div>
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Discount</span>
                <span>−₹{Number(order.discountAmount).toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST</span>
              <span>₹{Number(order.taxAmount).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>
                {Number(order.shippingAmount) === 0
                  ? "Free"
                  : `₹${Number(order.shippingAmount).toLocaleString("en-IN")}`}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>₹{Number(order.total).toLocaleString("en-IN")}</span>
            </div>
            {order.paymentMethod && (
              <p className="text-xs text-muted-foreground capitalize pt-1">
                Paid via {order.paymentMethod === "cod" ? "Cash on Delivery" : "Razorpay"}
                {order.paymentStatus && ` · ${order.paymentStatus}`}
              </p>
            )}
          </div>
        </div>

        {/* Shipping address */}
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Shipping address</h2>
          </div>
          <Separator />
          <div className="text-sm space-y-0.5">
            <p className="font-medium">{addr.recipientName}</p>
            <p className="text-muted-foreground">{addr.addressLine1}</p>
            {addr.addressLine2 && (
              <p className="text-muted-foreground">{addr.addressLine2}</p>
            )}
            <p className="text-muted-foreground">
              {addr.city}, {addr.state} {addr.postalCode}
            </p>
            {addr.phone && <p className="text-muted-foreground">{addr.phone}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
