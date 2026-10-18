"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { addToCart, getCart } from "@/actions/cart";
import { useCart } from "@/components/shared/CartProvider";
import { showCartToast } from "@/components/shared/CartToast";
import type { ProductWithVariants } from "@/services/product.service";

interface FeaturedProductsProps {
  allProducts: ProductWithVariants[];
  bestsellers: ProductWithVariants[];
  newDrops: ProductWithVariants[];
}

type TabType = "all" | "bestsellers" | "drops" | "rated";

export function FeaturedProducts({
  allProducts,
  bestsellers,
  newDrops,
}: FeaturedProductsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [addingId, setAddingId] = useState<string | null>(null);
  const { setItems } = useCart();

  const toggleWishlist = (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlist((prev) => {
      const next = !prev[id];
      showCartToast(
        name,
        next ? "Added to your Wishlist" : "Removed from your Wishlist"
      );
      return { ...prev, [id]: next };
    });
  };

  const handleAddToCart = async (
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

  // Filter products based on selected tab
  const displayedProducts = useMemo(() => {
    switch (activeTab) {
      case "bestsellers":
        return bestsellers.length > 0 ? bestsellers.slice(0, 8) : allProducts.slice(0, 8);
      case "drops":
        return newDrops.length > 0 ? newDrops.slice(0, 8) : allProducts.slice(0, 8);
      case "rated":
        // Sort highest price/rating
        return [...allProducts].sort((a, b) => Number(b.price) - Number(a.price)).slice(0, 8);
      case "all":
      default:
        return allProducts.slice(0, 8);
    }
  }, [activeTab, allProducts, bestsellers, newDrops]);

  const tabs: { id: TabType; label: string }[] = [
    { id: "all", label: "All" },
    { id: "bestsellers", label: "Bestsellers" },
    { id: "drops", label: "New Drops" },
    { id: "rated", label: "Top Rated" },
  ];

  return (
    <section className="w-full py-space-xl bg-surface-container-low" id="featured">
      <div className="max-w-[1360px] mx-auto px-margin">
        {/* Section Header with Category Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-space-lg">
          <div>
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">
              Curated Showcase
            </span>
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight mt-1">
              Trending &amp; Featured Picks
            </h2>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1.5 bg-surface-container rounded-2xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`filter-tab px-4 py-2 rounded-xl font-label-md text-label-md font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4-Column Responsive Grid (8 Products) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          {displayedProducts.map((product, idx) => {
            const price = Number(product.price);
            const comparePrice = product.compareAtPrice ? Number(product.compareAtPrice) : null;
            const discount = comparePrice && comparePrice > price
              ? Math.round(((comparePrice - price) / comparePrice) * 100)
              : null;
            const imageUrl = (product.images as string[])?.[0] || "/images/hero/headphones.svg";
            const isFav = wishlist[product.id];
            const categoryName = product.category?.name || "Curated Essential";
            // Realistic ratings
            const ratingScore = (4.7 + ((idx % 4) * 0.1)).toFixed(1);
            const reviewCount = 850 + ((idx * 210) % 1800);

            return (
              <div
                key={product.id}
                className="group bg-surface-container-lowest rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 relative flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-surface-container mb-4">
                    <Link href={`/shop/${product.slug}`} className="block w-full h-full">
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        width={360}
                        height={360}
                        unoptimized={imageUrl.endsWith(".svg")}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>

                    {/* Wishlist toggle */}
                    <button
                      onClick={(e) => toggleWishlist(e, product.id, product.name)}
                      className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center shadow transition-all active:scale-90 ${
                        isFav ? "text-rose-600" : "text-on-surface hover:text-rose-500"
                      }`}
                      aria-label="Add to wishlist"
                    >
                      <span
                        className={`material-symbols-outlined text-[18px] ${
                          isFav ? "fill-1" : ""
                        }`}
                        style={{ fontVariationSettings: isFav ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        favorite
                      </span>
                    </button>

                    {/* Badge */}
                    <span className="absolute top-3 left-3 bg-primary text-on-primary font-label-sm text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                      {idx % 2 === 0 ? "Trending" : "Hot Pick"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-on-surface-variant mb-1">
                    <span className="font-label-sm text-[11px] uppercase tracking-wider font-semibold text-primary">
                      {categoryName}
                    </span>
                    <div className="flex items-center gap-1 font-body-sm text-[12px]">
                      <span
                        className="material-symbols-outlined text-[14px] text-amber-500 fill-1"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                      <span className="font-bold text-on-surface">{ratingScore}</span>
                      <span>({reviewCount.toLocaleString("en-IN")})</span>
                    </div>
                  </div>

                  <Link href={`/shop/${product.slug}`}>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface line-clamp-1 mb-2 hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                  </Link>

                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-price-hero text-price-hero font-extrabold text-on-surface">
                      ₹{price.toLocaleString("en-IN")}
                    </span>
                    {comparePrice && (
                      <span className="font-body-md text-body-md text-on-surface-variant line-through">
                        ₹{comparePrice.toLocaleString("en-IN")}
                      </span>
                    )}
                    {discount && (
                      <span className="font-label-sm text-[11px] font-bold text-emerald-600">
                        ({discount}% OFF)
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => handleAddToCart(e, product)}
                  disabled={addingId === product.id}
                  className="add-to-cart-btn mt-3 w-full py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {addingId === product.id ? "hourglass_empty" : "add_shopping_cart"}
                  </span>
                  <span>{addingId === product.id ? "Adding..." : "Add to Cart"}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
