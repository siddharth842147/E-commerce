import { getAdminOrders } from "@/actions/admin";
import { OrdersTableClient } from "./OrdersTableClient";

export const metadata = {
  title: "Orders Management | Kartiva Admin",
};

interface OrdersPageProps {
  searchParams: Promise<{ status?: string; search?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: OrdersPageProps) {
  const { status, search } = await searchParams;
  const res = await getAdminOrders({ status, search, limit: 100 });
  const initialOrders = res.success ? res.data.orders : [];

  return (
    <div className="max-w-7xl mx-auto">
      <OrdersTableClient initialOrders={initialOrders} />
    </div>
  );
}
