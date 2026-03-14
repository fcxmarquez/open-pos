import { queryOptions } from "@tanstack/react-query";
import { getOpenSession, getOpenSessionSales } from "@/app/actions/session-queries";

export const openSessionQueryKey = ["open-session"] as const;
export const openSessionSalesQueryKey = ["open-session-sales"] as const;

export function openSessionQueryOptions() {
  return queryOptions({
    queryKey: openSessionQueryKey,
    queryFn: () => getOpenSession(),
  });
}

export function openSessionSalesQueryOptions() {
  return queryOptions({
    queryKey: openSessionSalesQueryKey,
    queryFn: () => getOpenSessionSales(),
  });
}
