import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { saleItems, sales, salesSessions } from "@/db/schema";

export async function getOpenSessionSales() {
  const [session] = await db
    .select({ id: salesSessions.id })
    .from(salesSessions)
    .where(eq(salesSessions.status, "open"))
    .orderBy(desc(salesSessions.openedAt))
    .limit(1);

  if (!session) return [];

  const saleRows = await db
    .select()
    .from(sales)
    .where(eq(sales.sessionId, session.id))
    .orderBy(desc(sales.createdAt));

  if (saleRows.length === 0) return [];

  const saleIds = saleRows.map((s) => s.id);

  const allItems = await db
    .select()
    .from(saleItems)
    .where(inArray(saleItems.saleId, saleIds));

  return saleRows.map((sale) => ({
    ...sale,
    items: allItems.filter((item) => item.saleId === sale.id),
  }));
}
