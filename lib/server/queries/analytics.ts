import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, saleItems, sales, salesSessions } from "@/db/schema";
import { getTodayDateString } from "@/lib/utils";

// ---------------------------------------------------------------------------
// getSalesTimeseries
// ---------------------------------------------------------------------------

export interface SalesTimeseriesParams {
  startDate: string;
  endDate: string;
  granularity: "day" | "week" | "month";
}

export interface SalesTimeseriesPoint {
  /** "YYYY-MM-DD" for day/week, "YYYY-MM" for month. */
  bucket: string;
  revenue: number;
  transactionCount: number;
  unitsSold: number;
}

export async function getSalesTimeseries(
  p: SalesTimeseriesParams
): Promise<SalesTimeseriesPoint[]> {
  const bucketFormat = p.granularity === "month" ? "YYYY-MM" : "YYYY-MM-DD";
  // Revenue must sum each sale's `total` exactly once. Joining `sale_items`
  // directly fans out one row per line item, multiplying `s.total` by the number
  // of items on the ticket — so units are pre-aggregated per sale before the join.
  const result = await db.execute(sql`
    SELECT
      to_char(
        date_trunc(${p.granularity}, ss.session_date::timestamp),
        ${bucketFormat}
      ) AS bucket,
      COALESCE(SUM(s.total::numeric), 0)::float AS revenue,
      COUNT(DISTINCT s.id)::int               AS "transactionCount",
      COALESCE(SUM(si.units), 0)::int         AS "unitsSold"
    FROM sales_sessions ss
    LEFT JOIN sales s ON s.session_id = ss.id
    LEFT JOIN (
      SELECT sale_id, SUM(quantity) AS units
      FROM sale_items
      GROUP BY sale_id
    ) si ON si.sale_id = s.id
    WHERE ss.session_date BETWEEN ${p.startDate}::date AND ${p.endDate}::date
    GROUP BY 1
    ORDER BY bucket
  `);

  return (result.rows as Array<Record<string, unknown>>).map((row) => ({
    bucket: String(row.bucket),
    revenue: Number(row.revenue),
    transactionCount: Number(row.transactionCount),
    unitsSold: Number(row.unitsSold),
  }));
}

// ---------------------------------------------------------------------------
// getTopProducts
// ---------------------------------------------------------------------------

export interface TopProductsParams {
  startDate: string;
  endDate: string;
  /** Default 10, capped at 50. */
  limit?: number;
  category?: string;
}

export interface TopProductRow {
  productId: string | null;
  barcode: string | null;
  name: string;
  category: string | null;
  unitsSold: number;
  revenue: number;
}

export async function getTopProducts(p: TopProductsParams): Promise<TopProductRow[]> {
  const limit = Math.min(Math.max(1, p.limit ?? 10), 50);

  const rows = await db
    .select({
      productId: saleItems.productId,
      barcode: saleItems.barcode,
      name: saleItems.productName,
      category: products.category,
      unitsSold: sql<number>`SUM(${saleItems.quantity})::int`,
      revenue: sql<number>`SUM(${saleItems.subtotal}::numeric)::float`,
    })
    .from(saleItems)
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .innerJoin(salesSessions, eq(sales.sessionId, salesSessions.id))
    .leftJoin(products, eq(saleItems.productId, products.id))
    .where(
      and(
        gte(salesSessions.sessionDate, p.startDate),
        lte(salesSessions.sessionDate, p.endDate),
        p.category ? eq(products.category, p.category) : undefined
      )
    )
    .groupBy(
      saleItems.productName,
      saleItems.productId,
      saleItems.barcode,
      products.category
    )
    .orderBy(
      sql`SUM(${saleItems.subtotal}::numeric) DESC`,
      sql`SUM(${saleItems.quantity}) DESC`
    )
    .limit(limit);

  return rows.map((row) => ({
    productId: row.productId ?? null,
    barcode: row.barcode ?? null,
    name: row.name,
    category: row.category ?? null,
    unitsSold: Number(row.unitsSold),
    revenue: Number(row.revenue),
  }));
}

// ---------------------------------------------------------------------------
// getCategoryPerformance
// ---------------------------------------------------------------------------

export interface CategoryPerformanceParams {
  startDate: string;
  endDate: string;
}

export interface CategoryPerformanceRow {
  category: string;
  revenue: number;
  unitsSold: number;
  transactionCount: number;
}

export async function getCategoryPerformance(
  p: CategoryPerformanceParams
): Promise<CategoryPerformanceRow[]> {
  const result = await db.execute(sql`
    SELECT
      COALESCE(pr.category, 'Sin categoría') AS category,
      COALESCE(SUM(si.subtotal::numeric), 0)::float AS revenue,
      COALESCE(SUM(si.quantity), 0)::int            AS "unitsSold",
      COUNT(DISTINCT s.id)::int                     AS "transactionCount"
    FROM sale_items si
    JOIN sales           s  ON si.sale_id   = s.id
    JOIN sales_sessions  ss ON s.session_id = ss.id
    LEFT JOIN products   pr ON si.product_id = pr.id
    WHERE ss.session_date BETWEEN ${p.startDate}::date AND ${p.endDate}::date
    GROUP BY COALESCE(pr.category, 'Sin categoría')
    ORDER BY revenue DESC
  `);

  return (result.rows as Array<Record<string, unknown>>).map((row) => ({
    category: String(row.category),
    revenue: Number(row.revenue),
    unitsSold: Number(row.unitsSold),
    transactionCount: Number(row.transactionCount),
  }));
}

// ---------------------------------------------------------------------------
// getSessionHealth
// ---------------------------------------------------------------------------

export interface SessionHealthResult {
  openSession: {
    id: string;
    sessionDate: string;
    sessionNumber: number;
    openedAt: string;
    /** True when sessionDate is before today (Mexico timezone). */
    isStale: boolean;
    systemTotal: number;
  } | null;
  recentClosed: Array<{
    id: string;
    sessionDate: string;
    sessionNumber: number;
    closedAt: string | null;
    systemTotal: number;
    countedTotal: number;
    difference: number;
    closedReason: string | null;
  }>;
}

export async function getSessionHealth(opts?: {
  /** Default 5, capped at 20. */
  closedLimit?: number;
}): Promise<SessionHealthResult> {
  const closedLimit = Math.min(Math.max(1, opts?.closedLimit ?? 5), 20);
  const today = getTodayDateString();

  const [openRows, closedRows] = await Promise.all([
    db.select().from(salesSessions).where(eq(salesSessions.status, "open")).limit(1),
    db
      .select()
      .from(salesSessions)
      .where(eq(salesSessions.status, "closed"))
      .orderBy(desc(salesSessions.sessionDate), desc(salesSessions.sessionNumber))
      .limit(closedLimit),
  ]);

  const open = openRows[0] ?? null;

  return {
    openSession: open
      ? {
          id: open.id,
          sessionDate: open.sessionDate,
          sessionNumber: open.sessionNumber,
          openedAt: open.openedAt.toISOString(),
          isStale: open.sessionDate < today,
          systemTotal: Number(open.systemTotal ?? 0),
        }
      : null,
    recentClosed: closedRows.map((row) => ({
      id: row.id,
      sessionDate: row.sessionDate,
      sessionNumber: row.sessionNumber,
      closedAt: row.closedAt?.toISOString() ?? null,
      systemTotal: Number(row.systemTotal ?? 0),
      countedTotal: Number(row.countedTotal ?? 0),
      difference: Number(row.difference ?? 0),
      closedReason: row.closedReason ?? null,
    })),
  };
}
