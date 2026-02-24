import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { getPendingProducts, getProducts } from "@/app/actions/product-queries";
import { PRODUCTS_PAGE_SIZE } from "@/lib/constants/products";
import { dbProductToStoreProduct } from "@/lib/mappers";
import type { Product } from "@/lib/store";

export const productsQueryKey = ["products"] as const;
export const pendingProductsQueryKey = ["pending-products"] as const;
export { PRODUCTS_PAGE_SIZE };

export interface ProductsPageData {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export function productsQueryOptions(opts: {
  search?: string;
  category?: string;
  page: number;
  pageSize: number;
}) {
  return queryOptions({
    queryKey: [
      ...productsQueryKey,
      opts.search ?? "",
      opts.category ?? "",
      opts.page,
      opts.pageSize,
    ] as const,
    queryFn: async () => {
      const pageData = await getProducts(opts);
      return {
        total: pageData.total,
        page: pageData.page,
        pageSize: pageData.pageSize,
        totalPages: pageData.totalPages,
        hasPreviousPage: pageData.hasPreviousPage,
        hasNextPage: pageData.hasNextPage,
        products: pageData.rows.map(dbProductToStoreProduct),
      } satisfies ProductsPageData;
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
