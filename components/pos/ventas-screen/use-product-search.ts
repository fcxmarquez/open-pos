"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  getProductByBarcode,
  getProductByPluCode,
  searchProducts as searchProductsQuery,
} from "@/app/actions/product-queries";
import { dbProductToStoreProduct } from "@/lib/mappers";
import { ventasSearchFormDefaults, ventasSearchFormSchema } from "@/lib/pos-form-schemas";
import { type Product, useStore } from "@/lib/store";

const PLU_CODE_REGEX = /^\d{4}$/;

interface UseProductSearchOptions {
  onUnregistered: (barcode: string) => void;
}

export function useProductSearch({ onUnregistered }: UseProductSearchOptions) {
  const tToast = useTranslations("ventas.toast");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const addToCart = useStore((s) => s.addToCart);

  const searchForm = useForm({
    resolver: zodResolver(ventasSearchFormSchema),
    defaultValues: ventasSearchFormDefaults,
  });
  const searchValue = searchForm.watch("searchValue");

  const focusInput = useCallback(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Auto-focus on mount
  useEffect(() => {
    focusInput();
  }, [focusInput]);

  // Debounced search as user types
  useEffect(() => {
    if (searchValue.length < 2) {
      setSearchResults([]);
      setIsDebouncing(false);
      return;
    }

    setIsDebouncing(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setIsDebouncing(false);
      setIsSearching(true);
      startTransition(async () => {
        try {
          const results = await searchProductsQuery(searchValue);
          setSearchResults(results.map((p) => dbProductToStoreProduct(p)));
        } catch {
          // Silently fail on search
        } finally {
          setIsSearching(false);
        }
      });
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchValue]);

  const clearSearch = useCallback(() => {
    searchForm.reset(ventasSearchFormDefaults);
    setSearchResults([]);
  }, [searchForm]);

  const clearSearchAndFocus = useCallback(() => {
    clearSearch();
    focusInput();
  }, [clearSearch, focusInput]);

  const handleSubmit = async ({
    searchValue: submittedValue,
  }: {
    searchValue: string;
  }) => {
    const value = submittedValue.trim();
    if (!value) return;

    setIsSubmitting(true);

    try {
      const product = await getProductByBarcode(value);
      if (product) {
        addToCart(dbProductToStoreProduct(product));
        toast.success(
          product.name ? tToast("added", { name: product.name }) : tToast("addedFallback")
        );
        clearSearchAndFocus();
        return;
      }

      if (PLU_CODE_REGEX.test(value)) {
        const pluProduct = await getProductByPluCode(value);
        if (pluProduct) {
          addToCart(dbProductToStoreProduct(pluProduct));
          toast.success(
            pluProduct.name
              ? tToast("added", { name: pluProduct.name })
              : tToast("addedFallback")
          );
          clearSearchAndFocus();
          return;
        }
      }

      const results = await searchProductsQuery(value);
      if (results.length === 1) {
        const p = dbProductToStoreProduct(results[0]);
        addToCart(p);
        toast.success(tToast("added", { name: p.name }));
        clearSearchAndFocus();
        return;
      }

      if (results.length > 1) {
        setSearchResults(results.map((p) => dbProductToStoreProduct(p)));
        return;
      }

      // No match - delegate to parent to open the unregistered sheet
      onUnregistered(value);
      clearSearch();
    } catch {
      toast.error(tToast("searchError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    searchForm,
    searchValue,
    searchResults,
    isSearching,
    isDebouncing,
    isSubmitting,
    handleSubmit,
    clearSearchAndFocus,
    inputRef,
    focusInput,
  };
}
