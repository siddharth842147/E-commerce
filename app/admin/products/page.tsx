import { getProducts } from "@/actions/products";
import { getCategories } from "@/actions/categories";
import { ProductsClient } from "./ProductsClient";

export const metadata = {
  title: "Products Management | Kartiva Admin",
};

export default async function AdminProductsPage() {
  const [productsRes, categoriesRes] = await Promise.all([
    getProducts({ limit: 100 }),
    getCategories(),
  ]);

  const initialProducts = productsRes.success ? productsRes.data.items : [];
  const categories = categoriesRes.success ? categoriesRes.data : [];

  return (
    <div className="max-w-7xl mx-auto">
      <ProductsClient
        initialProducts={initialProducts}
        categories={categories}
      />
    </div>
  );
}
