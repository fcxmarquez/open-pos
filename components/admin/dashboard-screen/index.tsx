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
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { adminDashboardQueryOptions } from "@/components/admin/dashboard-screen/query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCurrency, formatTime, toMexicoDateString } from "@/lib/utils";

type HistoryPeriod = "month" | "quarter" | "week";
type HistoryView = "graph" | "table";

const PERIOD_DAYS: Record<HistoryPeriod, number> = {
  month: 30,
  quarter: 90,
  week: 7,
};

const SUMMARY_SKELETON_KEYS = [
  "admin-dashboard-card-skeleton-1",
  "admin-dashboard-card-skeleton-2",
  "admin-dashboard-card-skeleton-3",
  "admin-dashboard-card-skeleton-4",
] as const;

const PANEL_SKELETON_KEYS = [
  "admin-dashboard-panel-skeleton-1",
  "admin-dashboard-panel-skeleton-2",
] as const;

function formatLongDate(date: Date): string {
  return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
}

function getPeriodCutoff(period: HistoryPeriod): string {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - (PERIOD_DAYS[period] - 1));
  return toMexicoDateString(cutoffDate);
}

function formatChartCurrency(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(Math.abs(value) >= 10_000 ? 0 : 1)}k`;
  }

  return `$${value.toFixed(0)}`;
}

function formatHistoryLabel(dateString: string, sessionNumber: number): string {
  const label = format(new Date(`${dateString}T12:00:00`), "d MMM", { locale: es });
  return `${label} · T${sessionNumber}`;
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

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {SUMMARY_SKELETON_KEYS.map((key) => (
          <Card key={key} className="rounded-3xl">
            <CardHeader className="space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
        {PANEL_SKELETON_KEYS.map((key) => (
          <Card key={key} className="rounded-3xl">
            <CardHeader className="space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full rounded-3xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function AdminDashboardScreen() {
  const [historyView, setHistoryView] = useState<HistoryView>("graph");
  const [historyPeriod, setHistoryPeriod] = useState<HistoryPeriod>("week");

  const { data, dataUpdatedAt, error, isFetching, isPending, refetch } = useQuery(
    adminDashboardQueryOptions()
  );

  const filteredHistory = useMemo(() => {
    if (!data) {
      return [];
    }

    const cutoff = getPeriodCutoff(historyPeriod);

    return data.sessionHistory.filter((record) => record.sessionDate >= cutoff);
  }, [data, historyPeriod]);

  const chartData = useMemo(
    () =>
      [...filteredHistory]
        .sort(
          (left, right) =>
            left.sessionDate.localeCompare(right.sessionDate) ||
            left.sessionNumber - right.sessionNumber
        )
        .map((record) => ({
          label: formatHistoryLabel(record.sessionDate, record.sessionNumber),
          revenue: record.revenue,
        })),
    [filteredHistory]
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
              <Card className="rounded-3xl">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Ingresos hoy</p>
                      <CardTitle className="text-3xl">
                        {formatCurrency(data.revenueToday)}
                      </CardTitle>
                    </div>
                    <Wallet className="h-5 w-5 text-muted-foreground" />
                  </div>

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
                </CardHeader>
              </Card>

              <Card className="rounded-3xl">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Transacciones</p>
                      <CardTitle className="text-3xl">{data.transactionCount}</CardTitle>
                    </div>
                    <ReceiptText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ventas completadas durante la jornada.
                  </p>
                </CardHeader>
              </Card>

              <Card className="rounded-3xl">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Productos vendidos</p>
                      <CardTitle className="text-3xl">{data.productsSold}</CardTitle>
                    </div>
                    <Package2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Unidades despachadas en las ventas de hoy.
                  </p>
                </CardHeader>
              </Card>

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
              <Card className="rounded-3xl">
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">Últimas transacciones</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Movimientos recientes del turno actual.
                    </p>
                  </div>

                  <Badge variant="muted" size="pill">
                    {data.transactionCount} hoy
                  </Badge>
                </CardHeader>
                <CardContent className="pt-0">
                  {data.latestTransactions.length === 0 ? (
                    <div className="rounded-3xl border border-dashed p-6 text-sm text-muted-foreground">
                      No hay transacciones registradas hoy todavía.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Hora</TableHead>
                          <TableHead>Productos</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.latestTransactions.map((transaction) => {
                          const visibleItems = transaction.itemNames.slice(0, 2);
                          const hiddenItems =
                            transaction.itemNames.length - visibleItems.length;

                          return (
                            <TableRow key={transaction.id}>
                              <TableCell className="font-medium text-foreground">
                                {formatTime(new Date(transaction.createdAt))}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-2">
                                  {visibleItems.map((itemName) => (
                                    <Badge
                                      key={`${transaction.id}-${itemName}`}
                                      variant="muted"
                                      size="chip"
                                    >
                                      {itemName}
                                    </Badge>
                                  ))}
                                  {hiddenItems > 0 ? (
                                    <Badge variant="muted" size="chip">
                                      +{hiddenItems}
                                    </Badge>
                                  ) : null}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-semibold text-foreground">
                                {formatCurrency(transaction.total)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardHeader className="space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">Historial de Cortes</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Consulta tendencias o detalle por periodo.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {(["week", "month", "quarter"] as const).map((period) => (
                        <Button
                          key={period}
                          type="button"
                          size="sm"
                          variant={historyPeriod === period ? "default" : "outline"}
                          onClick={() => setHistoryPeriod(period)}
                        >
                          {period === "week"
                            ? "Semana"
                            : period === "month"
                              ? "Mes"
                              : "Trimestre"}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {(["graph", "table"] as const).map((view) => (
                      <Button
                        key={view}
                        type="button"
                        size="sm"
                        variant={historyView === view ? "default" : "outline"}
                        onClick={() => setHistoryView(view)}
                      >
                        {view === "graph" ? "Gráfica" : "Tabla"}
                      </Button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {filteredHistory.length === 0 ? (
                    <div className="rounded-3xl border border-dashed p-6 text-sm text-muted-foreground">
                      No hay cortes cerrados para este periodo.
                    </div>
                  ) : historyView === "graph" ? (
                    <div className="rounded-3xl bg-primary p-4">
                      <div className="rounded-3xl bg-card p-4">
                        <ChartContainer
                          className="h-64 w-full aspect-auto"
                          config={{
                            revenue: {
                              color: "hsl(var(--primary))",
                              label: "Ingresos",
                            },
                          }}
                        >
                          <LineChart
                            accessibilityLayer
                            data={chartData}
                            margin={{ left: 12, right: 12, top: 16, bottom: 0 }}
                          >
                            <CartesianGrid vertical={false} />
                            <XAxis
                              axisLine={false}
                              dataKey="label"
                              minTickGap={18}
                              tickLine={false}
                            />
                            <YAxis
                              axisLine={false}
                              tickFormatter={formatChartCurrency}
                              tickLine={false}
                              width={64}
                            />
                            <ChartTooltip
                              content={
                                <ChartTooltipContent
                                  formatter={(value) => formatCurrency(Number(value))}
                                  indicator="line"
                                />
                              }
                            />
                            <Line
                              dataKey="revenue"
                              dot={false}
                              stroke="var(--color-revenue)"
                              strokeWidth={3}
                              type="monotone"
                            />
                          </LineChart>
                        </ChartContainer>
                      </div>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Ventas</TableHead>
                          <TableHead>Ingresos</TableHead>
                          <TableHead className="text-right">Diferencia</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredHistory.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium text-foreground">
                              {formatHistoryLabel(
                                record.sessionDate,
                                record.sessionNumber
                              )}
                            </TableCell>
                            <TableCell>{record.salesCount}</TableCell>
                            <TableCell>{formatCurrency(record.revenue)}</TableCell>
                            <TableCell
                              className={cn(
                                "text-right font-semibold",
                                record.difference > 0
                                  ? "text-success-foreground"
                                  : record.difference < 0
                                    ? "text-error-foreground"
                                    : "text-muted-foreground"
                              )}
                            >
                              {record.difference > 0 ? "+" : ""}
                              {formatCurrency(record.difference)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
