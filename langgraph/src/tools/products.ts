import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { searchProducts } from "../../../lib/server/queries/products";
import { toolError } from "./tool-error";

export const searchCatalogTool = tool(
  async ({ query }) => {
    try {
      const matches = await searchProducts(query);
      const data = matches.map(
        (product: Awaited<ReturnType<typeof searchProducts>>[number]) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
          barcode: product.barcode,
          pluCode: product.pluCode,
        })
      );
      return { ok: true as const, data };
    } catch (err) {
      return toolError("search_catalog", err);
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
