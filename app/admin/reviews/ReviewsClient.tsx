"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AdminReviewListItem,
  updateReviewStatus,
  deleteReview,
} from "@/actions/admin";
import { DataTable, ColumnDef } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Star,
  Check,
  X,
  Trash2,
  AlertCircle,
  Package,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface ReviewsClientProps {
  initialReviews: AdminReviewListItem[];
}

export function ReviewsClient({ initialReviews }: ReviewsClientProps) {
  const [reviews, setReviews] = React.useState<AdminReviewListItem[]>(initialReviews);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [deletingReview, setDeletingReview] = React.useState<AdminReviewListItem | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  const filteredReviews = React.useMemo(() => {
    if (statusFilter === "all") return reviews;
    return reviews.filter((r) => r.status === statusFilter);
  }, [reviews, statusFilter]);

  const handleUpdateStatus = async (
    reviewId: string,
    newStatus: "approved" | "rejected" | "pending"
  ) => {
    setActionLoadingId(reviewId);
    const res = await updateReviewStatus(reviewId, newStatus);
    setActionLoadingId(null);

    if (res.success) {
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, status: newStatus } : r))
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingReview) return;
    setActionLoadingId(deletingReview.id);
    const res = await deleteReview(deletingReview.id);
    setActionLoadingId(null);

    if (res.success) {
      setReviews((prev) => prev.filter((r) => r.id !== deletingReview.id));
      setIsDeleteOpen(false);
      setDeletingReview(null);
    }
  };

  const columns: ColumnDef<AdminReviewListItem>[] = [
    {
      key: "product.name",
      header: "Product",
      sortable: true,
      render: (row) => {
        const prod = row.product;
        const img = prod?.images?.[0];

        return (
          <div className="flex items-center gap-2.5">
            <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
              {img ? (
                <Image
                  src={img}
                  alt={prod?.name || "Product"}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                <Package className="size-4 text-muted-foreground/50" />
              )}
            </div>
            <div className="flex flex-col min-w-0 max-w-[180px]">
              <span className="font-semibold text-foreground text-xs line-clamp-1">
                {prod?.name || "Product"}
              </span>
              {prod?.slug && (
                <Link
                  href={`/shop/${prod.slug}`}
                  target="_blank"
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                >
                  <span>View product</span>
                  <ExternalLink className="size-2.5" />
                </Link>
              )}
            </div>
          </div>
        );
      },
      exportFormat: (row) => row.product?.name || "Product",
    },
    {
      key: "authorName",
      header: "Reviewer",
      sortable: true,
      render: (row) => (
        <div className="flex flex-col text-xs">
          <span className="font-semibold text-foreground">{row.authorName}</span>
          <span className="text-[11px] text-muted-foreground">{row.authorEmail || "—"}</span>
        </div>
      ),
      exportFormat: (row) => `${row.authorName} (${row.authorEmail || ""})`,
    },
    {
      key: "rating",
      header: "Rating",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1">
          <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`size-3.5 ${
                  i < row.rating
                    ? "fill-amber-400 text-amber-400"
                    : "fill-muted text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-bold text-foreground ml-1">{row.rating}.0</span>
        </div>
      ),
      exportFormat: (row) => `${row.rating} Stars`,
    },
    {
      key: "comment",
      header: "Review Content",
      render: (row) => (
        <div className="flex flex-col gap-0.5 text-xs max-w-xs">
          {row.title && (
            <span className="font-semibold text-foreground line-clamp-1">
              &quot;{row.title}&quot;
            </span>
          )}
          <span className="text-muted-foreground line-clamp-2 leading-relaxed">
            {row.comment}
          </span>
        </div>
      ),
      exportFormat: (row) => `${row.title ? `${row.title}: ` : ""}${row.comment}`,
    },
    {
      key: "createdAt",
      header: "Date",
      sortable: true,
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
      exportFormat: (row) => new Date(row.createdAt).toISOString(),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
          approved: "default",
          pending: "outline",
          rejected: "destructive",
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
      key: "actions",
      header: "Moderation",
      className: "text-right",
      render: (row) => {
        const isCurrentLoading = actionLoadingId === row.id;

        return (
          <div className="flex items-center justify-end gap-1.5">
            {row.status !== "approved" && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => handleUpdateStatus(row.id, "approved")}
                disabled={isCurrentLoading}
                className="gap-1 h-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800"
                title="Approve Review"
              >
                <Check className="size-3" />
                <span className="hidden sm:inline">Approve</span>
              </Button>
            )}

            {row.status !== "rejected" && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => handleUpdateStatus(row.id, "rejected")}
                disabled={isCurrentLoading}
                className="gap-1 h-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 border-amber-300 dark:border-amber-800"
                title="Reject Review"
              >
                <X className="size-3" />
                <span className="hidden sm:inline">Reject</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                setDeletingReview(row);
                setIsDeleteOpen(true);
              }}
              className="text-destructive hover:bg-destructive/10"
              title="Delete Review"
            >
              <Trash2 className="size-3.5" />
            </Button>
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
          <h2 className="text-2xl font-bold tracking-tight">Review Moderation</h2>
          <p className="text-xs text-muted-foreground">
            Approve verified customer feedback, flag spam, and monitor product satisfaction.
          </p>
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={filteredReviews}
        columns={columns}
        searchKey="authorName"
        searchPlaceholder="Search reviews by author, product, or comment..."
        exportFilename="kartiva_reviews"
        emptyMessage="No customer reviews found matching criteria."
        pageSize={10}
        filterComponent={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-36 text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reviews ({reviews.length})</SelectItem>
              <SelectItem value="pending">Pending Approval</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* ── Delete Modal ── */}
      {deletingReview && (
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive text-base font-bold">
                <AlertCircle className="size-5" />
                <span>Delete Customer Review</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Are you sure you want to permanently delete this review by &quot;{deletingReview.authorName}&quot;?
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
                disabled={actionLoadingId !== null}
              >
                {actionLoadingId ? <Loader2 className="size-3.5 animate-spin" /> : "Delete Review"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
