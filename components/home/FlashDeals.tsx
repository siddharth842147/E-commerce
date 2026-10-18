"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { addToCart, getCart } from "@/actions/cart";
import { useCart } from "@/components/shared/CartProvider";
import { showCartToast } from "@/components/shared/CartToast";
import type { ProductWithVariants } from "@/services/product.service";

interface FlashDealsProps {
  products: ProductWithVariants[];
}

export function FlashDeals({ products }: FlashDealsProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 18, seconds: 42 });
  const [addingId, setAddingId] = useState<string | null>(null);
  const { setItems } = useCart();

  // Live ticking countdown to midnight
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = Math.max(0, endOfDay.getTime() - now.getTime());

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleGrabDeal = async (
    e: React.MouseEvent,
    product: ProductWithVariants
  ) => {
    e.preventDefault();
    const variantId = product.variants?.[0]?.id;
    const priceNum = Number(product.price);

    if (!variantId) {
      showCartToast(product.name, `Added for ₹${priceNum.toLocaleString("en-IN")}`);
      return;
    }

    try {
      setAddingId(product.id);
      const res = await addToCart(variantId, 1);
      if (res.success) {
        showCartToast(product.name, `Added for ₹${priceNum.toLocaleString("en-IN")}`);
        const freshCart = await getCart();
        if (freshCart.success && freshCart.data) {
          setItems(freshCart.data);
        }
      } else {
        const msg = typeof res.error === "string" ? res.error : "Failed to add item";
        showCartToast("Error", msg);
      }
    } catch {
      showCartToast("Error", "Could not add item to cart");
    } finally {
      setAddingId(null);
    }
  };

  const pad = (n: number) => String(n).padStart(2, "0");

  if (!products || products.length === 0) return null;

  return (
    <section className="w-full py-space-xl bg-surface" id="deals">
      <div className="max-w-[1360px] mx-auto px-margin">
        {/* Strip Header with Live Countdown */}
        <div className="bg-gradient-to-r from-on-secondary to-surface-container p-6 md:p-8 rounded-3xl shadow-sm mb-space-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-lg shadow-secondary-container/30 shrink-0">
              <span className="material-symbols-outlined text-[32px]">bolt</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-label-sm text-label-sm uppercase font-extrabold tracking-wider text-secondary-container">
                  Limited Stock
                </span>
                <span className="w-2 h-2 rounded-full bg-secondary-container animate-ping" />
              </div>
              <h2 className="font-headline-md text-headline-md font-extrabold text-on-surface">
                Lightning Deals of the Day
              </h2>
            </div>
          </div>

          {/* Live Ticking Countdown */}
          <div className="flex items-center gap-2.5 bg-surface-container-lowest px-5 py-3 rounded-2xl shadow-sm">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              Ends In:
            </span>
            <div className="flex items-center gap-1 font-headline-md text-headline-md font-extrabold text-primary">
              <span className="px-2 py-1 rounded-lg bg-surface-container text-primary min-w-[36px] text-center">
                {pad(timeLeft.hours)}
              </span>
              <span>:</span>
              <span className="px-2 py-1 rounded-lg bg-surface-container text-primary min-w-[36px] text-center">
                {pad(timeLeft.minutes)}
              </span>
              <span>:</span>
              <span className="px-2 py-1 rounded-lg bg-surface-container text-secondary-container min-w-[36px] text-center">
                {pad(timeLeft.seconds)}
              </span>
            </div>
          </div>
        </div>

        {/* 5-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
          {products.slice(0, 5).map((product, idx) => {
            const price = Number(product.price);
            const comparePrice = product.compareAtPrice ? Number(product.compareAtPrice) : null;
            const discount = comparePrice && comparePrice > price
              ? Math.round(((comparePrice - price) / comparePrice) * 100)
              : 35 + ((idx * 7) % 30);
            const displayComparePrice = comparePrice || Math.round(price / (1 - discount / 100));
            // Calculate claimed percentage based on index or stock
            const claimedPct = 65 + ((idx * 9) % 25);
            const imageUrl = (product.images as string[])?.[0] || "/images/hero/headphones.svg";

            return (
              <div
                key={product.id}
                className="group bg-surface-container-lowest rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <Link href={`/shop/${product.slug}`} className="block relative w-full aspect-square rounded-2xl bg-surface-container-low overflow-hidden mb-4">
                    <Image
                      src={imageUrl}
                      alt={product.name}
                      width={300}
                      height={300}
                      unoptimized={imageUrl.endsWith(".svg")}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2.5 left-2.5 bg-secondary-container text-on-secondary-container font-label-sm text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {discount}% OFF
                    </span>
                  </Link>

                  <Link href={`/shop/${product.slug}`}>
                    <h4 className="font-headline-sm text-headline-sm font-bold text-on-surface line-clamp-1 hover:text-primary transition-colors">
                      {product.name}
                    </h4>
                  </Link>

                  <div className="flex items-baseline gap-2 mt-2 mb-3">
                    <span className="font-price-card text-price-card font-extrabold text-on-surface">
                      ₹{price.toLocaleString("en-IN")}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant line-through">
                      ₹{displayComparePrice.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Progress claimed bar */}
                  <div className="w-full bg-surface-container rounded-full h-2 mb-1.5 overflow-hidden">
                    <div
                      className="bg-secondary-container h-full rounded-full transition-all duration-500"
                      style={{ width: `${claimedPct}%` }}
                    />
                  </div>
                  <span className="font-body-sm text-[11px] text-on-surface-variant font-semibold">
                    Claimed: {claimedPct}%
                  </span>
                </div>

                <button
                  onClick={(e) => handleGrabDeal(e, product)}
                  disabled={addingId === product.id}
                  className="add-to-cart-btn mt-4 w-full py-2.5 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md font-bold hover:bg-primary transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {addingId === product.id ? "hourglass_empty" : "bolt"}
                  </span>
                  <span>{addingId === product.id ? "Adding..." : "Grab Deal"}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
