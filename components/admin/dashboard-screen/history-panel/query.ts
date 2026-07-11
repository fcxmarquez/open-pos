import { queryOptions } from "@tanstack/react-query";
import { getAdminCorteHistoryData } from "@/app/actions/admin-corte-history";
import { CORTE_HISTORY_RANGES, type CorteHistoryRange } from "@/lib/corte-history";

export const adminCorteHistoryQueryKey = (range: CorteHistoryRange, offset: number) =>
  ["admin-dashboard", "corte-history", range, offset] as const;

export function adminCorteHistoryQueryOptions({
  offset,
  range,
}: {
  offset: number;
  range: CorteHistoryRange;
}) {
  const isCurrentWeek = range === "1S" && offset === 0;

  return queryOptions({
    queryKey: adminCorteHistoryQueryKey(range, offset),
    queryFn: () => getAdminCorteHistoryData({ offset, range }),
    refetchInterval: isCurrentWeek ? 60_000 : false,
    refetchIntervalInBackground: false,
    staleTime: isCurrentWeek ? 0 : 5 * 60_000,
  });
}

export function initialAdminCorteHistoryQueries() {
  return CORTE_HISTORY_RANGES.flatMap((range) =>
    [0, 1].map((offset) => adminCorteHistoryQueryOptions({ offset, range }))
  );
}
