import Link from "next/link";

export function Footer() {
  // Year hardcoded to avoid unstable date at prerender — update annually
  const year = 2026;

  return (
    <footer className="mt-auto border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <Link href="/" className="text-lg font-bold tracking-tight">
              Kartiva
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              Quality products, delivered to your door.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-sm font-semibold">Shop</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/shop" className="transition-colors hover:text-foreground">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/account/profile" className="transition-colors hover:text-foreground">
                  My Account
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className="transition-colors hover:text-foreground">
                  Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter placeholder */}
          <div>
            <h3 className="text-sm font-semibold">Stay updated</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Subscribe for new arrivals and exclusive offers.
            </p>
            <div className="mt-3 flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                aria-label="Email for newsletter"
                className="h-9 min-w-0 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              />
              <button
                type="button"
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
          &copy; {year} Kartiva. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
