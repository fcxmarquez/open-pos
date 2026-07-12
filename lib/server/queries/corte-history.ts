import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { salesSessions } from "@/db/schema";
import {
  buildCorteHistoryData,
  type CorteHistoryBucketRow,
  type CorteHistoryData,
  type CorteHistoryRange,
  getCorteHistoryWindow,
} from "@/lib/corte-history";
import { getTodayDateString } from "@/lib/utils";

export interface CorteHistoryQueryParams {
  offset: number;
  range: CorteHistoryRange;
}

export async function getCorteHistoryData({
  offset,
  range,
}: CorteHistoryQueryParams): Promise<CorteHistoryData> {
  const window = getCorteHistoryWindow(range, offset, getTodayDateString());
  const bucketExpression =
    window.granularity === "month"
      ? sql<string>`to_char(${salesSessions.sessionDate}, 'YYYY-MM')`
      : sql<string>`to_char(${salesSessions.sessionDate}::date, 'YYYY-MM-DD')`;

  const rows = await db
    .select({
      bucket: bucketExpression,
      closedSessions: count(salesSessions.id),
      revenue: sql<number>`COALESCE(SUM(${salesSessions.systemTotal}::numeric), 0)::float`,
    })
    .from(salesSessions)
    .where(
      and(
        eq(salesSessions.status, "closed"),
        gte(salesSessions.sessionDate, window.startDate),
        lte(salesSessions.sessionDate, window.endDate)
      )
    )
    .groupBy(bucketExpression)
    .orderBy(bucketExpression);

  return buildCorteHistoryData(window, rows as CorteHistoryBucketRow[]);
}
