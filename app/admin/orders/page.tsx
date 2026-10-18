import { Suspense } from "react";
import { getAdminOrders } from "@/actions/admin";
import { OrdersTableClient } from "./OrdersTableClient";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Orders Management | Kartiva Admin",
};

export const instant = false;

interface OrdersPageProps {
  searchParams: Promise<{ status?: string; search?: string }>;
}

async function OrdersContent({ searchParams }: OrdersPageProps) {
  const { status, search } = await searchParams;
  const res = await getAdminOrders({ status, search, limit: 100 });
  const initialOrders = res.success ? res.data.orders : [];

  return <OrdersTableClient initialOrders={initialOrders} />;
}

function OrdersTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-9 w-28" />
      </div>
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-72 w-full rounded-lg" />
    </div>
  );
}

export default function AdminOrdersPage({ searchParams }: OrdersPageProps) {
  return (
    <div className="max-w-7xl mx-auto">
      <Suspense fallback={<OrdersTableSkeleton />}>
        <OrdersContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
