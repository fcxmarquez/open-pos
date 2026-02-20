"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
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
  type QuickSaleFormValues,
  quickSaleFormDefaults,
  quickSaleFormSchema,
} from "@/lib/pos-form-schemas";
import { type Category, useStore } from "@/lib/store";

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
    const saleName = values.name || "Venta rapida";

    const tempProduct = {
      id: `quick-${Date.now()}`,
      barcode: "",
      name: saleName,
      price: priceNum,
      category: "General" as Category,
      createdAt: new Date().toISOString(),
    };
    addToCart(tempProduct);
    toast.success(`${saleName} agregado - $${priceNum.toFixed(2)}`);
    onOpenChange(false);
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">Venta rapida</DialogTitle>
          <DialogDescription>Agrega un articulo sin codigo de barras</DialogDescription>
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
                    Precio <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="qs-price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
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
                  <FormLabel className="text-foreground">
                    Descripcion (opcional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="qs-name"
                      placeholder="Ej. Fotocopias, impresiones..."
                      className="mt-1 text-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-primary text-primary-foreground">
              Agregar a venta
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
