import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="relative mb-6 flex size-24 items-center justify-center rounded-3xl bg-primary/10 text-primary">
        <span className="font-heading text-5xl font-black tracking-tight">404</span>
      </div>

      <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
        Page Not Found
      </h1>

      <p className="mt-3 max-w-md text-sm sm:text-base text-muted-foreground leading-relaxed">
        The page you are looking for doesn&apos;t exist or has been moved. Explore our catalog or head back to the homepage.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button render={<Link href="/" />} size="lg" className="rounded-xl font-semibold">
          Back to Home
        </Button>
        <Button render={<Link href="/shop" />} variant="outline" size="lg" className="rounded-xl font-semibold">
          Browse Products
        </Button>
      </div>

      <p className="mt-12 text-xs text-muted-foreground">
        Need assistance?{" "}
        <Link href="/contact" className="text-primary underline hover:text-primary/80">
          Contact our support team
        </Link>
      </p>
    </div>
  );
}
