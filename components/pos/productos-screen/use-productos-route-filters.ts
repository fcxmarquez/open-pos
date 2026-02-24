"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { productosFiltersFormSchema } from "@/lib/pos-form-schemas";
import {
  buildProductsQueryString,
  parseProductosRouteState,
  SEARCH_DEBOUNCE_MS,
} from "./route-state";

export function useProductosRouteFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialStateRef = useRef<ReturnType<typeof parseProductosRouteState> | null>(
    null
  );

  if (!initialStateRef.current) {
    initialStateRef.current = parseProductosRouteState(searchParams);
  }

  const initialState = initialStateRef.current;
  const [page, setPage] = useState(initialState.page);
  const [debouncedSearch, setDebouncedSearch] = useState(initialState.searchQuery);
  const filtersForm = useForm({
    resolver: zodResolver(productosFiltersFormSchema),
    defaultValues: {
      searchQuery: initialState.searchQuery,
      categoryFilter: initialState.categoryFilter,
    },
  });
  const searchQuery = filtersForm.watch("searchQuery");
  const categoryFilter = filtersForm.watch("categoryFilter");
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousFilterRef = useRef(
    `${initialState.searchQuery.trim()}|${initialState.categoryFilter}`
  );
  const lastSyncedQueryRef = useRef(searchParams.toString());
  const skipNextUrlPushRef = useRef(false);
  const currentQueryString = searchParams.toString();
  const normalizedSearch = debouncedSearch.trim();

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    const nextFilterKey = `${normalizedSearch}|${categoryFilter}`;
    if (previousFilterRef.current === nextFilterKey) {
      return;
    }

    previousFilterRef.current = nextFilterKey;
    setPage(1);
  }, [categoryFilter, normalizedSearch]);

  useEffect(() => {
    if (currentQueryString === lastSyncedQueryRef.current) {
      return;
    }

    const routeState = parseProductosRouteState(searchParams);
    const currentSearchValue = filtersForm.getValues("searchQuery");
    const currentCategoryValue = filtersForm.getValues("categoryFilter");

    if (currentSearchValue !== routeState.searchQuery) {
      filtersForm.setValue("searchQuery", routeState.searchQuery, {
        shouldDirty: false,
        shouldTouch: false,
      });
    }

    if (currentCategoryValue !== routeState.categoryFilter) {
      filtersForm.setValue("categoryFilter", routeState.categoryFilter, {
        shouldDirty: false,
        shouldTouch: false,
      });
    }

    previousFilterRef.current = `${routeState.searchQuery.trim()}|${routeState.categoryFilter}`;
    setDebouncedSearch(routeState.searchQuery);
    setPage(routeState.page);
    lastSyncedQueryRef.current = currentQueryString;
    skipNextUrlPushRef.current = true;
  }, [currentQueryString, filtersForm, searchParams]);

  useEffect(() => {
    if (skipNextUrlPushRef.current) {
      skipNextUrlPushRef.current = false;
      return;
    }

    const nextQueryString = buildProductsQueryString({
      search: normalizedSearch || undefined,
      category: categoryFilter,
      page,
    });

    if (nextQueryString === lastSyncedQueryRef.current) {
      return;
    }

    lastSyncedQueryRef.current = nextQueryString;
    router.replace(nextQueryString ? `${pathname}?${nextQueryString}` : pathname, {
      scroll: false,
    });
  }, [categoryFilter, normalizedSearch, page, pathname, router]);

  return {
    filtersForm,
    categoryFilter,
    normalizedSearch,
    page,
    setPage,
  };
}
