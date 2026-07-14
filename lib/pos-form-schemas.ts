import { z } from "zod";
import { PLU_CODE_REGEX } from "@/lib/constants/products";
import type { Category } from "@/lib/store";

export const CATEGORY_OPTIONS = [
  "General",
  "Papelería",
  "Útiles escolares",
  "Arte",
  "Oficina",
  "Escritura",
  "Cuadernos",
  "Papel",
  "Adhesivos",
  "Colores y Dibujo",
  "Corrección",
  "Corte y Medición",
  "Cintas",
  "Notas Adhesivas",
  "Otro",
] as const satisfies readonly Category[];

export const CATEGORY_FILTER_OPTIONS = ["all", ...CATEGORY_OPTIONS] as const;

/** Translator for validation.* message keys. */
export type FormValidationKey =
  | "amountInvalid"
  | "costPriceInvalid"
  | "countedCashRequired"
  | "nameRequired"
  | "paymentInvalid"
  | "pluInvalid"
  | "priceInvalid";

export type ValidationTranslate = (key: FormValidationKey) => string;

const numberString = (requiredMessage: string, invalidMessage: string) =>
  z
    .string()
    .trim()
    .min(1, requiredMessage)
    .refine((value) => !Number.isNaN(Number.parseFloat(value)), invalidMessage);

const positiveNumberString = (message: string) =>
  numberString(message, message).refine((value) => Number.parseFloat(value) > 0, message);

const nonNegativeNumberString = (requiredMessage: string, invalidMessage: string) =>
  numberString(requiredMessage, invalidMessage).refine(
    (value) => Number.parseFloat(value) >= 0,
    invalidMessage
  );

const optionalNonNegativeNumberString = (message: string) =>
  z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        (!Number.isNaN(Number.parseFloat(value)) && Number.parseFloat(value) >= 0),
      message
    );

const optionalTrimmedString = z.string().trim();

function createOptionalPluCodeString(t: ValidationTranslate) {
  return z
    .string()
    .trim()
    .refine((value) => value === "" || PLU_CODE_REGEX.test(value), t("pluInvalid"));
}

export const ventasSearchFormSchema = z.object({
  searchValue: optionalTrimmedString,
});

export const ventasSearchFormDefaults: z.input<typeof ventasSearchFormSchema> = {
  searchValue: "",
};

export const productosFiltersFormSchema = z.object({
  searchQuery: optionalTrimmedString,
  categoryFilter: z.enum(CATEGORY_FILTER_OPTIONS),
});

export const productosFiltersFormDefaults: z.input<typeof productosFiltersFormSchema> = {
  searchQuery: "",
  categoryFilter: "all",
};

export function createProductFormSchema(t: ValidationTranslate) {
  return z.object({
    barcode: optionalTrimmedString,
    pluCode: createOptionalPluCodeString(t),
    name: z.string().trim().min(1, t("nameRequired")),
    price: positiveNumberString(t("priceInvalid")),
    costPrice: optionalNonNegativeNumberString(t("costPriceInvalid")),
    category: z.enum(CATEGORY_OPTIONS),
  });
}

export const productFormDefaults: z.input<ReturnType<typeof createProductFormSchema>> = {
  barcode: "",
  pluCode: "",
  name: "",
  price: "",
  costPrice: "",
  category: "General",
};

export function createCheckoutFormSchema(t: ValidationTranslate) {
  return z.object({
    payment: positiveNumberString(t("paymentInvalid")),
  });
}

export const checkoutFormDefaults: z.input<ReturnType<typeof createCheckoutFormSchema>> =
  {
    payment: "",
  };

export function createQuickSaleFormSchema(t: ValidationTranslate) {
  return z.object({
    price: positiveNumberString(t("priceInvalid")),
    name: optionalTrimmedString,
  });
}

export const quickSaleFormDefaults: z.input<
  ReturnType<typeof createQuickSaleFormSchema>
> = {
  price: "",
  name: "",
};

export function createUnregisteredProductFormSchema(t: ValidationTranslate) {
  return z.object({
    price: positiveNumberString(t("priceInvalid")),
    name: optionalTrimmedString,
    category: z.enum(CATEGORY_OPTIONS),
  });
}

export const unregisteredProductFormDefaults: z.input<
  ReturnType<typeof createUnregisteredProductFormSchema>
> = {
  price: "",
  name: "",
  category: "General",
};

export function createCorteFormSchema(t: ValidationTranslate) {
  return z.object({
    countedCash: nonNegativeNumberString(t("countedCashRequired"), t("amountInvalid")),
  });
}

export const corteFormDefaults: z.input<ReturnType<typeof createCorteFormSchema>> = {
  countedCash: "",
};

export type ProductFormValues = z.output<ReturnType<typeof createProductFormSchema>>;
export type CheckoutFormValues = z.output<ReturnType<typeof createCheckoutFormSchema>>;
export type QuickSaleFormValues = z.output<ReturnType<typeof createQuickSaleFormSchema>>;
export type UnregisteredProductFormValues = z.output<
  ReturnType<typeof createUnregisteredProductFormSchema>
>;
export type CorteFormValues = z.output<ReturnType<typeof createCorteFormSchema>>;
