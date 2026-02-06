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
import { useStore, type Category } from "@/lib/store"

interface QuickSaleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

export function QuickSaleDialog({
  open,
  onOpenChange,
  onComplete,
}: QuickSaleDialogProps) {
  const [price, setPrice] = useState("")
  const [name, setName] = useState("")
  const priceRef = useRef<HTMLInputElement>(null)

  const addToCart = useStore((s) => s.addToCart)

  useEffect(() => {
    if (open) {
      setPrice("")
      setName("")
      setTimeout(() => priceRef.current?.focus(), 100)
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Ingresa un precio valido")
      return
    }

    const tempProduct = {
      id: `quick-${Date.now()}`,
      barcode: "",
      name: name || "Venta rapida",
      price: priceNum,
      category: "General" as Category,
      createdAt: new Date().toISOString(),
    }
    addToCart(tempProduct)
    toast.success(
      `${name || "Venta rapida"} agregado - $${priceNum.toFixed(2)}`
    )
    onOpenChange(false)
    onComplete()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">Venta rapida</DialogTitle>
          <DialogDescription>
            Agrega un articulo sin codigo de barras
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-4">
          <div>
            <Label htmlFor="qs-price" className="text-foreground">
              Precio <span className="text-destructive">*</span>
            </Label>
            <Input
              ref={priceRef}
              id="qs-price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="mt-1 text-foreground"
              required
            />
          </div>

          <div>
            <Label htmlFor="qs-name" className="text-foreground">
              Descripcion (opcional)
            </Label>
            <Input
              id="qs-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Fotocopias, impresiones..."
              className="mt-1 text-foreground"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground"
          >
            Agregar a venta
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
