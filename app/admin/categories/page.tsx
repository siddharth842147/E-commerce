import { getCategories } from "@/actions/categories";
import { CategoriesClient } from "./CategoriesClient";

export const metadata = {
  title: "Categories Management | Kartiva Admin",
};

export default async function AdminCategoriesPage() {
  const res = await getCategories();
  const categories = res.success ? res.data : [];

  return (
    <div className="max-w-7xl mx-auto">
      <CategoriesClient initialCategories={categories} />
    </div>
  );
}
