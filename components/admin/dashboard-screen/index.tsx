"use client";

import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowDownRight,
  ArrowUpRight,
  Package2,
  ReceiptText,
  RefreshCw,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { adminDashboardQueryOptions } from "@/components/admin/dashboard-screen/query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import { HistoryPanel, LatestTransactionsPanel } from "./panels";
import { DashboardSkeleton } from "./skeleton";
import { SummaryCard } from "./summary-card";

function formatLongDate(date: Date): string {
  return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
}

function formatUpdatedLabel(timestamp: number): string {
  if (timestamp === 0) {
    return "Esperando datos";
  }

  return `Actualizado ${formatDistanceToNow(new Date(timestamp), {
    addSuffix: true,
    locale: es,
  })}`;
}

export function AdminDashboardScreen() {
  const { data, dataUpdatedAt, error, isFetching, isPending, refetch } = useQuery(
    adminDashboardQueryOptions()
  );

  const comparisonTone =
    data?.revenueVsLastWeek == null
      ? "border-border bg-muted text-muted-foreground"
      : data.revenueVsLastWeek >= 0
        ? "border-success-border bg-success text-success-foreground"
        : "border-destructive/20 bg-destructive/10 text-destructive";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="space-y-1">
            <h1 className="text-2xl text-foreground">Dashboard</h1>
            <p className="text-sm capitalize text-muted-foreground">
              {formatLongDate(new Date())}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-2 text-xs font-semibold text-foreground">
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  data?.hasOpenSession
                    ? "bg-success-foreground"
                    : "bg-muted-foreground/50"
                )}
              />
              <span>{data?.openSessionLabel ?? "Sin sesión abierta"}</span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
              aria-label="Actualizar dashboard"
            >
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            </Button>
          </div>
        </div>
      </header>

      <div className="space-y-6 p-4 md:p-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg text-foreground">Resumen de hoy</h2>
            <p className="text-sm text-muted-foreground">
              Sigue ventas, volumen y cortes del día en una sola vista.
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Actualiza cada 60 s · {formatUpdatedLabel(dataUpdatedAt)}
          </p>
        </div>

        {isPending ? (
          <DashboardSkeleton />
        ) : error || !data ? (
          <Card className="rounded-3xl">
            <CardContent className="flex flex-col gap-3 p-6">
              <h3 className="text-base font-semibold text-foreground">
                No se pudo cargar el dashboard
              </h3>
              <p className="text-sm text-muted-foreground">
                Verifica tu sesión de administrador e intenta actualizar de nuevo.
              </p>
              <div>
                <Button type="button" variant="outline" onClick={() => refetch()}>
                  Reintentar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <SummaryCard
                label="Ingresos hoy"
                value={formatCurrency(data.revenueToday)}
                icon={Wallet}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
                      comparisonTone
                    )}
                  >
                    {data.revenueVsLastWeek == null ? null : data.revenueVsLastWeek >=
                      0 ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5" />
                    )}
                    {data.revenueVsLastWeek == null
                      ? "Sin dato"
                      : `${data.revenueVsLastWeek >= 0 ? "+" : ""}${data.revenueVsLastWeek.toFixed(1)}%`}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {data.comparisonLabel}
                  </span>
                </div>
              </SummaryCard>

              <SummaryCard
                label="Transacciones"
                value={data.transactionCount}
                icon={ReceiptText}
              >
                <p className="text-xs text-muted-foreground">
                  Ventas completadas durante la jornada.
                </p>
              </SummaryCard>

              <SummaryCard
                label="Productos vendidos"
                value={data.productsSold}
                icon={Package2}
              >
                <p className="text-xs text-muted-foreground">
                  Unidades despachadas en las ventas de hoy.
                </p>
              </SummaryCard>

              <Card className="rounded-3xl border-primary/10 bg-primary text-primary-foreground">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm text-primary-foreground/70">
                        Más vendido hoy
                      </p>
                      <CardTitle className="text-2xl text-primary-foreground">
                        {data.topProduct?.name ?? "Sin ventas"}
                      </CardTitle>
                    </div>
                    <TrendingUp className="h-5 w-5 text-primary-foreground/70" />
                  </div>

                  {data.topProduct ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="inverted" size="chip">
                        {data.topProduct.units} unidades
                      </Badge>
                      {data.topProduct.category ? (
                        <Badge variant="inverted" size="chip">
                          {data.topProduct.category}
                        </Badge>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-xs text-primary-foreground/70">
                      Aún no hay un producto destacado para mostrar.
                    </p>
                  )}
                </CardHeader>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
              <LatestTransactionsPanel
                transactionCount={data.transactionCount}
                latestTransactions={data.latestTransactions}
              />
              <HistoryPanel sessionHistory={data.sessionHistory} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
