"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  createProduct as createProductAction,
  updateProduct as updateProductAction,
} from "@/app/actions/products";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  CATEGORY_OPTIONS,
  type ProductFormValues,
  productFormDefaults,
  productFormSchema,
} from "@/lib/pos-form-schemas";
import type { Product } from "@/lib/store";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSuccess?: () => void;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: ProductFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: productFormDefaults,
  });

  useEffect(() => {
    if (!open) return;

    if (product) {
      form.reset({
        barcode: product.barcode,
        pluCode: product.pluCode ?? "",
        name: product.name,
        price: product.price.toString(),
        costPrice: product.costPrice?.toString() ?? "",
        category: product.category,
      });
      return;
    }

    form.reset(productFormDefaults);
  }, [open, product, form]);

  const handleSubmit = (values: ProductFormValues) => {
    const priceNum = Number.parseFloat(values.price);
    const costNum = values.costPrice === "" ? null : Number.parseFloat(values.costPrice);

    startTransition(async () => {
      if (product) {
        const result = await updateProductAction({
          id: product.id,
          barcode: values.barcode || null,
          pluCode: values.pluCode || null,
          name: values.name,
          price: priceNum,
          costPrice: costNum,
          category: values.category,
        });
        if (result.success) {
          toast.success("Producto actualizado");
          onOpenChange(false);
          onSuccess?.();
        } else {
          if (result.field) {
            form.setError(result.field, { type: "server", message: result.error });
            return;
          }
          toast.error(result.error);
        }
      } else {
        const result = await createProductAction({
          barcode: values.barcode || null,
          pluCode: values.pluCode || null,
          name: values.name,
          price: priceNum,
          costPrice: costNum ?? undefined,
          category: values.category,
        });
        if (result.success) {
          toast.success("Producto agregado");
          onOpenChange(false);
          onSuccess?.();
        } else {
          if (result.field) {
            form.setError(result.field, { type: "server", message: result.error });
            return;
          }
          toast.error(result.error);
        }
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (isPending && !v) return;
        onOpenChange(v);
      }}
    >
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

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="mt-2 flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="barcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Codigo de barras</FormLabel>
                  <FormControl>
                    <Input
                      id="pf-barcode"
                      placeholder="Opcional"
                      className="mt-1 font-mono text-foreground"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pluCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Codigo PLU</FormLabel>
                  <FormControl>
                    <Input
                      id="pf-plu"
                      type="text"
                      placeholder="0001"
                      inputMode="numeric"
                      maxLength={4}
                      className="mt-1 font-mono text-foreground"
                      disabled={isPending}
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
                    Nombre <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="pf-name"
                      placeholder="Nombre del producto"
                      className="mt-1 text-foreground"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
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
                        id="pf-price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="mt-1 text-foreground"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Precio de costo</FormLabel>
                    <FormControl>
                      <Input
                        id="pf-cost"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Opcional"
                        className="mt-1 text-foreground"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Categoria</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isPending}
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

            <Button type="submit" className="mt-1 w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Spinner className="mr-2" />
                  Guardando...
                </>
              ) : product ? (
                "Guardar cambios"
              ) : (
                "Agregar producto"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
