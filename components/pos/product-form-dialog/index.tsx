"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  createProduct as createProductAction,
  updateProduct as updateProductAction,
} from "@/app/actions/products";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { getCategoryMessageKey } from "@/lib/i18n/categories";
import {
  CATEGORY_OPTIONS,
  createProductFormSchema,
  type ProductFormValues,
  productFormDefaults,
} from "@/lib/pos-form-schemas";
import type { Product } from "@/lib/store";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSuccess?: () => void;
  initialValues?: Partial<ProductFormValues>;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
  initialValues,
}: ProductFormDialogProps) {
  const t = useTranslations("productos.form");
  const tCommon = useTranslations("common");
  const tCategories = useTranslations("categories");
  const tToast = useTranslations("productos.toast");
  const tValidation = useTranslations("validation");
  const [isPending, startTransition] = useTransition();
  const productFormSchema = useMemo(
    () => createProductFormSchema(tValidation),
    [tValidation]
  );
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: productFormDefaults,
  });

  useEffect(() => {
    if (!open) return;

    if (product) {
      form.reset({
        barcode: product.barcode,
        pluCode: product.pluCode ?? "",
        name: product.name,
        price: product.price.toString(),
        costPrice: product.costPrice?.toString() ?? "",
        category: product.category,
      });
      return;
    }

    form.reset({ ...productFormDefaults, ...initialValues });
  }, [open, product, form, initialValues]);

  const handleSubmit = (values: ProductFormValues) => {
    const priceNum = Number.parseFloat(values.price);
    const costNum = values.costPrice === "" ? null : Number.parseFloat(values.costPrice);

    startTransition(async () => {
      if (product) {
        const result = await updateProductAction({
          id: product.id,
          barcode: values.barcode || null,
          pluCode: values.pluCode || null,
          name: values.name,
          price: priceNum,
          costPrice: costNum,
          category: values.category,
        });
        if (result.success) {
          toast.success(tToast("updated"));
          onOpenChange(false);
          onSuccess?.();
        } else {
          if (result.field) {
            form.setError(result.field, { type: "server", message: result.error });
            return;
          }
          toast.error(result.error);
        }
      } else {
        const result = await createProductAction({
          barcode: values.barcode || null,
          pluCode: values.pluCode || null,
          name: values.name,
          price: priceNum,
          costPrice: costNum ?? undefined,
          category: values.category,
        });
        if (result.success) {
          toast.success(tToast("added"));
          onOpenChange(false);
          onSuccess?.();
        } else {
          if (result.field) {
            form.setError(result.field, { type: "server", message: result.error });
            return;
          }
          toast.error(result.error);
        }
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (isPending && !v) return;
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {product ? t("editTitle") : t("addTitle")}
          </DialogTitle>
          <DialogDescription>
            {product ? t("editDescription") : t("addDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="mt-2 flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="barcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">{t("barcodeLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      id="pf-barcode"
                      placeholder={t("barcodePlaceholder")}
                      className="mt-1 font-mono text-foreground"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pluCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">{t("pluLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      id="pf-plu"
                      type="text"
                      placeholder={tCommon("placeholderPlu")}
                      inputMode="numeric"
                      maxLength={4}
                      className="mt-1 font-mono text-foreground"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">
                    {t("nameLabel")} <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="pf-name"
                      placeholder={t("namePlaceholder")}
                      className="mt-1 text-foreground"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">
                      {t("salePriceLabel")} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        id="pf-price"
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        placeholder={tCommon("placeholderAmount")}
                        className="mt-1 text-foreground"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">
                      {t("costPriceLabel")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        id="pf-cost"
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        placeholder={t("costPlaceholder")}
                        className="mt-1 text-foreground"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">{t("categoryLabel")}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder={t("categoryPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((category) => (
                        <SelectItem key={category} value={category}>
                          {tCategories(getCategoryMessageKey(category))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="mt-1 w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Spinner className="mr-2" />
                  {tCommon("saving")}
                </>
              ) : product ? (
                tCommon("save")
              ) : (
                t("submitAdd")
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
