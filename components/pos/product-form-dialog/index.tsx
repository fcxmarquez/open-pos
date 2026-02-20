"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Category, type Product, useStore } from "@/lib/store";

const CATEGORIES: Category[] = [
  "General",
  "Papelería",
  "Útiles escolares",
  "Arte",
  "Oficina",
  "Otro",
];

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null; // null = creating new
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
}: ProductFormDialogProps) {
  const [barcode, setBarcode] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [category, setCategory] = useState<Category>("General");

  const addProduct = useStore((s) => s.addProduct);
  const updateProduct = useStore((s) => s.updateProduct);

  useEffect(() => {
    if (open) {
      if (product) {
        setBarcode(product.barcode);
        setName(product.name);
        setPrice(product.price.toString());
        setCostPrice(product.costPrice?.toString() || "");
        setCategory(product.category);
      } else {
        setBarcode("");
        setName("");
        setPrice("");
        setCostPrice("");
        setCategory("General");
      }
    }
  }, [open, product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(price);
    if (!name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      toast.error("Ingresa un precio valido");
      return;
    }
    const costNum = costPrice ? parseFloat(costPrice) : undefined;

    if (product) {
      updateProduct(product.id, {
        barcode,
        name: name.trim(),
        price: priceNum,
        costPrice: costNum,
        category,
      });
      toast.success("Producto actualizado");
    } else {
      addProduct({
        barcode,
        name: name.trim(),
        price: priceNum,
        costPrice: costNum,
        category,
      });
      toast.success("Producto agregado");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {product ? "Editar producto" : "Agregar producto"}
          </DialogTitle>
          <DialogDescription>
            {product
              ? "Modifica los datos del producto"
              : "Completa los datos del nuevo producto"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-4">
          <div>
            <Label htmlFor="pf-barcode" className="text-foreground">
              Codigo de barras
            </Label>
            <Input
              id="pf-barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Opcional"
              className="mt-1 font-mono text-foreground"
            />
          </div>

          <div>
            <Label htmlFor="pf-name" className="text-foreground">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del producto"
              className="mt-1 text-foreground"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pf-price" className="text-foreground">
                Precio de venta <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pf-price"
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
              <Label htmlFor="pf-cost" className="text-foreground">
                Precio de costo
              </Label>
              <Input
                id="pf-cost"
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="Opcional"
                className="mt-1 text-foreground"
              />
            </div>
          </div>

          <div>
            <Label className="text-foreground">Categoria</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
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

          <Button
            type="submit"
            className="mt-1 w-full bg-primary text-primary-foreground"
          >
            {product ? "Guardar cambios" : "Agregar producto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
