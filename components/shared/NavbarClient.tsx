"use client";

import Link from "next/link";
import { ShoppingCartIcon, UserIcon, MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { signOut } from "@/lib/auth-actions";
import { useCart } from "@/components/shared/CartProvider";
import type { User } from "@supabase/supabase-js";

interface NavbarClientProps {
  user: User | null;
}

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
];

export function CartBadge() {
  const { itemCount } = useCart();
  return (
    <Link href="/cart" aria-label={`Cart (${itemCount} items)`} className="relative inline-flex">
      <Button variant="ghost" size="icon" aria-label="Cart">
        <ShoppingCartIcon className="size-5" />
      </Button>
      {itemCount > 0 && (
        <Badge
          className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full p-0 text-xs"
          aria-hidden="true"
        >
          {itemCount > 99 ? "99+" : itemCount}
        </Badge>
      )}
    </Link>
  );
}

export function NavbarClient({ user }: NavbarClientProps) {
  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Right side actions */}
      <div className="flex items-center gap-1">
        <CartBadge />

        {user ? (
          <div className="hidden items-center gap-1 md:flex">
            <Button variant="ghost" size="sm" render={<Link href="/account/profile" />}>
              <UserIcon className="size-4" />
              Account
            </Button>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="hidden md:inline-flex" render={<Link href="/login" />}>
            Login
          </Button>
        )}

        {/* Mobile hamburger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
              <MenuIcon className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle className="text-xl font-bold tracking-tight">Kartiva</SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1" aria-label="Mobile navigation">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-2 text-base font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link
                    href="/account/profile"
                    className="rounded-md px-3 py-2 text-base font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Account
                  </Link>
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="w-full rounded-md px-3 py-2 text-left text-base font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                    >
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/login"
                  className="rounded-md px-3 py-2 text-base font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                >
                  Login
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
