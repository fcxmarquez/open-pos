import { z } from "zod";
import type { Category } from "@/lib/store";

export const CATEGORY_OPTIONS = [
  "General",
  "Papelería",
  "Útiles escolares",
  "Arte",
  "Oficina",
  "Otro",
] as const satisfies readonly Category[];

export const CATEGORY_FILTER_OPTIONS = ["all", ...CATEGORY_OPTIONS] as const;

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

export const productFormSchema = z.object({
  barcode: optionalTrimmedString,
  name: z.string().trim().min(1, "El nombre es requerido"),
  price: positiveNumberString("Ingresa un precio valido"),
  costPrice: optionalNonNegativeNumberString("Ingresa un precio de costo valido"),
  category: z.enum(CATEGORY_OPTIONS),
});

export const productFormDefaults: z.input<typeof productFormSchema> = {
  barcode: "",
  name: "",
  price: "",
  costPrice: "",
  category: "General",
};

export const checkoutFormSchema = z.object({
  payment: positiveNumberString("Ingresa un pago valido"),
});

export const checkoutFormDefaults: z.input<typeof checkoutFormSchema> = {
  payment: "",
};

export const quickSaleFormSchema = z.object({
  price: positiveNumberString("Ingresa un precio valido"),
  name: optionalTrimmedString,
});

export const quickSaleFormDefaults: z.input<typeof quickSaleFormSchema> = {
  price: "",
  name: "",
};

export const unregisteredProductFormSchema = z.object({
  price: positiveNumberString("Ingresa un precio valido"),
  name: optionalTrimmedString,
  category: z.enum(CATEGORY_OPTIONS),
});

export const unregisteredProductFormDefaults: z.input<
  typeof unregisteredProductFormSchema
> = {
  price: "",
  name: "",
  category: "General",
};

export const corteFormSchema = z.object({
  countedCash: nonNegativeNumberString(
    "Ingresa el efectivo contado",
    "Ingresa un monto valido"
  ),
});

export const corteFormDefaults: z.input<typeof corteFormSchema> = {
  countedCash: "",
};

export type ProductFormValues = z.output<typeof productFormSchema>;
export type CheckoutFormValues = z.output<typeof checkoutFormSchema>;
export type QuickSaleFormValues = z.output<typeof quickSaleFormSchema>;
export type UnregisteredProductFormValues = z.output<
  typeof unregisteredProductFormSchema
>;
export type CorteFormValues = z.output<typeof corteFormSchema>;
