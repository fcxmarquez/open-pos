import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { and, desc, eq, gte, inArray, lt, sum } from "drizzle-orm";
import { db } from "@/db";
import { products, saleItems, sales, salesSessions } from "@/db/schema";
import { getOpenSession } from "@/lib/server/queries/sessions";
import { getMonthProgress, getTodayDateString, toMexicoDateString } from "@/lib/utils";

export interface AdminDashboardData {
  comparisonLabel: string;
  generatedAt: string;
  hasOpenSession: boolean;
  latestTransactions: {
    createdAt: string;
    id: string;
    items: { name: string; quantity: number }[];
    total: number;
  }[];
  monthDaysElapsed: number;
  monthDaysTotal: number;
  openSessionLabel: string | null;
  productsSold: number;
  revenueMonthProjected: number;
  revenueMonthToDate: number;
  revenueToday: number;
  revenueVsLastWeek: number | null;
  staleSession: {
    id: string;
    sessionDate: string;
    sessionNumber: number;
  } | null;
  topProduct: {
    category: string | null;
    name: string;
    units: number;
  } | null;
  transactionCount: number;
}

function getDateStringDaysAgo(days: number): string {
  return toMexicoDateString(subDays(new Date(), days));
}

function formatPastWeekday(dateString: string): string {
  return format(new Date(`${dateString}T12:00:00`), "EEEE 'pasado'", {
    locale: es,
  });
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const today = getTodayDateString();
  const lastWeekDate = getDateStringDaysAgo(7);
  const monthStart = `${today.slice(0, 7)}-01`;

  const [
    openSession,
    staleSessionRow,
    todaySalesRows,
    lastWeekSalesRows,
    monthSalesRows,
  ] = await Promise.all([
    getOpenSession(),
    db
      .select({
        id: salesSessions.id,
        sessionDate: salesSessions.sessionDate,
        sessionNumber: salesSessions.sessionNumber,
      })
      .from(salesSessions)
      .where(and(eq(salesSessions.status, "open"), lt(salesSessions.sessionDate, today)))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    db
      .select({
        createdAt: sales.createdAt,
        id: sales.id,
        total: sales.total,
      })
      .from(sales)
      .innerJoin(salesSessions, eq(sales.sessionId, salesSessions.id))
      .where(eq(salesSessions.sessionDate, today))
      .orderBy(desc(sales.createdAt)),
    db
      .select({ revenue: sum(sales.total) })
      .from(sales)
      .innerJoin(salesSessions, eq(sales.sessionId, salesSessions.id))
      .where(eq(salesSessions.sessionDate, lastWeekDate)),
    db
      .select({ revenue: sum(sales.total) })
      .from(sales)
      .innerJoin(salesSessions, eq(sales.sessionId, salesSessions.id))
      .where(gte(salesSessions.sessionDate, monthStart)),
  ]);

  const todaySaleIds = todaySalesRows.map((sale) => sale.id);

  const todaySaleItems =
    todaySaleIds.length > 0
      ? await db
          .select({
            productId: saleItems.productId,
            productName: saleItems.productName,
            quantity: saleItems.quantity,
            saleId: saleItems.saleId,
          })
          .from(saleItems)
          .where(inArray(saleItems.saleId, todaySaleIds))
      : [];

  const productIds = Array.from(
    new Set(
      todaySaleItems
        .map((item) => item.productId)
        .filter((productId): productId is string => Boolean(productId))
    )
  );

  const productRows =
    productIds.length > 0
      ? await db
          .select({
            category: products.category,
            id: products.id,
          })
          .from(products)
          .where(inArray(products.id, productIds))
      : [];

  const categoryByProductId = new Map(
    productRows.map((product) => [product.id, product.category ?? null])
  );
  const itemsBySaleId = new Map<string, { name: string; quantity: number }[]>();
  const topProducts = new Map<
    string,
    { category: string | null; name: string; units: number }
  >();

  for (const item of todaySaleItems) {
    const saleItems2 = itemsBySaleId.get(item.saleId) ?? [];
    saleItems2.push({ name: item.productName, quantity: item.quantity });
    itemsBySaleId.set(item.saleId, saleItems2);

    const key = item.productId ?? `name:${item.productName}`;
    const currentTopProduct = topProducts.get(key) ?? {
      category: item.productId ? (categoryByProductId.get(item.productId) ?? null) : null,
      name: item.productName,
      units: 0,
    };

    currentTopProduct.units += item.quantity;
    topProducts.set(key, currentTopProduct);
  }

  const revenueToday = todaySalesRows.reduce(
    (sum, sale) => sum + Number(sale.total ?? 0),
    0
  );
  const lastWeekRevenue = Number(lastWeekSalesRows[0]?.revenue ?? 0);
  const revenueMonthToDate = Number(monthSalesRows[0]?.revenue ?? 0);
  const { monthDaysElapsed, monthDaysTotal } = getMonthProgress(today);
  const revenueMonthProjected =
    monthDaysElapsed > 0 ? (revenueMonthToDate / monthDaysElapsed) * monthDaysTotal : 0;
  const productsSold = todaySaleItems.reduce((sum, item) => sum + item.quantity, 0);

  const revenueVsLastWeek =
    lastWeekRevenue > 0
      ? ((revenueToday - lastWeekRevenue) / lastWeekRevenue) * 100
      : null;

  const latestTransactions = todaySalesRows.map((sale) => ({
    createdAt: new Date(sale.createdAt).toISOString(),
    id: sale.id,
    items: itemsBySaleId.get(sale.id) ?? [],
    total: Number(sale.total ?? 0),
  }));

  const topProduct =
    Array.from(topProducts.values()).sort(
      (left, right) => right.units - left.units || left.name.localeCompare(right.name)
    )[0] ?? null;

  return {
    staleSession: staleSessionRow,
    comparisonLabel: `vs ${formatPastWeekday(lastWeekDate)}`,
    generatedAt: new Date().toISOString(),
    hasOpenSession: Boolean(openSession),
    latestTransactions,
    monthDaysElapsed,
    monthDaysTotal,
    openSessionLabel: openSession
      ? `Sesión abierta · Turno ${openSession.sessionNumber}`
      : null,
    productsSold,
    revenueMonthProjected,
    revenueMonthToDate,
    revenueToday,
    revenueVsLastWeek,
    topProduct,
    transactionCount: todaySalesRows.length,
  };
}
