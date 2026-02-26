import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { salesSessions } from "@/db/schema";

export async function getOpenSession() {
  const [session] = await db
    .select()
    .from(salesSessions)
    .where(eq(salesSessions.status, "open"))
    .orderBy(desc(salesSessions.openedAt))
    .limit(1);

  return session ?? null;
}

export async function getSessionHistory(limit = 30) {
  return db
    .select()
    .from(salesSessions)
    .orderBy(desc(salesSessions.openedAt))
    .limit(limit);
}
