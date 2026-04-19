import type { Product } from "@/lib/database.types";

/**
 * Factor que se multiplica sobre public_price para obtener el precio de activación.
 * Básico → 40% OFF → cliente paga el 60%
 * Intermedio → 50% OFF → cliente paga el 50%
 * VIP → 55% OFF → cliente paga el 45%
 */
export const ACTIVATION_FACTOR: Record<string, number> = {
  Básico:     0.60,
  Intermedio: 0.50,
  VIP:        0.45,
};

/** Porcentaje de descuento visible en la UI */
export const ACTIVATION_DISCOUNT_PCT: Record<string, number> = {
  Básico:     40,
  Intermedio: 50,
  VIP:        55,
};

/** Metas de compra acumulada para completar la activación (en S/) */
export const ACTIVATION_TARGET: Record<string, number> = {
  Básico:     120,
  Intermedio: 2000,
  VIP:        10000,
};

/** Orden ascendente de planes para detectar posibilidades de upgrade */
export const PLAN_ORDER = ["Básico", "Intermedio", "VIP"] as const;
export type PlanName = typeof PLAN_ORDER[number];

/**
 * Calcula el precio de activación de un producto para el plan dado.
 * Siempre se calcula sobre public_price (precio al cliente final).
 */
export function getActivationPrice(product: Product, plan: string): number {
  const base   = product.public_price ?? product.price;
  const factor = ACTIVATION_FACTOR[plan] ?? 0.60;
  return parseFloat((base * factor).toFixed(2));
}

/**
 * Devuelve el plan inmediatamente superior, o null si ya es VIP.
 */
export function getNextPlan(plan: string): PlanName | null {
  const idx = PLAN_ORDER.indexOf(plan as PlanName);
  if (idx === -1 || idx >= PLAN_ORDER.length - 1) return null;
  return PLAN_ORDER[idx + 1];
}

/**
 * Niveles de red desbloqueados por plan (para la UI del upgrade banner).
 */
export const PLAN_DEPTH: Record<string, number> = {
  Básico:     3,
  Intermedio: 7,
  VIP:        10,
};
