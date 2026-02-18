"use server";

import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { saleItems, sales, salesSessions } from "@/db/schema";
import { getTodayDateString } from "@/lib/utils";

export async function getTodaySales() {
  const today = getTodayDateString();

  const [session] = await db
    .select({ id: salesSessions.id })
    .from(salesSessions)
    .where(eq(salesSessions.sessionDate, today))
    .limit(1);

  if (!session) return [];

  const saleRows = await db
    .select()
    .from(sales)
    .where(eq(sales.sessionId, session.id))
    .orderBy(sales.createdAt);

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
