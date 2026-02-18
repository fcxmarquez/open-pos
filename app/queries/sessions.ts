"use server";

import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { salesSessions } from "@/db/schema";
import { getTodayDateString } from "@/lib/utils";

export async function getTodaySession() {
  const today = getTodayDateString();

  const [session] = await db
    .select()
    .from(salesSessions)
    .where(eq(salesSessions.sessionDate, today))
    .limit(1);

  return session ?? null;
}

export async function getSessionHistory(limit = 30) {
  return db
    .select()
    .from(salesSessions)
    .orderBy(desc(salesSessions.sessionDate))
    .limit(limit);
}
