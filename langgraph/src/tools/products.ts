import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { searchProducts } from "../../../lib/server/queries/products";

export const searchCatalogTool = tool(
  async ({ query }) => {
    try {
      const data = await searchProducts(query);
      return { ok: true as const, data };
    } catch (err) {
      return { ok: false as const, error: String(err) };
    }
  },
  {
    name: "search_catalog",
    description:
      "Searches the active product catalog by name, barcode, or PLU code. Returns matching products with their price, category, and barcode.",
    schema: z.object({
      query: z
        .string()
        .min(1)
        .max(100)
        .describe("Search term — product name, barcode, or PLU code"),
    }),
  }
);
