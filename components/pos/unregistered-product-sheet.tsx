"use client";

import { Loader2 } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { createProduct } from "@/app/actions/products";
import { Button } from "@/components/ui/button";
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
import { type Category, type Product, useStore } from "@/lib/store";

const CATEGORIES: Category[] = [
  "General",
  "Papelería",
  "Útiles escolares",
  "Arte",
  "Oficina",
  "Otro",
];

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
  const [price, setPrice] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("General");
  const [isRegistering, setIsRegistering] = useState(false);
  const priceRef = useRef<HTMLInputElement>(null);

  const addToCart = useStore((s) => s.addToCart);

  useEffect(() => {
    if (open) {
      setPrice("");
      setName("");
      setCategory("General");
      setTimeout(() => priceRef.current?.focus(), 100);
    }
  }, [open]);

  const handleRegisterAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(price);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      toast.error("Ingresa un precio valido");
      return;
    }

    setIsRegistering(true);

    try {
      const result = await createProduct({
        barcode,
        name: name || `Producto - ${barcode}`,
        price: priceNum,
        category,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const dbProduct = result.data;
      const product: Product = {
        id: dbProduct.id,
        barcode: dbProduct.barcode ?? "",
        name: dbProduct.name ?? `Producto - ${barcode}`,
        price: Number(dbProduct.price),
        category: (dbProduct.category as Category) ?? "General",
        createdAt: dbProduct.createdAt.toISOString(),
      };

      addToCart(product);
      toast.success(`Producto registrado y agregado - $${priceNum.toFixed(2)}`);
      onOpenChange(false);
      onComplete();
    } catch {
      toast.error("Error al registrar el producto");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleAddOnlyToSale = () => {
    const priceNum = parseFloat(price);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      toast.error("Ingresa un precio valido");
      return;
    }

    // Create a temporary product (not saved to catalog)
    const tempProduct: Product = {
      id: `temp-${Date.now()}`,
      barcode,
      name: name || `Producto sin nombre - ${barcode}`,
      price: priceNum,
      category: "General",
      createdAt: new Date().toISOString(),
    };
    addToCart(tempProduct);
    toast.success(`Producto agregado a la venta - $${priceNum.toFixed(2)}`);
    onOpenChange(false);
    onComplete();
  };

  return (
    <Sheet open={open} onOpenChange={isRegistering ? undefined : onOpenChange}>
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
              disabled={isRegistering}
            />
          </div>

          <div>
            <Label htmlFor="name" className="text-foreground">
              Nombre del producto (opcional)
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Cuaderno de notas"
              className="mt-1 text-foreground"
              disabled={isRegistering}
            />
          </div>

          <div>
            <Label className="text-foreground">Categoria</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as Category)}
              disabled={isRegistering}
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
              disabled={isRegistering}
            >
              {isRegistering ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Registrar y agregar"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full bg-transparent"
              onClick={handleAddOnlyToSale}
              disabled={isRegistering}
            >
              Solo agregar a venta
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
