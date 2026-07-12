import { describe, expect, test } from "bun:test";
import { getMonthProgress, mexicoAnchoredDate, toMexicoDateString } from "@/lib/utils";

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

  test("year boundary (last day of December)", () => {
    expect(getMonthProgress("2026-12-31")).toEqual({
      monthDaysElapsed: 31,
      monthDaysTotal: 31,
    });
  });
});

describe("mexicoAnchoredDate", () => {
  test("anchors at local noon on Mexico's calendar date for the given instant", () => {
    const input = new Date("2026-06-30T23:30:00Z");
    const anchored = mexicoAnchoredDate(input);
    const anchoredDateString = `${anchored.getFullYear()}-${String(anchored.getMonth() + 1).padStart(2, "0")}-${String(anchored.getDate()).padStart(2, "0")}`;

    expect(anchored.getHours()).toBe(12);
    expect(anchoredDateString).toBe(toMexicoDateString(input));
  });
});

describe("toMexicoDateString", () => {
  test("uses the Mexico City calendar date at the midnight boundary", () => {
    expect(toMexicoDateString(new Date("2026-07-10T05:59:59.000Z"))).toBe("2026-07-09");
    expect(toMexicoDateString(new Date("2026-07-10T06:00:00.000Z"))).toBe("2026-07-10");
  });
});
