"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { products } from "@/db/schema";
import { PLU_CODE_REGEX } from "@/lib/constants/products";
import { CATEGORY_OPTIONS } from "@/lib/pos-form-schemas";
import {
  barcodeExists,
  bulkUpdateProducts as bulkUpdateProductsQuery,
  pluCodeExists,
} from "@/lib/server/queries/products";
import type { ActionResult } from "@/lib/types";

type Product = typeof products.$inferSelect;
type ProductField = "barcode" | "pluCode";
type ProductActionResult<T = Product> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: string; field?: ProductField };

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

const nullablePluCode = z.preprocess((value) => {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}, z
  .string()
  .regex(PLU_CODE_REGEX, "El codigo PLU debe tener 4 digitos")
  .nullable()
  .optional());

const createProductSchema = z.object({
  barcode: nullableTrimmedString,
  pluCode: nullablePluCode,
  name: nullableTrimmedString,
  price: z.coerce.number().positive("El precio debe ser mayor a 0"),
  costPrice: z.coerce.number().nonnegative().optional(),
  category: optionalTrimmedString.default("General"),
});

const updateProductSchema = z.object({
  id: z.string().uuid("ID de producto invalido"),
  barcode: nullableTrimmedString,
  pluCode: nullablePluCode,
  name: nullableTrimmedString,
  price: z.coerce.number().positive("El precio debe ser mayor a 0").optional(),
  costPrice: z.coerce.number().nonnegative().nullable().optional(),
  category: optionalTrimmedString,
});

const deleteProductSchema = z.object({
  id: z.string().uuid("ID de producto invalido"),
});

const bulkProductUpdatesSchema = z
  .object({
    price: z.coerce.number().positive("El precio debe ser mayor a 0").optional(),
    costPrice: z
      .union([
        z.coerce.number().nonnegative("El precio de costo debe ser mayor o igual a 0"),
        z.null(),
      ])
      .optional(),
    category: z.enum(CATEGORY_OPTIONS).optional(),
  })
  .refine(
    (value) =>
      value.price !== undefined ||
      value.costPrice !== undefined ||
      value.category !== undefined,
    "No se enviaron campos para actualizar"
  );

const bulkUpdateProductsSchema = z.object({
  ids: z
    .array(z.string().uuid("ID de producto invalido"))
    .min(1, "Selecciona al menos un producto"),
  updates: bulkProductUpdatesSchema,
});

function formatZodError(error: z.ZodError): string {
  const firstIssue = error.issues[0];
  return firstIssue?.message ?? "Datos de entrada invalidos";
}

function duplicateFieldError(field: ProductField): {
  error: string;
  field: ProductField;
} {
  if (field === "pluCode") {
    return {
      error: "El codigo PLU ya esta registrado",
      field,
    };
  }

  return {
    error: "El codigo de barras ya esta registrado",
    field,
  };
}

function getUniqueConstraint(error: unknown): string | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  if (!("code" in error) || (error as { code?: string }).code !== "23505") {
    return null;
  }

  const maybeConstraint = (error as { constraint?: unknown }).constraint;
  return typeof maybeConstraint === "string" ? maybeConstraint : null;
}

function revalidateProducts() {
  revalidatePath("/");
}

export async function createProduct(
  input: z.input<typeof createProductSchema>
): Promise<ProductActionResult<Product>> {
  const parsed = createProductSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, data: null, error: formatZodError(parsed.error) };
  }

  try {
    if (parsed.data.barcode && (await barcodeExists(parsed.data.barcode))) {
      const duplicate = duplicateFieldError("barcode");
      return {
        success: false,
        data: null,
        error: duplicate.error,
        field: duplicate.field,
      };
    }

    if (parsed.data.pluCode && (await pluCodeExists(parsed.data.pluCode))) {
      const duplicate = duplicateFieldError("pluCode");
      return {
        success: false,
        data: null,
        error: duplicate.error,
        field: duplicate.field,
      };
    }

    const [created] = await db
      .insert(products)
      .values({
        barcode: parsed.data.barcode ?? null,
        pluCode: parsed.data.pluCode ?? null,
        name: parsed.data.name ?? null,
        price: parsed.data.price.toFixed(2),
        costPrice: parsed.data.costPrice?.toFixed(2) ?? null,
        category: parsed.data.category ?? "General",
      })
      .returning();

    revalidateProducts();

    return { success: true, data: created, error: null };
  } catch (error) {
    const uniqueConstraint = getUniqueConstraint(error);
    if (uniqueConstraint === "products_plu_code_unique") {
      const duplicate = duplicateFieldError("pluCode");
      return {
        success: false,
        data: null,
        error: duplicate.error,
        field: duplicate.field,
      };
    }

    if (uniqueConstraint === "products_barcode_unique") {
      const duplicate = duplicateFieldError("barcode");
      return {
        success: false,
        data: null,
        error: duplicate.error,
        field: duplicate.field,
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
): Promise<ProductActionResult<Product>> {
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

  if (parsed.data.pluCode !== undefined) {
    updateData.pluCode = parsed.data.pluCode;
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
      const duplicate = duplicateFieldError("barcode");
      return {
        success: false,
        data: null,
        error: duplicate.error,
        field: duplicate.field,
      };
    }

    if (
      parsed.data.pluCode &&
      (await pluCodeExists(parsed.data.pluCode, parsed.data.id))
    ) {
      const duplicate = duplicateFieldError("pluCode");
      return {
        success: false,
        data: null,
        error: duplicate.error,
        field: duplicate.field,
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
    const uniqueConstraint = getUniqueConstraint(error);
    if (uniqueConstraint === "products_plu_code_unique") {
      const duplicate = duplicateFieldError("pluCode");
      return {
        success: false,
        data: null,
        error: duplicate.error,
        field: duplicate.field,
      };
    }

    if (uniqueConstraint === "products_barcode_unique") {
      const duplicate = duplicateFieldError("barcode");
      return {
        success: false,
        data: null,
        error: duplicate.error,
        field: duplicate.field,
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

export async function bulkUpdateProducts(
  input: z.input<typeof bulkUpdateProductsSchema>
): Promise<ActionResult<{ updatedCount: number }>> {
  const parsed = bulkUpdateProductsSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, data: null, error: formatZodError(parsed.error) };
  }

  try {
    const updatedCount = await bulkUpdateProductsQuery(
      parsed.data.ids,
      parsed.data.updates
    );

    if (updatedCount === 0) {
      return {
        success: false,
        data: null,
        error: "No se actualizaron productos",
      };
    }

    revalidateProducts();

    return {
      success: true,
      data: { updatedCount },
      error: null,
    };
  } catch (error) {
    console.error("bulkUpdateProducts failed:", error);
    return {
      success: false,
      data: null,
      error: "No se pudieron actualizar los productos",
    };
  }
}
