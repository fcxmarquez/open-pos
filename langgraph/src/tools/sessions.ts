import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getSessionHealth } from "../../../lib/server/queries/analytics";

export const getSessionHealthTool = tool(
  async ({ closedLimit }) => {
    try {
      const data = await getSessionHealth({ closedLimit });
      return { ok: true as const, data };
    } catch (err) {
      return { ok: false as const, error: String(err) };
    }
  },
  {
    name: "get_session_health",
    description:
      "Returns the current open cash session (with stale flag if it's from a previous date) and the last N closed sessions with their reconciliation differences.",
    schema: z.object({
      closedLimit: z
        .number()
        .int()
        .min(1)
        .max(20)
        .default(5)
        .describe("Number of recent closed sessions to return (1–20, default 5)"),
    }),
  }
);
