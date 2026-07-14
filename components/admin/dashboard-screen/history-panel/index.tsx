"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import {
  Calendar,
  ChartColumn,
  ChartLine,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type Touch, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CORTE_HISTORY_RANGE_ARIA_KEYS,
  CORTE_HISTORY_RANGE_LABEL_KEYS,
  CORTE_HISTORY_RANGES,
  type CorteHistoryRange,
  type CorteHistoryView,
  isCorteHistoryRange,
} from "@/lib/corte-history";
import { cn, formatCurrency } from "@/lib/utils";
import { PanelEmptyState } from "../panel-empty-state";
import { isHorizontalSwipe } from "./gestures";
import { HistoryGraph } from "./graph";
import {
  readCorteHistoryPanelPreferences,
  writeCorteHistoryPanelPreferences,
} from "./preferences";
import { adminCorteHistoryQueryOptions, initialAdminCorteHistoryQueries } from "./query";

type HistoryTransition = "previous" | "next" | "range" | null;

function getHistoryTransitionClass(transition: HistoryTransition): string {
  switch (transition) {
    case "previous":
      return "animate-in fade-in duration-200 slide-in-from-left-8 motion-reduce:animate-none";
    case "next":
      return "animate-in fade-in duration-200 slide-in-from-right-8 motion-reduce:animate-none";
    case "range":
      return "animate-in fade-in duration-200 motion-reduce:animate-none";
    default:
      return "";
  }
}

function ChartViewButton({
  icon: Icon,
  isActive,
  label,
  value,
}: {
  icon: typeof ChartColumn;
  isActive: boolean;
  label: string;
  value: CorteHistoryView;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ToggleGroupItem
          aria-label={label}
          className={cn(
            "relative z-10 rounded-full bg-transparent transition-colors duration-200 hover:bg-transparent data-[state=on]:bg-transparent motion-reduce:transition-none",
            isActive
              ? "text-primary-foreground hover:text-primary-foreground data-[state=on]:text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          value={value}
        >
          <Icon className="h-4 w-4" />
        </ToggleGroupItem>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function HistoryPanel() {
  const t = useTranslations();
  const tHistory = useTranslations("admin.history");
  const tCorteHistory = useTranslations("corte.history");
  const locale = useLocale();
  const [historyView, setHistoryView] = useState<CorteHistoryView>("bar");
  const [historyRange, setHistoryRange] = useState<CorteHistoryRange>("1S");
  const [rangeOffset, setRangeOffset] = useState(0);
  const [historyTransition, setHistoryTransition] = useState<HistoryTransition>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const storedPreferences = readCorteHistoryPanelPreferences();
    if (!storedPreferences) {
      return;
    }

    setHistoryView(storedPreferences.view);
    setHistoryRange(storedPreferences.range);
  }, []);

  useQueries({ queries: initialAdminCorteHistoryQueries(locale) });

  const historyQuery = useQuery(
    adminCorteHistoryQueryOptions({
      locale,
      offset: rangeOffset,
      range: historyRange,
    })
  );

  const history = historyQuery.data;
  const canMoveForward = rangeOffset > 0;

  function moveToPreviousRange() {
    setHistoryTransition("previous");
    setRangeOffset((currentOffset) => currentOffset + 1);
  }

  function moveToNextRange() {
    setHistoryTransition("next");
    setRangeOffset((currentOffset) => Math.max(0, currentOffset - 1));
  }

  function handleSwipeEnd(touch: Touch) {
    const start = touchStartRef.current;
    touchStartRef.current = null;

    if (!start) {
      return;
    }

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;

    if (!isHorizontalSwipe(deltaX, deltaY)) {
      return;
    }

    if (deltaX > 0) {
      moveToPreviousRange();
      return;
    }

    if (canMoveForward) {
      moveToNextRange();
    }
  }

  return (
    <Card className="rounded-3xl">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{tHistory("title")}</CardTitle>
            <p className="text-sm text-muted-foreground">{tHistory("subtitle")}</p>
          </div>

          <TooltipProvider delayDuration={150}>
            <ToggleGroup
              aria-label={tHistory("chartTypeAria")}
              className="relative h-12 w-24 rounded-full bg-muted p-1"
              onValueChange={(value) => {
                if (value === "bar" || value === "line") {
                  setHistoryView(value);
                  writeCorteHistoryPanelPreferences({
                    view: value,
                    range: historyRange,
                  });
                }
              }}
              type="single"
              value={historyView}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute inset-y-1 left-1 z-0 w-10 rounded-full bg-primary shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none",
                  historyView === "line" && "translate-x-11"
                )}
              />
              <ChartViewButton
                icon={ChartColumn}
                isActive={historyView === "bar"}
                label={tHistory("barChart")}
                value="bar"
              />
              <ChartViewButton
                icon={ChartLine}
                isActive={historyView === "line"}
                label={tHistory("lineChart")}
                value="line"
              />
            </ToggleGroup>
          </TooltipProvider>
        </div>

        <Tabs
          value={historyRange}
          onValueChange={(value) => {
            if (isCorteHistoryRange(value)) {
              setHistoryTransition("range");
              setHistoryRange(value);
              setRangeOffset(0);
              writeCorteHistoryPanelPreferences({
                view: historyView,
                range: value,
              });
            }
          }}
        >
          <TabsList className="grid h-auto w-full grid-cols-4 rounded-full p-1 md:w-fit">
            {CORTE_HISTORY_RANGES.map((range) => (
              <TabsTrigger
                aria-label={tCorteHistory(CORTE_HISTORY_RANGE_ARIA_KEYS[range])}
                className="rounded-full px-4"
                key={range}
                value={range}
              >
                {tCorteHistory(CORTE_HISTORY_RANGE_LABEL_KEYS[range])}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="pt-0">
        <div
          onTouchCancel={() => {
            touchStartRef.current = null;
          }}
          onTouchEnd={(event) => {
            const touch = event.changedTouches.item(0);
            if (touch) {
              handleSwipeEnd(touch);
            }
          }}
          onTouchStart={(event) => {
            const touch = event.changedTouches.item(0);
            if (touch) {
              touchStartRef.current = { x: touch.clientX, y: touch.clientY };
            }
          }}
        >
          <div
            className={getHistoryTransitionClass(historyTransition)}
            key={history ? `${history.range}-${history.offset}` : "pending"}
          >
            {historyQuery.isPending ? (
              <div className="flex min-h-[300px] items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("common.loadingHistory")}
              </div>
            ) : historyQuery.isError || !history ? (
              <PanelEmptyState
                icon={Calendar}
                title={tHistory("loadPeriodErrorTitle")}
                description={tHistory("loadPeriodErrorDescription")}
                minHeight="min-h-[300px]"
              />
            ) : !history.hasData ? (
              <PanelEmptyState
                icon={Calendar}
                title={tHistory("noDataTitle")}
                description={tHistory("noDataDescription")}
                minHeight="min-h-[300px]"
              />
            ) : (
              <HistoryGraph buckets={history.buckets} view={historyView} />
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 pt-4 md:grid md:grid-cols-[auto_1fr_auto] md:items-center">
          <Button
            className="hidden md:inline-flex"
            disabled={historyQuery.isPending}
            onClick={moveToPreviousRange}
            size="sm"
            type="button"
            variant="outline"
          >
            <ChevronLeft className="h-4 w-4" />
            {t("common.previous")}
          </Button>

          <div
            className={cn(
              "flex flex-col items-center gap-1 text-center text-xs text-muted-foreground",
              historyQuery.isFetching && !historyQuery.isPending && "text-foreground"
            )}
          >
            <span className="font-medium text-foreground">
              {history?.label ?? t("common.loadingPeriod")}
            </span>
            <span>
              {history
                ? t("common.cortesSummary", {
                    revenue: formatCurrency(history.totalRevenue, locale),
                    count: history.closedSessionsCount,
                  })
                : t("common.noDataLoaded")}
              {historyQuery.isFetching && !historyQuery.isPending
                ? ` · ${t("common.refreshing")}`
                : ""}
            </span>
          </div>

          <Button
            className="hidden md:inline-flex"
            disabled={!canMoveForward || historyQuery.isPending}
            onClick={moveToNextRange}
            size="sm"
            type="button"
            variant="outline"
          >
            {t("common.next")}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
