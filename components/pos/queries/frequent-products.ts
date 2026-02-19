import { queryOptions } from "@tanstack/react-query";
import { getFrequentProducts } from "@/app/actions/product-queries";
import type { Product } from "@/lib/store";

type DbProduct = Awaited<ReturnType<typeof getFrequentProducts>>[number];

function dbProductToStoreProduct(p: DbProduct): Product {
  return {
    id: p.id,
    barcode: p.barcode ?? "",
    name: p.name ?? "Sin nombre",
    price: Number(p.price),
    category: (p.category as Product["category"]) ?? "General",
    createdAt: p.createdAt.toISOString(),
  };
}

export const frequentProductsQueryKey = ["frequent-products"] as const;

export function frequentProductsQueryOptions() {
  return queryOptions({
    queryKey: frequentProductsQueryKey,
    queryFn: async () => {
      const products = await getFrequentProducts();
      return products.map(dbProductToStoreProduct);
    },
  });
}
