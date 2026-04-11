"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatCurrency } from "@/lib/utils";

function formatChartCurrency(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(Math.abs(value) >= 10_000 ? 0 : 1)}k`;
  }
  return `$${value.toFixed(0)}`;
}

export function HistoryGraph({
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
