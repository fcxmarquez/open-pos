"use client";

import { Loader2 } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function CheckoutDialog({ open, onOpenChange, onComplete }: CheckoutDialogProps) {
  const [payment, setPayment] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const paymentRef = useRef<HTMLInputElement>(null);

  const cart = useStore((s) => s.cart);
  const getCartTotal = useStore((s) => s.getCartTotal);
  const clearCart = useStore((s) => s.clearCart);

  const total = getCartTotal();
  const paymentNum = parseFloat(payment) || 0;
  const change = paymentNum - total;
  const canConfirm = paymentNum >= total && total > 0 && !isProcessing;

  useEffect(() => {
    if (open) {
      setPayment("");
      setTimeout(() => paymentRef.current?.focus(), 100);
    }
  }, [open]);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canConfirm) return;

    setIsProcessing(true);

    try {
      const items = cart.map((item) => ({
        productId:
          item.product.id.startsWith("temp-") || item.product.id.startsWith("quick-")
            ? null
            : item.product.id,
        barcode: item.product.barcode || null,
        productName: item.product.name,
        unitPrice: item.product.price,
        quantity: item.quantity,
      }));

      const result = await completeSale({ items, payment: paymentNum });

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
          <DialogDescription>Registra el pago del cliente</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleConfirm} className="mt-2 flex flex-col gap-5">
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">Total a cobrar</p>
            <p className="text-3xl font-bold text-foreground">{formatCurrency(total)}</p>
          </div>

          <div>
            <Label htmlFor="payment" className="text-foreground">
              Pago del cliente
            </Label>
            <Input
              ref={paymentRef}
              id="payment"
              type="number"
              step="0.01"
              min="0"
              value={payment}
              onChange={(e) => setPayment(e.target.value)}
              placeholder="0.00"
              className="mt-1 h-12 text-center text-xl font-semibold text-foreground"
              disabled={isProcessing}
            />
          </div>

          {payment && (
            <div
              className={`rounded-lg p-3 text-center text-lg font-semibold ${
                change >= 0
                  ? "bg-accent/10 text-accent"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {change >= 0
                ? `Cambio: ${formatCurrency(change)}`
                : `Falta: ${formatCurrency(Math.abs(change))}`}
            </div>
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
      </DialogContent>
    </Dialog>
  );
}
