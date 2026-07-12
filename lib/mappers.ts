import type { Product } from "@/lib/store";

interface DbProduct {
  id: string;
  barcode: string | null;
  pluCode: string | null;
  name: string | null;
  price: string;
  costPrice: string | null;
  category: string | null;
  createdAt: Date;
  lastSoldAt: Date | null;
}

/** Default unnamed product label (Spanish). Translate at display when locale differs. */
export const UNNAMED_PRODUCT_FALLBACK = "Sin nombre";

export function dbProductToStoreProduct(
  p: DbProduct,
  fallbackName: string = UNNAMED_PRODUCT_FALLBACK
): Product {
  return {
    id: p.id,
    barcode: p.barcode ?? "",
    pluCode: p.pluCode ?? undefined,
    name: p.name ?? fallbackName,
    price: Number(p.price),
    costPrice: p.costPrice ? Number(p.costPrice) : undefined,
    category: (p.category as Product["category"]) ?? "General",
    createdAt: p.createdAt.toISOString(),
    lastSoldAt: p.lastSoldAt?.toISOString(),
  };
}
