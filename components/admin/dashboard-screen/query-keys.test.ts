import { describe, expect, test } from "bun:test";
import { adminCorteHistoryQueryKey, adminDashboardQueryKey } from "./query-keys";

describe("localized admin query keys", () => {
  test("separates dashboard responses by locale", () => {
    expect(adminDashboardQueryKey("es")).toEqual(["admin-dashboard", "es"]);
    expect(adminDashboardQueryKey("en")).toEqual(["admin-dashboard", "en"]);
    expect(adminDashboardQueryKey("es")).not.toEqual(adminDashboardQueryKey("en"));
  });

  test("separates corte history responses by locale", () => {
    expect(adminCorteHistoryQueryKey("es", "1S", 0)).toEqual([
      "admin-dashboard",
      "corte-history",
      "es",
      "1S",
      0,
    ]);
    expect(adminCorteHistoryQueryKey("en", "1S", 0)).toEqual([
      "admin-dashboard",
      "corte-history",
      "en",
      "1S",
      0,
    ]);
    expect(adminCorteHistoryQueryKey("es", "1S", 0)).not.toEqual(
      adminCorteHistoryQueryKey("en", "1S", 0)
    );
  });
});
