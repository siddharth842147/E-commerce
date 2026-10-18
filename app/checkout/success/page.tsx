import Link from "next/link";
import { CheckCircleIcon, PackageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// searchParams is dynamic — opt out of static prerender
export const instant = false;

export const metadata = {
  title: "Order Confirmed",
  description: "Your order has been placed successfully",
};

interface SuccessPageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  // Next.js 16 — must await searchParams
  const { orderId } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center gap-6 text-center">
        {/* Success icon */}
        <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
          <CheckCircleIcon className="size-10 text-primary" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Order Confirmed!
          </h1>
          <p className="text-muted-foreground">
            Thank you for your purchase. We&apos;ve received your order and will process it shortly.
          </p>
        </div>

        {/* Order ID */}
        {orderId && (
          <div className="w-full rounded-xl border bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Order ID
            </p>
            <p className="mt-1 break-all font-mono text-sm font-semibold">{orderId}</p>
          </div>
        )}

        <Separator className="w-full" />

        {/* Actions */}
        <div className="flex w-full flex-col gap-3">
          {orderId && (
            <Button
              className="w-full"
              render={<Link href={`/account/orders/${orderId}`} />}
            >
              <PackageIcon className="mr-2 size-4" />
              Track Your Order
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full"
            render={<Link href="/account/orders" />}
          >
            View All Orders
          </Button>

          <Button
            variant="ghost"
            className="w-full"
            render={<Link href="/shop" />}
          >
            Continue Shopping
          </Button>
        </div>

        {/* Help text */}
        <p className="text-xs text-muted-foreground">
          You&apos;ll receive a confirmation email with your order details.
          If you have any questions, contact our support team.
        </p>
      </div>
    </div>
  );
}
