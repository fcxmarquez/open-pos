"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { saleItems, sales, salesSessions } from "@/db/schema";
import type { ActionResult } from "@/lib/types";

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

function formatZodError(error: z.ZodError): string {
  const firstIssue = error.issues[0];
  return firstIssue?.message ?? "Datos de entrada invalidos";
}

interface CompleteSaleResult {
  saleId: string;
  total: string;
  payment: string;
  change: string;
  createdAt: Date;
}

async function getOrCreateTodaySession(): Promise<string> {
  const today = new Date().toISOString().split("T")[0];

  const existing = await db
    .select({ id: salesSessions.id })
    .from(salesSessions)
    .where(eq(salesSessions.sessionDate, today))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  const [created] = await db
    .insert(salesSessions)
    .values({ sessionDate: today })
    .returning({ id: salesSessions.id });

  return created.id;
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
    const sessionId = await getOrCreateTodaySession();

    const [sale] = await db
      .insert(sales)
      .values({
        sessionId,
        total: total.toFixed(2),
        paymentAmount: payment.toFixed(2),
        changeAmount: change.toFixed(2),
      })
      .returning();

    await db.insert(saleItems).values(
      items.map((item) => ({
        saleId: sale.id,
        productId: item.productId,
        barcode: item.barcode,
        productName: item.productName,
        unitPrice: item.unitPrice.toFixed(2),
        quantity: item.quantity,
        subtotal: (item.unitPrice * item.quantity).toFixed(2),
      }))
    );

    await db
      .update(salesSessions)
      .set({
        systemTotal: sql`COALESCE(${salesSessions.systemTotal}, 0) + ${total.toFixed(2)}::decimal`,
      })
      .where(eq(salesSessions.id, sessionId));

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
  } catch {
    return {
      success: false,
      data: null,
      error: "No se pudo completar la venta",
    };
  }
}
