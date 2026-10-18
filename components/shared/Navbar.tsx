import Link from "next/link";
import { getUser } from "@/lib/auth";
import { NavbarClient } from "@/components/shared/NavbarClient";

export async function Navbar() {
  const user = await getUser();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-foreground"
          aria-label="Kartiva home"
        >
          Kartiva
        </Link>

        {/* Client parts: nav links, cart badge, user menu, mobile sheet */}
        <NavbarClient user={user} />
      </div>
    </header>
  );
}
