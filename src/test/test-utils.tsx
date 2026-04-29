/**
 * Utilidades compartidas para todos los tests del proyecto Winclick.
 * Incluye: fixtures, wrapper con providers, helpers de mock.
 */
import React, { ReactNode } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { MemoryRouter, MemoryRouterProps } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CartProvider } from "@/contexts/CartContext";
import type { Product, Affiliate } from "@/lib/database.types";

// ─── Query client sin reintentos (falla rápido en tests) ────────────────────

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries:   { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

export const mockProduct: Product = {
  id:            "prod-1",
  name:          "Camu Camu Premium",
  description:   "Producto orgánico de alta calidad",
  price:         89.90,
  partner_price: 70.00,
  public_price:  99.90,
  stock:         50,
  category_id:   "cat-1",
  tags:          ["organico", "vitamina-c"],
  rating:        4.8,
  reviews_count: 124,
  image_url:     "https://example.com/camu.webp",
  image_alt:     "Camu Camu Premium",
  gallery_images: [],
  slug:          "camu-camu-premium",
  organic:       true,
  is_active:     true,
  created_at:    "2026-01-01T00:00:00Z",
  updated_at:    "2026-01-01T00:00:00Z",
};

export const mockProductLowStock: Product = {
  ...mockProduct,
  id:    "prod-2",
  name:  "Maca Andina",
  stock: 5,
  rating: 3.8,
  organic: false,
};

export const mockAffiliate: Affiliate = {
  id:                    "aff-1",
  user_id:               "user-1",
  name:                  "María García",
  email:                 "maria@example.com",
  dni:                   "12345678",
  phone:                 "999111222",
  shipping_address:      "Av. Siempre Viva 123",
  shipping_city:         "Lima",
  affiliate_code:        "WIN-MAR123",
  yape_number:           "999888777",
  package:               "Intermedio",
  depth_unlocked:        5,
  account_status:        "active",
  active_directos:       8,
  total_sales:           5600,
  total_commissions:     840,
  referral_count:        8,
  referred_by:           null,
  activated_at:          "2026-01-15T00:00:00Z",
  suspended_at:          null,
  last_reactivation_at:  null,
  next_reactivation_due: null,
  created_at:            "2026-01-15T00:00:00Z",
  updated_at:            "2026-04-01T00:00:00Z",
};

// ─── Wrapper con todos los providers ─────────────────────────────────────────

interface WrapperOptions extends RenderOptions {
  routerProps?: MemoryRouterProps;
  queryClient?: QueryClient;
}

function AllProviders({
  children,
  routerProps,
  queryClient,
}: {
  children: ReactNode;
  routerProps?: MemoryRouterProps;
  queryClient?: QueryClient;
}) {
  const qc = queryClient ?? createTestQueryClient();
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter {...routerProps}>
        <CartProvider>
          {children}
        </CartProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

/**
 * renderWithProviders — render un componente dentro de:
 *   QueryClientProvider + MemoryRouter + CartProvider
 *
 * Para tests que también necesitan AuthContext, usa vi.mock("@/contexts/AuthContext")
 * antes de llamar a esta función.
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: WrapperOptions = {},
) {
  const { routerProps, queryClient, ...renderOptions } = options;
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders routerProps={routerProps} queryClient={queryClient}>
        {children}
      </AllProviders>
    ),
    ...renderOptions,
  });
}
