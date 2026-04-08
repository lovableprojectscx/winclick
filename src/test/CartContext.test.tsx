/**
 * QA — CartContext
 * Prueba la lógica pura del carrito (useState, sin Supabase).
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React, { ReactNode } from "react";
import { CartProvider, useCart } from "@/contexts/CartContext";
import { mockProduct, mockProductLowStock } from "./test-utils";

function wrapper({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}

describe("CartContext — addItem", () => {
  it("agrega un producto nuevo con quantity 1", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(mockProduct));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(1);
    expect(result.current.items[0].product.id).toBe(mockProduct.id);
  });

  it("incrementa quantity si el producto ya existe", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(mockProduct));
    act(() => result.current.addItem(mockProduct));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
  });

  it("agrega dos productos distintos como items separados", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(mockProduct));
    act(() => result.current.addItem(mockProductLowStock));
    expect(result.current.items).toHaveLength(2);
  });

  it("setea lastAddedId al agregar", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(mockProduct));
    expect(result.current.lastAddedId).toBe(mockProduct.id);
  });

  it("limpia lastAddedId después de 300ms", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(mockProduct));
    expect(result.current.lastAddedId).toBe(mockProduct.id);
    await act(async () => { vi.advanceTimersByTime(350); });
    expect(result.current.lastAddedId).toBeNull();
    vi.useRealTimers();
  });
});

describe("CartContext — removeItem", () => {
  it("elimina el item por productId", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(mockProduct));
    act(() => result.current.removeItem(mockProduct.id));
    expect(result.current.items).toHaveLength(0);
  });

  it("no falla si el productId no existe", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(() => {
      act(() => result.current.removeItem("nonexistent-id"));
    }).not.toThrow();
  });
});

describe("CartContext — updateQuantity", () => {
  it("actualiza la cantidad correctamente", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(mockProduct));
    act(() => result.current.updateQuantity(mockProduct.id, 5));
    expect(result.current.items[0].quantity).toBe(5);
  });

  it("elimina el item si quantity <= 0", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(mockProduct));
    act(() => result.current.updateQuantity(mockProduct.id, 0));
    expect(result.current.items).toHaveLength(0);
  });

  it("elimina el item si quantity es negativo", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(mockProduct));
    act(() => result.current.updateQuantity(mockProduct.id, -1));
    expect(result.current.items).toHaveLength(0);
  });
});

describe("CartContext — clearCart", () => {
  it("vacía el array de items", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(mockProduct));
    act(() => result.current.addItem(mockProductLowStock));
    act(() => result.current.clearCart());
    expect(result.current.items).toHaveLength(0);
  });
});

describe("CartContext — total e itemCount", () => {
  it("total = precio × cantidad (un item)", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(mockProduct)); // S/ 89.90
    expect(result.current.total).toBeCloseTo(89.90, 2);
  });

  it("total suma varios items con distintas cantidades", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(mockProduct));           // 89.90 × 1
    act(() => result.current.addItem(mockProduct));           // 89.90 × 2
    act(() => result.current.addItem(mockProductLowStock));   // mock2.price × 1
    const expected = mockProduct.price * 2 + mockProductLowStock.price * 1;
    expect(result.current.total).toBeCloseTo(expected, 2);
  });

  it("total es 0 con carrito vacío", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.total).toBe(0);
  });

  it("itemCount refleja la suma de cantidades", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(mockProduct));
    act(() => result.current.addItem(mockProduct));         // qty = 2
    act(() => result.current.addItem(mockProductLowStock)); // qty = 1
    expect(result.current.itemCount).toBe(3);
  });

  it("itemCount es 0 con carrito vacío", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.itemCount).toBe(0);
  });
});

describe("CartContext — isOpen / setIsOpen", () => {
  it("isOpen empieza en false", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.isOpen).toBe(false);
  });

  it("setIsOpen(true) abre el drawer", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.setIsOpen(true));
    expect(result.current.isOpen).toBe(true);
  });

  it("setIsOpen(false) cierra el drawer", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.setIsOpen(true));
    act(() => result.current.setIsOpen(false));
    expect(result.current.isOpen).toBe(false);
  });
});

describe("CartContext — affiliateCode", () => {
  it("affiliateCode empieza en null", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.affiliateCode).toBeNull();
  });

  it("setAffiliateCode persiste el código", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.setAffiliateCode("WIN-MAR123"));
    expect(result.current.affiliateCode).toBe("WIN-MAR123");
  });

  it("setAffiliateCode(null) limpia el código", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.setAffiliateCode("WIN-MAR123"));
    act(() => result.current.setAffiliateCode(null));
    expect(result.current.affiliateCode).toBeNull();
  });
});
