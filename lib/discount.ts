export const MAX_DISCOUNT_PERCENT = 60;
const DISCOUNT_PERCENT_SCALE = 100;
const MAX_DISCOUNT_BASIS_POINTS = MAX_DISCOUNT_PERCENT * DISCOUNT_PERCENT_SCALE;
const DISCOUNT_DENOMINATOR_BASIS_POINTS = 100 * DISCOUNT_PERCENT_SCALE;
const DISCOUNT_INPUT_PATTERN = /^(?:\d+|\d*\.\d+)$/;

export interface DiscountBreakdown {
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
}

/**
 * cart-percentage-discount.RULES.1
 * cart-percentage-discount.RULES.2
 * cart-percentage-discount.RULES.3
 * Negative, NaN, and non-finite input clamp to 0; anything above the max clamps to it.
 * Percentages are normalized to the same 2-decimal scale persisted in the DB
 * before they are used in calculations.
 */
export function clampDiscountPercent(value: number): number {
  return toDiscountBasisPoints(value) / DISCOUNT_PERCENT_SCALE;
}

/**
 * cart-percentage-discount.RULES.3
 * Accepts normal positive decimal input, optionally with a trailing percent
 * sign. Negative, blank, and mixed non-numeric strings are ignored.
 */
export function parseDiscountPercentInput(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;

  const trimmed = value.trim();
  if (trimmed === "" || trimmed.startsWith("-")) return 0;

  const normalized = trimmed.replace(/\s*%\s*$/, "").trim();
  if (!DISCOUNT_INPUT_PATTERN.test(normalized)) return 0;

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDiscountBasisPoints(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;

  const clamped = Math.min(value, MAX_DISCOUNT_PERCENT);
  const shifted = Number(`${clamped}e2`);
  const basisPoints = Number.isFinite(shifted)
    ? Math.round(shifted)
    : Math.round(clamped * DISCOUNT_PERCENT_SCALE);

  return Math.min(basisPoints, MAX_DISCOUNT_BASIS_POINTS);
}

/**
 * cart-percentage-discount.CART_TOTALS.1
 * cart-percentage-discount.CART_TOTALS.2
 * cart-percentage-discount.CART_TOTALS.3
 * cart-percentage-discount.ROUNDING.1
 * Shared by client (cart preview) and server (sale persistence) so both sides
 * round identically and never disagree on the charged total. Works in integer
 * cents throughout — multiplying in floating-point dollars first (e.g.
 * `subtotal * percent / 100`) misrounds ~0.25% of subtotal/percent
 * combinations by a penny due to binary float representation.
 */
export function computeDiscountBreakdown(
  subtotal: number,
  rawPercent: number
): DiscountBreakdown {
  const discountBasisPoints = toDiscountBasisPoints(rawPercent);
  const subtotalCents =
    Number.isFinite(subtotal) && subtotal > 0 ? Math.round(subtotal * 100) : 0;
  const discountCents = Math.round(
    (subtotalCents * discountBasisPoints) / DISCOUNT_DENOMINATOR_BASIS_POINTS
  );
  const totalCents = Math.max(0, subtotalCents - discountCents);

  return {
    subtotal: subtotalCents / 100,
    discountPercent: discountBasisPoints / DISCOUNT_PERCENT_SCALE,
    discountAmount: discountCents / 100,
    total: totalCents / 100,
  };
}
