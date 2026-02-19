// Thin wrapper that exposes only the product queries needed by client components.
// This avoids a module-level "use server" in app/queries/products.ts, which would
// turn every export (e.g. getProducts, getPendingProducts) into a public endpoint.
"use server";

import {
  getFrequentProducts as queryFrequentProducts,
  getProductByBarcode as queryProductByBarcode,
  searchProducts as querySearchProducts,
} from "@/app/queries/products";

export async function getProductByBarcode(barcode: string) {
  return queryProductByBarcode(barcode);
}

export async function searchProducts(query: string) {
  return querySearchProducts(query);
}

export async function getFrequentProducts(limit?: number) {
  return queryFrequentProducts(limit);
}
