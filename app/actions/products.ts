"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { products } from "@/db/schema";
import type { ActionResult } from "@/lib/types";

type Product = typeof products.$inferSelect;

const nullableTrimmedString = z.preprocess((value) => {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}, z.string().min(1).nullable().optional());

const optionalTrimmedString = z.preprocess((value) => {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}, z.string().min(1).optional());

const createProductSchema = z.object({
  barcode: nullableTrimmedString,
  name: nullableTrimmedString,
  price: z.coerce.number().positive("El precio debe ser mayor a 0"),
  costPrice: z.coerce.number().nonnegative().optional(),
  category: optionalTrimmedString.default("General"),
});

const updateProductSchema = z.object({
  id: z.string().uuid("ID de producto invalido"),
  barcode: nullableTrimmedString,
  name: nullableTrimmedString,
  price: z.coerce.number().positive("El precio debe ser mayor a 0").optional(),
  costPrice: z.coerce.number().nonnegative().nullable().optional(),
  category: optionalTrimmedString,
});

const deleteProductSchema = z.object({
  id: z.string().uuid("ID de producto invalido"),
});

function formatZodError(error: z.ZodError): string {
  const firstIssue = error.issues[0];
  return firstIssue?.message ?? "Datos de entrada invalidos";
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

async function barcodeExists(barcode: string, excludeId?: string): Promise<boolean> {
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

function revalidateProducts() {
  revalidatePath("/");
}

export async function createProduct(
  input: z.input<typeof createProductSchema>
): Promise<ActionResult<Product>> {
  const parsed = createProductSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, data: null, error: formatZodError(parsed.error) };
  }

  try {
    if (parsed.data.barcode && (await barcodeExists(parsed.data.barcode))) {
      return {
        success: false,
        data: null,
        error: "El codigo de barras ya esta registrado",
      };
    }

    const [created] = await db
      .insert(products)
      .values({
        barcode: parsed.data.barcode ?? null,
        name: parsed.data.name ?? null,
        price: parsed.data.price.toFixed(2),
        costPrice: parsed.data.costPrice?.toFixed(2) ?? null,
        category: parsed.data.category ?? "General",
      })
      .returning();

    revalidateProducts();

    return { success: true, data: created, error: null };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        success: false,
        data: null,
        error: "El codigo de barras ya esta registrado",
      };
    }

    console.error("createProduct failed:", error);
    return {
      success: false,
      data: null,
      error: "No se pudo crear el producto",
    };
  }
}

export async function updateProduct(
  input: z.input<typeof updateProductSchema>
): Promise<ActionResult<Product>> {
  const parsed = updateProductSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, data: null, error: formatZodError(parsed.error) };
  }

  const updateData: Partial<typeof products.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (parsed.data.barcode !== undefined) {
    updateData.barcode = parsed.data.barcode;
  }

  if (parsed.data.name !== undefined) {
    updateData.name = parsed.data.name;
  }

  if (parsed.data.price !== undefined) {
    updateData.price = parsed.data.price.toFixed(2);
  }

  if (parsed.data.costPrice !== undefined) {
    updateData.costPrice =
      parsed.data.costPrice === null ? null : parsed.data.costPrice.toFixed(2);
  }

  if (parsed.data.category !== undefined) {
    updateData.category = parsed.data.category;
  }

  if (Object.keys(updateData).length === 1) {
    return {
      success: false,
      data: null,
      error: "No se enviaron campos para actualizar",
    };
  }

  try {
    if (
      parsed.data.barcode &&
      (await barcodeExists(parsed.data.barcode, parsed.data.id))
    ) {
      return {
        success: false,
        data: null,
        error: "El codigo de barras ya esta registrado",
      };
    }

    const [updated] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, parsed.data.id))
      .returning();

    if (!updated) {
      return {
        success: false,
        data: null,
        error: "Producto no encontrado",
      };
    }

    revalidateProducts();

    return { success: true, data: updated, error: null };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        success: false,
        data: null,
        error: "El codigo de barras ya esta registrado",
      };
    }

    console.error("updateProduct failed:", error);
    return {
      success: false,
      data: null,
      error: "No se pudo actualizar el producto",
    };
  }
}

export async function deleteProduct(
  input: z.input<typeof deleteProductSchema>
): Promise<ActionResult> {
  const parsed = deleteProductSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, data: null, error: formatZodError(parsed.error) };
  }

  try {
    const [deleted] = await db
      .update(products)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(products.id, parsed.data.id))
      .returning({ id: products.id });

    if (!deleted) {
      return {
        success: false,
        data: null,
        error: "Producto no encontrado",
      };
    }

    revalidateProducts();

    return { success: true, data: null, error: null };
  } catch (err) {
    console.error("deleteProduct failed:", err);
    return {
      success: false,
      data: null,
      error: "No se pudo eliminar el producto",
    };
  }
}
