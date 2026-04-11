"use client";

import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type React from "react";
import { useState } from "react";
import { adminDashboardQueryKey } from "@/components/admin/dashboard-screen/query";
import { reloadIfDeploymentSkew } from "@/lib/deployment-skew";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    const qc = new QueryClient({
      queryCache: new QueryCache({
        onError: () => {
          reloadIfDeploymentSkew();
        },
      }),
      defaultOptions: {
        queries: {
          staleTime: 60_000,
          gcTime: 5 * 60_000,
          refetchOnWindowFocus: false,
        },
      },
    });
    qc.setQueryDefaults(adminDashboardQueryKey, {
      refetchInterval: 60_000,
      refetchIntervalInBackground: true,
    });
    return qc;
  });

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
