import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getAdminDashboardData } from "../../../lib/server/queries/admin-dashboard";
import { toolError } from "./tool-error";

export const getDashboardSnapshot = tool(
  async () => {
    try {
      const data = await getAdminDashboardData();
      return { ok: true as const, data };
    } catch (err) {
      return toolError("get_dashboard_snapshot", err);
    }
  },
  {
    name: "get_dashboard_snapshot",
    description:
      "Returns today's sales summary: revenue, transaction count, products sold, top product, MTD projection, and stale session status. Use this for questions like '¿cómo vamos hoy?' or '¿cuánto llevamos?'.",
    schema: z.object({}),
  }
);
