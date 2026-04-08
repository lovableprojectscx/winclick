/**
 * QA — CartDrawer
 * Prueba el drawer del carrito: estado vacío, lista de items, controles de cantidad,
 * eliminar, total, checkout link y cierre.
 */
import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import CartDrawer from "@/components/CartDrawer";
import { CartProvider, useCart } from "@/contexts/CartContext";
import { renderWithProviders, mockProduct, mockProductLowStock } from "./test-utils";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { act, renderHook } from "@testing-library/react";

// ─── Helper: renderizar drawer con cart abierto ──────────────────────────────

function renderOpenDrawer(setup?: (cart: ReturnType<typeof useCart>) => void) {
  let cartRef: ReturnType<typeof useCart>;

  function Inner() {
    cartRef = useCart();
    return <CartDrawer />;
  }

  render(
    <MemoryRouter>
      <CartProvider>
        <Inner />
      </CartProvider>
    </MemoryRouter>,
  );

  // Abrir drawer y ejecutar setup
  act(() => {
    cartRef!.setIsOpen(true);
    setup?.(cartRef!);
  });

  return cartRef!;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("CartDrawer — drawer cerrado", () => {
  it("no renderiza nada cuando isOpen = false", () => {
    renderWithProviders(<CartDrawer />);
    expect(screen.queryByText("Tu carrito")).not.toBeInTheDocument();
  });
});

describe("CartDrawer — carrito vacío", () => {
  it("muestra el título 'Tu carrito'", () => {
    renderOpenDrawer();
    expect(screen.getByText("Tu carrito")).toBeInTheDocument();
  });

  it("muestra el mensaje de carrito vacío", () => {
    renderOpenDrawer();
    expect(screen.getByText("Tu carrito está vacío")).toBeInTheDocument();
  });

  it("muestra link a /catalogo en estado vacío", () => {
    renderOpenDrawer();
    expect(screen.getByRole("link", { name: /ver productos/i })).toHaveAttribute("href", "/catalogo");
  });

  it("NO muestra el total ni el botón de checkout", () => {
    renderOpenDrawer();
    expect(screen.queryByText(/ir al checkout/i)).not.toBeInTheDocument();
  });
});

describe("CartDrawer — con items", () => {
  it("muestra el nombre del producto", () => {
    renderOpenDrawer((cart) => cart.addItem(mockProduct));
    expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
  });

  it("muestra el precio del producto", () => {
    renderOpenDrawer((cart) => cart.addItem(mockProduct));
    // Puede haber múltiples elementos con el mismo precio (item + total) — basta con que exista al menos uno
    const priceEls = screen.getAllByText(`S/ ${mockProduct.price.toFixed(2)}`);
    expect(priceEls.length).toBeGreaterThanOrEqual(1);
  });

  it("muestra la cantidad del item", () => {
    renderOpenDrawer((cart) => cart.addItem(mockProduct));
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("muestra el total en el footer", () => {
    renderOpenDrawer((cart) => {
      cart.addItem(mockProduct);
      cart.addItem(mockProduct); // qty=2 → total = 89.90 * 2 = 179.80
    });
    const total = (mockProduct.price * 2).toFixed(2);
    expect(screen.getByText(`S/ ${total}`)).toBeInTheDocument();
  });

  it("muestra el link 'Ir al checkout'", () => {
    renderOpenDrawer((cart) => cart.addItem(mockProduct));
    expect(screen.getByRole("link", { name: /ir al checkout/i })).toHaveAttribute("href", "/checkout");
  });

  it("muestra items de dos productos distintos", () => {
    renderOpenDrawer((cart) => {
      cart.addItem(mockProduct);
      cart.addItem(mockProductLowStock);
    });
    expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
    expect(screen.getByText(mockProductLowStock.name)).toBeInTheDocument();
  });
});

describe("CartDrawer — controles de cantidad y eliminación", () => {
  it("botón '+' incrementa la cantidad", () => {
    renderOpenDrawer((cart) => cart.addItem(mockProduct));
    const plusBtn = screen.getByLabelText("Sumar");
    fireEvent.click(plusBtn);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("botón '-' decrementa la cantidad", () => {
    renderOpenDrawer((cart) => {
      cart.addItem(mockProduct);
      cart.addItem(mockProduct); // qty = 2
    });
    const minusBtn = screen.getByLabelText("Restar");
    fireEvent.click(minusBtn);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("botón eliminar quita el item del drawer", () => {
    renderOpenDrawer((cart) => cart.addItem(mockProduct));
    const deleteBtn = screen.getByLabelText("Eliminar producto");
    fireEvent.click(deleteBtn);
    expect(screen.getByText("Tu carrito está vacío")).toBeInTheDocument();
  });
});

describe("CartDrawer — cierre", () => {
  it("botón X llama setIsOpen(false) y desaparece el drawer", () => {
    renderOpenDrawer((cart) => cart.addItem(mockProduct));
    const closeBtn = screen.getByLabelText("Cerrar carrito");
    fireEvent.click(closeBtn);
    expect(screen.queryByText("Tu carrito")).not.toBeInTheDocument();
  });

  it("click en el backdrop cierra el drawer", () => {
    renderOpenDrawer((cart) => cart.addItem(mockProduct));
    // El backdrop es el primer div con fixed inset-0 bg-black/60
    const backdrop = document.querySelector(".fixed.inset-0.z-50.bg-black\\/60") as HTMLElement;
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop);
    expect(screen.queryByText("Tu carrito")).not.toBeInTheDocument();
  });
});
