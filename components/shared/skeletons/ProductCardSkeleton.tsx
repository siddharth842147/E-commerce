import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm",
        className
      )}
      aria-hidden="true"
    >
      {/* Image placeholder */}
      <Skeleton className="aspect-square w-full rounded-none" />

      {/* Details */}
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="mt-2 h-8 w-full" />
      </div>
    </div>
  );
}
