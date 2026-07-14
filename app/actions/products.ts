"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { db } from "@/db";
import { products } from "@/db/schema";
import { PLU_CODE_REGEX } from "@/lib/constants/products";
import type {
  ErrorsTranslator,
  ValidationTranslator,
} from "@/lib/i18n/server-translators";
import { CATEGORY_OPTIONS } from "@/lib/pos-form-schemas";
import {
  barcodeExists,
  bulkUpdateProducts as bulkUpdateProductsQuery,
  pluCodeExists,
} from "@/lib/server/queries/products";
import { type ActionResult, formatZodError } from "@/lib/types";

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

function createNullablePluCode(t: ValidationTranslator) {
  return z.preprocess((value) => {
    if (typeof value !== "string") return value;

    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }, z.string().regex(PLU_CODE_REGEX, t("pluFourDigits")).nullable().optional());
}

function createCreateProductSchema(t: ValidationTranslator) {
  return z.object({
    barcode: nullableTrimmedString,
    pluCode: createNullablePluCode(t),
    name: nullableTrimmedString,
    price: z.coerce.number().positive(t("unitPricePositive")),
    costPrice: z.coerce.number().nonnegative().optional(),
    category: optionalTrimmedString.default("General"),
  });
}

function createUpdateProductSchema(t: ValidationTranslator) {
  return z.object({
    id: z.string().uuid(t("productIdInvalid")),
    barcode: nullableTrimmedString,
    pluCode: createNullablePluCode(t),
    name: nullableTrimmedString,
    price: z.coerce.number().positive(t("unitPricePositive")).optional(),
    costPrice: z.coerce.number().nonnegative().nullable().optional(),
    category: optionalTrimmedString,
  });
}

function createDeleteProductSchema(t: ValidationTranslator) {
  return z.object({
    id: z.string().uuid(t("productIdInvalid")),
  });
}

function createBulkUpdateProductsSchema(t: ValidationTranslator) {
  const bulkProductUpdatesSchema = z
    .object({
      price: z.coerce.number().positive(t("unitPricePositive")).optional(),
      costPrice: z
        .union([z.coerce.number().nonnegative(t("costPriceNonNegative")), z.null()])
        .optional(),
      category: z.enum(CATEGORY_OPTIONS).optional(),
    })
    .refine(
      (value) =>
        value.price !== undefined ||
        value.costPrice !== undefined ||
        value.category !== undefined,
      t("noFieldsToUpdate")
    );

  return z.object({
    ids: z
      .array(z.string().uuid(t("productIdInvalid")))
      .min(1, t("selectAtLeastOne"))
      .max(500, t("bulkMax500")),
    updates: bulkProductUpdatesSchema,
  });
}

function duplicateFieldError(
  field: ProductField,
  tErrors: ErrorsTranslator
): {
  error: string;
  field: ProductField;
} {
  if (field === "pluCode") {
    return {
      error: tErrors("pluDuplicate"),
      field,
    };
  }

  return {
    error: tErrors("barcodeDuplicate"),
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
  input: z.input<ReturnType<typeof createCreateProductSchema>>
): Promise<ProductActionResult<Product>> {
  const t = await getTranslations("validation");
  const tErrors = await getTranslations("errors");
  const createProductSchema = createCreateProductSchema(t);
  const parsed = createProductSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      data: null,
      error: formatZodError(parsed.error, t("invalidInput")),
    };
  }

  try {
    if (parsed.data.barcode && (await barcodeExists(parsed.data.barcode))) {
      const duplicate = duplicateFieldError("barcode", tErrors);
      return {
        success: false,
        data: null,
        error: duplicate.error,
        field: duplicate.field,
      };
    }

    if (parsed.data.pluCode && (await pluCodeExists(parsed.data.pluCode))) {
      const duplicate = duplicateFieldError("pluCode", tErrors);
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
      const duplicate = duplicateFieldError("pluCode", tErrors);
      return {
        success: false,
        data: null,
        error: duplicate.error,
        field: duplicate.field,
      };
    }

    if (uniqueConstraint === "products_barcode_unique") {
      const duplicate = duplicateFieldError("barcode", tErrors);
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
      error: tErrors("createProductFailed"),
    };
  }
}

export async function updateProduct(
  input: z.input<ReturnType<typeof createUpdateProductSchema>>
): Promise<ProductActionResult<Product>> {
  const t = await getTranslations("validation");
  const tErrors = await getTranslations("errors");
  const updateProductSchema = createUpdateProductSchema(t);
  const parsed = updateProductSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      data: null,
      error: formatZodError(parsed.error, t("invalidInput")),
    };
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
      error: t("noFieldsToUpdate"),
    };
  }

  try {
    if (
      parsed.data.barcode &&
      (await barcodeExists(parsed.data.barcode, parsed.data.id))
    ) {
      const duplicate = duplicateFieldError("barcode", tErrors);
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
      const duplicate = duplicateFieldError("pluCode", tErrors);
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
        error: tErrors("productNotFound"),
      };
    }

    revalidateProducts();

    return { success: true, data: updated, error: null };
  } catch (error) {
    const uniqueConstraint = getUniqueConstraint(error);
    if (uniqueConstraint === "products_plu_code_unique") {
      const duplicate = duplicateFieldError("pluCode", tErrors);
      return {
        success: false,
        data: null,
        error: duplicate.error,
        field: duplicate.field,
      };
    }

    if (uniqueConstraint === "products_barcode_unique") {
      const duplicate = duplicateFieldError("barcode", tErrors);
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
      error: tErrors("updateProductFailed"),
    };
  }
}

export async function deleteProduct(
  input: z.input<ReturnType<typeof createDeleteProductSchema>>
): Promise<ActionResult> {
  const t = await getTranslations("validation");
  const tErrors = await getTranslations("errors");
  const deleteProductSchema = createDeleteProductSchema(t);
  const parsed = deleteProductSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      data: null,
      error: formatZodError(parsed.error, t("invalidInput")),
    };
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
        error: tErrors("productNotFound"),
      };
    }

    revalidateProducts();

    return { success: true, data: null, error: null };
  } catch (err) {
    console.error("deleteProduct failed:", err);
    return {
      success: false,
      data: null,
      error: tErrors("deleteProductFailed"),
    };
  }
}

export async function bulkUpdateProducts(
  input: z.input<ReturnType<typeof createBulkUpdateProductsSchema>>
): Promise<ActionResult<{ updatedCount: number }>> {
  const t = await getTranslations("validation");
  const tErrors = await getTranslations("errors");
  const bulkUpdateProductsSchema = createBulkUpdateProductsSchema(t);
  const parsed = bulkUpdateProductsSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      data: null,
      error: formatZodError(parsed.error, t("invalidInput")),
    };
  }

  try {
    const updatedCount = await bulkUpdateProductsQuery(
      parsed.data.ids,
      parsed.data.updates
    );

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
      error: tErrors("bulkUpdateFailed"),
    };
  }
}
