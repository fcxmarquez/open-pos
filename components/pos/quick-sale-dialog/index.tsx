"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
  createQuickSaleFormSchema,
  type QuickSaleFormValues,
  quickSaleFormDefaults,
} from "@/lib/pos-form-schemas";
import { type Category, useStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

interface QuickSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function QuickSaleDialog({
  open,
  onOpenChange,
  onComplete,
}: QuickSaleDialogProps) {
  const t = useTranslations("ventas.quickSale");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const locale = useLocale();

  const quickSaleFormSchema = useMemo(
    () => createQuickSaleFormSchema(tValidation),
    [tValidation]
  );

  const form = useForm<QuickSaleFormValues>({
    resolver: zodResolver(quickSaleFormSchema),
    defaultValues: quickSaleFormDefaults,
  });
  const addToCart = useStore((s) => s.addToCart);

  useEffect(() => {
    if (open) {
      form.reset(quickSaleFormDefaults);
      setTimeout(() => form.setFocus("price"), 100);
    }
  }, [open, form]);

  const handleSubmit = (values: QuickSaleFormValues) => {
    const priceNum = Number.parseFloat(values.price);
    const saleName = values.name || t("defaultName");

    const tempProduct = {
      id: `quick-${Date.now()}`,
      barcode: "",
      name: saleName,
      price: priceNum,
      category: "General" as Category,
      createdAt: new Date().toISOString(),
    };
    addToCart(tempProduct);
    toast.success(
      t("toast", { name: saleName, price: formatCurrency(priceNum, locale) })
    );
    onOpenChange(false);
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="mt-2 flex flex-col gap-4"
          >
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
                      id="qs-price"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      placeholder={tCommon("placeholderAmount")}
                      className="mt-1 text-foreground"
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
                      id="qs-name"
                      placeholder={t("namePlaceholder")}
                      className="mt-1 text-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              {t("submit")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
