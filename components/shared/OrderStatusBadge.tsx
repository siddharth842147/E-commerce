import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "@/components/ui/badge";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

const STATUS_MAP: Record<string, { label: string; variant: BadgeVariant; className: string }> = {
  pending: { label: "Pending", variant: "outline", className: "border-yellow-400 text-yellow-700 dark:text-yellow-400" },
  confirmed: { label: "Confirmed", variant: "outline", className: "border-blue-400 text-blue-700 dark:text-blue-400" },
  processing: { label: "Processing", variant: "outline", className: "border-indigo-400 text-indigo-700 dark:text-indigo-400" },
  shipped: { label: "Shipped", variant: "default", className: "bg-blue-600 text-white" },
  delivered: { label: "Delivered", variant: "default", className: "bg-green-600 text-white" },
  cancelled: { label: "Cancelled", variant: "destructive", className: "" },
  refunded: { label: "Refunded", variant: "outline", className: "border-orange-400 text-orange-700 dark:text-orange-400" },
  returned: { label: "Returned", variant: "secondary", className: "" },
};

interface OrderStatusBadgeProps {
  status: string;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = STATUS_MAP[status.toLowerCase()] ?? {
    label: status,
    variant: "outline" as BadgeVariant,
    className: "",
  };

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
