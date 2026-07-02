import { describe, expect, test } from "bun:test";
import {
  clampDiscountPercent,
  computeDiscountBreakdown,
  parseDiscountPercentInput,
} from "./discount";

describe("parseDiscountPercentInput", () => {
  test("cart-percentage-discount.RULES.3 accepts plain positive decimal input", () => {
    expect(parseDiscountPercentInput("15")).toBe(15);
    expect(parseDiscountPercentInput("12.5")).toBe(12.5);
    expect(parseDiscountPercentInput(".5")).toBe(0.5);
    expect(parseDiscountPercentInput("15%")).toBe(15);
  });

  test("cart-percentage-discount.RULES.3 ignores negative, blank, and mixed non-numeric strings", () => {
    expect(parseDiscountPercentInput("-5")).toBe(0);
    expect(parseDiscountPercentInput("")).toBe(0);
    expect(parseDiscountPercentInput("abc5")).toBe(0);
    expect(parseDiscountPercentInput("1e2")).toBe(0);
    expect(parseDiscountPercentInput(Number.NaN)).toBe(0);
    expect(parseDiscountPercentInput(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("clampDiscountPercent", () => {
  test("cart-percentage-discount.RULES.1 keeps values within the 0-60 range unchanged", () => {
    expect(clampDiscountPercent(0)).toBe(0);
    expect(clampDiscountPercent(15)).toBe(15);
    expect(clampDiscountPercent(60)).toBe(60);
  });

  test("cart-percentage-discount.RULES.2 clamps values above 60 down to 60", () => {
    expect(clampDiscountPercent(61)).toBe(60);
    expect(clampDiscountPercent(100)).toBe(60);
  });

  test("normalizes percentages to the persisted 2-decimal precision", () => {
    expect(clampDiscountPercent(12.345)).toBe(12.35);
    expect(clampDiscountPercent(10.004)).toBe(10);
    expect(clampDiscountPercent(10.005)).toBe(10.01);
  });

  test("cart-percentage-discount.RULES.3 treats negative, NaN, and non-finite values as 0", () => {
    expect(clampDiscountPercent(-10)).toBe(0);
    expect(clampDiscountPercent(Number.NaN)).toBe(0);
    expect(clampDiscountPercent(Number.POSITIVE_INFINITY)).toBe(0);
    expect(clampDiscountPercent(Number.NEGATIVE_INFINITY)).toBe(0);
  });
});

// biome-ignore lint/security/noSecrets: false positive on the function name identifier
describe("computeDiscountBreakdown", () => {
  test("cart-percentage-discount.CART_TOTALS.1-3 returns subtotal, discount amount, and total", () => {
    const result = computeDiscountBreakdown(100, 10);
    expect(result.subtotal).toBe(100);
    expect(result.discountPercent).toBe(10);
    expect(result.discountAmount).toBe(10);
    expect(result.total).toBe(90);
  });

  test("cart-percentage-discount.CART_TOTALS.4 leaves the total unchanged when discount is 0", () => {
    const result = computeDiscountBreakdown(49.99, 0);
    expect(result.discountAmount).toBe(0);
    expect(result.total).toBe(49.99);
  });

  test("cart-percentage-discount.RULES.3 never lets the total exceed the subtotal", () => {
    const result = computeDiscountBreakdown(20, -5);
    expect(result.discountAmount).toBe(0);
    expect(result.total).toBe(20);
  });

  test("cart-percentage-discount.ROUNDING.1 rounds the discount amount and total to 2 decimals", () => {
    const result = computeDiscountBreakdown(19.99, 33);
    expect(result.discountAmount).toBe(6.6);
    expect(result.total).toBe(13.39);
  });

  test("cart-percentage-discount.RULES.2 clamps a 60% discount at the floor and never goes negative", () => {
    const result = computeDiscountBreakdown(10, 60);
    expect(result.discountAmount).toBe(6);
    expect(result.total).toBe(4);
    expect(result.total).toBeGreaterThanOrEqual(0);
  });

  test("cart-percentage-discount.RULES.5 treats a zero or negative subtotal as no discount possible", () => {
    const result = computeDiscountBreakdown(0, 20);
    expect(result.subtotal).toBe(0);
    expect(result.discountAmount).toBe(0);
    expect(result.total).toBe(0);
  });

  test("cart-percentage-discount.ROUNDING.1 stays penny-accurate where naive float multiplication misrounds", () => {
    // subtotal * (percent / 100) in floating-point dollars misrounds this combination down a cent
    expect(computeDiscountBreakdown(0.29, 50)).toMatchObject({
      discountAmount: 0.15,
      total: 0.14,
    });
    expect(computeDiscountBreakdown(4.27, 50)).toMatchObject({
      discountAmount: 2.14,
      total: 2.13,
    });
    expect(computeDiscountBreakdown(0.5, 57)).toMatchObject({
      discountAmount: 0.29,
      total: 0.21,
    });
  });

  test("uses the persisted percent precision before calculating discount amount", () => {
    expect(computeDiscountBreakdown(1000, 10.004)).toMatchObject({
      discountPercent: 10,
      discountAmount: 100,
      total: 900,
    });

    const result = computeDiscountBreakdown(9999.99, 12.345);
    expect(result).toMatchObject({
      discountPercent: 12.35,
      discountAmount: 1235,
      total: 8764.99,
    });

    expect(
      computeDiscountBreakdown(result.subtotal, result.discountPercent)
    ).toMatchObject({
      discountAmount: result.discountAmount,
      total: result.total,
    });
  });
});
