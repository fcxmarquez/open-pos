"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useStore, type Category } from "@/lib/store"

const CATEGORIES: Category[] = [
  "General",
  "Papelería",
  "Útiles escolares",
  "Arte",
  "Oficina",
  "Otro",
]

interface UnregisteredProductSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  barcode: string
  onComplete: () => void
}

export function UnregisteredProductSheet({
  open,
  onOpenChange,
  barcode,
  onComplete,
}: UnregisteredProductSheetProps) {
  const [price, setPrice] = useState("")
  const [name, setName] = useState("")
  const [category, setCategory] = useState<Category>("General")
  const priceRef = useRef<HTMLInputElement>(null)

  const addProduct = useStore((s) => s.addProduct)
  const addToCart = useStore((s) => s.addToCart)

  useEffect(() => {
    if (open) {
      setPrice("")
      setName("")
      setCategory("General")
      setTimeout(() => priceRef.current?.focus(), 100)
    }
  }, [open])

  const handleRegisterAndAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Ingresa un precio valido")
      return
    }

    const product = addProduct({
      barcode,
      name: name || `Producto - ${barcode}`,
      price: priceNum,
      category,
    })
    addToCart(product)
    toast.success(`Producto registrado y agregado - $${priceNum.toFixed(2)}`)
    onOpenChange(false)
    onComplete()
  }

  const handleAddOnlyToSale = () => {
    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Ingresa un precio valido")
      return
    }

    // Create a temporary product (not saved to catalog)
    const tempProduct = {
      id: `temp-${Date.now()}`,
      barcode,
      name: name || `Producto sin nombre - ${barcode}`,
      price: priceNum,
      category: "General" as Category,
      createdAt: new Date().toISOString(),
    }
    addToCart(tempProduct)
    toast.success(`Producto agregado a la venta - $${priceNum.toFixed(2)}`)
    onOpenChange(false)
    onComplete()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[400px] sm:max-w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-foreground">Producto no registrado</SheetTitle>
          <SheetDescription>
            El codigo <span className="font-mono font-semibold">{barcode}</span> no se
            encontro en el catalogo.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleRegisterAndAdd} className="mt-6 flex flex-col gap-4">
          <div>
            <Label className="text-foreground">Codigo de barras</Label>
            <Input
              value={barcode}
              readOnly
              className="mt-1 bg-muted font-mono text-foreground"
            />
          </div>

          <div>
            <Label htmlFor="price" className="text-foreground">
              Precio de venta <span className="text-destructive">*</span>
            </Label>
            <Input
              ref={priceRef}
              id="price"
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
            <Label htmlFor="name" className="text-foreground">Nombre del producto (opcional)</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Cuaderno de notas"
              className="mt-1 text-foreground"
            />
          </div>

          <div>
            <Label className="text-foreground">Categoria</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as Category)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-2 flex flex-col gap-2">
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground"
            >
              Registrar y agregar
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full bg-transparent"
              onClick={handleAddOnlyToSale}
            >
              Solo agregar a venta
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
