import { queryOptions } from "@tanstack/react-query";
import { getAdminDashboardData } from "@/app/actions/admin-dashboard";

export const adminDashboardQueryKey = ["admin-dashboard"] as const;

export function adminDashboardQueryOptions() {
  return queryOptions({
    queryKey: adminDashboardQueryKey,
    queryFn: () => getAdminDashboardData(),
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
  });
}
