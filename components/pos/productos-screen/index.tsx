"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { deleteProduct as deleteProductAction } from "@/app/actions/products";
import { ProductFormDialog } from "@/components/pos/product-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CATEGORY_OPTIONS,
  productosFiltersFormDefaults,
  productosFiltersFormSchema,
} from "@/lib/pos-form-schemas";
import type { Product } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import {
  pendingProductsQueryKey,
  pendingProductsQueryOptions,
  productsQueryKey,
  productsQueryOptions,
} from "./query";

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "Nunca";
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ProductosScreen() {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isPending, startTransition] = useTransition();
  const filtersForm = useForm({
    resolver: zodResolver(productosFiltersFormSchema),
    defaultValues: productosFiltersFormDefaults,
  });
  const searchQuery = filtersForm.watch("searchQuery");
  const categoryFilter = filtersForm.watch("categoryFilter");

  // Debounced search value
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const queryClient = useQueryClient();

  const queryOpts = {
    search: debouncedSearch || undefined,
    category: categoryFilter === "all" ? undefined : categoryFilter,
  };

  const { data: products = [], isLoading } = useQuery(productsQueryOptions(queryOpts));
  const { data: pendingCount = 0 } = useQuery(pendingProductsQueryOptions());

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: productsQueryKey });
    queryClient.invalidateQueries({ queryKey: pendingProductsQueryKey });
  };

  const handleDelete = (product: Product) => {
    if (window.confirm(`Eliminar "${product.name}"? Esta accion no se puede deshacer.`)) {
      startTransition(async () => {
        const result = await deleteProductAction({ id: product.id });
        if (result.success) {
          toast.success("Producto eliminado");
          invalidateQueries();
        } else {
          toast.error(result.error);
        }
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-4 md:p-5">
      {/* Header with stats and actions */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {products.length} productos
          </Badge>
          {pendingCount > 0 && (
            <Badge
              variant="outline"
              className="border-amber-300 bg-amber-50 text-amber-700"
            >
              <AlertTriangle className="mr-1 h-3 w-3" />
              {pendingCount} sin nombre
            </Badge>
          )}
        </div>
        <Button
          onClick={() => {
            setEditingProduct(null);
            setShowForm(true);
          }}
          className="bg-primary text-primary-foreground"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Agregar producto
        </Button>
      </div>

      {/* Search and filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Form {...filtersForm}>
          <FormField
            control={filtersForm.control}
            name="searchQuery"
            render={({ field }) => (
              <FormItem className="relative flex-1 space-y-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <FormControl>
                  <Input
                    placeholder="Buscar por nombre o codigo..."
                    className="pl-9"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={filtersForm.control}
            name="categoryFilter"
            render={({ field }) => (
              <FormItem className="w-full space-y-0 sm:w-48">
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorias</SelectItem>
                    {CATEGORY_OPTIONS.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </Form>
      </div>

      {/* Products - Table on desktop, Cards on mobile */}
      <ScrollArea className="flex-1">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            No se encontraron productos
          </div>
        ) : (
          <>
            {/* Mobile: Card layout */}
            <div className="flex flex-col gap-3 md:hidden">
              {products.map((product) => (
                <Card key={product.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {product.name.startsWith("Producto sin nombre") ? (
                          <p className="text-sm text-amber-600">
                            <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                            Sin nombre - requiere registro
                          </p>
                        ) : (
                          <p className="text-sm font-medium text-foreground">
                            {product.name}
                          </p>
                        )}
                        {product.barcode && (
                          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                            {product.barcode}
                          </p>
                        )}
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {product.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Venta: {formatDate(product.lastSoldAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-base font-bold text-foreground">
                          {formatCurrency(product.price)}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(product)}
                            disabled={isPending}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDelete(product)}
                            disabled={isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop: Table layout */}
            <div className="hidden rounded-md border md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codigo</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="text-right">Precio de venta</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Ultima venta</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono text-sm">
                        {product.barcode || (
                          <span className="text-muted-foreground">Sin codigo</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.name.startsWith("Producto sin nombre") ? (
                          <span className="text-amber-600">
                            <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                            Sin nombre - requiere registro
                          </span>
                        ) : (
                          <span className="font-medium text-foreground">
                            {product.name}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-foreground">
                        {formatCurrency(product.price)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(product.lastSoldAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(product)}
                            disabled={isPending}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDelete(product)}
                            disabled={isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </ScrollArea>

      {/* Product form dialog */}
      <ProductFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        product={editingProduct}
        onSuccess={invalidateQueries}
      />
    </div>
  );
}
