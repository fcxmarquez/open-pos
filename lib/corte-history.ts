import { format } from "date-fns";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { getDateFnsLocale } from "@/lib/i18n/date-locale";

export const CORTE_HISTORY_RANGES = ["1S", "1M", "6M", "1A"] as const;

export type CorteHistoryRange = (typeof CORTE_HISTORY_RANGES)[number];
export type CorteHistoryView = "bar" | "line";
export type CorteHistoryGranularity = "day" | "month";

/** Message keys under corte.history.* for range tab labels. */
export const CORTE_HISTORY_RANGE_LABEL_KEYS = {
  "1S": "range1S",
  "1M": "range1M",
  "6M": "range6M",
  "1A": "range1A",
} as const satisfies Record<CorteHistoryRange, string>;

/** Message keys under corte.history.* for range tab aria-labels. */
export const CORTE_HISTORY_RANGE_ARIA_KEYS = {
  "1S": "range1SAria",
  "1M": "range1MAria",
  "6M": "range6MAria",
  "1A": "range1AAria",
} as const satisfies Record<CorteHistoryRange, string>;

export interface CorteHistoryWindow {
  endDate: string;
  granularity: CorteHistoryGranularity;
  label: string;
  offset: number;
  range: CorteHistoryRange;
  startDate: string;
}

export interface CorteHistoryBucket {
  closedSessions: number;
  hasData: boolean;
  key: string;
  label: string;
  revenue: number;
  tooltipLabel: string;
}

export interface CorteHistoryBucketRow {
  bucket: string;
  closedSessions: number;
  revenue: number;
}

export interface CorteHistoryData extends CorteHistoryWindow {
  buckets: CorteHistoryBucket[];
  closedSessionsCount: number;
  hasData: boolean;
  totalRevenue: number;
}

export function isCorteHistoryRange(value: unknown): value is CorteHistoryRange {
  return (
    typeof value === "string" && CORTE_HISTORY_RANGES.includes(value as CorteHistoryRange)
  );
}

export function isCorteHistoryView(value: unknown): value is CorteHistoryView {
  return value === "bar" || value === "line";
}

export function normalizeCorteHistoryOffset(offset: unknown): number {
  return typeof offset === "number" && Number.isInteger(offset) && offset > 0
    ? offset
    : 0;
}

function getDateParts(dateString: string): {
  day: number;
  month: number;
  year: number;
} {
  const [year, month, day] = dateString.split("-").map(Number);
  return { day, month, year };
}

function dateStringFromParts(year: number, monthIndex: number, day: number): string {
  return new Date(Date.UTC(year, monthIndex, day, 12)).toISOString().slice(0, 10);
}

function utcDateFromString(dateString: string): Date {
  const { day, month, year } = getDateParts(dateString);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function localDateFromString(dateString: string): Date {
  const { day, month, year } = getDateParts(dateString);
  return new Date(year, month - 1, day, 12);
}

function addDays(dateString: string, days: number): string {
  const date = utcDateFromString(dateString);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function addMonthsToStart(dateString: string, months: number): string {
  const { month, year } = getDateParts(dateString);
  return dateStringFromParts(year, month - 1 + months, 1);
}

function endOfMonth(dateString: string): string {
  const { month, year } = getDateParts(dateString);
  return dateStringFromParts(year, month, 0);
}

function formatPlainDate(dateString: string, pattern: string, locale: Locale): string {
  return format(localDateFromString(dateString), pattern, {
    locale: getDateFnsLocale(locale),
  });
}

function formatDateRangeLabel(
  startDate: string,
  endDate: string,
  locale: Locale
): string {
  return `${formatPlainDate(startDate, "d MMM", locale)} - ${formatPlainDate(
    endDate,
    "d MMM yyyy",
    locale
  )}`;
}

export function getCorteHistoryWindow(
  range: CorteHistoryRange,
  offset: number,
  today: string,
  locale: Locale = defaultLocale
): CorteHistoryWindow {
  const normalizedOffset = normalizeCorteHistoryOffset(offset);
  const { month, year } = getDateParts(today);

  if (range === "1S") {
    const weekday = utcDateFromString(today).getUTCDay();
    const daysSinceMonday = (weekday + 6) % 7;
    const startDate = addDays(today, -(daysSinceMonday + normalizedOffset * 7));
    const endDate = addDays(startDate, 6);

    return {
      endDate,
      granularity: "day",
      label: formatDateRangeLabel(startDate, endDate, locale),
      offset: normalizedOffset,
      range,
      startDate,
    };
  }

  if (range === "1M") {
    const startDate = dateStringFromParts(year, month - 1 - normalizedOffset, 1);

    return {
      endDate: endOfMonth(startDate),
      granularity: "day",
      label: formatPlainDate(startDate, "MMMM yyyy", locale),
      offset: normalizedOffset,
      range,
      startDate,
    };
  }

  if (range === "6M") {
    const currentSemesterStartMonth = month <= 6 ? 1 : 7;
    const startDate = dateStringFromParts(
      year,
      currentSemesterStartMonth - 1 - normalizedOffset * 6,
      1
    );
    const endDate = addDays(addMonthsToStart(startDate, 6), -1);

    return {
      endDate,
      granularity: "month",
      label: formatDateRangeLabel(startDate, endDate, locale),
      offset: normalizedOffset,
      range,
      startDate,
    };
  }

  const targetYear = year - normalizedOffset;
  const startDate = dateStringFromParts(targetYear, 0, 1);
  const endDate = dateStringFromParts(targetYear, 12, 0);

  return {
    endDate,
    granularity: "month",
    label: String(targetYear),
    offset: normalizedOffset,
    range,
    startDate,
  };
}

function getMonthBucketKey(dateString: string): string {
  return dateString.slice(0, 7);
}

function getBucketLabels(window: CorteHistoryWindow, key: string, locale: Locale) {
  if (window.granularity === "month") {
    const dateString = `${key}-01`;

    return {
      label: formatPlainDate(dateString, "MMM", locale),
      tooltipLabel: formatPlainDate(dateString, "MMMM yyyy", locale),
    };
  }

  return {
    label:
      window.range === "1S"
        ? formatPlainDate(key, "EEE d", locale)
        : formatPlainDate(key, "d", locale),
    tooltipLabel: formatPlainDate(key, "d MMM yyyy", locale),
  };
}

function getWindowBucketKeys(window: CorteHistoryWindow): string[] {
  if (window.granularity === "month") {
    const keys: string[] = [];
    let cursor = window.startDate;

    while (cursor <= window.endDate) {
      keys.push(getMonthBucketKey(cursor));
      cursor = addMonthsToStart(cursor, 1);
    }

    return keys;
  }

  const keys: string[] = [];
  let cursor = window.startDate;

  while (cursor <= window.endDate) {
    keys.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return keys;
}

export function buildCorteHistoryData(
  window: CorteHistoryWindow,
  rows: CorteHistoryBucketRow[],
  locale: Locale = defaultLocale
): CorteHistoryData {
  const rowByBucket = new Map(rows.map((row) => [row.bucket, row]));

  const buckets = getWindowBucketKeys(window).map((key) => {
    const row = rowByBucket.get(key);
    const labels = getBucketLabels(window, key, locale);

    return {
      closedSessions: row?.closedSessions ?? 0,
      hasData: Boolean(row && row.closedSessions > 0),
      key,
      label: labels.label,
      revenue: row?.revenue ?? 0,
      tooltipLabel: labels.tooltipLabel,
    };
  });

  return {
    ...window,
    buckets,
    closedSessionsCount: buckets.reduce(
      (total, bucket) => total + bucket.closedSessions,
      0
    ),
    hasData: buckets.some((bucket) => bucket.hasData),
    totalRevenue: buckets.reduce((total, bucket) => total + bucket.revenue, 0),
  };
}
