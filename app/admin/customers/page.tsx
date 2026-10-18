import { getAdminCustomers } from "@/actions/admin";
import { CustomersClient } from "./CustomersClient";

export const metadata = {
  title: "Customers | Kartiva Admin",
};

export const instant = false;

export default async function AdminCustomersPage() {
  const res = await getAdminCustomers({ limit: 100 });
  const customers = res.success ? res.data.customers : [];

  return (
    <div className="max-w-7xl mx-auto">
      <CustomersClient initialCustomers={customers} />
    </div>
  );
}
