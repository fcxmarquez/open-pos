import { describe, expect, test } from "bun:test";
import { isLocale, locales } from "@/lib/i18n/config";

describe("isLocale", () => {
  test("derives supported values from the locale collection", () => {
    for (const locale of locales) {
      expect(isLocale(locale)).toBe(true);
    }
  });

  test("rejects unsupported and empty values", () => {
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});
