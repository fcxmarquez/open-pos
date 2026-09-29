import { beforeEach, describe, expect, mock, test } from "bun:test";
import { PRODUCT_SEARCH_RESULT_LIMIT } from "@/lib/constants/products";

const appliedLimits: Array<number | undefined> = [];

function createSelectBuilder() {
  let appliedLimit: number | undefined;
  const builder = {
    from() {
      return builder;
    },
    where() {
      return builder;
    },
    orderBy() {
      return builder;
    },
    limit(value: number) {
      appliedLimit = value;
      return builder;
    },
    then<TResult1 = unknown[], TResult2 = never>(
      onFulfilled?: ((value: unknown[]) => TResult1 | PromiseLike<TResult1>) | null,
      onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ) {
      appliedLimits.push(appliedLimit);
      return Promise.resolve([]).then(onFulfilled, onRejected);
    },
  };

  return builder;
}

mock.module("@/db", () => ({
  db: {
    select: () => createSelectBuilder(),
  },
}));

async function searchProducts(
  ...args: Parameters<typeof import("./products").searchProducts>
) {
  const { searchProducts: query } = await import("./products");
  return query(...args);
}

async function searchProductsAction(query: string) {
  const { searchProducts: action } = await import("@/app/actions/product-queries");
  return action(query);
}

describe("searchProducts", () => {
  beforeEach(() => {
    appliedLimits.length = 0;
  });

  test("returns every match when no limit is requested", async () => {
    await searchProducts("co");

    expect(appliedLimits).toEqual([undefined]);
  });

  test("caps the POS typeahead at the requested limit", async () => {
    await searchProducts("co", 50);

    expect(appliedLimits).toEqual([50]);
  });

  test("ignores a non-positive limit so callers still get the full set", async () => {
    await searchProducts("co", 0);

    expect(appliedLimits).toEqual([undefined]);
  });

  test("truncates a fractional limit before sending it to the database", async () => {
    await searchProducts("papel", 50.9);

    expect(appliedLimits).toEqual([50]);
  });

  test("the POS action uses the typeahead cap", async () => {
    await searchProductsAction("co");

    expect(appliedLimits).toEqual([PRODUCT_SEARCH_RESULT_LIMIT]);
  });
});
