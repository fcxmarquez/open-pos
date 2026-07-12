import { queryOptions } from "@tanstack/react-query";
import { getAdminDashboardData } from "@/app/actions/admin-dashboard";
import type { Locale } from "@/lib/i18n/config";
import { adminDashboardQueryKey } from "./query-keys";

export { adminDashboardQueryKey } from "./query-keys";

export function adminDashboardQueryOptions(locale: Locale) {
  return queryOptions({
    queryKey: adminDashboardQueryKey(locale),
    queryFn: () => getAdminDashboardData(),
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
  });
}
