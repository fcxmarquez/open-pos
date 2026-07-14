import { isCategory } from "@/lib/i18n/categories";
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

export function dbProductToStoreProduct(p: DbProduct): Product {
  const name = p.name?.trim() ?? "";

  return {
    id: p.id,
    barcode: p.barcode ?? "",
    pluCode: p.pluCode ?? undefined,
    name,
    isUnnamed: name.length === 0,
    price: Number(p.price),
    costPrice: p.costPrice ? Number(p.costPrice) : undefined,
    category: isCategory(p.category) ? p.category : "General",
    createdAt: p.createdAt.toISOString(),
    lastSoldAt: p.lastSoldAt?.toISOString(),
  };
}

export function getProductDisplayName(
  product: Pick<Product, "isUnnamed" | "name">,
  unnamedLabel: string
): string {
  return product.isUnnamed ? unnamedLabel : product.name;
}
