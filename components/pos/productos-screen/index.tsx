"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Plus, Search } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteProduct as deleteProductAction } from "@/app/actions/products";
import { ProductFormDialog } from "@/components/pos/product-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useIsMobile } from "@/components/ui/use-mobile";
import { CATEGORY_OPTIONS } from "@/lib/pos-form-schemas";
import type { Product } from "@/lib/store";
import { ProductsList } from "./products-list";
import { ProductsPagination } from "./products-pagination";
import {
  PRODUCTS_PAGE_SIZE,
  pendingProductsQueryKey,
  pendingProductsQueryOptions,
  productsQueryKey,
  productsQueryOptions,
} from "./query";
import { useProductosRouteFilters } from "./use-productos-route-filters";

export function ProductosScreen() {
  const isMobile = useIsMobile();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isPending, startTransition] = useTransition();
  const { filtersForm, categoryFilter, normalizedSearch, page, setPage } =
    useProductosRouteFilters();
  const queryClient = useQueryClient();
  const selectedCategory = categoryFilter === "all" ? undefined : categoryFilter;

  const queryOpts = {
    search: normalizedSearch || undefined,
    category: selectedCategory,
    page,
    pageSize: PRODUCTS_PAGE_SIZE,
  };

  const {
    data: productsPage,
    isLoading,
    isFetching,
  } = useQuery(productsQueryOptions(queryOpts));
  const { data: pendingCount = 0 } = useQuery(pendingProductsQueryOptions());
  const products = productsPage?.products ?? [];
  const totalProducts = productsPage?.total ?? 0;
  const totalPages = productsPage?.totalPages ?? 1;
  const hasPreviousPage = productsPage?.hasPreviousPage ?? false;
  const hasNextPage = productsPage?.hasNextPage ?? false;
  const pageSize = productsPage?.pageSize ?? PRODUCTS_PAGE_SIZE;

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, setPage, totalPages]);

  useEffect(() => {
    if (!hasNextPage) {
      return;
    }

    void queryClient.prefetchQuery(
      productsQueryOptions({
        search: normalizedSearch || undefined,
        category: selectedCategory,
        page: page + 1,
        pageSize,
      })
    );
  }, [hasNextPage, normalizedSearch, page, pageSize, queryClient, selectedCategory]);

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
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {totalProducts} productos
          </Badge>
          <Badge variant="outline" className="text-sm">
            Pagina {page} de {totalPages}
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

      <ScrollArea className="flex-1">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            No se encontraron productos
          </div>
        ) : (
          <ProductsList
            isMobile={isMobile}
            isPending={isPending}
            onDelete={handleDelete}
            onEdit={handleEdit}
            products={products}
          />
        )}
      </ScrollArea>

      <ProductsPagination
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        isFetching={isFetching}
        onNext={() => setPage((currentPage) => currentPage + 1)}
        onPrevious={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        totalProducts={totalProducts}
      />

      <ProductFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        product={editingProduct}
        onSuccess={invalidateQueries}
      />
    </div>
  );
}
