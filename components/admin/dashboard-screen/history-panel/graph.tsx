"use client";

import { type PointerEvent, type TouchEvent, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import type { CorteHistoryBucket, CorteHistoryView } from "@/lib/corte-history";
import { cn, formatCurrency } from "@/lib/utils";

function formatChartCurrency(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(Math.abs(value) >= 10_000 ? 0 : 1)}k`;
  }
  return `$${value.toFixed(0)}`;
}

interface ActiveBucketState {
  index: number;
  lineX: number;
  tooltipX: number;
  tooltipY: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function HistoryGraph({
  buckets,
  view,
}: {
  buckets: CorteHistoryBucket[];
  view: CorteHistoryView;
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [activeBucket, setActiveBucket] = useState<ActiveBucketState | null>(null);
  const chartData = buckets.map((bucket) => ({
    ...bucket,
    fill: "var(--color-revenue)",
  }));
  const activeBucketData = activeBucket
    ? buckets[clamp(activeBucket.index, 0, buckets.length - 1)]
    : null;

  function updateActiveBucket(clientX: number, clientY: number) {
    const chart = chartRef.current;
    const surface = chart?.querySelector(".recharts-surface");
    const gridLine = chart?.querySelector(".recharts-cartesian-grid-horizontal line");

    if (!chart || !surface || buckets.length === 0) {
      return;
    }

    const chartRect = chart.getBoundingClientRect();
    const surfaceRect = surface.getBoundingClientRect();
    const x1 = Number(gridLine?.getAttribute("x1") ?? 0);
    const x2 = Number(gridLine?.getAttribute("x2") ?? surfaceRect.width);
    const plotLeft = surfaceRect.left + x1;
    const plotRight = surfaceRect.left + x2;
    const plotWidth = Math.max(1, plotRight - plotLeft);
    const ratio = clamp((clientX - plotLeft) / plotWidth, 0, 1);
    const index = clamp(Math.round(ratio * (buckets.length - 1)), 0, buckets.length - 1);
    const lineX = plotLeft - chartRect.left + ratio * plotWidth;

    setActiveBucket({
      index,
      lineX,
      tooltipX: clamp(clientX - chartRect.left, 48, Math.max(48, chartRect.width - 48)),
      tooltipY: clamp(
        clientY - chartRect.top - 58,
        8,
        Math.max(8, chartRect.height - 72)
      ),
    });
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    updateActiveBucket(event.clientX, event.clientY);
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    const touch = event.changedTouches.item(0);
    if (touch) {
      updateActiveBucket(touch.clientX, touch.clientY);
    }
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    const touch = event.changedTouches.item(0);
    if (touch) {
      updateActiveBucket(touch.clientX, touch.clientY);
    }
  }

  return (
    <div
      className="relative pt-2"
      data-history-chart
      onPointerLeave={() => setActiveBucket(null)}
      onPointerMove={handlePointerMove}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      ref={chartRef}
    >
      {activeBucket && activeBucketData ? (
        <>
          {view === "line" ? (
            <div
              className="pointer-events-none absolute top-4 bottom-8 z-10 w-px bg-foreground/40"
              style={{ left: activeBucket.lineX }}
            />
          ) : null}
          <div
            className={cn(
              "pointer-events-none absolute z-20 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
              view === "bar" ? "font-medium" : "grid min-w-28 gap-1"
            )}
            style={{
              left: activeBucket.tooltipX,
              top: activeBucket.tooltipY,
              transform: "translateX(-50%)",
            }}
          >
            {view === "bar" ? (
              formatCurrency(activeBucketData.revenue)
            ) : (
              <>
                <span className="font-medium text-foreground">
                  {activeBucketData.tooltipLabel}
                </span>
                <span className="font-mono font-medium tabular-nums text-primary">
                  {formatCurrency(activeBucketData.revenue)}
                </span>
              </>
            )}
          </div>
        </>
      ) : null}
      <ChartContainer
        className="aspect-auto h-64 w-full"
        config={{
          revenue: {
            color: "hsl(var(--primary))",
            label: "Ingresos",
          },
        }}
      >
        {view === "bar" ? (
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 12, right: 12, top: 16, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis axisLine={false} dataKey="label" minTickGap={12} tickLine={false} />
            <YAxis
              axisLine={false}
              tickFormatter={formatChartCurrency}
              tickLine={false}
              width={64}
            />
            <Bar
              dataKey="revenue"
              fill="var(--color-revenue)"
              isAnimationActive={false}
              maxBarSize={34}
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        ) : (
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 12, right: 12, top: 16, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis axisLine={false} dataKey="label" minTickGap={12} tickLine={false} />
            <YAxis
              axisLine={false}
              tickFormatter={formatChartCurrency}
              tickLine={false}
              width={64}
            />
            <Line
              dataKey="revenue"
              dot={false}
              isAnimationActive={false}
              stroke="var(--color-revenue)"
              strokeWidth={3}
              type="monotone"
            />
          </LineChart>
        )}
      </ChartContainer>
    </div>
  );
}
