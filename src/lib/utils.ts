import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * PostgreSQL NUMERIC columns come back as strings from PostgREST
 * (e.g. "120.00" instead of 120). Call toN() before any arithmetic
 * or .toFixed() to avoid TypeError at runtime.
 */
export function toN(v: unknown): number {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}
