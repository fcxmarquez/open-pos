import { queryOptions } from "@tanstack/react-query";
import {
  getSessionHistory,
  getTodaySales,
  getTodaySession,
} from "@/app/actions/session-queries";

export const todaySessionQueryKey = ["today-session"] as const;
export const todaySalesQueryKey = ["today-sales"] as const;
export const sessionHistoryQueryKey = ["session-history"] as const;

export function todaySessionQueryOptions() {
  return queryOptions({
    queryKey: todaySessionQueryKey,
    queryFn: () => getTodaySession(),
  });
}

export function todaySalesQueryOptions() {
  return queryOptions({
    queryKey: todaySalesQueryKey,
    queryFn: () => getTodaySales(),
  });
}

export function sessionHistoryQueryOptions() {
  return queryOptions({
    queryKey: sessionHistoryQueryKey,
    queryFn: () => getSessionHistory(),
  });
}
