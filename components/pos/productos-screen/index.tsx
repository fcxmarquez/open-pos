"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Plus, Search } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  bulkUpdateProducts as bulkUpdateProductsAction,
  deleteProduct as deleteProductAction,
} from "@/app/actions/products";
import {
  BulkEditDialog,
  type BulkProductUpdatesPayload,
} from "@/components/pos/bulk-edit-dialog";
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
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
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
  const selectedCount = selectedProductIds.size;
  const selectedOnPageCount = products.reduce(
    (count, product) => count + (selectedProductIds.has(product.id) ? 1 : 0),
    0
  );
  const allSelectedOnPage =
    products.length > 0 && selectedOnPageCount === products.length;
  const someSelectedOnPage = selectedOnPageCount > 0 && !allSelectedOnPage;

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, setPage, totalPages]);

  useEffect(() => {
    setSelectedProductIds((previousSelection) => {
      if (previousSelection.size === 0) {
        return previousSelection;
      }

      const currentPageIds = new Set(products.map((product) => product.id));
      const filteredSelection = new Set(
        [...previousSelection].filter((id) => currentPageIds.has(id))
      );

      if (filteredSelection.size === previousSelection.size) {
        return previousSelection;
      }

      return filteredSelection;
    });
  }, [products]);

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

  const clearSelection = () => {
    setSelectedProductIds(new Set());
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((previousSelection) => {
      const nextSelection = new Set(previousSelection);

      if (nextSelection.has(productId)) {
        nextSelection.delete(productId);
      } else {
        nextSelection.add(productId);
      }

      return nextSelection;
    });
  };

  const toggleSelectAllOnPage = (checked: boolean) => {
    if (!checked) {
      const pageIds = new Set(products.map((product) => product.id));
      setSelectedProductIds(
        (prev) => new Set([...prev].filter((id) => !pageIds.has(id)))
      );
      return;
    }

    setSelectedProductIds(
      (prev) => new Set([...prev, ...products.map((product) => product.id)])
    );
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

  const handleBulkApply = async (updates: BulkProductUpdatesPayload) => {
    if (selectedCount === 0) {
      toast.error("Selecciona al menos un producto");
      return false;
    }

    const result = await bulkUpdateProductsAction({
      ids: Array.from(selectedProductIds),
      updates,
    });

    if (!result.success) {
      toast.error(result.error);
      return false;
    }

    toast.success(
      result.data.updatedCount === 1
        ? "1 producto actualizado"
        : `${result.data.updatedCount} productos actualizados`
    );
    invalidateQueries();
    clearSelection();
    return true;
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
            Página {page} de {totalPages}
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
                    placeholder="Buscar por nombre, codigo o PLU..."
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

      {isMobile && products.length > 0 && (
        <div className="mb-3 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => toggleSelectAllOnPage(!allSelectedOnPage)}
            disabled={isPending}
          >
            {allSelectedOnPage ? "Deseleccionar pagina" : "Seleccionar pagina"}
          </Button>
        </div>
      )}

      {selectedCount > 0 && (
        <div className="mb-4 flex flex-col gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              {selectedCount} producto{selectedCount === 1 ? "" : "s"} seleccionado
              {selectedCount === 1 ? "" : "s"}
            </p>
            <p className="text-xs text-muted-foreground">Solo productos de esta pagina</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={() => setShowBulkEditDialog(true)}>
              Editar seleccionados
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={clearSelection}>
              Limpiar seleccion
            </Button>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            No se encontraron productos
          </div>
        ) : (
          <ProductsList
            allSelectedOnPage={allSelectedOnPage}
            isMobile={isMobile}
            isPending={isPending}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onToggleProductSelection={toggleProductSelection}
            onToggleSelectAllPage={toggleSelectAllOnPage}
            products={products}
            selectedProductIds={selectedProductIds}
            someSelectedOnPage={someSelectedOnPage}
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
      <BulkEditDialog
        open={showBulkEditDialog}
        onOpenChange={setShowBulkEditDialog}
        selectedCount={selectedCount}
        onApply={handleBulkApply}
      />
    </div>
  );
}
