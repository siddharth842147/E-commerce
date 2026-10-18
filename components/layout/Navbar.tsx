import { connection } from "next/server";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { AnnouncementBar } from "./AnnouncementBar";
import { NavbarClient } from "./NavbarClient";

export async function Navbar() {
  await connection();
  const user = await getUser();

  return (
    <header className="sticky top-0 z-40 w-full">
      <AnnouncementBar />
      <div className="bg-surface-container-lowest/85 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-all">
        <div className="max-w-[1360px] mx-auto px-margin h-20 flex items-center justify-between gap-gutter">
          {/* Brand Logo */}
          <div className="flex items-center gap-space-sm">
            <Link
              href="/"
              className="flex items-center gap-space-xs group"
              aria-label="Kartiva Home"
            >
              <span className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-on-primary font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
                K
              </span>
              <span className="font-headline-md text-headline-md font-bold tracking-tight text-primary">
                Kartiva
              </span>
            </Link>
          </div>

          {/* Client Navigation and Controls */}
          <NavbarClient user={user} />
        </div>
      </div>
    </header>
  );
}
