"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import type { CartItem } from "@/types/cart";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  refresh: () => void;
  setItems: (items: CartItem[]) => void;
}

const CartContext = createContext<CartContextValue>({
  items: [],
  itemCount: 0,
  refresh: () => {},
  setItems: () => {},
});

interface CartProviderProps {
  children: React.ReactNode;
  initialItems?: CartItem[];
}

export function CartProvider({ children, initialItems = [] }: CartProviderProps) {
  const [items, setItemsState] = useState<CartItem[]>(initialItems);

  const setItems = useCallback((newItems: CartItem[]) => {
    setItemsState(newItems);
  }, []);

  // refresh is a no-op by default; consumers can call setItems after mutations
  const refresh = useCallback(() => {
    // Consumers trigger refresh by calling server actions and then setItems
  }, []);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, itemCount, refresh, setItems }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  return useContext(CartContext);
}
