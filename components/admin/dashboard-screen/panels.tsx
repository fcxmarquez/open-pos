"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
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

const PERIOD_LABELS: Record<HistoryPeriod, string> = {
  month: "Mes",
  quarter: "Trimestre",
  week: "Semana",
};

type HistoryRecord = {
  id: string;
  sessionDate: string;
  sessionNumber: number;
  salesCount: number;
  revenue: number;
  difference: number;
};

type TransactionRecord = {
  id: string;
  createdAt: string;
  itemNames: string[];
  total: number;
};

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

interface LatestTransactionsPanelProps {
  transactionCount: number;
  latestTransactions: TransactionRecord[];
}

export function LatestTransactionsPanel({
  transactionCount,
  latestTransactions,
}: LatestTransactionsPanelProps) {
  return (
    <Card className="rounded-3xl">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg">Últimas transacciones</CardTitle>
          <p className="text-sm text-muted-foreground">
            Movimientos recientes del turno actual.
          </p>
        </div>
        <Badge variant="muted" size="pill">
          {transactionCount} hoy
        </Badge>
      </CardHeader>
      <CardContent className="pt-0">
        {latestTransactions.length === 0 ? (
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
              {latestTransactions.map((transaction) => {
                const visibleItems = transaction.itemNames.slice(0, 2);
                const hiddenItems = transaction.itemNames.length - visibleItems.length;

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
  );
}

function getDifferenceColor(difference: number): string {
  if (difference > 0) return "text-success-foreground";
  if (difference < 0) return "text-error-foreground";
  return "text-muted-foreground";
}

function HistoryGraph({
  chartData,
}: {
  chartData: { label: string; revenue: number }[];
}) {
  return (
    <div className="rounded-3xl bg-primary p-4">
      <div className="rounded-3xl bg-card p-4">
        <ChartContainer
          className="aspect-auto h-64 w-full"
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
            <XAxis axisLine={false} dataKey="label" minTickGap={18} tickLine={false} />
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
  );
}

function HistoryTable({ records }: { records: HistoryRecord[] }) {
  return (
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
        {records.map((record) => (
          <TableRow key={record.id}>
            <TableCell className="font-medium text-foreground">
              {formatHistoryLabel(record.sessionDate, record.sessionNumber)}
            </TableCell>
            <TableCell>{record.salesCount}</TableCell>
            <TableCell>{formatCurrency(record.revenue)}</TableCell>
            <TableCell
              className={cn(
                "text-right font-semibold",
                getDifferenceColor(record.difference)
              )}
            >
              {record.difference > 0 ? "+" : ""}
              {formatCurrency(record.difference)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

interface HistoryPanelProps {
  sessionHistory: HistoryRecord[];
}

export function HistoryPanel({ sessionHistory }: HistoryPanelProps) {
  const [historyView, setHistoryView] = useState<HistoryView>("graph");
  const [historyPeriod, setHistoryPeriod] = useState<HistoryPeriod>("week");

  const filteredHistory = useMemo(() => {
    const cutoff = getPeriodCutoff(historyPeriod);
    return sessionHistory.filter((record) => record.sessionDate >= cutoff);
  }, [sessionHistory, historyPeriod]);

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

  return (
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
                {PERIOD_LABELS[period]}
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
          <HistoryGraph chartData={chartData} />
        ) : (
          <HistoryTable records={filteredHistory} />
        )}
      </CardContent>
    </Card>
  );
}
