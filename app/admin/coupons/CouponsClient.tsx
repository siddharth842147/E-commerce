"use client";

import * as React from "react";
import {
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
} from "@/actions/admin";
import type { Coupon } from "@/types/db";
import { DataTable, ColumnDef } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Tag,
  Copy,
  Sparkles,
  AlertCircle,
  Loader2,
  Calendar,
} from "lucide-react";

interface CouponsClientProps {
  initialCoupons: Coupon[];
}

export function CouponsClient({ initialCoupons }: CouponsClientProps) {
  const [coupons, setCoupons] = React.useState<Coupon[]>(initialCoupons);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // Modals
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [editingCoupon, setEditingCoupon] = React.useState<Coupon | null>(null);
  const [deletingCoupon, setDeletingCoupon] = React.useState<Coupon | null>(null);

  // Form State
  const [formCode, setFormCode] = React.useState("");
  const [formType, setFormType] = React.useState<"percentage" | "fixed">("percentage");
  const [formValue, setFormValue] = React.useState("");
  const [formMinOrder, setFormMinOrder] = React.useState("");
  const [formMaxUses, setFormMaxUses] = React.useState("");
  const [formExpiresAt, setFormExpiresAt] = React.useState("");
  const [formIsActive, setFormIsActive] = React.useState(true);

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    setCoupons(initialCoupons);
  }, [initialCoupons]);

  const filteredCoupons = React.useMemo(() => {
    if (statusFilter === "all") return coupons;
    if (statusFilter === "active") return coupons.filter((c) => c.isActive);
    if (statusFilter === "inactive") return coupons.filter((c) => !c.isActive);
    return coupons;
  }, [coupons, statusFilter]);

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormCode("");
    setFormType("percentage");
    setFormValue("10");
    setFormMinOrder("");
    setFormMaxUses("");
    setFormExpiresAt("");
    setFormIsActive(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormCode(coupon.code);
    setFormType(coupon.discountType);
    setFormValue(coupon.discountValue);
    setFormMinOrder(coupon.minOrderAmount || "");
    setFormMaxUses(coupon.maxUses ? String(coupon.maxUses) : "");
    setFormExpiresAt(
      coupon.expiresAt
        ? new Date(coupon.expiresAt).toISOString().split("T")[0]
        : ""
    );
    setFormIsActive(coupon.isActive);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const handleGenerateCode = () => {
    const prefixes = ["SALE", "SAVE", "FESTIVE", "KARTIVA", "FLASH", "DEAL"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(10 + Math.random() * 90);
    setFormCode(`${prefix}${num}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formValue) {
      setErrorMsg("Please provide a valid coupon code and discount value.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const inputData = {
      code: formCode.trim().toUpperCase(),
      discountType: formType,
      discountValue: parseFloat(formValue),
      minOrderAmount: formMinOrder ? parseFloat(formMinOrder) : null,
      maxUses: formMaxUses ? parseInt(formMaxUses, 10) : null,
      isActive: formIsActive,
      expiresAt: formExpiresAt || null,
    };

    let res;
    if (editingCoupon) {
      res = await updateCoupon(editingCoupon.id, inputData);
    } else {
      res = await createCoupon(inputData);
    }

    setIsLoading(false);

    if (res.success) {
      const saved = res.data;
      if (editingCoupon) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === saved.id ? saved : c))
        );
      } else {
        setCoupons((prev) => [saved, ...prev]);
      }
      setSuccessMsg(editingCoupon ? "Coupon updated!" : "Coupon created!");
      setTimeout(() => {
        setIsModalOpen(false);
      }, 800);
    } else {
      setErrorMsg(res.error || "Failed to save coupon");
    }
  };

  const handleToggle = async (coupon: Coupon) => {
    const res = await toggleCouponStatus(coupon.id);
    if (res.success) {
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? res.data : c))
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCoupon) return;
    setIsLoading(true);
    const res = await deleteCoupon(deletingCoupon.id);
    setIsLoading(false);

    if (res.success) {
      setCoupons((prev) => prev.filter((c) => c.id !== deletingCoupon.id));
      setIsDeleteOpen(false);
      setDeletingCoupon(null);
    } else {
      setErrorMsg(res.error || "Failed to delete coupon");
    }
  };

  const columns: ColumnDef<Coupon>[] = [
    {
      key: "code",
      header: "Coupon Code",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <Badge variant="secondary" className="font-bold tracking-wider px-2 py-0.5">
            {row.code}
          </Badge>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(row.code)}
            title="Copy Code"
            className="text-muted-foreground hover:text-foreground"
          >
            <Copy className="size-3" />
          </button>
        </div>
      ),
      exportFormat: (row) => row.code,
    },
    {
      key: "discountValue",
      header: "Discount",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1 font-semibold text-xs">
          {row.discountType === "percentage" ? (
            <span className="text-emerald-600 dark:text-emerald-400">
              {parseFloat(row.discountValue)}% OFF
            </span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400">
              ₹{parseFloat(row.discountValue).toFixed(2)} FLAT
            </span>
          )}
        </div>
      ),
      exportFormat: (row) =>
        row.discountType === "percentage"
          ? `${row.discountValue}%`
          : `₹${row.discountValue}`,
    },
    {
      key: "minOrderAmount",
      header: "Min Order",
      sortable: true,
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.minOrderAmount ? `₹${parseFloat(row.minOrderAmount).toFixed(2)}` : "No Min"}
        </span>
      ),
      exportFormat: (row) => row.minOrderAmount || "None",
    },
    {
      key: "usedCount",
      header: "Usage / Limit",
      sortable: true,
      render: (row) => (
        <div className="text-xs">
          <span className="font-medium text-foreground">{row.usedCount}</span>
          <span className="text-muted-foreground">
            {row.maxUses ? ` / ${row.maxUses}` : " (unlimited)"}
          </span>
        </div>
      ),
      exportFormat: (row) => `${row.usedCount} / ${row.maxUses || "unlimited"}`,
    },
    {
      key: "expiresAt",
      header: "Expiration",
      sortable: true,
      render: (row) => {
        const isExpired = row.expiresAt && new Date(row.expiresAt) < new Date();
        return (
          <div className="flex flex-col text-xs">
            <span className={isExpired ? "text-destructive font-medium" : "text-muted-foreground"}>
              {row.expiresAt
                ? new Date(row.expiresAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Never"}
            </span>
            {isExpired && (
              <span className="text-[10px] text-destructive">Expired</span>
            )}
          </div>
        );
      },
      exportFormat: (row) => (row.expiresAt ? new Date(row.expiresAt).toISOString() : "Never"),
    },
    {
      key: "isActive",
      header: "Status",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.isActive}
            onCheckedChange={() => handleToggle(row)}
            title="Toggle active"
          />
          <Badge
            variant={row.isActive ? "default" : "outline"}
            className="text-[11px] capitalize"
          >
            {row.isActive ? "Active" : "Disabled"}
          </Badge>
        </div>
      ),
      exportFormat: (row) => (row.isActive ? "Active" : "Disabled"),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="xs"
            onClick={() => handleOpenEdit(row)}
            className="gap-1 h-7"
            title="Edit coupon"
          >
            <Pencil className="size-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Edit</span>
          </Button>

          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => {
              setDeletingCoupon(row);
              setIsDeleteOpen(true);
            }}
            className="text-destructive hover:bg-destructive/10"
            title="Delete coupon"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Coupon Management</h2>
          <p className="text-xs text-muted-foreground">
            Create promotional voucher codes, minimum purchase requirements, and validity rules.
          </p>
        </div>
        <Button onClick={handleOpenCreate} size="sm" className="gap-1.5 shadow-sm">
          <Plus className="size-4" />
          <span>Create Coupon</span>
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredCoupons}
        columns={columns}
        searchKey="code"
        searchPlaceholder="Search coupon code..."
        exportFilename="kartiva_coupons"
        emptyMessage="No promotional coupons found."
        pageSize={10}
        filterComponent={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-32 text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Coupons</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Disabled Only</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* ── Coupon Create / Edit Modal ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <Tag className="size-4 text-primary" />
                <span>{editingCoupon ? "Edit Coupon" : "Create New Coupon"}</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Configure discount rules and usage restrictions.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3.5 py-4 text-xs">
              {errorMsg && (
                <div className="rounded-lg bg-destructive/10 p-2.5 font-medium text-destructive">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="rounded-lg bg-emerald-500/10 p-2.5 font-medium text-emerald-600 dark:text-emerald-400">
                  {successMsg}
                </div>
              )}

              {/* Code */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="couponCode" className="text-xs font-semibold">
                    Promo Code *
                  </Label>
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    className="flex items-center gap-1 text-[10px] text-primary hover:underline"
                  >
                    <Sparkles className="size-2.5" />
                    <span>Generate Code</span>
                  </button>
                </div>
                <Input
                  id="couponCode"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FESTIVE20"
                  className="h-9 font-mono font-semibold text-xs tracking-wider uppercase"
                  required
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold">Discount Type</Label>
                  <Select
                    value={formType}
                    onValueChange={(val: "percentage" | "fixed") => setFormType(val)}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Flat Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="couponVal" className="text-xs font-semibold">
                    {formType === "percentage" ? "Percentage (% Off)" : "Amount (₹ Off)"} *
                  </Label>
                  <Input
                    id="couponVal"
                    type="number"
                    step="0.01"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    placeholder={formType === "percentage" ? "15" : "250"}
                    className="h-9 text-xs"
                    required
                  />
                </div>
              </div>

              {/* Min Order & Max Uses */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="couponMin" className="text-xs font-semibold">
                    Min Order Amount (₹)
                  </Label>
                  <Input
                    id="couponMin"
                    type="number"
                    step="0.01"
                    value={formMinOrder}
                    onChange={(e) => setFormMinOrder(e.target.value)}
                    placeholder="e.g. 999.00"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="couponUses" className="text-xs font-semibold">
                    Max Redemptions
                  </Label>
                  <Input
                    id="couponUses"
                    type="number"
                    value={formMaxUses}
                    onChange={(e) => setFormMaxUses(e.target.value)}
                    placeholder="e.g. 100"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Expiry Date */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="couponExpiry" className="text-xs font-semibold">
                  Expiration Date (Optional)
                </Label>
                <Input
                  id="couponExpiry"
                  type="date"
                  value={formExpiresAt}
                  onChange={(e) => setFormExpiresAt(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Is Active */}
              <div className="flex items-center gap-2 pt-1">
                <Switch
                  id="formIsActive"
                  checked={formIsActive}
                  onCheckedChange={setFormIsActive}
                />
                <Label htmlFor="formIsActive" className="text-xs cursor-pointer font-medium">
                  Coupon is active immediately
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isLoading} className="gap-1.5">
                {isLoading && <Loader2 className="size-3.5 animate-spin" />}
                <span>{editingCoupon ? "Save Changes" : "Create Coupon"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Modal ── */}
      {deletingCoupon && (
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive text-base font-bold">
                <AlertCircle className="size-5" />
                <span>Delete Coupon</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Are you sure you want to delete promo code &quot;{deletingCoupon.code}&quot;? Customers will no longer be able to use it during checkout.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : "Delete Coupon"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
