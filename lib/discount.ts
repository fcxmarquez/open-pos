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
 * round identically and never disagree on the charged total.
 */
export function computeDiscountBreakdown(
  subtotal: number,
  rawPercent: number
): DiscountBreakdown {
  const safeSubtotal = Number.isFinite(subtotal) && subtotal > 0 ? subtotal : 0;
  const discountPercent = clampDiscountPercent(rawPercent);
  const discountAmount = Math.round(safeSubtotal * (discountPercent / 100) * 100) / 100;
  const total = Math.max(0, Math.round((safeSubtotal - discountAmount) * 100) / 100);

  return { subtotal: safeSubtotal, discountPercent, discountAmount, total };
}
