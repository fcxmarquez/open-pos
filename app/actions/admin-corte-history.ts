"use server";

import { auth } from "@/auth";
import { isAdminRole } from "@/lib/auth/roles";
import {
  type CorteHistoryRange,
  isCorteHistoryRange,
  normalizeCorteHistoryOffset,
} from "@/lib/corte-history";
import { getCorteHistoryData as queryCorteHistoryData } from "@/lib/server/queries/corte-history";

export async function getAdminCorteHistoryData(params: {
  offset: number;
  range: CorteHistoryRange;
}) {
  const session = await auth();

  if (!session || !isAdminRole(session.user?.role)) {
    throw new Error("Unauthorized");
  }

  if (!isCorteHistoryRange(params.range)) {
    throw new Error("Invalid corte history range");
  }

  return queryCorteHistoryData({
    offset: normalizeCorteHistoryOffset(params.offset),
    range: params.range,
  });
}
