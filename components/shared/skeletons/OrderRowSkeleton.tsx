import { Skeleton } from "@/components/ui/skeleton";

export function OrderRowSkeleton() {
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-lg border p-4"
      aria-hidden="true"
    >
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}
