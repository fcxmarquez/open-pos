"use server";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { db } from "@/db";
import { products, saleItems, sales, salesSessions } from "@/db/schema";
import {
  clampDiscountPercent,
  computeDiscountBreakdown,
  parseDiscountPercentInput,
} from "@/lib/discount";
import { type ActionResult, formatZodError } from "@/lib/types";
import { getTodayDateString } from "@/lib/utils";

type ValidationT = Awaited<ReturnType<typeof getTranslations<"validation">>>;

function createCompleteSaleSchema(t: ValidationT) {
  const cartItemSchema = z.object({
    productId: z.string().uuid().nullable(),
    barcode: z.string().nullable(),
    productName: z.string().min(1, t("productNameRequired")),
    unitPrice: z.coerce.number().positive(t("unitPricePositive")),
    quantity: z.coerce.number().int().positive(t("quantityPositive")),
  });

  return z.object({
    // cart-percentage-discount.RULES.5 — empty carts are already rejected by min(1) + positive prices
    items: z.array(cartItemSchema).min(1, t("cartNotEmpty")),
    payment: z.coerce.number().positive(t("paymentPositive")),
    // cart-percentage-discount.SERVER.1 — raw input only, re-clamped and recomputed below
    discountPercent: z.preprocess(parseDiscountPercentInput, z.number()),
  });
}

interface CompleteSaleResult {
  saleId: string;
  total: string;
  payment: string;
  change: string;
  createdAt: Date;
}

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function getOrCreateOpenSession(tx: DbTransaction): Promise<string> {
  const today = getTodayDateString();

  const [existing] = await tx
    .select({
      id: salesSessions.id,
      sessionDate: salesSessions.sessionDate,
      systemTotal: salesSessions.systemTotal,
    })
    .from(salesSessions)
    .where(eq(salesSessions.status, "open"))
    .orderBy(desc(salesSessions.openedAt))
    .limit(1);

  if (existing) {
    if (existing.sessionDate === today) {
      return existing.id;
    }

    // Stale session from a previous day — auto-close it
    await tx
      .update(salesSessions)
      .set({
        status: "closed",
        closedReason: "auto",
        countedTotal: existing.systemTotal ?? "0.00",
        difference: "0.00",
        closedAt: new Date(),
      })
      .where(and(eq(salesSessions.id, existing.id), eq(salesSessions.status, "open")));
  }

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
  input: z.input<ReturnType<typeof createCompleteSaleSchema>>
): Promise<ActionResult<CompleteSaleResult>> {
  const t = await getTranslations("validation");
  const tErrors = await getTranslations("errors");
  const completeSaleSchema = createCompleteSaleSchema(t);
  const parsed = completeSaleSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      data: null,
      error: formatZodError(parsed.error, t("invalidInput")),
    };
  }

  const { items, payment, discountPercent } = parsed.data;

  // cart-percentage-discount.SERVER.1 — subtotal is derived from items server-side, never trusted from the client
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const breakdown = computeDiscountBreakdown(
    subtotal,
    clampDiscountPercent(discountPercent)
  );
  const total = breakdown.total;

  if (payment < total) {
    return {
      success: false,
      data: null,
      error: tErrors("paymentLessThanTotal"),
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
          // cart-percentage-discount.PERSISTENCE.1, cart-percentage-discount.PERSISTENCE.2
          subtotal: breakdown.subtotal.toFixed(2),
          discountType: breakdown.discountAmount > 0 ? "percentage" : null,
          discountValue:
            breakdown.discountAmount > 0 ? breakdown.discountPercent.toFixed(2) : null,
          discountAmount: breakdown.discountAmount.toFixed(2),
          // cart-percentage-discount.CHECKOUT.3
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
          // cart-percentage-discount.PERSISTENCE.3 — real unit price, unaffected by the cart-level discount
          unitPrice: item.unitPrice.toFixed(2),
          quantity: item.quantity,
          subtotal: (item.unitPrice * item.quantity).toFixed(2),
        }))
      );

      // cart-percentage-discount.RECONCILIATION.1 — accumulates the post-discount total
      await tx
        .update(salesSessions)
        .set({
          systemTotal: sql`COALESCE(${salesSessions.systemTotal}, 0) + ${total.toFixed(2)}::decimal`,
        })
        .where(eq(salesSessions.id, sessionId));

      const soldProductIds = items
        .map((item) => item.productId)
        .filter((id): id is string => id !== null);

      if (soldProductIds.length > 0) {
        await tx
          .update(products)
          .set({ lastSoldAt: newSale.createdAt })
          .where(inArray(products.id, soldProductIds));
      }

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
      error: tErrors("saleFailed"),
    };
  }
}
