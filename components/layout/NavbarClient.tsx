"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/shared/CartProvider";
import { signOut } from "@/lib/auth-actions";
import type { User } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavbarClientProps {
  user: User | null;
}

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Categories", href: "/#categories" },
  { label: "Deals", href: "/#deals" },
  { label: "New Arrivals", href: "/shop?sort=newest" },
];

export function NavbarClient({ user }: NavbarClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [wishlistCount] = useState(2); // Local wishlist state

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("header-search-input");
        searchInput?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav
        className="hidden xl:flex items-center gap-space-xs"
        aria-label="Main Navigation"
      >
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "px-space-sm py-2 font-label-md text-label-md rounded-xl transition-all",
                isActive
                  ? "bg-primary-container text-on-primary-container font-semibold shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Right Side Actions */}
      <div className="flex items-center gap-space-md">
        {/* Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative hidden md:flex items-center"
        >
          <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[20px] select-none pointer-events-none">
            search
          </span>
          <input
            id="header-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, brands..."
            className="w-60 lg:w-64 pl-10 pr-12 py-2 bg-surface-container-low text-on-surface font-body-sm text-body-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/70"
          />
          <kbd className="absolute right-2.5 font-label-sm text-[11px] bg-surface-container-highest text-on-surface-variant px-1.5 py-0.5 rounded pointer-events-none select-none">
            ⌘K
          </kbd>
        </form>

        {/* Wishlist Button */}
        <Link
          href="/shop?filter=wishlist"
          className="relative p-2 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center rounded-xl hover:bg-surface-container-low"
          aria-label={`Wishlist (${wishlistCount} items)`}
        >
          <span className="material-symbols-outlined text-[24px]">favorite</span>
          {wishlistCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-secondary text-on-secondary font-label-sm text-[10px] flex items-center justify-center leading-none">
              {wishlistCount}
            </span>
          )}
        </Link>

        {/* Cart Button */}
        <Link
          href="/cart"
          className="relative p-2 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center rounded-xl hover:bg-surface-container-low"
          aria-label={`Cart (${itemCount} items)`}
        >
          <span className="material-symbols-outlined text-[24px]">shopping_bag</span>
          {itemCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[10px] font-bold flex items-center justify-center leading-none">
              {itemCount > 99 ? "99+" : itemCount}
            </span>
          )}
        </Link>

        {/* User Account Menu */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-surface-container-low outline-none focus:ring-2 focus:ring-primary/20">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-sm select-none">
                {user.email ? user.email.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-[18px] hidden sm:block">
                expand_more
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-surface-container-lowest shadow-xl border-border">
              <DropdownMenuLabel className="font-label-md">
                <div className="font-medium text-foreground truncate">{user.email}</div>
                <div className="text-xs text-muted-foreground font-normal">Active Session</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/account/profile" className="cursor-pointer flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">person</span>
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/account/orders" className="cursor-pointer flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">package_2</span>
                  My Orders
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/account/addresses" className="cursor-pointer flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">home_pin</span>
                  Addresses
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action={signOut} className="w-full">
                  <button type="submit" className="w-full text-left text-destructive flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Sign out
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
            <span>Sign in</span>
          </Link>
        )}

        {/* Mobile Hamburger Drawer */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              className="p-2 text-on-surface-variant hover:text-on-surface xl:hidden rounded-xl"
              aria-label="Open mobile menu"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-surface-container-lowest">
            <SheetHeader>
              <SheetTitle className="font-headline-md text-primary flex items-center gap-2">
                Kartiva
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-2 font-label-md text-label-md">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="px-3 py-2.5 rounded-xl hover:bg-surface-container text-on-surface transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t my-2" />
              {user ? (
                <>
                  <Link
                    href="/account/profile"
                    className="px-3 py-2.5 rounded-xl hover:bg-surface-container text-on-surface"
                  >
                    My Account
                  </Link>
                  <Link
                    href="/account/orders"
                    className="px-3 py-2.5 rounded-xl hover:bg-surface-container text-on-surface"
                  >
                    Orders
                  </Link>
                  <form action={signOut} className="mt-2">
                    <button
                      type="submit"
                      className="w-full text-left px-3 py-2.5 text-destructive rounded-xl hover:bg-destructive/10"
                    >
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/login"
                  className="px-3 py-2.5 rounded-xl bg-primary text-on-primary text-center font-bold"
                >
                  Sign in / Register
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
