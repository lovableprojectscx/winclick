import type { Product } from "@/lib/database.types";

// ─────────────────────────────────────────────────────────────────────────────
// ESTRUCTURA DE PRECIOS POR PLAN
//
// MEMBRESÍA (afiliado pending — primera compra obligatoria para activar membresía):
//   • Básico     → SIN DESCUENTO (Precio Público)
//   • Ejecutivo  → 45% OFF
//   • Intermedio → 50% OFF
//   • VIP        → 55% OFF
//
// RECOMPRA MENSUAL (afiliado activo — genera comisiones en red):
//   • Básico     → 40% OFF
//   • Ejecutivo  → 45% OFF
//   • Intermedio → 50% OFF
//   • VIP        → 55% OFF
//
// METAS DE MEMBRESÍA (compra acumulada mínima para activar la membresía):
//   • Básico     → S/   120
//   • Ejecutivo  → S/   600
//   • Intermedio → S/ 2,000
//   • VIP        → S/10,000
//
// ─────────────────────────────────────────────────────────────────────────────

/** Orden ascendente de planes (para upgrade banner y utilidades) */
export const PLAN_ORDER = ["Básico", "Ejecutivo", "Intermedio", "VIP"] as const;
export type PlanName = typeof PLAN_ORDER[number];

// ── Membresía (primera compra) ────────────────────────────────────────────────

/**
 * Factor multiplicador sobre public_price durante la membresía (primera compra).
 * Todos los planes reciben descuento desde el día de afiliación.
 */
export const ACTIVATION_FACTOR: Record<string, number> = {
  Básico:     1.00,   // 0% OFF
  Ejecutivo:  0.55,   // 45% OFF
  Intermedio: 0.50,   // 50% OFF
  VIP:        0.45,   // 55% OFF
};

/** Porcentaje de descuento visible en la UI durante membresía */
export const ACTIVATION_DISCOUNT_PCT: Record<string, number> = {
  Básico:     0,
  Ejecutivo:  45,
  Intermedio: 50,
  VIP:        55,
};

/** Metas de compra acumulada para completar la activación (en S/) */
export const ACTIVATION_TARGET: Record<string, number> = {
  Básico:     120,
  Ejecutivo:  600,
  Intermedio: 2000,
  VIP:        10000,
};

/**
 * Sobrepaso máximo permitido sobre la meta de activación.
 * El carrito puede sumar hasta TARGET + OVERAGE en total acumulado.
 * Ej.: Básico → máx S/220, Intermedio → máx S/2,100, VIP → máx S/10,100
 */
export const ACTIVATION_MAX_OVERAGE = 100;

/** Tope absoluto del carrito de membresía (total_sales + cart total ≤ cap) */
export function getActivationCap(plan: string): number {
  // Solo aplicamos tope a planes con descuento de membresía (Ejecutivo+)
  // Para el Básico, al ser precio público, permitimos mayor margen o mantenemos el estándar
  return (ACTIVATION_TARGET[plan] ?? 120) + ACTIVATION_MAX_OVERAGE;
}

/**
 * Precio de membresía de un producto para el plan dado.
 * Básico SIN DESC | Ejecutivo 45% OFF | Intermedio 50% OFF | VIP 55% OFF.
 */
export function getActivationPrice(product: Product, plan: string): number {
  const base   = product.public_price ?? product.price;
  const factor = ACTIVATION_FACTOR[plan] ?? 1.00;
  return parseFloat((base * factor).toFixed(2));
}

/**
 * ¿El plan tiene descuento de membresía visible?
 * Todos los planes tienen descuento, por lo que siempre retorna true si el plan existe.
 */
export function hasActivationDiscount(plan: string): boolean {
  return (ACTIVATION_DISCOUNT_PCT[plan] ?? 0) > 0;
}

/**
 * Devuelve true si se puede agregar un ítem al carrito de activación sin superar el tope.
 */
export function canAddActivationItem(
  alreadySpent: number,
  currentCartTotal: number,
  itemPrice: number,
  plan: string,
): boolean {
  return alreadySpent + currentCartTotal + itemPrice <= getActivationCap(plan);
}

// ── Recompra mensual (afiliados activos) ──────────────────────────────────────

/**
 * Factor multiplicador sobre public_price en la recompra mensual.
 * Estos descuentos aplican a afiliados activos en todas sus compras tras la activación.
 */
export const RECOMPRA_FACTOR: Record<string, number> = {
  Básico:     0.60,   // 40% OFF
  Ejecutivo:  0.50,   // 50% OFF
  Intermedio: 0.50,   // 50% OFF
  VIP:        0.50,   // 50% OFF
};

/** Porcentaje de descuento visible en la UI para recompra */
export const RECOMPRA_DISCOUNT_PCT: Record<string, number> = {
  Básico:     40,
  Ejecutivo:  50,
  Intermedio: 50,
  VIP:        50,
};

/**
 * Precio de recompra mensual de un producto para el plan del afiliado activo.
 * Si el plan no está reconocido, cae al partner_price legacy o al public_price.
 */
export function getRecompraPrice(product: Product, plan: string | null | undefined): number {
  const base   = product.public_price ?? product.price;
  const factor = plan ? (RECOMPRA_FACTOR[plan] ?? null) : null;
  if (factor != null) return parseFloat((base * factor).toFixed(2));
  // Fallback legacy: partner_price si existe
  return product.partner_price ?? product.public_price ?? product.price;
}

// ── Utilidades generales ──────────────────────────────────────────────────────

/** Devuelve el plan inmediatamente superior, o null si ya es VIP */
export function getNextPlan(plan: string): PlanName | null {
  const idx = PLAN_ORDER.indexOf(plan as PlanName);
  if (idx === -1 || idx >= PLAN_ORDER.length - 1) return null;
  return PLAN_ORDER[idx + 1];
}

/** 
 * Devuelve el plan más alto alcanzado según el monto acumulado.
 * Se excluye 'VIP' del auto-upgrade en carrito por reglas de negocio.
 */
export function getReachedPlan(currentPlan: string, cumulative: number): PlanName | null {
  const currentIndex = PLAN_ORDER.indexOf(currentPlan as PlanName);
  if (currentIndex === -1) return null;
  
  // Evaluamos de arriba hacia abajo, hasta el nivel Intermedio (índice 2).
  for (let i = 2; i > currentIndex; i--) {
    const plan = PLAN_ORDER[i];
    if (cumulative >= (ACTIVATION_TARGET[plan] || Infinity)) {
      return plan;
    }
  }
  return null;
}

/** Niveles de red desbloqueados por plan (para la UI del upgrade banner) */
export const PLAN_DEPTH: Record<string, number> = {
  Básico:     3,
  Ejecutivo:  5,
  Intermedio: 7,
  VIP:        10,
};
