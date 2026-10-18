"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  ShieldCheck,
  Store,
  ExternalLink,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ADMIN_NAV_ITEMS } from "./AdminSidebar";
import { cn } from "@/lib/utils";

interface AdminHeaderProps {
  adminEmail?: string;
  adminName?: string;
}

export function AdminHeader({
  adminEmail = "admin@kartiva.dev",
  adminName = "Kartiva Admin",
}: AdminHeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  // Generate title based on current path
  const currentItem = ADMIN_NAV_ITEMS.find((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  );
  const pageTitle = currentItem?.label ?? "Admin";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      {/* Left side: Mobile menu toggle + Page title */}
      <div className="flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              className="md:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b p-4 text-left">
              <SheetTitle className="flex items-center gap-2 text-base font-bold">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <ShieldCheck className="size-4" />
                </div>
                <span>Kartiva Admin</span>
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1 p-4">
              {ADMIN_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <div className="mt-4 border-t pt-4">
                <Link
                  href="/"
                  target="_blank"
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  <div className="flex items-center gap-2">
                    <Store className="size-3.5" />
                    <span>Live Storefront</span>
                  </div>
                  <ExternalLink className="size-3" />
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex flex-col">
          <h1 className="text-base font-semibold sm:text-lg text-foreground">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Right side: Store link + profile */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          target="_blank"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Store className="size-3.5" />
          <span>View Store</span>
          <ExternalLink className="size-3 opacity-70" />
        </Link>

        <div className="flex items-center gap-2.5 pl-2 border-l">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {adminName.charAt(0)}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold leading-tight">{adminName}</span>
            <span className="text-[10px] text-muted-foreground">Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}
