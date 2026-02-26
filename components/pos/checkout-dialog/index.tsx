"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
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
import {
  type CheckoutFormValues,
  checkoutFormDefaults,
  checkoutFormSchema,
} from "@/lib/pos-form-schemas";
import { useStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function CheckoutDialog({ open, onOpenChange, onComplete }: CheckoutDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: checkoutFormDefaults,
    mode: "onChange",
  });

  const cart = useStore((s) => s.cart);
  const getCartTotal = useStore((s) => s.getCartTotal);
  const clearCart = useStore((s) => s.clearCart);

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
        message: "El pago debe ser mayor o igual al total",
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

      const result = await completeSale({ items, payment: submittedPayment });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      clearCart();
      toast.success(`Venta registrada - ${formatCurrency(total)}`);
      onOpenChange(false);
      onComplete();
    } catch {
      toast.error("Error al procesar la venta");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isProcessing ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Cobrar</DialogTitle>
          <DialogDescription>
            {total > 0
              ? `Registra el pago de ${formatCurrency(total)} del cliente`
              : "Registra el pago del cliente"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleConfirm)}
            className="mt-2 flex flex-col gap-5"
          >
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground">Total a cobrar</p>
              <p className="text-3xl font-bold text-foreground">
                {formatCurrency(total)}
              </p>
            </div>

            <FormField
              control={form.control}
              name="payment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Pago del cliente</FormLabel>
                  <FormControl>
                    <Input
                      id="payment"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="mt-1 h-12 text-center text-xl font-semibold text-foreground"
                      disabled={isProcessing}
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
                    ? "bg-accent/10 text-accent"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {change >= 0
                  ? `Cambio: ${formatCurrency(change)}`
                  : `Falta: ${formatCurrency(Math.abs(change))}`}
              </output>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={!canConfirm}
              className="w-full bg-accent text-accent-foreground text-base font-semibold hover:bg-accent/90"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Confirmar venta"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
