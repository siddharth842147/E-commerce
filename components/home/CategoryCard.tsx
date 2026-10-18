import Link from "next/link";
import Image from "next/image";

export interface CategoryCardData {
  slug: string;
  name: string;
  badge: string;
  subtitle: string;
  title: string;
  startingPrice: string;
  gradient: string;
  accentTextColor: string;
  imageUrl: string;
}

interface CategoryCardProps {
  category: CategoryCardData;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/shop?category=${encodeURIComponent(category.slug)}`}
      id={`category-${category.slug}`}
      className={`group relative rounded-3xl overflow-hidden p-5 flex flex-col justify-between min-h-[340px] bg-gradient-to-br ${category.gradient} text-white shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5`}
    >
      <div className="z-10 flex items-center justify-between">
        <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md font-label-sm text-label-sm font-bold tracking-wide">
          {category.badge}
        </span>
        <span className="material-symbols-outlined text-white/80 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform">
          north_east
        </span>
      </div>

      <div className="relative w-full h-36 my-auto flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={category.imageUrl}
          alt={category.title}
          width={180}
          height={180}
          className="h-32 w-auto object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-500"
        />
      </div>

      <div className="z-10">
        <span className={`font-body-sm text-[12px] ${category.accentTextColor}`}>
          {category.subtitle}
        </span>
        <h3 className="font-headline-sm text-headline-sm font-bold mt-0.5">
          {category.title}
        </h3>
        <span className="font-label-md text-label-md text-white font-extrabold mt-1 block">
          {category.startingPrice}
        </span>
      </div>
    </Link>
  );
}
