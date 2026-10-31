import { siteConfig } from "@/lib/siteConfig";

export function AnnouncementBar() {
  const { announcement } = siteConfig;
  if (!announcement?.enabled) return null;

  return (
    <div className="bg-primary text-on-primary py-2 px-3 sm:px-gutter text-center font-label-md text-xs sm:text-label-md flex items-center justify-center gap-1.5 sm:gap-2 transition-all">
      <span
        className="material-symbols-outlined text-[16px] sm:text-[18px] text-secondary-fixed select-none shrink-0"
        aria-hidden="true"
      >
        bolt
      </span>
      <span className="flex items-center gap-1 min-w-0">
        <span className="font-semibold shrink-0">{announcement.badgeText}:</span>
        <span className="shrink-0">
          Code:{" "}
          <span className="font-bold tracking-wider text-secondary-fixed">
            {announcement.couponCode}
          </span>
        </span>
        <span className="truncate">({announcement.offerText})</span>
        <span className="hidden md:inline shrink-0">| {announcement.shippingNote}</span>
      </span>
    </div>
  );
}
