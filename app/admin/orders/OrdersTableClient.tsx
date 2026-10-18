"use client";

import * as React from "react";
import {
  AdminOrderListItem,
  updateOrderStatus,
  updateOrderTracking,
  processRefund,
} from "@/actions/admin";
import { DataTable, ColumnDef } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Truck,
  RotateCcw,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  ExternalLink,
  CreditCard,
  Banknote,
  Send,
  Loader2,
} from "lucide-react";

interface OrdersTableClientProps {
  initialOrders: AdminOrderListItem[];
}

export function OrdersTableClient({ initialOrders }: OrdersTableClientProps) {
  const [orders, setOrders] = React.useState<AdminOrderListItem[]>(initialOrders);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [selectedOrder, setSelectedOrder] = React.useState<AdminOrderListItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = React.useState(false);
  const [isRefundOpen, setIsRefundOpen] = React.useState(false);
  const [isStatusOpen, setIsStatusOpen] = React.useState(false);

  // Form states
  const [trackingCarrier, setTrackingCarrier] = React.useState("");
  const [trackingId, setTrackingId] = React.useState("");
  const [targetStatus, setTargetStatus] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // Sync state if server data refreshes
  React.useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  // Filtered orders
  const filteredOrders = React.useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const handleOpenDetail = (order: AdminOrderListItem) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleOpenTracking = (order: AdminOrderListItem) => {
    setSelectedOrder(order);
    setTrackingCarrier(order.carrier || "BlueDart");
    setTrackingId(order.trackingId || "");
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsTrackingOpen(true);
  };

  const handleOpenStatus = (order: AdminOrderListItem) => {
    setSelectedOrder(order);
    setTargetStatus(order.status);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsStatusOpen(true);
  };

  const handleOpenRefund = (order: AdminOrderListItem) => {
    setSelectedOrder(order);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsRefundOpen(true);
  };

  // Submit tracking update
  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!trackingId.trim() || !trackingCarrier.trim()) {
      setErrorMsg("Please provide both carrier name and tracking ID.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const res = await updateOrderTracking({
      orderId: selectedOrder.id,
      trackingId: trackingId.trim(),
      carrier: trackingCarrier.trim(),
    });

    setIsLoading(false);

    if (res.success) {
      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === selectedOrder.id
            ? {
                ...ord,
                trackingId: trackingId.trim(),
                carrier: trackingCarrier.trim(),
                status:
                  ord.status === "confirmed" || ord.status === "processing"
                    ? "shipped"
                    : ord.status,
              }
            : ord
        )
      );
      setSuccessMsg("Tracking information updated successfully!");
      setTimeout(() => {
        setIsTrackingOpen(false);
      }, 1000);
    } else {
      setErrorMsg(res.error || "Failed to update tracking");
    }
  };

  // Submit status update
  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setIsLoading(true);
    setErrorMsg(null);

    const res = await updateOrderStatus({
      orderId: selectedOrder.id,
      status: targetStatus,
    });

    setIsLoading(false);

    if (res.success) {
      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === selectedOrder.id ? { ...ord, status: targetStatus } : ord
        )
      );
      setSuccessMsg(`Order status updated to ${targetStatus}!`);
      setTimeout(() => {
        setIsStatusOpen(false);
      }, 1000);
    } else {
      setErrorMsg(res.error || "Failed to update status");
    }
  };

  // Submit refund
  const handleConfirmRefund = async () => {
    if (!selectedOrder) return;

    setIsLoading(true);
    setErrorMsg(null);

    const res = await processRefund(selectedOrder.id);
    setIsLoading(false);

    if (res.success) {
      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === selectedOrder.id
            ? {
                ...ord,
                status: "refunded",
                payment: ord.payment ? { ...ord.payment, status: "refunded" } : null,
              }
            : ord
        )
      );
      setSuccessMsg("Refund processed successfully!");
      setTimeout(() => {
        setIsRefundOpen(false);
      }, 1200);
    } else {
      setErrorMsg(res.error || "Failed to process refund");
    }
  };

  const columns: ColumnDef<AdminOrderListItem>[] = [
    {
      key: "id",
      header: "Order ID",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="font-semibold text-foreground">
            #{row.id.slice(0, 8)}
          </span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(row.id);
            }}
            title="Copy full UUID"
            className="text-muted-foreground hover:text-foreground"
          >
            <Copy className="size-3" />
          </button>
        </div>
      ),
      exportFormat: (row) => row.id,
    },
    {
      key: "createdAt",
      header: "Date",
      sortable: true,
      render: (row) => (
        <div className="flex flex-col text-xs">
          <span className="font-medium text-foreground">
            {new Date(row.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          <span className="text-muted-foreground text-[10px]">
            {new Date(row.createdAt).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      ),
      exportFormat: (row) => new Date(row.createdAt).toISOString(),
    },
    {
      key: "customer.fullName",
      header: "Customer",
      sortable: true,
      render: (row) => (
        <div className="flex flex-col text-xs">
          <span className="font-semibold text-foreground">
            {row.customer.fullName || "Customer"}
          </span>
          <span className="text-muted-foreground text-[11px] truncate max-w-[160px]">
            {row.customer.email}
          </span>
        </div>
      ),
      exportFormat: (row) =>
        `${row.customer.fullName || ""} (${row.customer.email})`,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
          delivered: "default",
          shipped: "secondary",
          processing: "outline",
          confirmed: "secondary",
          pending: "outline",
          cancelled: "destructive",
          refunded: "destructive",
          returned: "destructive",
        };
        const variant = variants[row.status] || "outline";

        return (
          <Badge variant={variant} className="capitalize text-xs font-semibold">
            {row.status}
          </Badge>
        );
      },
      exportFormat: (row) => row.status,
    },
    {
      key: "trackingId",
      header: "Tracking ID",
      render: (row) => {
        if (row.trackingId) {
          return (
            <div className="flex flex-col text-xs">
              <span className="font-mono font-medium text-foreground">
                {row.trackingId}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {row.carrier || "Courier"}
              </span>
            </div>
          );
        }
        return (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => handleOpenTracking(row)}
            className="text-xs text-primary gap-1 h-6 px-1.5"
          >
            <Truck className="size-3" />
            <span>+ Add ID</span>
          </Button>
        );
      },
      exportFormat: (row) =>
        row.trackingId ? `${row.carrier || ""}: ${row.trackingId}` : "None",
    },
    {
      key: "payment.method",
      header: "Payment",
      render: (row) => (
        <div className="flex flex-col text-xs">
          <span className="uppercase font-semibold text-[11px] text-foreground">
            {row.payment?.method || "Online"}
          </span>
          <span
            className={`text-[10px] capitalize font-medium ${
              row.payment?.status === "captured"
                ? "text-emerald-600 dark:text-emerald-400"
                : row.payment?.status === "refunded"
                ? "text-rose-600 dark:text-rose-400"
                : "text-muted-foreground"
            }`}
          >
            {row.payment?.status || "Pending"}
          </span>
        </div>
      ),
      exportFormat: (row) =>
        `${row.payment?.method || "Unknown"} (${row.payment?.status || "pending"})`,
    },
    {
      key: "total",
      header: "Total",
      sortable: true,
      className: "text-right",
      render: (row) => (
        <div className="text-right font-bold text-foreground text-xs sm:text-sm">
          ₹{parseFloat(row.total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </div>
      ),
      exportFormat: (row) => row.total,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (row) => {
        const canRefund =
          ["confirmed", "processing", "shipped", "delivered"].includes(row.status) &&
          row.payment?.status !== "refunded";

        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="outline"
              size="xs"
              onClick={() => handleOpenDetail(row)}
              className="gap-1 h-7"
              title="View full order details"
            >
              <Eye className="size-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Details</span>
            </Button>

            <Button
              variant="outline"
              size="xs"
              onClick={() => handleOpenStatus(row)}
              className="gap-1 h-7"
              title="Update status"
            >
              <Clock className="size-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Status</span>
            </Button>

            <Button
              variant="outline"
              size="xs"
              onClick={() => handleOpenTracking(row)}
              className="gap-1 h-7"
              title="Update tracking number"
            >
              <Truck className="size-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Tracking</span>
            </Button>

            {canRefund && (
              <Button
                variant="destructive"
                size="xs"
                onClick={() => handleOpenRefund(row)}
                className="gap-1 h-7"
                title="Initiate refund"
              >
                <RotateCcw className="size-3.5" />
                <span className="hidden sm:inline">Refund</span>
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Orders Management</h2>
          <p className="text-xs text-muted-foreground">
            Manage customer orders, track fulfillment status, update shipping IDs, and process refunds.
          </p>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredOrders}
        columns={columns}
        searchKey="customer.fullName"
        searchPlaceholder="Search by customer, email, or order ID..."
        exportFilename="kartiva_orders"
        emptyMessage="No orders found matching the filter criteria."
        pageSize={10}
        filterComponent={
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-40 text-xs">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses ({orders.length})</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* ── Order Detail Modal ── */}
      {selectedOrder && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between text-base font-bold">
                <span>Order #{selectedOrder.id.slice(0, 8)}</span>
                <Badge variant="outline" className="capitalize">
                  {selectedOrder.status}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Placed on {new Date(selectedOrder.createdAt).toLocaleString("en-IN")}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 text-xs">
              {/* Customer & Shipping Summary */}
              <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3">
                <div>
                  <div className="font-semibold text-foreground">Customer</div>
                  <div className="text-muted-foreground mt-0.5">
                    {selectedOrder.customer.fullName || "Customer"}
                  </div>
                  <div className="text-muted-foreground">
                    {selectedOrder.customer.email}
                  </div>
                  {selectedOrder.customer.phone && (
                    <div className="text-muted-foreground">
                      {selectedOrder.customer.phone}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-foreground">Payment & Tracking</div>
                  <div className="text-muted-foreground mt-0.5">
                    Method: {selectedOrder.payment?.method || "Razorpay / Online"}
                  </div>
                  <div className="text-muted-foreground">
                    Status: {selectedOrder.payment?.status || "Pending"}
                  </div>
                  {selectedOrder.trackingId && (
                    <div className="font-mono text-primary font-medium mt-1">
                      {selectedOrder.carrier}: {selectedOrder.trackingId}
                    </div>
                  )}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="rounded-lg border divide-y">
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">
                    ₹{parseFloat(selectedOrder.subtotal).toFixed(2)}
                  </span>
                </div>
                {parseFloat(selectedOrder.discountAmount) > 0 && (
                  <div className="flex items-center justify-between p-2.5 text-emerald-600">
                    <span>Discount</span>
                    <span>-₹{parseFloat(selectedOrder.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium text-foreground">
                    ₹{parseFloat(selectedOrder.shippingAmount).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-muted-foreground">Tax / GST</span>
                  <span className="font-medium text-foreground">
                    ₹{parseFloat(selectedOrder.taxAmount).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-muted/40 font-bold text-sm">
                  <span>Total</span>
                  <span>₹{parseFloat(selectedOrder.total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsDetailOpen(false);
                  handleOpenTracking(selectedOrder);
                }}
              >
                Update Tracking
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setIsDetailOpen(false);
                  handleOpenStatus(selectedOrder);
                }}
              >
                Change Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Tracking ID Modal ── */}
      {selectedOrder && (
        <Dialog open={isTrackingOpen} onOpenChange={setIsTrackingOpen}>
          <DialogContent className="max-w-md">
            <form onSubmit={handleSaveTracking}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base font-bold">
                  <Truck className="size-4 text-primary" />
                  <span>Update Tracking Information</span>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Set or edit the shipping courier and tracking number for Order #{selectedOrder.id.slice(0, 8)}.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-3.5 py-4">
                {errorMsg && (
                  <div className="rounded-lg bg-destructive/10 p-2.5 text-xs font-medium text-destructive">
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="rounded-lg bg-emerald-500/10 p-2.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {successMsg}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="carrier" className="text-xs font-semibold">
                    Shipping Carrier
                  </Label>
                  <Select value={trackingCarrier} onValueChange={setTrackingCarrier}>
                    <SelectTrigger id="carrier" className="h-9 text-xs">
                      <SelectValue placeholder="Select Courier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BlueDart">BlueDart</SelectItem>
                      <SelectItem value="Delhivery">Delhivery</SelectItem>
                      <SelectItem value="India Post">India Post</SelectItem>
                      <SelectItem value="Shiprocket">Shiprocket</SelectItem>
                      <SelectItem value="DTDC">DTDC</SelectItem>
                      <SelectItem value="FedEx">FedEx</SelectItem>
                      <SelectItem value="XpressBees">XpressBees</SelectItem>
                      <SelectItem value="Other">Other Courier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="trackingId" className="text-xs font-semibold">
                    Tracking / Waybill ID
                  </Label>
                  <Input
                    id="trackingId"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    placeholder="e.g. BLUEDART-8891024"
                    className="h-9 font-mono text-xs"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Adding tracking will automatically set status to &quot;shipped&quot; and send a notification to the customer.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTrackingOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isLoading} className="gap-1.5">
                  {isLoading && <Loader2 className="size-3.5 animate-spin" />}
                  <span>Save Tracking</span>
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Status Update Modal ── */}
      {selectedOrder && (
        <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
          <DialogContent className="max-w-md">
            <form onSubmit={handleSaveStatus}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base font-bold">
                  <Clock className="size-4 text-primary" />
                  <span>Update Order Status</span>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Transition Order #{selectedOrder.id.slice(0, 8)} to a new fulfillment stage.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-3 py-4">
                {errorMsg && (
                  <div className="rounded-lg bg-destructive/10 p-2.5 text-xs font-medium text-destructive">
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="rounded-lg bg-emerald-500/10 p-2.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {successMsg}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="orderStatus" className="text-xs font-semibold">
                    New Status
                  </Label>
                  <Select value={targetStatus} onValueChange={setTargetStatus}>
                    <SelectTrigger id="orderStatus" className="h-9 text-xs capitalize">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled (Restores stock)</SelectItem>
                      <SelectItem value="returned">Returned</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Setting status to &quot;cancelled&quot; automatically rolls back inventory stock and coupon usage.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsStatusOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isLoading} className="gap-1.5">
                  {isLoading && <Loader2 className="size-3.5 animate-spin" />}
                  <span>Update Status</span>
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Refund Confirmation Modal ── */}
      {selectedOrder && (
        <Dialog open={isRefundOpen} onOpenChange={setIsRefundOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-destructive">
                <AlertCircle className="size-5" />
                <span>Process Order Refund</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Are you sure you want to refund Order #{selectedOrder.id.slice(0, 8)}?
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 py-3 text-xs">
              {errorMsg && (
                <div className="rounded-lg bg-destructive/10 p-2.5 text-xs font-medium text-destructive">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="rounded-lg bg-emerald-500/10 p-2.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {successMsg}
                </div>
              )}

              <div className="rounded-lg border bg-muted/40 p-3 flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Refund Amount:</span>
                  <span className="font-bold text-foreground">
                    ₹{parseFloat(selectedOrder.total).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium text-foreground">
                    {selectedOrder.customer.fullName} ({selectedOrder.customer.email})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span className="font-medium text-foreground uppercase">
                    {selectedOrder.payment?.method || "Online"}
                  </span>
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                This will trigger an API refund via Razorpay (or mark COD refunded), update order and payment statuses to &quot;refunded&quot;, and restore inventory stock to product variants in an atomic transaction.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsRefundOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleConfirmRefund}
                disabled={isLoading}
                className="gap-1.5"
              >
                {isLoading && <Loader2 className="size-3.5 animate-spin" />}
                <span>Confirm &amp; Refund</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
