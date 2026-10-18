import { Suspense } from "react";
import Link from "next/link";
import { ShoppingCartIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CartItemRow } from "@/components/shared/CartItemRow";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { getCart } from "@/actions/cart";

export const metadata = {
  title: "Shopping Cart",
  description: "Review items in your shopping bag, apply promo coupons, and proceed to checkout.",
  openGraph: {
    title: "Shopping Cart | Kartiva",
    description: "Review items in your shopping bag, apply promo coupons, and proceed to checkout.",
    url: "/cart",
  },
  robots: {
    index: false,
    follow: true,
  },
};

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
}

// ─── Cart content (async — reads cookies, wrapped in Suspense) ────────────────

async function CartContent() {
  const cartRes = await getCart();
  const items = cartRes.success ? cartRes.data : [];

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCartIcon}
        title="Your cart is empty"
        description="Looks like you haven't added anything to your cart yet."
        action={{ label: "Continue Shopping", href: "/shop" }}
      />
    );
  }

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Cart items */}
      <div className="min-w-0 flex-1">
        <div className="rounded-xl border bg-card">
          <div className="divide-y">
            {items.map((item) => (
              <div key={item.variantId} className="px-4 sm:px-6">
                <CartItemRow item={item} />
              </div>
            ))}
          </div>
        </div>

        {/* Continue shopping */}
        <div className="mt-4">
          <Button variant="ghost" size="sm" render={<Link href="/shop" />}>
            ← Continue Shopping
          </Button>
        </div>
      </div>

      {/* Order summary */}
      <div className="w-full shrink-0 lg:w-80">
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-base font-semibold">Order Summary</h2>
          <Separator className="my-4" />

          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-muted-foreground">Calculated at checkout</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST</span>
              <span className="text-muted-foreground">Calculated at checkout</span>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex justify-between text-base font-semibold">
            <span>Estimated Total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          <Button className="mt-6 w-full" size="lg" render={<Link href="/checkout" />}>
            Proceed to Checkout
          </Button>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            Taxes and shipping are calculated at checkout
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton fallback ────────────────────────────────────────────────────────

function CartSkeleton() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1 space-y-4">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
      <div className="w-full shrink-0 lg:w-80">
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CartPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
        Shopping Cart
      </h1>

      <Suspense fallback={<CartSkeleton />}>
        <CartContent />
      </Suspense>
    </div>
  );
}
