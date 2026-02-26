"use server";

import { getOpenSessionSales as queryOpenSessionSales } from "@/lib/server/queries/sales";
import {
  getOpenSession as queryOpenSession,
  getSessionHistory as querySessionHistory,
} from "@/lib/server/queries/sessions";

export async function getOpenSession() {
  return queryOpenSession();
}

export async function getSessionHistory(limit?: number) {
  return querySessionHistory(limit);
}

export async function getOpenSessionSales() {
  return queryOpenSessionSales();
}
