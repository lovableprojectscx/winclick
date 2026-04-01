import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import type { Product } from "@/lib/database.types";

export type { Product };

export interface CartItem {
  product:  Product;
  quantity: number;
}

interface CartContextType {
  items:            CartItem[];
  addItem:          (product: Product) => void;
  removeItem:       (productId: string) => void;
  updateQuantity:   (productId: string, quantity: number) => void;
  clearCart:        () => void;
  total:            number;
  itemCount:        number;
  isOpen:           boolean;
  setIsOpen:        (open: boolean) => void;
  affiliateCode:    string | null;
  setAffiliateCode: (code: string | null) => void;
  lastAddedId:      string | null;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items,         setItems]         = useState<CartItem[]>([]);
  const [isOpen,        setIsOpen]        = useState(false);
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);
  const [lastAddedId,   setLastAddedId]   = useState<string | null>(null);

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
    setLastAddedId(product.id);
    setTimeout(() => setLastAddedId(null), 300);
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) { removeItem(productId); return; }
    setItems((prev) => prev.map((i) => i.product.id === productId ? { ...i, quantity } : i));
  }, [removeItem]);

  const clearCart = useCallback(() => setItems([]), []);

  const total     = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount, isOpen, setIsOpen, affiliateCode, setAffiliateCode, lastAddedId }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
