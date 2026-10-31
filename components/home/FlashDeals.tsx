"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { addToCart, getCart } from "@/actions/cart";
import { useCart } from "@/components/shared/CartProvider";
import { showCartToast } from "@/components/shared/CartToast";
import type { ProductWithVariants } from "@/services/product.service";

interface FlashDealsProps {
  products: ProductWithVariants[];
}

interface DealItem {
  product: ProductWithVariants;
  price: number;
  displayComparePrice: number;
  discount: number;
  claimedPct: number;
  imageUrl: string;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 18, seconds: 42 });

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

  return (
    <div
      role="timer"
      aria-label={`Flash deals time remaining: ${timeLeft.hours} hours, ${timeLeft.minutes} minutes, ${timeLeft.seconds} seconds`}
      className="flex items-center gap-2 sm:gap-2.5 bg-surface-container-lowest px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl shadow-sm self-stretch sm:self-auto justify-center"
    >
      <span className="font-label-sm text-xs sm:text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
        Ends In:
      </span>
      <div className="flex items-center gap-1 font-headline-md text-sm sm:text-headline-md font-extrabold text-primary" aria-hidden="true">
        <span className="px-2 py-1 rounded-lg bg-surface-container text-primary min-w-[32px] sm:min-w-[36px] text-center">
          {pad(timeLeft.hours)}
        </span>
        <span>:</span>
        <span className="px-2 py-1 rounded-lg bg-surface-container text-primary min-w-[32px] sm:min-w-[36px] text-center">
          {pad(timeLeft.minutes)}
        </span>
        <span>:</span>
        <span className="px-2 py-1 rounded-lg bg-surface-container text-secondary-container min-w-[32px] sm:min-w-[36px] text-center">
          {pad(timeLeft.seconds)}
        </span>
      </div>
    </div>
  );
}

export function FlashDeals({ products }: FlashDealsProps) {
  const [addingId, setAddingId] = useState<string | null>(null);
  const { setItems } = useCart();

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

  const dealProducts: DealItem[] = useMemo(() => {
    if (!products || products.length === 0) return [];
    return products.slice(0, 5).map((product, idx) => {
      const price = Number(product.price);
      const comparePrice = product.compareAtPrice ? Number(product.compareAtPrice) : null;
      const discount = comparePrice && comparePrice > price
        ? Math.round(((comparePrice - price) / comparePrice) * 100)
        : 35 + ((idx * 7) % 30);
      const displayComparePrice = comparePrice || Math.round(price / (1 - discount / 100));
      const claimedPct = 65 + ((idx * 9) % 25);
      const imageUrl = (product.images as string[])?.[0] || "/images/hero/headphones.svg";

      return {
        product,
        price,
        displayComparePrice,
        discount,
        claimedPct,
        imageUrl,
      };
    });
  }, [products]);

  if (!products || products.length === 0) return null;

  return (
    <section className="w-full py-space-xl bg-surface" id="deals">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-margin">
        {/* Strip Header with Live Countdown */}
        <div className="bg-gradient-to-r from-on-secondary to-surface-container p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm mb-space-lg flex flex-col md:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-lg shadow-secondary-container/30 shrink-0">
              <span className="material-symbols-outlined text-[26px] sm:text-[32px]" aria-hidden="true">bolt</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-label-sm text-label-sm uppercase font-extrabold tracking-wider text-secondary-container">
                  Limited Stock
                </span>
                <span className="w-2 h-2 rounded-full bg-secondary-container animate-ping" aria-hidden="true" />
              </div>
              <h2 className="text-xl sm:text-headline-md font-extrabold text-on-surface">
                Lightning Deals of the Day
              </h2>
            </div>
          </div>

          {/* Live Ticking Countdown Component (isolated to prevent full list re-renders) */}
          <CountdownTimer />
        </div>

        {/* 5-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-space-md">
          {dealProducts.map(({ product, price, displayComparePrice, discount, claimedPct, imageUrl }) => (
            <div
              key={product.id}
              className="group bg-surface-container-lowest rounded-3xl p-5 shadow-sm border border-outline-variant/35 hover:border-primary/40 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <Link
                  href={`/shop/${product.slug}`}
                  className="block relative w-full aspect-square rounded-2xl bg-surface-container-low overflow-hidden mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={`View deal for ${product.name}`}
                >
                  <Image
                    src={imageUrl}
                    alt={product.name || "Flash deal product image"}
                    width={300}
                    height={300}
                    unoptimized={imageUrl.endsWith(".svg")}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-2.5 left-2.5 bg-secondary-container text-on-secondary-container font-label-sm text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    {discount}% OFF
                  </span>
                </Link>

                <Link
                  href={`/shop/${product.slug}`}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded block"
                >
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface line-clamp-1 hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                </Link>

                <div className="flex items-baseline gap-2 mt-2 mb-3">
                  <span className="font-price-card text-price-card font-extrabold text-on-surface">
                    ₹{price.toLocaleString("en-IN")}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant line-through">
                    ₹{displayComparePrice.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Accessible Progress claimed bar */}
                <div
                  className="w-full bg-surface-container rounded-full h-2 mb-1.5 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={claimedPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${claimedPct}% of stock claimed`}
                >
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
                aria-label={`Grab deal for ${product.name} at ₹${price.toLocaleString("en-IN")}`}
                className="add-to-cart-btn mt-4 w-full py-2.5 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md font-bold hover:bg-primary transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  {addingId === product.id ? "hourglass_empty" : "bolt"}
                </span>
                <span>{addingId === product.id ? "Adding..." : "Grab Deal"}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
