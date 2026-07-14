import { describe, expect, test } from "bun:test";
import { getCategoryMessageKey, isCategory } from "@/lib/i18n/categories";

describe("category localization", () => {
  test("accepts supported database categories", () => {
    expect(isCategory("Útiles escolares")).toBe(true);
    expect(getCategoryMessageKey("Útiles escolares")).toBe("utilesEscolares");
  });

  test("rejects legacy or unexpected category text", () => {
    expect(isCategory("Legacy category")).toBe(false);
    expect(isCategory(null)).toBe(false);
  });
});
