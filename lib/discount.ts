export const MAX_DISCOUNT_PERCENT = 60;

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
 */
export function clampDiscountPercent(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(value, MAX_DISCOUNT_PERCENT);
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
  const discountPercent = clampDiscountPercent(rawPercent);
  const subtotalCents =
    Number.isFinite(subtotal) && subtotal > 0 ? Math.round(subtotal * 100) : 0;
  const discountCents = Math.round((subtotalCents * discountPercent) / 100);
  const totalCents = Math.max(0, subtotalCents - discountCents);

  return {
    subtotal: subtotalCents / 100,
    discountPercent,
    discountAmount: discountCents / 100,
    total: totalCents / 100,
  };
}
