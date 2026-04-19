import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import type { Product } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";
import { toN } from "@/lib/utils";

export type { Product };

export interface CartItem {
  product:   Product;
  quantity:  number;
  unitPrice: number;   // precio real al momento de agregar (public_price, partner_price o price)
}

interface CartContextType {
  items:            CartItem[];
  addItem:          (product: Product, unitPrice?: number) => void;
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
  const [items,         setItems]         = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("wo_cart_items");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [isOpen,        setIsOpen]        = useState(false);
  const [affiliateCode, setAffiliateCode] = useState<string | null>(() => localStorage.getItem("wo_affiliate_code"));
  const [lastAddedId,   setLastAddedId]   = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("wo_cart_items", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (affiliateCode) localStorage.setItem("wo_affiliate_code", affiliateCode);
    else localStorage.removeItem("wo_affiliate_code");
  }, [affiliateCode]);

  const addItem = useCallback((product: Product, unitPrice?: number) => {
    const resolvedPrice = toN(unitPrice ?? product.public_price ?? product.price);
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1, unitPrice: resolvedPrice }];
    });
    setLastAddedId(product.id);
    setTimeout(() => setLastAddedId(null), 700);
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) { removeItem(productId); return; }
    setItems((prev) => prev.map((i) => i.product.id === productId ? { ...i, quantity } : i));
  }, [removeItem]);

  const clearCart = useCallback(() => setItems([]), []);

  // Limpiar carrito y código de afiliado al cerrar sesión
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setItems([]);
        setAffiliateCode(null);
        localStorage.removeItem("wo_cart_items");
        localStorage.removeItem("wo_affiliate_code");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const total     = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount, isOpen, setIsOpen, affiliateCode, setAffiliateCode, lastAddedId }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
