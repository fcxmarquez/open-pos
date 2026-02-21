import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { getPendingProducts, getProducts } from "@/app/actions/product-queries";
import { dbProductToStoreProduct } from "@/lib/mappers";

export const productsQueryKey = ["products"] as const;
export const pendingProductsQueryKey = ["pending-products"] as const;

export function productsQueryOptions(opts?: { search?: string; category?: string }) {
  return queryOptions({
    queryKey: [...productsQueryKey, opts?.search ?? "", opts?.category ?? ""] as const,
    queryFn: async () => {
      const rows = await getProducts(opts);
      return rows.map(dbProductToStoreProduct);
    },
    placeholderData: keepPreviousData,
  });
}

export function pendingProductsQueryOptions() {
  return queryOptions({
    queryKey: pendingProductsQueryKey,
    queryFn: async () => {
      const rows = await getPendingProducts();
      return rows.length;
    },
  });
}
