import type { AdminDashboardData } from "../../lib/server/queries/admin-dashboard";

// Stub for Storybook — the real server action uses next-auth which is Node-only.
// Stories pre-seed the QueryClient directly, so this fn is never called at runtime.
export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  throw new Error("getAdminDashboardData should not be called in Storybook");
}
