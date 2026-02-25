import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  decimal,
  index,
  integer,
  pgTable,
  text,
  timestamp,
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
  },
  (table) => [
    index("idx_products_barcode").on(table.barcode).where(sql`barcode IS NOT NULL`),
    index("idx_products_plu_code").on(table.pluCode).where(sql`plu_code IS NOT NULL`),
    index("idx_products_name").on(table.name).where(sql`name IS NOT NULL`),
  ]
);

export const salesSessions = pgTable(
  "sales_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionDate: date("session_date").unique().notNull(),
    systemTotal: decimal("system_total", { precision: 10, scale: 2 }).default("0"),
    countedTotal: decimal("counted_total", { precision: 10, scale: 2 }),
    difference: decimal("difference", { precision: 10, scale: 2 }),
    status: text("status").default("open"),
    openedAt: timestamp("opened_at").defaultNow().notNull(),
    closedAt: timestamp("closed_at"),
  },
  (table) => [
    index("idx_sales_sessions_date").on(table.sessionDate),
    index("idx_sales_sessions_status").on(table.status),
  ]
);

export const sales = pgTable(
  "sales",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .references(() => salesSessions.id)
      .notNull(),
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
