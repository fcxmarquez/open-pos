"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { completeSale } from "@/app/actions/sales";
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
import { Spinner } from "@/components/ui/spinner";
import {
  type CheckoutFormValues,
  checkoutFormDefaults,
  createCheckoutFormSchema,
} from "@/lib/pos-form-schemas";
import { useStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function CheckoutDialog({ open, onOpenChange, onComplete }: CheckoutDialogProps) {
  const t = useTranslations("ventas.checkout");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const locale = useLocale();
  const [isProcessing, setIsProcessing] = useState(false);

  const checkoutFormSchema = useMemo(
    () => createCheckoutFormSchema(tValidation),
    [tValidation]
  );

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: checkoutFormDefaults,
    mode: "onChange",
  });

  const cart = useStore((s) => s.cart);
  const discountPercent = useStore((s) => s.discountPercent);
  const getCartTotal = useStore((s) => s.getCartTotal);
  const clearCart = useStore((s) => s.clearCart);

  // cart-percentage-discount.CHECKOUT.1, cart-percentage-discount.CHECKOUT.2 — post-discount total
  const total = getCartTotal();
  const payment = form.watch("payment");
  const paymentNum = parseFloat(payment) || 0;
  const change = paymentNum - total;
  const canConfirm = payment !== "" && paymentNum >= total && total > 0 && !isProcessing;

  useEffect(() => {
    if (open) {
      form.reset(checkoutFormDefaults);
      setTimeout(() => form.setFocus("payment"), 100);
    }
  }, [open, form]);

  const handleConfirm = async (values: CheckoutFormValues) => {
    const submittedPayment = Number.parseFloat(values.payment);

    if (total <= 0) {
      return;
    }

    if (submittedPayment < total) {
      form.setError("payment", {
        message: tValidation("paymentMustCoverTotal"),
      });
      return;
    }

    setIsProcessing(true);

    try {
      const items = cart.map((item) => ({
        productId:
          item.product.id.startsWith("temp-") || item.product.id.startsWith("quick-")
            ? null
            : item.product.id,
        barcode: item.product.barcode || null,
        productName: item.product.name,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      }));

      const result = await completeSale({
        items,
        payment: submittedPayment,
        discountPercent,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      clearCart();
      toast.success(t("toastSuccess", { total: formatCurrency(total, locale) }));
      onOpenChange(false);
      onComplete();
    } catch {
      toast.error(t("toastError"));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isProcessing ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleConfirm)}
            className="mt-2 flex flex-col gap-5"
          >
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground">{t("totalLabel")}</p>
              <p className="font-heading text-3xl font-bold text-foreground">
                {formatCurrency(total, locale)}
              </p>
            </div>

            <FormField
              control={form.control}
              name="payment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">{t("paymentLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      id="payment"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      placeholder={tCommon("placeholderAmount")}
                      className="mt-1 h-12 text-center text-xl font-semibold text-foreground"
                      disabled={isProcessing}
                      onFocus={(e) => e.target.select()}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {payment && (
              <output
                htmlFor="payment"
                aria-live="polite"
                className={`rounded-lg p-3 text-center text-lg font-semibold ${
                  change >= 0
                    ? "bg-muted text-success-text"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {change >= 0
                  ? t("change", { amount: formatCurrency(change, locale) })
                  : t("short", { amount: formatCurrency(Math.abs(change), locale) })}
              </output>
            )}

            <Button type="submit" size="lg" disabled={!canConfirm} className="w-full">
              {isProcessing ? (
                <>
                  <Spinner className="mr-2" />
                  {tCommon("processing")}
                </>
              ) : (
                t("confirm")
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
