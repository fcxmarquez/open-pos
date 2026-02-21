import { queryOptions } from "@tanstack/react-query";
import { getFrequentProducts } from "@/app/actions/product-queries";
import { dbProductToStoreProduct } from "@/lib/mappers";

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
