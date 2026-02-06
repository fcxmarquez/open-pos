"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useStore } from "@/lib/store"

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`
}

interface CheckoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

export function CheckoutDialog({
  open,
  onOpenChange,
  onComplete,
}: CheckoutDialogProps) {
  const [payment, setPayment] = useState("")
  const paymentRef = useRef<HTMLInputElement>(null)

  const getCartTotal = useStore((s) => s.getCartTotal)
  const completeSale = useStore((s) => s.completeSale)

  const total = getCartTotal()
  const paymentNum = parseFloat(payment) || 0
  const change = paymentNum - total
  const canConfirm = paymentNum >= total && total > 0

  useEffect(() => {
    if (open) {
      setPayment("")
      setTimeout(() => paymentRef.current?.focus(), 100)
    }
  }, [open])

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canConfirm) return
    const sale = completeSale(paymentNum)
    toast.success(`Venta registrada - ${formatCurrency(sale.total)}`)
    onOpenChange(false)
    onComplete()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Cobrar</DialogTitle>
          <DialogDescription>Registra el pago del cliente</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleConfirm} className="mt-2 flex flex-col gap-5">
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">Total a cobrar</p>
            <p className="text-3xl font-bold text-foreground">
              {formatCurrency(total)}
            </p>
          </div>

          <div>
            <Label htmlFor="payment" className="text-foreground">Pago del cliente</Label>
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
            Confirmar venta
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
