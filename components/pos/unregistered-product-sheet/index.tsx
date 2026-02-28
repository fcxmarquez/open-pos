"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
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
import { dbProductToStoreProduct } from "@/lib/mappers";
import {
  CATEGORY_OPTIONS,
  type UnregisteredProductFormValues,
  unregisteredProductFormDefaults,
  unregisteredProductFormSchema,
} from "@/lib/pos-form-schemas";
import { type Category, type Product, useStore } from "@/lib/store";

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
  const [isRegistering, setIsRegistering] = useState(false);
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
    const productName = values.name || `Producto - ${barcode}`;

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
      toast.success(`Producto registrado y agregado - $${priceNum.toFixed(2)}`);
      onOpenChange(false);
      onComplete();
    } catch {
      toast.error("Error al registrar el producto");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleAddOnlyToSale = (values: UnregisteredProductFormValues) => {
    const priceNum = Number.parseFloat(values.price);
    const productName = values.name || `Producto sin nombre - ${barcode}`;

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

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleRegisterAndAdd)}
            className="mt-6 flex flex-col gap-4"
          >
            <div>
              <Label className="text-foreground">Codigo de barras</Label>
              <Input
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
                    Precio de venta <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
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
                  <FormLabel className="text-foreground">
                    Nombre del producto (opcional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="name"
                      placeholder="Ej. Cuaderno de notas"
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
                  <FormLabel className="text-foreground">Categoria</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isRegistering}
                  >
                    <FormControl>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
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
                    Registrando...
                  </>
                ) : (
                  "Registrar y agregar"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={form.handleSubmit(handleAddOnlyToSale)}
                disabled={isRegistering}
              >
                Solo agregar a venta
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
