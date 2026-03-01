"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Pencil, Plus, Search, ShoppingBag, Trash2, X, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  getProductByBarcode,
  getProductByPluCode,
  searchProducts as searchProductsQuery,
} from "@/app/actions/product-queries";
import { CheckoutDialog } from "@/components/pos/checkout-dialog";
import { QuickSaleDialog } from "@/components/pos/quick-sale-dialog";
import { SearchBar } from "@/components/pos/search-bar";
import { UnregisteredProductSheet } from "@/components/pos/unregistered-product-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { CATEGORY_COLOR_MAP } from "@/lib/category-colors";
import { dbProductToStoreProduct } from "@/lib/mappers";
import { ventasSearchFormDefaults, ventasSearchFormSchema } from "@/lib/pos-form-schemas";
import { type Product, useStore } from "@/lib/store";
import { cn, formatCurrency } from "@/lib/utils";
import { frequentProductsQueryKey, frequentProductsQueryOptions } from "./query";

const PLU_CODE_REGEX = /^\d{4}$/;

function CartHeader({
  cartItemCount,
  onClose,
}: {
  cartItemCount: number;
  onClose?: () => void;
}) {
  return (
    <div className="flex h-14 items-center border-b px-5">
      <ShoppingBag className="h-5 w-5 shrink-0 text-foreground" />
      <h3 className="ml-2 text-base font-extrabold text-foreground">Venta actual</h3>
      <div className="flex-1" />
      <Badge variant="muted" size="chip" className="border-foreground px-2.5 py-1">
        {cartItemCount} {cartItemCount === 1 ? "artículo" : "artículos"}
      </Badge>
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="ml-2 h-8 w-8"
          onClick={onClose}
          aria-label="Cerrar carrito"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Cerrar carrito</span>
        </Button>
      )}
    </div>
  );
}

export function VentasScreen() {
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showUnregistered, setShowUnregistered] = useState(false);
  const [unregisteredBarcode, setUnregisteredBarcode] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [showQuickSale, setShowQuickSale] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const searchForm = useForm({
    resolver: zodResolver(ventasSearchFormSchema),
    defaultValues: ventasSearchFormDefaults,
  });
  const searchValue = searchForm.watch("searchValue");

  const cart = useStore((s) => s.cart);
  const addToCart = useStore((s) => s.addToCart);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const updateCartQuantity = useStore((s) => s.updateCartQuantity);
  const updateCartItemPrice = useStore((s) => s.updateCartItemPrice);
  const clearCart = useStore((s) => s.clearCart);
  const getCartTotal = useStore((s) => s.getCartTotal);

  const cartTotal = getCartTotal();
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const queryClient = useQueryClient();
  const { data: frequentProducts = [] } = useQuery(frequentProductsQueryOptions());

  const focusInput = useCallback(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Auto focus on mount
  useEffect(() => {
    focusInput();
  }, [focusInput]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F2" || (e.ctrlKey && e.key === "Enter")) {
        e.preventDefault();
        if (cart.length > 0) setShowCheckout(true);
      }
      if (e.key === "F4") {
        e.preventDefault();
        setShowQuickSale(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cart.length]);

  // Debounced search as user types
  useEffect(() => {
    if (searchValue.length < 2) {
      setSearchResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setIsSearching(true);
      startTransition(async () => {
        try {
          const results = await searchProductsQuery(searchValue);
          setSearchResults(results.map(dbProductToStoreProduct));
        } catch {
          // Silently fail on search
        } finally {
          setIsSearching(false);
        }
      });
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchValue]);

  const clearSearch = () => {
    searchForm.reset(ventasSearchFormDefaults);
    setSearchResults([]);
  };

  const handleSubmit = async ({
    searchValue: submittedValue,
  }: {
    searchValue: string;
  }) => {
    const value = submittedValue.trim();
    if (!value) return;

    setIsSubmitting(true);

    try {
      // First try exact barcode match
      const product = await getProductByBarcode(value);
      if (product) {
        addToCart(dbProductToStoreProduct(product));
        toast.success(`${product.name ?? "Producto"} agregado`);
        clearSearch();
        focusInput();
        return;
      }

      if (PLU_CODE_REGEX.test(value)) {
        const pluProduct = await getProductByPluCode(value);
        if (pluProduct) {
          addToCart(dbProductToStoreProduct(pluProduct));
          toast.success(`${pluProduct.name ?? "Producto"} agregado`);
          clearSearch();
          focusInput();
          return;
        }
      }

      // Try name search
      const results = await searchProductsQuery(value);
      if (results.length === 1) {
        const p = dbProductToStoreProduct(results[0]);
        addToCart(p);
        toast.success(`${p.name} agregado`);
        clearSearch();
        focusInput();
        return;
      }

      if (results.length > 1) {
        setSearchResults(results.map(dbProductToStoreProduct));
        return;
      }

      // No match - open unregistered product sheet
      setUnregisteredBarcode(value);
      setShowUnregistered(true);
      clearSearch();
    } catch {
      toast.error("Error al buscar el producto");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductClick = (product: Product) => {
    addToCart(product);
    toast.success(`${product.name} agregado`);
    focusInput();
  };

  const handleCancelSale = () => {
    if (cart.length === 0) return;
    if (
      window.confirm(
        "Cancelar la venta actual? Se perderan todos los productos del carrito."
      )
    ) {
      clearCart();
      toast.info("Venta cancelada");
      focusInput();
    }
  };

  const handleSaleComplete = () => {
    focusInput();
    queryClient.invalidateQueries({ queryKey: frequentProductsQueryKey });
  };

  // Shared cart content component
  const cartContent = (
    <>
      {/* Cart items */}
      <ScrollArea className="flex-1">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <ShoppingBag className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-xs font-semibold text-muted-foreground">
              Escanea o busca un producto para iniciar
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Los artículos aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="divide-y px-4">
            {cart.map((item) => (
              <div key={item.product.id} className="flex items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug text-foreground">
                    {item.product.name}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Precio</span>
                    {editingPriceId === item.product.id ? (
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateCartItemPrice(
                            item.product.id,
                            Number.parseFloat(e.target.value) || 0
                          )
                        }
                        onBlur={() => setEditingPriceId(null)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === "Escape")
                            setEditingPriceId(null);
                        }}
                        onFocus={(e) => e.target.select()}
                        className="h-7 w-24 text-sm"
                        min="0"
                        step="1"
                        autoFocus
                      />
                    ) : (
                      <>
                        <span className="text-xs text-foreground">
                          ${item.unitPrice.toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-muted-foreground hover:text-foreground"
                          onClick={() => setEditingPriceId(item.product.id)}
                          aria-label={`Editar precio de ${item.product.name}`}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                  {/* Quantity controls */}
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 bg-transparent"
                      onClick={() =>
                        updateCartQuantity(item.product.id, item.quantity - 1)
                      }
                      aria-label={`Disminuir cantidad de ${item.product.name}`}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateCartQuantity(
                          item.product.id,
                          parseInt(e.target.value, 10) || 0
                        )
                      }
                      onFocus={(e) => e.target.select()}
                      className="h-7 w-12 text-center text-sm"
                      min="1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 bg-transparent"
                      onClick={() =>
                        updateCartQuantity(item.product.id, item.quantity + 1)
                      }
                      aria-label={`Aumentar cantidad de ${item.product.name}`}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-semibold text-foreground">
                    {`$${(item.unitPrice * item.quantity).toFixed(2)}`}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => removeFromCart(item.product.id)}
                    aria-label={`Eliminar ${item.product.name} del carrito`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Cart footer */}
      <div className="px-5 py-4">
        <div className="mb-3 flex items-center justify-between rounded-xl bg-muted px-3 py-2.5">
          <span className="text-sm font-bold text-foreground">Total</span>
          <span className="text-4xl font-extrabold leading-none tracking-[-1px] text-foreground">
            {formatCurrency(cartTotal)}
          </span>
        </div>
        <Button
          size="lg"
          className="mb-2 w-full"
          disabled={cart.length === 0}
          onClick={() => {
            setShowCheckout(true);
            setMobileCartOpen(false);
          }}
        >
          Cobrar (F2) →
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          disabled={cart.length === 0}
          onClick={handleCancelSale}
        >
          Cancelar venta
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* Left column - Product entry */}
      <div className="flex flex-1 flex-col overflow-hidden border-b p-4 md:border-b-0 md:p-5">
        {/* Barcode input */}
        <Form {...searchForm}>
          <form onSubmit={searchForm.handleSubmit(handleSubmit)} className="mb-4">
            <FormField
              control={searchForm.control}
              name="searchValue"
              render={({ field }) => {
                const { ref, ...fieldProps } = field;

                return (
                  <FormItem className="space-y-0">
                    <SearchBar animated className="h-12">
                      {isSubmitting ? (
                        <Spinner className="h-5 w-5 shrink-0 text-foreground" />
                      ) : (
                        <Search className="h-5 w-5 shrink-0 text-foreground" />
                      )}
                      <FormControl>
                        <Input
                          ref={(element) => {
                            ref(element);
                            inputRef.current = element;
                          }}
                          placeholder="Busca o escanea un producto..."
                          className="h-full flex-1 border-0 bg-transparent p-0 text-sm font-medium shadow-none placeholder:font-medium placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                          autoFocus
                          disabled={isSubmitting}
                          {...fieldProps}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        onClick={() => setShowQuickSale(true)}
                        size="sm"
                        className="shrink-0"
                        aria-label="Venta rápida"
                      >
                        <Zap className="h-3.5 w-3.5" />
                        <span className="hidden text-xs font-semibold md:inline">
                          Venta rápida (F4)
                        </span>
                      </Button>
                    </SearchBar>
                  </FormItem>
                );
              }}
            />
          </form>
        </Form>

        {/* Search results dropdown */}
        {searchValue.length >= 2 && searchResults.length > 1 && (
          <div className="mb-4 max-h-48 overflow-auto rounded-md border bg-card shadow-md">
            {isSearching && (
              <div className="flex items-center justify-center py-2">
                <Spinner />
              </div>
            )}
            {searchResults.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => {
                  addToCart(p);
                  toast.success(`${p.name} agregado`);
                  clearSearch();
                  focusInput();
                }}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted"
              >
                <div>
                  <span className="font-medium text-foreground">{p.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{p.barcode}</span>
                </div>
                <span className="font-semibold text-foreground">
                  {formatCurrency(p.price)}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Frequent products grid */}
        <div className="flex-1 overflow-auto">
          <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.8px] text-foreground">
            Productos frecuentes
          </h3>
          <div className="grid grid-cols-2 gap-[10px] md:grid-cols-4">
            {frequentProducts.map((product) => (
              <button
                type="button"
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="flex h-[100px] flex-row items-stretch overflow-hidden rounded-2xl border bg-card text-left transition-all hover:border-primary/40 hover:shadow-sm active:scale-[0.98]"
              >
                <div
                  className="w-1.5 shrink-0"
                  style={{ background: CATEGORY_COLOR_MAP[product.category] }}
                />
                <div className="flex flex-1 flex-col justify-between gap-2 p-3.5">
                  <span className="line-clamp-2 text-[13px] font-semibold uppercase leading-tight text-product-title">
                    {product.name}
                  </span>
                  <span className="text-xl font-extrabold tracking-[-0.5px] text-foreground">
                    {formatCurrency(product.price)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile cart toggle button - fixed at bottom on small screens */}
      <div className="border-t bg-card p-3 md:hidden">
        <Button className="w-full" onClick={() => setMobileCartOpen(true)}>
          <ShoppingBag className="mr-2 h-4 w-4" />
          Ver carrito
          {cartItemCount > 0 && (
            <Badge variant="inverted" size="chip" className="ml-2 rounded-full">
              {cartItemCount}
            </Badge>
          )}
          <span className="ml-auto font-bold">{formatCurrency(cartTotal)}</span>
        </Button>
      </div>

      {/* Mobile cart overlay */}
      {mobileCartOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-foreground/40 md:hidden"
          onClick={() => setMobileCartOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setMobileCartOpen(false);
          }}
          aria-label="Cerrar carrito"
        />
      )}

      {/* Mobile cart drawer (slides up from bottom) */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 flex max-h-[85vh] flex-col rounded-t-xl bg-card shadow-xl transition-transform duration-300 md:hidden",
          mobileCartOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        <CartHeader
          cartItemCount={cartItemCount}
          onClose={() => setMobileCartOpen(false)}
        />
        {cartContent}
      </div>

      {/* Desktop cart sidebar - hidden on mobile */}
      <div className="hidden py-3 md:flex">
        <div className="flex w-[380px] flex-col overflow-hidden rounded-3xl border bg-card">
          <CartHeader cartItemCount={cartItemCount} />
          {cartContent}
        </div>
      </div>

      {/* Unregistered product sheet */}
      <UnregisteredProductSheet
        open={showUnregistered}
        onOpenChange={(open) => {
          setShowUnregistered(open);
          if (!open) focusInput();
        }}
        barcode={unregisteredBarcode}
        onComplete={focusInput}
      />

      {/* Checkout dialog */}
      <CheckoutDialog
        open={showCheckout}
        onOpenChange={(open) => {
          setShowCheckout(open);
          if (!open) focusInput();
        }}
        onComplete={handleSaleComplete}
      />

      {/* Quick sale dialog */}
      <QuickSaleDialog
        open={showQuickSale}
        onOpenChange={(open) => {
          setShowQuickSale(open);
          if (!open) focusInput();
        }}
        onComplete={focusInput}
      />
    </div>
  );
}
