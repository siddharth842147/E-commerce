import { siteConfig } from "@/lib/siteConfig";

export function AnnouncementBar() {
  const { announcement } = siteConfig;
  if (!announcement?.enabled) return null;

  return (
    <div className="bg-primary text-on-primary py-2 px-gutter text-center font-label-md text-label-md flex items-center justify-center gap-2 transition-all">
      <span className="material-symbols-outlined text-[18px] text-secondary-fixed select-none">
        bolt
      </span>
      <span>
        {announcement.badgeText}: {announcement.offerText} | Use Code:{" "}
        <span className="font-bold tracking-wider text-secondary-fixed">
          {announcement.couponCode}
        </span>{" "}
        | {announcement.shippingNote}
      </span>
    </div>
  );
}
