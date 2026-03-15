"use client";

import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ReceiptText,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";
import { adminDashboardQueryOptions } from "@/components/admin/dashboard-screen/query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { HistoryPanel, LatestTransactionsPanel } from "./panels";
import { DashboardSkeleton } from "./skeleton";
import { SummaryCard } from "./summary-card";

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
  const { data, dataUpdatedAt, error, isPending, refetch } = useQuery(
    adminDashboardQueryOptions()
  );
  const [staleBannerDismissed, setStaleBannerDismissed] = useState(false);

  const showStaleBanner = !!data?.staleSession && !staleBannerDismissed;

  return (
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
          {showStaleBanner && data.staleSession && (
            <div className="flex items-start justify-between gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <span>
                  El corte del{" "}
                  <span className="font-medium">
                    {format(
                      new Date(`${data.staleSession.sessionDate}T12:00:00`),
                      "d 'de' MMMM",
                      { locale: es }
                    )}
                  </span>{" "}
                  (Turno {data.staleSession.sessionNumber}) no fue cerrado. Se cerrará
                  automáticamente al registrar la próxima venta.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStaleBannerDismissed(true)}
                className="shrink-0 text-muted-foreground hover:text-foreground"
                aria-label="Descartar aviso"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-4">
            <Card className="rounded-3xl">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">Proyección del mes</p>
                  <CalendarDays className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardTitle className="text-3xl">
                  {formatCurrency(data.revenueMonthProjected)}
                </CardTitle>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Acumulado: {formatCurrency(data.revenueMonthToDate)}</span>
                    <span>
                      Día {data.monthDaysElapsed} de {data.monthDaysTotal}
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
              label="Ingresos hoy"
              value={formatCurrency(data.revenueToday)}
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
                  <p className="text-sm text-muted-foreground">Actividad de hoy</p>
                  <ReceiptText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex gap-6">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Transacciones</p>
                    <CardTitle className="text-3xl">{data.transactionCount}</CardTitle>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Productos</p>
                    <CardTitle className="text-3xl">{data.productsSold}</CardTitle>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="rounded-3xl border-primary/10 bg-primary text-primary-foreground">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm text-primary-foreground/70">Más vendido hoy</p>
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
              productsSold={data.productsSold}
              latestTransactions={data.latestTransactions}
            />
            <HistoryPanel sessionHistory={data.sessionHistory} />
          </div>
        </>
      )}
    </div>
  );
}
