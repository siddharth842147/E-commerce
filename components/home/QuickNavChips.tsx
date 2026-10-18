"use client";

import Link from "next/link";

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

  return (
    <section className="sticky top-[104px] z-40 bg-surface/90 backdrop-blur-md py-3 shadow-sm transition-all duration-300">
      <div className="max-w-[1360px] mx-auto px-margin flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md shrink-0">
          <span className="material-symbols-outlined text-[18px] text-primary">
            local_mall
          </span>
          <span className="font-bold text-on-surface">Explore:</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
          {CHIPS.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md transition-all hover:-translate-y-0.5 whitespace-nowrap ${
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
