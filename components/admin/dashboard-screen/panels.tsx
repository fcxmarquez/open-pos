"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Receipt } from "lucide-react";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatCurrency, formatTime, toMexicoDateString } from "@/lib/utils";

type HistoryPeriod = "month" | "quarter" | "week";
type HistoryView = "graph" | "table";

const PERIOD_DAYS: Record<HistoryPeriod, number> = {
  month: 30,
  quarter: 90,
  week: 7,
};

function PanelEmptyState({
  icon: Icon,
  title,
  description,
  minHeight = "min-h-[200px]",
}: {
  icon: typeof Receipt;
  title: string;
  description: string;
  minHeight?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed p-6 text-center",
        minHeight
      )}
    >
      <Icon className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

const PERIOD_LABELS: Record<HistoryPeriod, string> = {
  month: "30 días",
  quarter: "90 días",
  week: "7 días",
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
  items: { name: string; quantity: number }[];
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
  productsSold: number;
  latestTransactions: TransactionRecord[];
}

export function LatestTransactionsPanel({
  transactionCount,
  productsSold,
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
        <div className="flex items-center gap-2">
          <Badge variant="muted" size="pill">
            {transactionCount} ventas
          </Badge>
          <Badge variant="muted" size="pill">
            {productsSold} productos
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {latestTransactions.length === 0 ? (
          <PanelEmptyState
            icon={Receipt}
            title="No hay transacciones hoy"
            description="Las ventas realizadas durante el turno actual aparecerán aquí."
          />
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
                const visibleItems = transaction.items.slice(0, 2);
                const hiddenItems = transaction.items.length - visibleItems.length;

                return (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium text-foreground">
                      {formatTime(new Date(transaction.createdAt))}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {visibleItems.map((item, index) => (
                          <Badge
                            key={`${transaction.id}-${item.name}-${index}`}
                            variant="muted"
                            size="chip"
                          >
                            {item.name} x{item.quantity}
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
  chartData: { label: string; revenue: number | null }[];
}) {
  return (
    <div className="rounded-2xl border bg-card p-4">
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
            connectNulls
            dataKey="revenue"
            dot={false}
            stroke="var(--color-revenue)"
            strokeWidth={3}
            type="monotone"
          />
        </LineChart>
      </ChartContainer>
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

  const chartData = useMemo(() => {
    const days = PERIOD_DAYS[historyPeriod];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (days - 1));
    const cutoffStr = toMexicoDateString(cutoff);

    const recordsByDate = new Map<string, HistoryRecord[]>();
    for (const record of sessionHistory) {
      if (record.sessionDate >= cutoffStr) {
        const existing = recordsByDate.get(record.sessionDate) ?? [];
        existing.push(record);
        recordsByDate.set(record.sessionDate, existing);
      }
    }

    const result: { label: string; revenue: number | null }[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(cutoff);
      date.setDate(date.getDate() + i);
      const dateStr = toMexicoDateString(date);
      const records = recordsByDate.get(dateStr);

      if (records && records.length > 0) {
        for (const record of records.sort((a, b) => a.sessionNumber - b.sessionNumber)) {
          result.push({
            label: formatHistoryLabel(record.sessionDate, record.sessionNumber),
            revenue: record.revenue,
          });
        }
      } else {
        result.push({
          label: format(new Date(`${dateStr}T12:00:00`), "d MMM", { locale: es }),
          revenue: null,
        });
      }
    }

    return result;
  }, [sessionHistory, historyPeriod]);

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

          <Tabs
            value={historyPeriod}
            onValueChange={(v) => setHistoryPeriod(v as HistoryPeriod)}
          >
            <TabsList className="h-auto rounded-full p-1">
              {(["week", "month", "quarter"] as const).map((period) => (
                <TabsTrigger key={period} value={period} className="rounded-full">
                  {PERIOD_LABELS[period]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <Tabs value={historyView} onValueChange={(v) => setHistoryView(v as HistoryView)}>
          <TabsList className="h-auto rounded-full p-1">
            <TabsTrigger value="graph" className="rounded-full">
              Gráfica
            </TabsTrigger>
            <TabsTrigger value="table" className="rounded-full">
              Tabla
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="pt-0">
        {filteredHistory.length === 0 ? (
          <PanelEmptyState
            icon={Calendar}
            title="No hay cortes en este periodo"
            description="Intenta seleccionar un periodo de tiempo diferente usando los filtros de arriba."
            minHeight="min-h-[300px]"
          />
        ) : historyView === "graph" ? (
          <HistoryGraph chartData={chartData} />
        ) : (
          <HistoryTable records={filteredHistory} />
        )}
      </CardContent>
    </Card>
  );
}
