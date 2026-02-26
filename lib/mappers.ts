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
  return {
    id: p.id,
    barcode: p.barcode ?? "",
    pluCode: p.pluCode ?? undefined,
    name: p.name ?? "Sin nombre",
    price: Number(p.price),
    costPrice: p.costPrice ? Number(p.costPrice) : undefined,
    category: (p.category as Product["category"]) ?? "General",
    createdAt: p.createdAt.toISOString(),
    lastSoldAt: p.lastSoldAt?.toISOString(),
  };
}
