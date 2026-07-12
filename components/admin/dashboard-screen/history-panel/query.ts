import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { getAdminCorteHistoryData } from "@/app/actions/admin-corte-history";
import { CORTE_HISTORY_RANGES, type CorteHistoryRange } from "@/lib/corte-history";
import type { Locale } from "@/lib/i18n/config";
import { adminCorteHistoryQueryKey } from "../query-keys";

export { adminCorteHistoryQueryKey } from "../query-keys";

export function adminCorteHistoryQueryOptions({
  locale,
  offset,
  range,
}: {
  locale: Locale;
  offset: number;
  range: CorteHistoryRange;
}) {
  const isCurrentWeek = range === "1S" && offset === 0;

  return queryOptions({
    queryKey: adminCorteHistoryQueryKey(locale, range, offset),
    queryFn: () => getAdminCorteHistoryData({ offset, range }),
    refetchInterval: isCurrentWeek ? 60_000 : false,
    refetchIntervalInBackground: false,
    placeholderData: keepPreviousData,
    staleTime: isCurrentWeek ? 0 : 5 * 60_000,
  });
}

export function initialAdminCorteHistoryQueries(locale: Locale) {
  return CORTE_HISTORY_RANGES.flatMap((range) =>
    [0, 1].map((offset) => adminCorteHistoryQueryOptions({ locale, offset, range }))
  );
}
