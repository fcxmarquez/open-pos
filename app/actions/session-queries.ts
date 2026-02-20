"use server";

import { getTodaySales as queryTodaySales } from "@/lib/server/queries/sales";
import {
  getSessionHistory as querySessionHistory,
  getTodaySession as queryTodaySession,
} from "@/lib/server/queries/sessions";

export async function getTodaySession() {
  return queryTodaySession();
}

export async function getSessionHistory(limit?: number) {
  return querySessionHistory(limit);
}

export async function getTodaySales() {
  return queryTodaySales();
}
