import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { DashboardSidebarClient } from "@/components/shared/DashboardSidebarClient";

// All /account/* routes require authentication (cookies) — disable static prerender
export const instant = false;

const SIDEBAR_LINKS = [
  { label: "Profile", href: "/account/profile" },
  { label: "Addresses", href: "/account/addresses" },
  { label: "Orders", href: "/account/orders" },
  { label: "Notifications", href: "/account/notifications" },
] as const;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 md:flex-row">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 shrink-0 md:block" aria-label="Account navigation">
          <nav className="flex flex-col gap-1">
            {SIDEBAR_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile: sheet-based sidebar trigger */}
        <DashboardSidebarClient links={SIDEBAR_LINKS} />

        {/* Main content */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
