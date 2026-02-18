import { and, count, desc, eq, ilike, inArray, isNotNull, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, saleItems } from "@/db/schema";

export async function getProducts(opts?: {
  search?: string;
  category?: string;
  includeInactive?: boolean;
}) {
  const conditions = [];

  if (!opts?.includeInactive) {
    conditions.push(eq(products.isActive, true));
  }

  if (opts?.search) {
    const term = `%${opts.search}%`;
    conditions.push(or(ilike(products.name, term), ilike(products.barcode, term))!);
  }

  if (opts?.category) {
    conditions.push(eq(products.category, opts.category));
  }

  return db
    .select()
    .from(products)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(products.name);
}

export async function getProductByBarcode(barcode: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.barcode, barcode), eq(products.isActive, true)))
    .limit(1);

  return product ?? null;
}

export async function searchProducts(query: string) {
  const term = `%${query}%`;

  return db
    .select()
    .from(products)
    .where(
      and(
        eq(products.isActive, true),
        or(ilike(products.name, term), ilike(products.barcode, term))
      )
    )
    .orderBy(products.name);
}

export async function getFrequentProducts(limit = 12) {
  const rows = await db
    .select({
      productId: saleItems.productId,
      totalSold: count(saleItems.id).as("total_sold"),
    })
    .from(saleItems)
    .where(isNotNull(saleItems.productId))
    .groupBy(saleItems.productId)
    .orderBy(desc(sql`total_sold`))
    .limit(limit);

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.productId!);

  const productRows = await db
    .select()
    .from(products)
    .where(and(eq(products.isActive, true), inArray(products.id, ids)));

  const orderMap = new Map(ids.map((id, i) => [id, i]));
  return productRows.sort(
    (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
  );
}

export async function getPendingProducts() {
  return db
    .select()
    .from(products)
    .where(
      and(isNotNull(products.barcode), isNull(products.name), eq(products.isActive, true))
    )
    .orderBy(desc(products.createdAt));
}
