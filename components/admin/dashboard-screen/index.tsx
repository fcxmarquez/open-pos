"use client";

import { CopilotSidebar } from "@copilotkit/react-core/v2";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ReceiptText,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { adminDashboardQueryOptions } from "@/components/admin/dashboard-screen/query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STORE_NAME } from "@/lib/constants/store";
import { getCategoryMessageKey } from "@/lib/i18n/categories";
import type { Locale } from "@/lib/i18n/config";
import { getDateFnsLocale } from "@/lib/i18n/date-locale";
import type { Category } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { HistoryPanel } from "./history-panel";
import { LatestTransactionsPanel } from "./latest-transactions-panel";
import { DashboardSkeleton } from "./skeleton";
import { StaleSessionBanner } from "./stale-session-banner";
import { SummaryCard } from "./summary-card";

export function AdminDashboardScreen() {
  const t = useTranslations();
  const tAdmin = useTranslations("admin.dashboard");
  const tCopilot = useTranslations("copilot");
  const tCategories = useTranslations("categories");
  const locale = useLocale() as Locale;
  const { data, dataUpdatedAt, error, isPending, refetch } = useQuery(
    adminDashboardQueryOptions()
  );
  const [dismissedStaleSessionId, setDismissedStaleSessionId] = useState<string | null>(
    null
  );

  const showStaleBanner = Boolean(
    data?.staleSession && data.staleSession.id !== dismissedStaleSessionId
  );

  function formatUpdatedLabel(timestamp: number): string {
    if (timestamp === 0) {
      return t("common.waitingForData");
    }

    return t("common.updatedAgo", {
      time: formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: getDateFnsLocale(locale),
      }),
    });
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      {process.env.NEXT_PUBLIC_COPILOT_ENABLED === "true" && (
        <CopilotSidebar
          labels={{
            modalHeaderTitle: tCopilot("modalTitle", { storeName: STORE_NAME }),
            welcomeMessageText: tCopilot("welcomeMessage"),
          }}
        />
      )}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg text-foreground">{tAdmin("title")}</h2>
          <p className="text-sm text-muted-foreground">{tAdmin("subtitle")}</p>
        </div>

        <p className="text-xs text-muted-foreground">
          {t("common.refreshInterval", { status: formatUpdatedLabel(dataUpdatedAt) })}
        </p>
      </div>

      {isPending ? (
        <DashboardSkeleton />
      ) : error || !data ? (
        <Card className="rounded-3xl">
          <CardContent className="flex flex-col gap-3 p-6">
            <h3 className="text-base font-semibold text-foreground">
              {tAdmin("loadErrorTitle")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {tAdmin("loadErrorDescription")}
            </p>
            <div>
              <Button type="button" variant="outline" onClick={() => refetch()}>
                {t("common.retry")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {showStaleBanner && data.staleSession && (
            <StaleSessionBanner
              staleSession={data.staleSession}
              onDismiss={() => setDismissedStaleSessionId(data.staleSession?.id ?? null)}
            />
          )}

          <div className="grid gap-4 md:grid-cols-4">
            <Card className="rounded-3xl">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    {tAdmin("monthProjection")}
                  </p>
                  <CalendarDays className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardTitle className="text-3xl">
                  {formatCurrency(data.revenueMonthProjected, locale)}
                </CardTitle>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {tAdmin("accumulated", {
                        amount: formatCurrency(data.revenueMonthToDate, locale),
                      })}
                    </span>
                    <span>
                      {tAdmin("dayProgress", {
                        elapsed: data.monthDaysElapsed,
                        total: data.monthDaysTotal,
                      })}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${(data.monthDaysElapsed / data.monthDaysTotal) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </CardHeader>
            </Card>

            <SummaryCard
              label={tAdmin("revenueToday")}
              value={formatCurrency(data.revenueToday, locale)}
              icon={Wallet}
            >
              {data.revenueVsLastWeek != null && (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={data.revenueVsLastWeek >= 0 ? "success" : "warning"}
                    size="pill"
                    className="gap-1"
                  >
                    {data.revenueVsLastWeek >= 0 ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5" />
                    )}
                    {`${data.revenueVsLastWeek >= 0 ? "+" : ""}${data.revenueVsLastWeek.toFixed(1)}%`}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {data.comparisonLabel}
                  </span>
                </div>
              )}
            </SummaryCard>

            <Card className="rounded-3xl">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    {tAdmin("activityToday")}
                  </p>
                  <ReceiptText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex gap-6">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {tAdmin("transactions")}
                    </p>
                    <CardTitle className="text-3xl">{data.transactionCount}</CardTitle>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{tAdmin("products")}</p>
                    <CardTitle className="text-3xl">{data.productsSold}</CardTitle>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="rounded-3xl border-primary/10 bg-primary text-primary-foreground">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm text-primary-foreground/70">
                      {tAdmin("topSeller")}
                    </p>
                    <CardTitle className="text-2xl text-primary-foreground">
                      {data.topProduct?.name ?? tAdmin("noSales")}
                    </CardTitle>
                  </div>
                  <TrendingUp className="h-5 w-5 text-primary-foreground/70" />
                </div>

                {data.topProduct ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="inverted" size="chip">
                      {t("common.units", { count: data.topProduct.units })}
                    </Badge>
                    {data.topProduct.category ? (
                      <Badge variant="inverted" size="chip">
                        {tCategories(
                          getCategoryMessageKey(data.topProduct.category as Category)
                        )}
                      </Badge>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-xs text-primary-foreground/70">
                    {tAdmin("noTopProduct")}
                  </p>
                )}
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
            <LatestTransactionsPanel
              transactionCount={data.transactionCount}
              productsSold={data.productsSold}
              latestTransactions={data.latestTransactions}
            />
            <HistoryPanel />
          </div>
        </>
      )}
    </div>
  );
}
