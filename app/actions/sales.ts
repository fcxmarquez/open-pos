"use server";

import { desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { saleItems, sales, salesSessions } from "@/db/schema";
import type { ActionResult } from "@/lib/types";
import { formatZodError } from "@/lib/types";
import { getTodayDateString } from "@/lib/utils";

const cartItemSchema = z.object({
  productId: z.string().uuid().nullable(),
  barcode: z.string().nullable(),
  productName: z.string().min(1, "Nombre del producto requerido"),
  unitPrice: z.coerce.number().positive("El precio debe ser mayor a 0"),
  quantity: z.coerce.number().int().positive("La cantidad debe ser mayor a 0"),
});

const completeSaleSchema = z.object({
  items: z.array(cartItemSchema).min(1, "El carrito no puede estar vacio"),
  payment: z.coerce.number().positive("El pago debe ser mayor a 0"),
});

interface CompleteSaleResult {
  saleId: string;
  total: string;
  payment: string;
  change: string;
  createdAt: Date;
}

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function getOrCreateOpenSession(tx: DbTransaction): Promise<string> {
  const [existing] = await tx
    .select({ id: salesSessions.id })
    .from(salesSessions)
    .where(eq(salesSessions.status, "open"))
    .orderBy(desc(salesSessions.openedAt))
    .limit(1);

  if (existing) {
    return existing.id;
  }

  const today = getTodayDateString();

  const [lastToday] = await tx
    .select({ sessionNumber: salesSessions.sessionNumber })
    .from(salesSessions)
    .where(eq(salesSessions.sessionDate, today))
    .orderBy(desc(salesSessions.sessionNumber))
    .limit(1);

  const nextNumber = lastToday ? lastToday.sessionNumber + 1 : 1;

  const inserted = await tx
    .insert(salesSessions)
    .values({ sessionDate: today, sessionNumber: nextNumber, status: "open" })
    .onConflictDoNothing()
    .returning({ id: salesSessions.id });

  if (inserted.length > 0) {
    return inserted[0].id;
  }

  // Another transaction won the race — read the session it created
  const [raced] = await tx
    .select({ id: salesSessions.id })
    .from(salesSessions)
    .where(eq(salesSessions.status, "open"))
    .orderBy(desc(salesSessions.openedAt))
    .limit(1);

  if (!raced) {
    throw new Error("Failed to create or retrieve open session");
  }

  return raced.id;
}

export async function completeSale(
  input: z.input<typeof completeSaleSchema>
): Promise<ActionResult<CompleteSaleResult>> {
  const parsed = completeSaleSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, data: null, error: formatZodError(parsed.error) };
  }

  const { items, payment } = parsed.data;

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  if (payment < total) {
    return {
      success: false,
      data: null,
      error: "El pago es menor al total de la venta",
    };
  }

  const change = payment - total;

  try {
    const sale = await db.transaction(async (tx) => {
      const sessionId = await getOrCreateOpenSession(tx);

      const [newSale] = await tx
        .insert(sales)
        .values({
          sessionId,
          total: total.toFixed(2),
          paymentAmount: payment.toFixed(2),
          changeAmount: change.toFixed(2),
        })
        .returning();

      await tx.insert(saleItems).values(
        items.map((item) => ({
          saleId: newSale.id,
          productId: item.productId,
          barcode: item.barcode,
          productName: item.productName,
          unitPrice: item.unitPrice.toFixed(2),
          quantity: item.quantity,
          subtotal: (item.unitPrice * item.quantity).toFixed(2),
        }))
      );

      await tx
        .update(salesSessions)
        .set({
          systemTotal: sql`COALESCE(${salesSessions.systemTotal}, 0) + ${total.toFixed(2)}::decimal`,
        })
        .where(eq(salesSessions.id, sessionId));

      return newSale;
    });

    revalidatePath("/");

    return {
      success: true,
      data: {
        saleId: sale.id,
        total: sale.total,
        payment: sale.paymentAmount,
        change: sale.changeAmount,
        createdAt: sale.createdAt,
      },
      error: null,
    };
  } catch (err) {
    console.error("completeSale failed:", err);
    return {
      success: false,
      data: null,
      error: "No se pudo completar la venta",
    };
  }
}
