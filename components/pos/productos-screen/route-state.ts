import { CATEGORY_FILTER_OPTIONS } from "@/lib/pos-form-schemas";

export const SEARCH_DEBOUNCE_MS = 300;

export type CategoryFilter = (typeof CATEGORY_FILTER_OPTIONS)[number];

export interface QueryParamsReader {
  get: (key: string) => string | null;
}

export interface ProductosRouteState {
  searchQuery: string;
  categoryFilter: CategoryFilter;
  page: number;
}

export function parsePage(rawValue: string | null): number {
  const parsed = Number.parseInt(rawValue ?? "", 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

export function parseCategoryFilter(rawValue: string | null): CategoryFilter {
  if (rawValue && CATEGORY_FILTER_OPTIONS.includes(rawValue as CategoryFilter)) {
    return rawValue as CategoryFilter;
  }

  return "all";
}

export function parseProductosRouteState(params: QueryParamsReader): ProductosRouteState {
  return {
    searchQuery: params.get("q")?.trim() ?? "",
    categoryFilter: parseCategoryFilter(params.get("category")),
    page: parsePage(params.get("page")),
  };
}

export function buildProductsQueryString(opts: {
  search?: string;
  category: CategoryFilter;
  page: number;
}): string {
  const params = new URLSearchParams();

  if (opts.search) {
    params.set("q", opts.search);
  }

  if (opts.category !== "all") {
    params.set("category", opts.category);
  }

  if (opts.page > 1) {
    params.set("page", String(opts.page));
  }

  return params.toString();
}
