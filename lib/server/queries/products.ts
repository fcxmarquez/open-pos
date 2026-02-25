import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import { products, saleItems } from "@/db/schema";
import { PRODUCTS_PAGE_SIZE } from "@/lib/constants/products";

function normalizePaginationValue(
  value: number | undefined,
  fallback: number,
  max: number
) {
  const numericValue = typeof value === "number" ? value : Number.NaN;
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  const normalized = Math.trunc(numericValue);
  if (normalized < 1) {
    return 1;
  }

  return Math.min(normalized, max);
}

function buildContainsPattern(rawValue: string): string {
  const escapedValue = rawValue.replace(/[\\%_]/g, "\\$&");
  return `%${escapedValue}%`;
}

export async function getProducts(opts?: {
  search?: string;
  category?: string;
  includeInactive?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const pageSize = normalizePaginationValue(opts?.pageSize, PRODUCTS_PAGE_SIZE, 200);
  const maxPage = Math.floor(Number.MAX_SAFE_INTEGER / pageSize) + 1;
  const page = normalizePaginationValue(opts?.page, 1, maxPage);
  const offset = (page - 1) * pageSize;
  const conditions = [];

  if (!opts?.includeInactive) {
    conditions.push(eq(products.isActive, true));
  }

  if (opts?.search) {
    const term = buildContainsPattern(opts.search);
    conditions.push(
      or(
        ilike(products.name, term),
        ilike(products.barcode, term),
        ilike(products.pluCode, term)
      )!
    );
  }

  if (opts?.category) {
    conditions.push(eq(products.category, opts.category));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [rows, totalRows] = await Promise.all([
    db
      .select()
      .from(products)
      .where(where)
      .orderBy(asc(products.name), asc(products.id))
      .limit(pageSize)
      .offset(offset),
    db
      .select({
        total: count(products.id),
      })
      .from(products)
      .where(where),
  ]);

  const total = Number(totalRows[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    rows,
    total,
    page,
    pageSize,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
}

export async function getProductByBarcode(barcode: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.barcode, barcode), eq(products.isActive, true)))
    .limit(1);

  return product ?? null;
}

export async function getProductByPluCode(pluCode: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.pluCode, pluCode), eq(products.isActive, true)))
    .limit(1);

  return product ?? null;
}

export async function searchProducts(query: string) {
  const term = buildContainsPattern(query);

  return db
    .select()
    .from(products)
    .where(
      and(
        eq(products.isActive, true),
        or(
          ilike(products.name, term),
          ilike(products.barcode, term),
          ilike(products.pluCode, term)
        )
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

export async function barcodeExists(
  barcode: string,
  excludeId?: string
): Promise<boolean> {
  const whereClause = excludeId
    ? and(eq(products.barcode, barcode), ne(products.id, excludeId))
    : eq(products.barcode, barcode);

  const existing = await db
    .select({ id: products.id })
    .from(products)
    .where(whereClause)
    .limit(1);

  return existing.length > 0;
}

export async function pluCodeExists(
  pluCode: string,
  excludeId?: string
): Promise<boolean> {
  const whereClause = excludeId
    ? and(eq(products.pluCode, pluCode), ne(products.id, excludeId))
    : eq(products.pluCode, pluCode);

  const existing = await db
    .select({ id: products.id })
    .from(products)
    .where(whereClause)
    .limit(1);

  return existing.length > 0;
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
