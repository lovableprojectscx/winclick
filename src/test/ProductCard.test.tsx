/**
 * QA — ProductCard
 * Prueba el componente de tarjeta de producto: badges, add-to-cart, favorito, navegación.
 */
import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import ProductCard from "@/components/ProductCard";
import { renderWithProviders, mockProduct, mockProductLowStock } from "./test-utils";
import type { Product } from "@/lib/database.types";

// ─── Fixtures adicionales ────────────────────────────────────────────────────

const productHighRating: Product = { ...mockProduct, rating: 4.9 };
const productLowRating: Product  = { ...mockProduct, id: "prod-lr", rating: 3.5 };
const productOrganic: Product    = { ...mockProduct, id: "prod-org", organic: true };
const productNotOrganic: Product = { ...mockProduct, id: "prod-no-org", organic: false };

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("ProductCard — renderizado básico", () => {
  it("muestra el nombre del producto", () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
  });

  it("muestra el precio formateado", () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    expect(screen.getByText(`S/ ${mockProduct.price.toFixed(2)}`)).toBeInTheDocument();
  });

  it("el link apunta a /catalogo/{id}", () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", `/catalogo/${mockProduct.slug || mockProduct.id}`);
  });
});

describe("ProductCard — badges condicionales", () => {
  it("muestra badge 'Premium' si rating >= 4.5", () => {
    renderWithProviders(<ProductCard product={productHighRating} />);
    expect(screen.getByText("Premium")).toBeInTheDocument();
  });

  it("NO muestra badge 'Premium' si rating < 4.5", () => {
    renderWithProviders(<ProductCard product={productLowRating} />);
    expect(screen.queryByText("Premium")).not.toBeInTheDocument();
  });

  it("muestra badge 'Últimas' si stock <= 10 y > 0", () => {
    renderWithProviders(<ProductCard product={mockProductLowStock} />);
    expect(screen.getByText("Últimas")).toBeInTheDocument();
  });

  it("NO muestra badge 'Últimas' si stock > 10", () => {
    renderWithProviders(<ProductCard product={mockProduct} />); // stock = 50
    expect(screen.queryByText("Últimas")).not.toBeInTheDocument();
  });

  it("muestra badge 'Orgánico' si organic = true", () => {
    renderWithProviders(<ProductCard product={productOrganic} />);
    expect(screen.getByText("Orgánico")).toBeInTheDocument();
  });

  it("NO muestra badge 'Orgánico' si organic = false", () => {
    renderWithProviders(<ProductCard product={productNotOrganic} />);
    expect(screen.queryByText("Orgánico")).not.toBeInTheDocument();
  });
});

describe("ProductCard — botón agregar al carrito", () => {
  it("muestra '★ Agregar' cuando no hay affiliateCode", () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    // El botón de agregar tiene texto "★ Agregar"; el de favoritos tiene aria-label "Agregar a favoritos"
    // Usamos getAllByRole y filtramos por el que no tiene aria-label
    const buttons = screen.getAllByRole("button");
    const addBtn = buttons.find((b) => b.textContent?.includes("Agregar") && !b.getAttribute("aria-label"));
    expect(addBtn).toBeInTheDocument();
  });

  it("muestra '★ Comprar' cuando hay affiliateCode", () => {
    renderWithProviders(<ProductCard product={mockProduct} affiliateCode="WIN-TST123" />);
    expect(screen.getByRole("button", { name: /comprar/i })).toBeInTheDocument();
  });

  it("al hacer click en agregar el botón cambia a 'Agregado'", async () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    const buttons = screen.getAllByRole("button");
    const addBtn = buttons.find((b) => b.textContent?.includes("Agregar") && !b.getAttribute("aria-label"))!;
    fireEvent.click(addBtn);
    expect(screen.getByText("Agregado")).toBeInTheDocument();
  });

  it("el botón agregar vuelve al estado original tras 2s", async () => {
    vi.useFakeTimers();
    renderWithProviders(<ProductCard product={mockProduct} />);
    const buttons = screen.getAllByRole("button");
    const addBtn = buttons.find((b) => b.textContent?.includes("Agregar") && !b.getAttribute("aria-label"))!;
    fireEvent.click(addBtn);
    expect(screen.getByText("Agregado")).toBeInTheDocument();
    await act(async () => { vi.advanceTimersByTime(2100); });
    expect(screen.queryByText("Agregado")).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});

describe("ProductCard — botón favorito", () => {
  it("tiene aria-label 'Agregar a favoritos' por defecto", () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    expect(screen.getByLabelText("Agregar a favoritos")).toBeInTheDocument();
  });

  it("cambia aria-label a 'Quitar de favoritos' al hacer click", () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    fireEvent.click(screen.getByLabelText("Agregar a favoritos"));
    expect(screen.getByLabelText("Quitar de favoritos")).toBeInTheDocument();
  });

  it("toggle: segundo click vuelve a 'Agregar a favoritos'", () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    fireEvent.click(screen.getByLabelText("Agregar a favoritos"));
    fireEvent.click(screen.getByLabelText("Quitar de favoritos"));
    expect(screen.getByLabelText("Agregar a favoritos")).toBeInTheDocument();
  });
});
