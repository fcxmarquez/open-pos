import { describe, expect, test } from "bun:test";
import {
  buildCorteHistoryData,
  getCorteHistoryWindow,
  isCorteHistoryRange,
  isCorteHistoryView,
  normalizeCorteHistoryOffset,
} from "./corte-history";

describe("corte history input guards", () => {
  test("accepts only configured ranges", () => {
    expect(isCorteHistoryRange("1S")).toBe(true);
    expect(isCorteHistoryRange("1M")).toBe(true);
    expect(isCorteHistoryRange("6M")).toBe(true);
    expect(isCorteHistoryRange("1A")).toBe(true);
    expect(isCorteHistoryRange("30D")).toBe(false);
    expect(isCorteHistoryRange(undefined)).toBe(false);
  });

  test("accepts only configured chart views", () => {
    expect(isCorteHistoryView("bar")).toBe(true);
    expect(isCorteHistoryView("line")).toBe(true);
    expect(isCorteHistoryView("pie")).toBe(false);
    expect(isCorteHistoryView(undefined)).toBe(false);
  });

  test("normalizes invalid offsets to the current period", () => {
    expect(normalizeCorteHistoryOffset(2)).toBe(2);
    expect(normalizeCorteHistoryOffset(0)).toBe(0);
    expect(normalizeCorteHistoryOffset(-1)).toBe(0);
    expect(normalizeCorteHistoryOffset(1.5)).toBe(0);
    expect(normalizeCorteHistoryOffset(Number.NaN)).toBe(0);
    expect(normalizeCorteHistoryOffset("1")).toBe(0);
  });
});

describe("getCorteHistoryWindow", () => {
  test("builds the current calendar week from Monday to Sunday", () => {
    expect(getCorteHistoryWindow("1S", 0, "2026-07-04")).toMatchObject({
      endDate: "2026-07-05",
      granularity: "day",
      offset: 0,
      range: "1S",
      startDate: "2026-06-29",
    });
  });

  test("moves weekly windows backward by exact calendar weeks", () => {
    expect(getCorteHistoryWindow("1S", 2, "2026-07-04")).toMatchObject({
      endDate: "2026-06-21",
      startDate: "2026-06-15",
    });
  });

  test("keeps Sunday in the same week and starts a new week on Monday", () => {
    expect(getCorteHistoryWindow("1S", 0, "2026-07-05")).toMatchObject({
      endDate: "2026-07-05",
      startDate: "2026-06-29",
    });

    expect(getCorteHistoryWindow("1S", 0, "2026-07-06")).toMatchObject({
      endDate: "2026-07-12",
      startDate: "2026-07-06",
    });
  });

  test("builds current and previous calendar months", () => {
    expect(getCorteHistoryWindow("1M", 0, "2026-07-04")).toMatchObject({
      endDate: "2026-07-31",
      granularity: "day",
      startDate: "2026-07-01",
    });

    expect(getCorteHistoryWindow("1M", 1, "2026-07-04")).toMatchObject({
      endDate: "2026-06-30",
      startDate: "2026-06-01",
    });
  });

  test("handles previous-year months and leap February", () => {
    expect(getCorteHistoryWindow("1M", 1, "2026-01-04")).toMatchObject({
      endDate: "2025-12-31",
      startDate: "2025-12-01",
    });

    expect(getCorteHistoryWindow("1M", 0, "2024-02-15")).toMatchObject({
      endDate: "2024-02-29",
      startDate: "2024-02-01",
    });
  });

  test("builds current and previous calendar semesters", () => {
    expect(getCorteHistoryWindow("6M", 0, "2026-07-04")).toMatchObject({
      endDate: "2026-12-31",
      granularity: "month",
      startDate: "2026-07-01",
    });

    expect(getCorteHistoryWindow("6M", 1, "2026-07-04")).toMatchObject({
      endDate: "2026-06-30",
      startDate: "2026-01-01",
    });
  });

  test("handles first-semester navigation across the year boundary", () => {
    expect(getCorteHistoryWindow("6M", 0, "2026-01-04")).toMatchObject({
      endDate: "2026-06-30",
      startDate: "2026-01-01",
    });

    expect(getCorteHistoryWindow("6M", 1, "2026-01-04")).toMatchObject({
      endDate: "2025-12-31",
      startDate: "2025-07-01",
    });
  });

  test("builds current and previous calendar years", () => {
    expect(getCorteHistoryWindow("1A", 0, "2026-07-04")).toMatchObject({
      endDate: "2026-12-31",
      granularity: "month",
      label: "2026",
      startDate: "2026-01-01",
    });

    expect(getCorteHistoryWindow("1A", 1, "2026-07-04")).toMatchObject({
      endDate: "2025-12-31",
      label: "2025",
      startDate: "2025-01-01",
    });
  });
});

describe("buildCorteHistoryData", () => {
  test("keeps every day in a weekly period and fills missing days with zero revenue", () => {
    const window = getCorteHistoryWindow("1S", 0, "2026-07-04");
    const result = buildCorteHistoryData(window, [
      { bucket: "2026-06-30", closedSessions: 2, revenue: 150.5 },
      { bucket: "2026-07-04", closedSessions: 1, revenue: 75 },
    ]);

    expect(result.buckets).toHaveLength(7);
    expect(result.buckets.map((bucket) => bucket.key)).toEqual([
      "2026-06-29",
      "2026-06-30",
      "2026-07-01",
      "2026-07-02",
      "2026-07-03",
      "2026-07-04",
      "2026-07-05",
    ]);
    expect(result.buckets[0]).toMatchObject({ hasData: false, revenue: 0 });
    expect(result.buckets[1]).toMatchObject({
      closedSessions: 2,
      hasData: true,
      revenue: 150.5,
    });
    expect(result.closedSessionsCount).toBe(3);
    expect(result.hasData).toBe(true);
    expect(result.totalRevenue).toBe(225.5);
  });

  test("returns a zero-filled empty period with display labels", () => {
    const weekly = buildCorteHistoryData(
      getCorteHistoryWindow("1S", 0, "2026-07-04"),
      []
    );
    const yearly = buildCorteHistoryData(
      getCorteHistoryWindow("1A", 0, "2026-07-04"),
      []
    );

    expect(weekly.closedSessionsCount).toBe(0);
    expect(weekly.hasData).toBe(false);
    expect(weekly.totalRevenue).toBe(0);
    expect(
      weekly.buckets.every((bucket) => !bucket.hasData && bucket.revenue === 0)
    ).toBe(true);
    expect(weekly.buckets[0]).toMatchObject({
      label: "lun 29",
      tooltipLabel: "29 jun 2026",
    });
    expect(yearly.buckets[0]).toMatchObject({
      label: "ene",
      tooltipLabel: "enero 2026",
    });
  });

  test("keeps every month in yearly periods", () => {
    const window = getCorteHistoryWindow("1A", 0, "2026-07-04");
    const result = buildCorteHistoryData(window, [
      { bucket: "2026-03", closedSessions: 1, revenue: 300 },
      { bucket: "2026-06", closedSessions: 1, revenue: 686 },
    ]);

    expect(result.buckets).toHaveLength(12);
    expect(result.buckets.map((bucket) => bucket.key)).toEqual([
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10",
      "2026-11",
      "2026-12",
    ]);
    expect(result.buckets[2]).toMatchObject({ hasData: true, revenue: 300 });
    expect(result.buckets[6]).toMatchObject({ hasData: false, revenue: 0 });
    expect(result.totalRevenue).toBe(986);
  });
});
