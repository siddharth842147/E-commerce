import { ProductGridSkeleton } from "@/components/shared/skeletons/ProductGridSkeleton";

export default function ShopLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 h-8 w-32 animate-pulse rounded-lg bg-muted" />
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 rounded-xl border bg-card p-4 lg:w-56">
          <div className="space-y-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <ProductGridSkeleton count={12} />
        </div>
      </div>
    </div>
  );
}
