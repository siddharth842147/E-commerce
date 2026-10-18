import Link from "next/link";
import { getOrders } from "@/actions/account";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { ShoppingBag, ChevronRight } from "lucide-react";

export default async function OrdersPage() {
  const result = await getOrders();
  const orders = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your order history
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed py-16 text-center">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium">No orders yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              When you place an order, it will appear here
            </p>
          </div>
          <Link
              href="/shop"
              className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
            >
              Start shopping
            </Link>
        </div>
      ) : (
        <div className="divide-y rounded-lg border bg-card">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 space-y-1">
                <p className="truncate font-mono text-sm font-medium">
                  #{order.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {" · "}
                  {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <OrderStatusBadge status={order.status} />
                <p className="font-medium">₹{Number(order.total).toLocaleString("en-IN")}</p>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
