import type { CorteHistoryRange } from "@/lib/corte-history";
import type { Locale } from "@/lib/i18n/config";

export const adminDashboardQueryKey = (locale: Locale) =>
  ["admin-dashboard", locale] as const;

export const adminCorteHistoryQueryKey = (
  locale: Locale,
  range: CorteHistoryRange,
  offset: number
) => ["admin-dashboard", "corte-history", locale, range, offset] as const;
