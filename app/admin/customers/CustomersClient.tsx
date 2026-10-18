"use client";

import * as React from "react";
import Link from "next/link";
import { AdminCustomerListItem } from "@/actions/admin";
import { DataTable, ColumnDef } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  ShoppingBag,
  Mail,
  Phone,
  Copy,
  ExternalLink,
} from "lucide-react";

interface CustomersClientProps {
  initialCustomers: AdminCustomerListItem[];
}

export function CustomersClient({ initialCustomers }: CustomersClientProps) {
  const [customers, setCustomers] = React.useState<AdminCustomerListItem[]>(initialCustomers);
  const [roleFilter, setRoleFilter] = React.useState<string>("all");

  React.useEffect(() => {
    setCustomers(initialCustomers);
  }, [initialCustomers]);

  const filteredCustomers = React.useMemo(() => {
    if (roleFilter === "all") return customers;
    return customers.filter((c) => c.role === roleFilter);
  }, [customers, roleFilter]);

  const columns: ColumnDef<AdminCustomerListItem>[] = [
    {
      key: "fullName",
      header: "Customer",
      sortable: true,
      render: (row) => {
        const initials = (row.fullName || row.email || "C")
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();

        return (
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {initials}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground text-xs sm:text-sm">
                {row.fullName || "Unspecified Name"}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Joined{" "}
                {new Date(row.createdAt).toLocaleDateString("en-IN", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        );
      },
      exportFormat: (row) => row.fullName || "Unspecified",
    },
    {
      key: "email",
      header: "Contact Info",
      sortable: true,
      render: (row) => (
        <div className="flex flex-col text-xs">
          <div className="flex items-center gap-1.5 text-foreground font-medium">
            <Mail className="size-3 text-muted-foreground" />
            <span>{row.email}</span>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(row.email)}
              title="Copy Email"
              className="text-muted-foreground hover:text-foreground ml-0.5"
            >
              <Copy className="size-2.5" />
            </button>
          </div>
          {row.phone && (
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] mt-0.5">
              <Phone className="size-3" />
              <span>{row.phone}</span>
            </div>
          )}
        </div>
      ),
      exportFormat: (row) => `${row.email} ${row.phone ? `(${row.phone})` : ""}`,
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      render: (row) => (
        <Badge
          variant={row.role === "admin" ? "default" : "secondary"}
          className="text-xs capitalize font-semibold"
        >
          {row.role}
        </Badge>
      ),
      exportFormat: (row) => row.role,
    },
    {
      key: "ordersCount",
      header: "Orders Placed",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs">
          <Badge variant="outline" className="font-semibold text-xs">
            {row.ordersCount} {row.ordersCount === 1 ? "order" : "orders"}
          </Badge>
        </div>
      ),
      exportFormat: (row) => String(row.ordersCount),
    },
    {
      key: "totalSpent",
      header: "Total Spent",
      sortable: true,
      className: "text-right",
      render: (row) => (
        <div className="text-right font-bold text-foreground text-xs sm:text-sm">
          ₹{row.totalSpent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </div>
      ),
      exportFormat: (row) => String(row.totalSpent),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            href={`/admin/orders?search=${encodeURIComponent(row.email)}`}
            className={buttonVariants({ variant: "outline", size: "xs", className: "gap-1 h-7 text-xs" })}
          >
            <ShoppingBag className="size-3 text-muted-foreground" />
            <span>View Orders</span>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Customer Directory</h2>
          <p className="text-xs text-muted-foreground">
            View registered user profiles, cumulative purchase volume, and order history.
          </p>
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={filteredCustomers}
        columns={columns}
        searchKey="email"
        searchPlaceholder="Search customers by name, email, or phone..."
        exportFilename="kartiva_customers"
        emptyMessage="No customers found matching the search criteria."
        pageSize={10}
        filterComponent={
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-9 w-32 text-xs">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="customer">Customers</SelectItem>
              <SelectItem value="admin">Administrators</SelectItem>
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}
