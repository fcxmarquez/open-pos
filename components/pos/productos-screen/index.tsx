"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Plus, Search } from "lucide-react";
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
import { SearchBar } from "@/components/pos/search-bar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Spinner } from "@/components/ui/spinner";
import { useIsMobile } from "@/components/ui/use-mobile";
import { CATEGORY_OPTIONS } from "@/lib/pos-form-schemas";
import type { Product } from "@/lib/store";
import { cn } from "@/lib/utils";
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

const SELECT_PAGE_BTN_BASE_CLS =
  "shrink-0 rounded-2xl border-[1.5px] px-4 text-sm font-medium text-foreground transition-colors duration-150";
const SELECT_PAGE_BTN_SELECTED_CLS = `${SELECT_PAGE_BTN_BASE_CLS} border-primary/20 bg-primary/[0.06] hover:border-primary/25 hover:bg-primary/[0.08] hover:text-foreground active:border-primary/30 active:bg-primary/[0.12] active:text-foreground`;
const SELECT_PAGE_BTN_DEFAULT_CLS = `${SELECT_PAGE_BTN_BASE_CLS} border-foreground/15 bg-card hover:border-foreground/20 hover:bg-muted/60 hover:text-foreground active:border-foreground/25 active:bg-muted active:text-foreground`;

export function ProductosScreen() {
  const isMobile = useIsMobile();
  const [showForm, setShowForm] = useState(false);
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
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
  const hasSelection = selectedCount > 0;
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
    setProductToDelete(product);
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
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-4 md:p-5">
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between">
        <Button
          onClick={() => {
            setEditingProduct(null);
            setShowForm(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Agregar producto
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {pendingCount > 0 && (
            <Badge variant="warning" size="compact">
              <AlertTriangle className="h-3 w-3" />
              {pendingCount} sin nombre
            </Badge>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <Form {...filtersForm}>
          <FormField
            control={filtersForm.control}
            name="searchQuery"
            render={({ field }) => (
              <FormItem className="flex-1 space-y-0">
                <SearchBar className="h-12">
                  <Search className="h-5 w-5 shrink-0 text-foreground" />
                  <FormControl>
                    <Input
                      placeholder="Buscar por nombre, codigo o PLU..."
                      className="h-full flex-1 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      {...field}
                    />
                  </FormControl>
                </SearchBar>
              </FormItem>
            )}
          />
          <div className="flex items-center gap-2">
            <FormField
              control={filtersForm.control}
              name="categoryFilter"
              render={({ field }) => (
                <FormItem className="flex-1 space-y-0 md:w-[200px] md:flex-none">
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="md:h-12 rounded-2xl border-[1.5px] border-foreground bg-card">
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
            {isMobile && products.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="default"
                className={
                  allSelectedOnPage
                    ? SELECT_PAGE_BTN_SELECTED_CLS
                    : SELECT_PAGE_BTN_DEFAULT_CLS
                }
                onClick={() => toggleSelectAllOnPage(!allSelectedOnPage)}
                disabled={isPending}
              >
                {allSelectedOnPage ? "Quitar seleccion" : "Seleccionar pagina"}
              </Button>
            )}
          </div>
        </Form>
      </div>

      <div
        className={cn(
          "overflow-hidden transition-[max-height,opacity,transform,margin] duration-200 ease-out",
          hasSelection
            ? "mb-4 max-h-40 translate-y-0 opacity-100"
            : "pointer-events-none mb-0 max-h-0 -translate-y-2 opacity-0"
        )}
        aria-hidden={!hasSelection}
      >
        <div className="flex flex-col gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              {selectedCount} producto{selectedCount === 1 ? "" : "s"} seleccionado
              {selectedCount === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              disabled={!hasSelection}
              onClick={() => setShowBulkEditDialog(true)}
            >
              Editar seleccionados
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!hasSelection}
              onClick={clearSelection}
            >
              Limpiar seleccion
            </Button>
          </div>
        </div>
      </div>

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
        hideMobilePaginationRow={isMobile && hasSelection}
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

      <AlertDialog
        open={!!productToDelete}
        onOpenChange={(open) => !open && setProductToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el producto
              &quot;{productToDelete?.name}&quot; de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                if (productToDelete) {
                  startTransition(async () => {
                    const result = await deleteProductAction({
                      id: productToDelete.id,
                    });
                    if (result.success) {
                      toast.success("Producto eliminado");
                      invalidateQueries();
                    } else {
                      toast.error(result.error);
                    }
                    setProductToDelete(null);
                  });
                }
              }}
            >
              {isPending && <Spinner className="mr-2" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
