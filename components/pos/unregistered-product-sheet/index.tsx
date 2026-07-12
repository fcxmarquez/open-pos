"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createProduct } from "@/app/actions/products";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { getCategoryMessageKey } from "@/lib/i18n/categories";
import { dbProductToStoreProduct } from "@/lib/mappers";
import {
  CATEGORY_OPTIONS,
  createUnregisteredProductFormSchema,
  type UnregisteredProductFormValues,
  unregisteredProductFormDefaults,
} from "@/lib/pos-form-schemas";
import { type Category, type Product, useStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

interface UnregisteredProductSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barcode: string;
  onComplete: () => void;
}

export function UnregisteredProductSheet({
  open,
  onOpenChange,
  barcode,
  onComplete,
}: UnregisteredProductSheetProps) {
  const t = useTranslations("ventas.unregistered");
  const tCommon = useTranslations("common");
  const tCategories = useTranslations("categories");
  const tValidation = useTranslations("validation");
  const locale = useLocale();
  const [isRegistering, setIsRegistering] = useState(false);

  const unregisteredProductFormSchema = useMemo(
    () => createUnregisteredProductFormSchema(tValidation),
    [tValidation]
  );

  const form = useForm<UnregisteredProductFormValues>({
    resolver: zodResolver(unregisteredProductFormSchema),
    defaultValues: unregisteredProductFormDefaults,
  });

  const addToCart = useStore((s) => s.addToCart);

  useEffect(() => {
    if (open) {
      form.reset(unregisteredProductFormDefaults);
      setTimeout(() => form.setFocus("price"), 100);
    }
  }, [open, form]);

  const handleRegisterAndAdd = async (values: UnregisteredProductFormValues) => {
    const priceNum = Number.parseFloat(values.price);
    const productName = values.name || t("defaultName", { barcode });

    setIsRegistering(true);

    try {
      const result = await createProduct({
        barcode,
        name: productName,
        price: priceNum,
        category: values.category,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const product = dbProductToStoreProduct(result.data);

      addToCart(product);
      toast.success(t("toastRegistered", { price: formatCurrency(priceNum, locale) }));
      onOpenChange(false);
      onComplete();
    } catch {
      toast.error(t("toastError"));
    } finally {
      setIsRegistering(false);
    }
  };

  const handleAddOnlyToSale = (values: UnregisteredProductFormValues) => {
    const priceNum = Number.parseFloat(values.price);
    const productName = values.name || t("tempName", { barcode });

    // Create a temporary product (not saved to catalog)
    const tempProduct: Product = {
      id: `temp-${Date.now()}`,
      barcode,
      name: productName,
      price: priceNum,
      category: values.category as Category,
      createdAt: new Date().toISOString(),
    };
    addToCart(tempProduct);
    toast.success(t("toastAdded", { price: formatCurrency(priceNum, locale) }));
    onOpenChange(false);
    onComplete();
  };

  return (
    <Sheet open={open} onOpenChange={isRegistering ? undefined : onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[400px] sm:max-w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-foreground">{t("title")}</SheetTitle>
          <SheetDescription>{t("description", { barcode })}</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleRegisterAndAdd)}
            className="mt-6 flex flex-col gap-4"
          >
            <div>
              <Label htmlFor="barcode" className="text-foreground">
                {t("barcodeLabel")}
              </Label>
              <Input
                id="barcode"
                value={barcode}
                readOnly
                className="mt-1 bg-muted font-mono text-foreground"
              />
            </div>

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">
                    {t("priceLabel")} <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="price"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      placeholder={tCommon("placeholderAmount")}
                      className="mt-1 text-foreground"
                      disabled={isRegistering}
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
                  <FormLabel className="text-foreground">{t("nameLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      id="name"
                      placeholder={t("namePlaceholder")}
                      className="mt-1 text-foreground"
                      disabled={isRegistering}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">{t("categoryLabel")}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isRegistering}
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

            <div className="mt-2 flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={isRegistering}>
                {isRegistering ? (
                  <>
                    <Spinner className="mr-2" />
                    {tCommon("registering")}
                  </>
                ) : (
                  t("registerAndAdd")
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={form.handleSubmit(handleAddOnlyToSale)}
                disabled={isRegistering}
              >
                {t("addOnly")}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
