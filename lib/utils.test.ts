import { describe, expect, test } from "bun:test";
import { getMonthProgress } from "@/lib/utils";

describe("getMonthProgress", () => {
  test("last day of a 30-day month", () => {
    expect(getMonthProgress("2026-06-30")).toEqual({
      monthDaysElapsed: 30,
      monthDaysTotal: 30,
    });
  });

  test("first day of a 31-day month", () => {
    expect(getMonthProgress("2026-07-01")).toEqual({
      monthDaysElapsed: 1,
      monthDaysTotal: 31,
    });
  });

  test("non-leap February", () => {
    expect(getMonthProgress("2026-02-15")).toEqual({
      monthDaysElapsed: 15,
      monthDaysTotal: 28,
    });
  });

  test("leap February", () => {
    expect(getMonthProgress("2024-02-15")).toEqual({
      monthDaysElapsed: 15,
      monthDaysTotal: 29,
    });
  });
});
