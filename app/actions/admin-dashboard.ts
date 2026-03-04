"use server";

import { auth } from "@/auth";
import { isAdminRole } from "@/lib/auth/roles";
import { getAdminDashboardData as queryAdminDashboardData } from "@/lib/server/queries/admin-dashboard";

export async function getAdminDashboardData() {
  const session = await auth();

  if (!session || !isAdminRole(session.user?.role)) {
    throw new Error("Unauthorized");
  }

  return queryAdminDashboardData();
}
