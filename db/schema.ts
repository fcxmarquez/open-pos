import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    barcode: text("barcode").unique(),
    pluCode: text("plu_code").unique(),
    name: text("name"),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
    category: text("category").default("General"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    lastSoldAt: timestamp("last_sold_at"),
  },
  (table) => [index("idx_products_name").on(table.name).where(sql`name IS NOT NULL`)]
);

export const salesSessions = pgTable(
  "sales_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionDate: date("session_date").notNull(),
    sessionNumber: integer("session_number").default(1).notNull(),
    systemTotal: decimal("system_total", { precision: 10, scale: 2 }).default("0"),
    countedTotal: decimal("counted_total", { precision: 10, scale: 2 }),
    difference: decimal("difference", { precision: 10, scale: 2 }),
    status: text("status").default("open"),
    closedReason: text("closed_reason"),
    openedAt: timestamp("opened_at").defaultNow().notNull(),
    closedAt: timestamp("closed_at"),
  },
  (table) => [
    index("idx_sales_sessions_date").on(table.sessionDate),
    index("idx_sales_sessions_status").on(table.status),
    uniqueIndex("idx_sales_sessions_one_open")
      .on(table.status)
      .where(sql`status = 'open'`),
    uniqueIndex("idx_sales_sessions_date_number").on(
      table.sessionDate,
      table.sessionNumber
    ),
  ]
);

export const historicalSalesImportBatches = pgTable(
  "historical_sales_import_batches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceFileName: text("source_file_name").notNull(),
    sourceFilePath: text("source_file_path").notNull(),
    sourceFileSha256: text("source_file_sha256").notNull(),
    selectionPolicy: text("selection_policy").notNull(),
    expectedRowCount: integer("expected_row_count").notNull(),
    expectedKnownAmountCount: integer("expected_known_amount_count").notNull(),
    expectedNullAmountCount: integer("expected_null_amount_count").notNull(),
    expectedStartDate: date("expected_start_date").notNull(),
    expectedEndDate: date("expected_end_date").notNull(),
    expectedTotalAmountMxn: decimal("expected_total_amount_mxn", {
      precision: 14,
      scale: 2,
    }).notNull(),
    repositoryCommit: text("repository_commit"),
    importedAt: timestamp("imported_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_historical_import_batches_sha256").on(table.sourceFileSha256),
    check(
      "ck_historical_import_batches_sha256",
      sql`${table.sourceFileSha256} ~ '^[0-9a-f]{64}$'`
    ),
    check(
      "ck_historical_import_batches_counts",
      sql`${table.expectedRowCount} > 0
        AND ${table.expectedKnownAmountCount} >= 0
        AND ${table.expectedNullAmountCount} >= 0
        AND ${table.expectedKnownAmountCount} + ${table.expectedNullAmountCount} = ${table.expectedRowCount}`
    ),
    check(
      "ck_historical_import_batches_date_range",
      sql`${table.expectedStartDate} <= ${table.expectedEndDate}`
    ),
    check(
      "ck_historical_import_batches_total",
      sql`${table.expectedTotalAmountMxn} >= 0`
    ),
  ]
);

export const historicalDailySales = pgTable(
  "historical_daily_sales",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    importBatchId: uuid("import_batch_id")
      .references(() => historicalSalesImportBatches.id)
      .notNull(),
    businessDate: date("business_date").notNull(),
    amountMxn: decimal("amount_mxn", { precision: 12, scale: 2 }),
    selectedSource: text("selected_source").notNull(),
    selectionBasis: text("selection_basis").notNull(),
    mergeStatus: text("merge_status").notNull(),
    sourceRowNumber: integer("source_row_number").notNull(),
    provenance: jsonb("provenance").$type<Record<string, string | null>>().notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_historical_daily_sales_business_date").on(table.businessDate),
    uniqueIndex("uq_historical_daily_sales_batch_row").on(
      table.importBatchId,
      table.sourceRowNumber
    ),
    index("idx_historical_daily_sales_batch").on(table.importBatchId),
    check(
      "ck_historical_daily_sales_amount",
      sql`${table.amountMxn} IS NULL OR ${table.amountMxn} >= 0`
    ),
    check("ck_historical_daily_sales_source_row", sql`${table.sourceRowNumber} >= 2`),
    check(
      "ck_historical_daily_sales_source_status",
      sql`(
          ${table.selectedSource} = 'notebook'
          AND ${table.selectionBasis} = 'notebook_authoritative'
          AND (
            (${table.amountMxn} IS NOT NULL AND ${table.mergeStatus} = 'ready_notebook_authoritative')
            OR (${table.amountMxn} IS NULL AND ${table.mergeStatus} = 'unresolved_notebook_blank')
          )
        ) OR (
          ${table.selectedSource} = 'managementpro'
          AND ${table.selectionBasis} = 'managementpro_nonoverlap_gap_fill'
          AND (
            (${table.amountMxn} IS NOT NULL AND ${table.mergeStatus} = 'ready_managementpro_gap_fill')
            OR (${table.amountMxn} IS NULL AND ${table.mergeStatus} = 'unresolved_managementpro_blank')
          )
        )`
    ),
  ]
);

export const sales = pgTable(
  "sales",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .references(() => salesSessions.id)
      .notNull(),
    // cart-percentage-discount.PERSISTENCE.1
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
    // cart-percentage-discount.PERSISTENCE.2 — null when no discount was applied
    // cart-percentage-discount.RULES.4 — a single column per sale structurally allows at most one discount
    discountType: text("discount_type"),
    discountValue: decimal("discount_value", { precision: 5, scale: 2 }),
    discountAmount: decimal("discount_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    // cart-percentage-discount.SERVER.2 — subtotal/discount columns above are plain, independently queryable columns
    total: decimal("total", { precision: 10, scale: 2 }).notNull(),
    paymentAmount: decimal("payment_amount", {
      precision: 10,
      scale: 2,
    }).notNull(),
    changeAmount: decimal("change_amount", {
      precision: 10,
      scale: 2,
    }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_sales_session_id").on(table.sessionId),
    index("idx_sales_created_at").on(table.createdAt),
  ]
);

export const saleItems = pgTable(
  "sale_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    saleId: uuid("sale_id")
      .references(() => sales.id)
      .notNull(),
    productId: uuid("product_id").references(() => products.id),
    barcode: text("barcode"),
    productName: text("product_name").notNull(),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    quantity: integer("quantity").default(1).notNull(),
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  },
  (table) => [index("idx_sale_items_sale_id").on(table.saleId)]
);
