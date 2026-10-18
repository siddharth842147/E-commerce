"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderTree,
  Users,
  Tag,
  Star,
  ExternalLink,
  ShieldCheck,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const ADMIN_NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: ShoppingBag,
    exact: false,
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: Package,
    exact: false,
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: FolderTree,
    exact: false,
  },
  {
    label: "Customers",
    href: "/admin/customers",
    icon: Users,
    exact: false,
  },
  {
    label: "Coupons",
    href: "/admin/coupons",
    icon: Tag,
    exact: false,
  },
  {
    label: "Reviews",
    href: "/admin/reviews",
    icon: Star,
    exact: false,
  },
];

interface AdminSidebarProps {
  adminEmail?: string;
  adminName?: string;
}

export function AdminSidebar({
  adminEmail = "admin@kartiva.dev",
  adminName = "Kartiva Admin",
}: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-card/60 backdrop-blur-md md:flex">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-2.5 border-b px-6">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
          <ShieldCheck className="size-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold tracking-tight text-foreground">Kartiva</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            Admin Console
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <nav className="flex flex-col gap-1.5" aria-label="Admin Navigation">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
            Management
          </div>
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className={cn("size-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="flex flex-col gap-3 pt-4 border-t">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between rounded-lg border bg-background/50 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <div className="flex items-center gap-2">
              <Store className="size-3.5" />
              <span>Live Storefront</span>
            </div>
            <ExternalLink className="size-3" />
          </Link>

          {/* Admin user preview */}
          <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {adminName.charAt(0)}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="truncate text-xs font-semibold text-foreground">
                {adminName}
              </span>
              <span className="truncate text-[11px] text-muted-foreground">
                {adminEmail}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
