"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toMexicoDateString } from "@/lib/utils";
import { PanelEmptyState } from "../panel-empty-state";
import { HistoryGraph } from "./graph";
import { formatHistoryLabel, type HistoryRecord, HistoryTable } from "./table";

type HistoryPeriod = "month" | "quarter" | "week";
type HistoryView = "graph" | "table";

const PERIOD_DAYS: Record<HistoryPeriod, number> = {
  month: 30,
  quarter: 90,
  week: 7,
};

const PERIOD_LABELS: Record<HistoryPeriod, string> = {
  month: "30 días",
  quarter: "90 días",
  week: "7 días",
};

const HISTORY_PAGE_SIZE = 10;

function getPeriodCutoff(period: HistoryPeriod): string {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - (PERIOD_DAYS[period] - 1));
  return toMexicoDateString(cutoffDate);
}

interface HistoryPanelProps {
  sessionHistory: HistoryRecord[];
}

export function HistoryPanel({ sessionHistory }: HistoryPanelProps) {
  const [historyView, setHistoryView] = useState<HistoryView>("graph");
  const [historyPeriod, setHistoryPeriod] = useState<HistoryPeriod>("week");
  const [page, setPage] = useState(0);

  const filteredHistory = useMemo(() => {
    const cutoff = getPeriodCutoff(historyPeriod);
    return sessionHistory.filter((record) => record.sessionDate >= cutoff);
  }, [sessionHistory, historyPeriod]);

  const pageCount = Math.ceil(filteredHistory.length / HISTORY_PAGE_SIZE);
  const clampedPage = pageCount > 0 ? Math.min(page, pageCount - 1) : 0;
  const pagedHistory = filteredHistory.slice(
    clampedPage * HISTORY_PAGE_SIZE,
    (clampedPage + 1) * HISTORY_PAGE_SIZE
  );

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
          label: format(new Date(`${dateStr}T12:00:00`), "d MMM", {
            locale: es,
          }),
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
            onValueChange={(v) => {
              setHistoryPeriod(v as HistoryPeriod);
              setPage(0);
            }}
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

        <Tabs
          value={historyView}
          onValueChange={(v) => {
            setHistoryView(v as HistoryView);
            setPage(0);
          }}
        >
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
          <>
            <HistoryTable records={pagedHistory} />
            {pageCount > 1 && (
              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(clampedPage - 1)}
                  disabled={clampedPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <span className="text-xs text-muted-foreground">
                  {clampedPage + 1} / {pageCount}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(clampedPage + 1)}
                  disabled={clampedPage >= pageCount - 1}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
