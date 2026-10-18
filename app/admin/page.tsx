import Link from "next/link";
import {
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Users,
  Package,
  ArrowRight,
  PlusCircle,
  Tag,
  Star,
  ExternalLink,
} from "lucide-react";
import { getAdminDashboardData } from "@/actions/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardCharts } from "@/components/admin/DashboardCharts";

export const metadata = {
  title: "Admin Console | Kartiva",
};

export const instant = false;

export default async function AdminDashboardPage() {
  const res = await getAdminDashboardData();
  const data = res.success
    ? res.data
    : {
        metrics: {
          totalRevenue: 0,
          totalOrders: 0,
          avgOrderValue: 0,
          totalCustomers: 0,
          totalProducts: 0,
        },
        ordersByStatus: {},
        salesTrend: [],
        lowStockAlerts: [],
        recentOrders: [],
        categoryBreakdown: [],
      };

  const { metrics, lowStockAlerts, recentOrders } = data;

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Store Overview
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time business performance, inventory alerts, and customer activity.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/products"
            className={buttonVariants({ size: "sm", className: "gap-1.5 shadow-sm" })}
          >
            <PlusCircle className="size-4" />
            <span>Add Product</span>
          </Link>
          <Link
            href="/admin/orders"
            className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5" })}
          >
            <ShoppingBag className="size-4 text-muted-foreground" />
            <span>Orders</span>
          </Link>
          <Link
            href="/admin/coupons"
            className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5" })}
          >
            <Tag className="size-4 text-muted-foreground" />
            <span>Coupons</span>
          </Link>
          <Link
            href="/admin/reviews"
            className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5" })}
          >
            <Star className="size-4 text-muted-foreground" />
            <span>Reviews</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card className="shadow-sm border bg-card transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Revenue
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <IndianRupee className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold tracking-tight">
              ₹{metrics.totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <span className="inline-flex items-center text-emerald-600 font-medium">
                <TrendingUp className="size-3 mr-0.5" /> Active
              </span>
              <span>across all completed orders</span>
            </p>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="shadow-sm border bg-card transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Orders
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShoppingBag className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold tracking-tight">
              {metrics.totalOrders}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center justify-between">
              <span>{data.ordersByStatus.pending || 0} pending processing</span>
              <Link href="/admin/orders" className="text-primary hover:underline font-medium">
                View all &rarr;
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Average Order Value */}
        <Card className="shadow-sm border bg-card transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Avg Order Value
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <TrendingUp className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold tracking-tight">
              ₹{metrics.avgOrderValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Average basket size per order
            </p>
          </CardContent>
        </Card>

        {/* Customers & Catalog */}
        <Card className="shadow-sm border bg-card transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Customers & Products
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Users className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-extrabold tracking-tight">
                {metrics.totalCustomers}
              </div>
              <span className="text-xs text-muted-foreground font-medium">users</span>
              <span className="text-muted-foreground/40">•</span>
              <div className="text-2xl font-extrabold tracking-tight">
                {metrics.totalProducts}
              </div>
              <span className="text-xs text-muted-foreground font-medium">items</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center justify-between">
              <span>Catalog & users active</span>
              <Link href="/admin/customers" className="text-primary hover:underline font-medium">
                Customer list &rarr;
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts Section */}
      {lowStockAlerts.length > 0 && (
        <Card className="border-amber-200/80 bg-amber-500/5 dark:border-amber-900/50 dark:bg-amber-950/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="size-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  Low-Stock Inventory Alerts ({lowStockAlerts.length})
                </CardTitle>
                <CardDescription className="text-xs text-amber-800/80 dark:text-amber-300/80">
                  The following product variants have 10 or fewer units remaining in stock.
                </CardDescription>
              </div>
            </div>
            <Link
              href="/admin/products"
              className={buttonVariants({ variant: "outline", size: "xs", className: "border-amber-300 text-amber-900 dark:border-amber-800 dark:text-amber-200" })}
            >
              Manage Stock
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {lowStockAlerts.map((variant) => (
                <div
                  key={variant.id}
                  className="flex items-center justify-between rounded-lg border border-amber-200/60 bg-background/80 p-3 backdrop-blur-sm dark:border-amber-900/40"
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="truncate text-xs font-semibold text-foreground">
                      {variant.productName}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {variant.title} ({variant.sku})
                    </span>
                  </div>
                  <Badge
                    variant="destructive"
                    className="shrink-0 font-bold text-xs"
                  >
                    {variant.stock} left
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interactive Charts Section */}
      <DashboardCharts
        salesTrend={data.salesTrend}
        ordersByStatus={data.ordersByStatus}
        categoryBreakdown={data.categoryBreakdown}
      />

      {/* Recent Orders Section */}
      <Card className="shadow-sm border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b bg-muted/20">
          <div>
            <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
            <CardDescription className="text-xs">
              Latest transactions placed on Kartiva
            </CardDescription>
          </div>
          <Link
            href="/admin/orders"
            className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5 text-xs" })}
          >
            <span>View All Orders</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentOrders.length > 0 ? (
            <div className="divide-y text-sm">
              {recentOrders.map((ord) => {
                const statusBadgeVariant =
                  ord.status === "delivered"
                    ? "default"
                    : ord.status === "cancelled" || ord.status === "refunded"
                    ? "destructive"
                    : "secondary";

                return (
                  <div
                    key={ord.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/30 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground font-mono text-xs font-bold">
                        #{ord.id.slice(0, 4)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">
                          {ord.customerName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {ord.customerEmail} • {ord.itemsCount} item{ord.itemsCount > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <Badge variant={statusBadgeVariant} className="capitalize text-xs">
                        {ord.status}
                      </Badge>
                      <div className="text-right">
                        <div className="font-bold text-foreground">
                          ₹{parseFloat(ord.total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                      <Link
                        href={`/admin/orders?search=${ord.id}`}
                        title="View Order"
                        className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                      >
                        <ExternalLink className="size-4 text-muted-foreground" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No orders placed yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
