import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  getCategoryPerformance,
  getSalesTimeseries,
  getTopProducts,
} from "../../../lib/server/queries/analytics";
import { toolError } from "./tool-error";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, "Must be a real calendar date");

function validateDateRange(startDate: string, endDate: string): string | null {
  if (startDate > endDate) return "startDate must be ≤ endDate";
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > 365) return "Date range cannot exceed 365 days";
  return null;
}

export const getSalesTimeseriesTool = tool(
  async ({ startDate, endDate, granularity }) => {
    const rangeErr = validateDateRange(startDate, endDate);
    if (rangeErr) return { ok: false as const, error: rangeErr };
    try {
      const data = await getSalesTimeseries({ startDate, endDate, granularity });
      return { ok: true as const, data };
    } catch (err) {
      return toolError("get_sales_timeseries", err);
    }
  },
  {
    name: "get_sales_timeseries",
    description:
      "Returns revenue, transaction count, and units sold bucketed by day, week, or month for a given date range. Use for trend and comparison questions.",
    schema: z.object({
      startDate: dateSchema.describe("Start date inclusive (YYYY-MM-DD, Mexico TZ)"),
      endDate: dateSchema.describe("End date inclusive (YYYY-MM-DD, Mexico TZ)"),
      granularity: z.enum(["day", "week", "month"]).describe("Time bucket size"),
    }),
  }
);

export const getTopProductsTool = tool(
  async ({ startDate, endDate, limit, category }) => {
    const rangeErr = validateDateRange(startDate, endDate);
    if (rangeErr) return { ok: false as const, error: rangeErr };
    try {
      const data = await getTopProducts({ startDate, endDate, limit, category });
      return { ok: true as const, data };
    } catch (err) {
      return toolError("get_top_products", err);
    }
  },
  {
    name: "get_top_products",
    description:
      "Returns the top-selling products by revenue for a given date range, optionally filtered by category. Ranked by revenue descending.",
    schema: z.object({
      startDate: dateSchema.describe("Start date inclusive (YYYY-MM-DD, Mexico TZ)"),
      endDate: dateSchema.describe("End date inclusive (YYYY-MM-DD, Mexico TZ)"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .default(10)
        .describe("Maximum number of products to return (1–50, default 10)"),
      category: z.string().optional().describe("Filter by product category (optional)"),
    }),
  }
);

export const getCategoryPerformanceTool = tool(
  async ({ startDate, endDate }) => {
    const rangeErr = validateDateRange(startDate, endDate);
    if (rangeErr) return { ok: false as const, error: rangeErr };
    try {
      const data = await getCategoryPerformance({ startDate, endDate });
      return { ok: true as const, data };
    } catch (err) {
      return toolError("get_category_performance", err);
    }
  },
  {
    name: "get_category_performance",
    description:
      "Returns revenue, units sold, and transaction count grouped by product category for a given date range.",
    schema: z.object({
      startDate: dateSchema.describe("Start date inclusive (YYYY-MM-DD, Mexico TZ)"),
      endDate: dateSchema.describe("End date inclusive (YYYY-MM-DD, Mexico TZ)"),
    }),
  }
);
