import { getCart } from "@/actions/cart";
import { CartProvider } from "@/components/shared/CartProvider";

/**
 * Server component wrapper for CartProvider.
 * Fetches the initial cart server-side and passes it as a prop,
 * keeping server actions out of client component imports.
 */
export async function CartProviderServer({ children }: { children: React.ReactNode }) {
  const res = await getCart();
  const initialItems = res.success ? res.data : [];

  return <CartProvider initialItems={initialItems}>{children}</CartProvider>;
}
