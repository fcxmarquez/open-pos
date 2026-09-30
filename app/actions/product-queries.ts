// Thin wrapper that exposes only the product queries needed by client components.
// This avoids a module-level "use server" in lib/server/queries/products.ts, which would
// turn every export (e.g. getProducts, getPendingProducts) into a public endpoint.
"use server";

import { PRODUCT_SEARCH_RESULT_LIMIT } from "@/lib/constants/products";
import {
  getFrequentProducts as queryFrequentProducts,
  getProducts as queryGetProducts,
  getPendingProducts as queryPendingProducts,
  getProductByBarcode as queryProductByBarcode,
  getProductByPluCode as queryProductByPluCode,
  searchProducts as querySearchProducts,
} from "@/lib/server/queries/products";

export async function getProductByBarcode(barcode: string) {
  return queryProductByBarcode(barcode);
}

export async function getProductByPluCode(pluCode: string) {
  return queryProductByPluCode(pluCode);
}

export async function searchProducts(query: string) {
  // Cap the interactive search. The catalog agent calls the query directly
  // and still receives every match.
  return querySearchProducts(query, PRODUCT_SEARCH_RESULT_LIMIT);
}

export async function getFrequentProducts(limit?: number) {
  return queryFrequentProducts(limit);
}

export async function getProducts(opts?: {
  search?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}) {
  return queryGetProducts(opts);
}

export async function getPendingProducts() {
  return queryPendingProducts();
}
