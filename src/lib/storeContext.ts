/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │               CONTEXTO DE TIENDA — WinClick                 │
 * │                                                             │
 * │  DOS MUNDOS COMPLETAMENTE DISTINTOS:                        │
 * │                                                             │
 * │  1. TIENDA WINCLICK (catálogo principal)                    │
 * │     • El socio compra para sus recompras mensuales          │
 * │     • Precio = descuento de plan (40-50% OFF)               │
 * │     • Solo el propio afiliado, con su sesión activa         │
 * │                                                             │
 * │  2. TIENDA DEL SOCIO (vitrina pública del afiliado)         │
 * │     • El cliente final del socio compra aquí                │
 * │     • Precio = public_price (o custom del afiliado)         │
 * │     • SIN IMPORTAR si hay sesión activa ni qué plan tenga   │
 * │     • Nunca se aplican descuentos de membresía              │
 * └─────────────────────────────────────────────────────────────┘
 */

import type { Product } from "@/lib/database.types";
import type { Json } from "@/lib/database.types";
import { getActivationPrice, getRecompraPrice } from "@/lib/activationPrice";

// ── Tipos de contexto de tienda ────────────────────────────────────────────────

/**
 * Define en qué tipo de tienda se está mostrando el producto.
 * - 'winclick'  → catálogo WinClick, descuentos de membresía aplican
 * - 'affiliate' → tienda de un socio, siempre precio público (o custom)
 */
export type StoreMode = "winclick" | "affiliate";

/**
 * Contexto completo de la tienda de un afiliado.
 * Se construye al cargar la tienda y se pasa a los ProductCard.
 */
export interface AffiliateStoreContext {
  mode: "affiliate";
  /** Precios personalizados: { [productId: string]: number } */
  customPrices: Record<string, number>;
}

export const WINCLICK_STORE: { mode: "winclick" } = { mode: "winclick" };

// ── Función central de precios ─────────────────────────────────────────────────

interface PriceInput {
  product: Product;
  storeMode: StoreMode;
  /** Solo aplica en modo affiliate — precios personalizados del socio */
  customPrices?: Record<string, number>;
  /** Solo aplica en modo winclick — perfil del afiliado logueado */
  affiliatePlan?: string | null;
  affiliateStatus?: "pending" | "active" | "suspended" | null;
}

/**
 * Calcula el precio final a mostrar según el contexto de la tienda.
 *
 * REGLA DE ORO:
 *  - Tienda afiliado → precio personalizado del socio OR precio público. NUNCA descuento de membresía.
 *  - Tienda WinClick → lógica normal de activación/recompra por plan.
 */
export function getDisplayPrice({
  product,
  storeMode,
  customPrices = {},
  affiliatePlan,
  affiliateStatus,
}: PriceInput): number {
  const publicPrice = product.public_price ?? product.price;

  // ── TIENDA DEL SOCIO: siempre precio público o custom del socio ──────────────
  if (storeMode === "affiliate") {
    const customPrice = customPrices[product.id];
    // Si el socio puso un precio personalizado (debe ser >= public_price del sistema)
    if (customPrice != null && customPrice > 0) {
      return parseFloat(customPrice.toFixed(2));
    }
    // Fallback: precio público estándar de WinClick
    return parseFloat(publicPrice.toFixed(2));
  }

  // ── TIENDA WINCLICK: lógica de descuentos por membresía ──────────────────────
  const isPending = affiliateStatus === "pending";

  if (affiliatePlan && isPending) {
    return getActivationPrice(product, affiliatePlan);
  }

  if (affiliatePlan && affiliateStatus === "active") {
    return getRecompraPrice(product, affiliatePlan);
  }

  // Visitante sin sesión → precio público
  return parseFloat(publicPrice.toFixed(2));
}

/**
 * Parsea el campo custom_prices (Json de Supabase) a Record<string, number>.
 * Maneja los casos donde el JSON pueda tener valores inválidos.
 */
export function parseCustomPrices(raw: Json | null | undefined): Record<string, number> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    const num = typeof value === "number" ? value : parseFloat(String(value));
    if (!isNaN(num) && num > 0) {
      result[key] = num;
    }
  }
  return result;
}
