import Link from "next/link";
import { CategoryCard, type CategoryCardData } from "./CategoryCard";

interface CategoryGridProps {
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    imageUrl?: string | null;
  }>;
}

const CATEGORY_STYLE_MAP: Record<
  string,
  Omit<CategoryCardData, "slug" | "name">
> = {
  books: {
    badge: "Books",
    subtitle: "50,000+ Titles",
    title: "Literature & Reads",
    startingPrice: "Starting ₹199",
    gradient: "from-emerald-900 via-teal-900 to-cyan-950",
    accentTextColor: "text-teal-200",
    imageUrl: "/images/categories/books.svg",
  },
  clothing: {
    badge: "Fashion",
    subtitle: "Trending Fits",
    title: "Apparel & Ethnic",
    startingPrice: "Starting ₹599",
    gradient: "from-orange-600 via-rose-600 to-amber-700",
    accentTextColor: "text-orange-200",
    imageUrl: "/images/categories/fashion.svg",
  },
  electronics: {
    badge: "Gadgets",
    subtitle: "Flagship Gadgets",
    title: "Audio & Gear",
    startingPrice: "Starting ₹1,299",
    gradient: "from-indigo-900 via-primary to-purple-950",
    accentTextColor: "text-indigo-200",
    imageUrl: "/images/categories/electronics.svg",
  },
  "home-kitchen": {
    badge: "Home",
    subtitle: "Aesthetic Living",
    title: "Kitchen & Decor",
    startingPrice: "Starting ₹449",
    gradient: "from-amber-900 via-stone-800 to-emerald-950",
    accentTextColor: "text-amber-200",
    imageUrl: "/images/categories/home.svg",
  },
  sports: {
    badge: "Fitness",
    subtitle: "Active Lifestyle",
    title: "Fitness & Yoga",
    startingPrice: "Starting ₹399",
    gradient: "from-cyan-900 via-blue-900 to-slate-900",
    accentTextColor: "text-cyan-200",
    imageUrl: "/images/categories/fitness.svg",
  },
};

export function CategoryGrid({ categories = [] }: CategoryGridProps) {
  // If categories are passed from database, match them with styling, or use default 5 categories
  const defaultKeys = ["books", "clothing", "electronics", "home-kitchen", "sports"];

  const cardItems: CategoryCardData[] = defaultKeys.map((key) => {
    const dbCat = categories.find((c) => c.slug === key);
    const style = CATEGORY_STYLE_MAP[key];

    return {
      slug: key,
      name: dbCat?.name || style.title,
      badge: style.badge,
      subtitle: style.subtitle,
      title: dbCat?.name || style.title,
      startingPrice: style.startingPrice,
      gradient: style.gradient,
      accentTextColor: style.accentTextColor,
      imageUrl: dbCat?.imageUrl || style.imageUrl,
    };
  });

  return (
    <section className="w-full bg-surface-container-low py-space-xl" id="categories">
      <div className="max-w-[1360px] mx-auto px-margin">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-space-lg">
          <div>
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">
              Curated Essentials
            </span>
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight mt-1">
              Shop by Category
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Handpicked collections across modern lifestyle essentials
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 font-label-md text-label-md text-primary hover:text-primary-container font-bold group"
          >
            <span>Explore all collections</span>
            <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">
              arrow_forward
            </span>
          </Link>
        </div>

        {/* 5-Column Responsive Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
          {cardItems.map((cat) => (
            <CategoryCard key={cat.slug} category={cat} />
          ))}
        </div>
      </div>
    </section>
  );
}
