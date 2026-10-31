import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";

interface QuickNavChipsProps {
  pincode?: string | null;
  city?: string | null;
}

const CHIPS = [
  { label: "🔥 All Categories", href: "#categories", primary: true },
  { label: "⚡ Flash Deals", href: "#deals" },
  { label: "✨ Bestsellers", href: "#featured" },
  { label: "📚 Books", href: "#category-books" },
  { label: "👕 Apparel", href: "#category-clothing" },
  { label: "🎧 Electronics", href: "#category-electronics" },
  { label: "🪴 Home & Decor", href: "#category-home" },
  { label: "🏃 Fitness", href: "#category-sports" },
];

export function QuickNavChips({ pincode, city }: QuickNavChipsProps) {
  const deliveryText = pincode
    ? `Delivering to ${pincode}${city ? ` (${city})` : ""}`
    : "Delivering across India";

  const hasAnnouncement = Boolean(siteConfig.announcement?.enabled);
  const stickyOffsetClass = hasAnnouncement
    ? "top-[100px] md:top-[116px]"
    : "top-16 md:top-20";

  return (
    <section
      aria-label="Quick category navigation"
      className={`sticky ${stickyOffsetClass} z-30 bg-surface/90 backdrop-blur-md py-2.5 sm:py-3 border-b border-surface-container/60 shadow-sm transition-all duration-300`}
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-margin flex items-center justify-between gap-3 sm:gap-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 sm:gap-2 text-on-surface-variant font-label-md text-xs sm:text-label-md shrink-0">
          <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
            local_mall
          </span>
          <span className="font-bold text-on-surface">Explore:</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
          {CHIPS.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md transition-all duration-200 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                chip.primary
                  ? "bg-primary-container text-on-primary-container shadow-sm font-semibold"
                  : "bg-surface-container hover:bg-surface-container-high text-on-surface"
              }`}
            >
              {chip.label}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold tracking-wide uppercase">
            {deliveryText}
          </span>
        </div>
      </div>
    </section>
  );
}
