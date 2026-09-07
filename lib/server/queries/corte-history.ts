import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import { getLocale } from "next-intl/server";
import { db } from "@/db";
import { historicalDailySales, salesSessions } from "@/db/schema";
import {
  buildCorteHistoryData,
  type CorteHistoryBucketRow,
  type CorteHistoryData,
  type CorteHistoryRange,
  getCorteHistoryWindow,
} from "@/lib/corte-history";
import type { Locale } from "@/lib/i18n/config";
import { getTodayDateString } from "@/lib/utils";

export interface CorteHistoryQueryParams {
  offset: number;
  range: CorteHistoryRange;
}

export async function getCorteHistoryData({
  offset,
  range,
}: CorteHistoryQueryParams): Promise<CorteHistoryData> {
  const locale = (await getLocale()) as Locale;
  const window = getCorteHistoryWindow(range, offset, getTodayDateString(), locale);
  const liveDateExpression = sql<string>`to_char(${salesSessions.sessionDate}::date, 'YYYY-MM-DD')`;

  const liveRowsQuery = db
    .select({
      bucket: liveDateExpression,
      closedSessions: count(salesSessions.id),
      revenue: sql<number>`COALESCE(SUM(${salesSessions.systemTotal}::numeric), 0)::float`,
      source: sql<"live">`'live'`,
    })
    .from(salesSessions)
    .where(
      and(
        eq(salesSessions.status, "closed"),
        gte(salesSessions.sessionDate, window.startDate),
        lte(salesSessions.sessionDate, window.endDate)
      )
    )
    .groupBy(liveDateExpression)
    .orderBy(liveDateExpression);

  const historicalRowsQuery = db
    .select({
      bucket: historicalDailySales.businessDate,
      closedSessions: sql<number>`0`,
      revenue: sql<number | null>`${historicalDailySales.amountMxn}::float`,
      source: sql<"historical">`'historical'`,
    })
    .from(historicalDailySales)
    .where(
      and(
        gte(historicalDailySales.businessDate, window.startDate),
        lte(historicalDailySales.businessDate, window.endDate)
      )
    )
    .orderBy(historicalDailySales.businessDate);

  const [liveRows, historicalRows] = await Promise.all([
    liveRowsQuery,
    historicalRowsQuery,
  ]);

  return buildCorteHistoryData(
    window,
    [...historicalRows, ...liveRows] as CorteHistoryBucketRow[],
    locale
  );
}
