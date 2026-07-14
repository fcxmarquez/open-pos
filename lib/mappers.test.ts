import { describe, expect, test } from "bun:test";
import { dbProductToStoreProduct, getProductDisplayName } from "@/lib/mappers";

const baseProduct = {
  id: "f429047c-c4cf-43e1-970d-e24122a3338d",
  barcode: "7500000000000",
  pluCode: null,
  name: "Cuaderno",
  price: "25.00",
  costPrice: null,
  category: "Cuadernos",
  createdAt: new Date("2026-07-14T12:00:00.000Z"),
  lastSoldAt: null,
};

describe("dbProductToStoreProduct", () => {
  test("preserves missing-name state for display-time translation", () => {
    const product = dbProductToStoreProduct({ ...baseProduct, name: null });

    expect(product.name).toBe("");
    expect(product.isUnnamed).toBe(true);
    expect(getProductDisplayName(product, "Unnamed")).toBe("Unnamed");
    expect(getProductDisplayName(product, "Sin nombre")).toBe("Sin nombre");
  });

  test("normalizes unexpected database categories", () => {
    const product = dbProductToStoreProduct({
      ...baseProduct,
      category: "Legacy category",
    });

    expect(product.category).toBe("General");
  });
});
