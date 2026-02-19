"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Minus, Plus, Search, ShoppingBag, Trash2, X, Zap } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  getFrequentProducts,
  getProductByBarcode,
  searchProducts as searchProductsQuery,
} from "@/app/actions/product-queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type Product, useStore } from "@/lib/store";
import { cn, formatCurrency } from "@/lib/utils";
import { CheckoutDialog } from "./checkout-dialog";
import { QuickSaleDialog } from "./quick-sale-dialog";
import { UnregisteredProductSheet } from "./unregistered-product-sheet";

type DbProduct = Awaited<ReturnType<typeof getFrequentProducts>>[number];

function dbProductToStoreProduct(p: DbProduct): Product {
  return {
    id: p.id,
    barcode: p.barcode ?? "",
    name: p.name ?? "Sin nombre",
    price: Number(p.price),
    category: (p.category as Product["category"]) ?? "General",
    createdAt: p.createdAt.toISOString(),
  };
}

export function VentasScreen() {
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showUnregistered, setShowUnregistered] = useState(false);
  const [unregisteredBarcode, setUnregisteredBarcode] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [showQuickSale, setShowQuickSale] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const cart = useStore((s) => s.cart);
  const addToCart = useStore((s) => s.addToCart);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const updateCartQuantity = useStore((s) => s.updateCartQuantity);
  const clearCart = useStore((s) => s.clearCart);
  const getCartTotal = useStore((s) => s.getCartTotal);

  const cartTotal = getCartTotal();
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const queryClient = useQueryClient();
  const { data: frequentProducts = [] } = useQuery({
    queryKey: ["frequent-products"],
    queryFn: async () => {
      const products = await getFrequentProducts();
      return products.map(dbProductToStoreProduct);
    },
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = searchValue.trim();
    if (!value) return;

    setIsSubmitting(true);

    try {
      // First try exact barcode match
      const product = await getProductByBarcode(value);
      if (product) {
        addToCart(dbProductToStoreProduct(product));
        toast.success(`${product.name ?? "Producto"} agregado`);
        setSearchValue("");
        setSearchResults([]);
        focusInput();
        return;
      }

      // Try name search
      const results = await searchProductsQuery(value);
      if (results.length === 1) {
        const p = dbProductToStoreProduct(results[0]);
        addToCart(p);
        toast.success(`${p.name} agregado`);
        setSearchValue("");
        setSearchResults([]);
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
      setSearchValue("");
      setSearchResults([]);
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
    queryClient.invalidateQueries({ queryKey: ["frequent-products"] });
  };

  // Shared cart content component
  const cartContent = (
    <>
      {/* Cart items */}
      <ScrollArea className="flex-1">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <ShoppingBag className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Escanea un producto para comenzar
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
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatCurrency(item.product.price)} c/u
                  </p>
                  {/* Quantity controls */}
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 bg-transparent"
                      onClick={() =>
                        updateCartQuantity(item.product.id, item.quantity - 1)
                      }
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
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(item.product.price * item.quantity)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => removeFromCart(item.product.id)}
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
      <div className="border-t bg-muted/30 px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-base font-semibold text-foreground">Total</span>
          <span className="text-2xl font-bold text-foreground">
            {formatCurrency(cartTotal)}
          </span>
        </div>
        <Button
          size="lg"
          className="mb-2 w-full bg-accent text-accent-foreground text-base font-semibold hover:bg-accent/90"
          disabled={cart.length === 0}
          onClick={() => {
            setShowCheckout(true);
            setMobileCartOpen(false);
          }}
        >
          Cobrar (F2)
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground hover:text-destructive"
          disabled={cart.length === 0}
          onClick={handleCancelSale}
        >
          Cancelar venta
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Left column - Product entry */}
      <div className="flex flex-1 flex-col overflow-hidden border-b p-4 lg:border-b-0 lg:border-r lg:p-5">
        {/* Barcode input */}
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="relative">
            {isSubmitting ? (
              <Loader2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : (
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            )}
            <Input
              ref={inputRef}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Escanear codigo o buscar..."
              className="animate-pulse-ring h-12 pl-10 text-base"
              autoFocus
              disabled={isSubmitting}
            />
          </div>
        </form>

        {/* Search results dropdown */}
        {searchValue.length >= 2 && searchResults.length > 1 && (
          <div className="mb-4 max-h-48 overflow-auto rounded-md border bg-card shadow-md">
            {isSearching && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {searchResults.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => {
                  addToCart(p);
                  toast.success(`${p.name} agregado`);
                  setSearchValue("");
                  setSearchResults([]);
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

        {/* Quick sale button */}
        <div className="mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQuickSale(true)}
            className="bg-transparent text-sm"
          >
            <Zap className="mr-1.5 h-4 w-4" />
            Venta rapida (F4)
          </Button>
        </div>

        {/* Frequent products grid */}
        <div className="flex-1 overflow-auto">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Productos frecuentes
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
            {frequentProducts.map((product) => (
              <button
                type="button"
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="flex flex-col items-start rounded-lg border bg-card p-2.5 text-left transition-all hover:border-primary/40 hover:shadow-sm active:scale-[0.98] sm:p-3"
              >
                <span className="text-xs font-medium leading-snug text-foreground sm:text-sm">
                  {product.name}
                </span>
                <span className="mt-auto pt-1.5 text-sm font-bold text-primary sm:pt-2 sm:text-base">
                  {formatCurrency(product.price)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile cart toggle button - fixed at bottom on small screens */}
      <div className="border-t bg-card p-3 lg:hidden">
        <Button
          className="w-full bg-primary text-primary-foreground"
          onClick={() => setMobileCartOpen(true)}
        >
          <ShoppingBag className="mr-2 h-4 w-4" />
          Ver carrito
          {cartItemCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 bg-primary-foreground/20 text-primary-foreground"
            >
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
          className="fixed inset-0 z-30 bg-foreground/40 lg:hidden"
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
          "fixed inset-x-0 bottom-0 z-40 flex max-h-[85vh] flex-col rounded-t-xl bg-card shadow-xl transition-transform duration-300 lg:hidden",
          mobileCartOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Cart header */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-foreground" />
            <h3 className="text-base font-semibold text-foreground">Venta actual</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {cartItemCount} {cartItemCount === 1 ? "articulo" : "articulos"}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMobileCartOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {cartContent}
      </div>

      {/* Desktop cart sidebar - hidden on mobile */}
      <div className="hidden w-[380px] flex-col bg-card lg:flex xl:w-[420px]">
        {/* Cart header */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-foreground" />
            <h3 className="text-base font-semibold text-foreground">Venta actual</h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            {cartItemCount} {cartItemCount === 1 ? "articulo" : "articulos"}
          </Badge>
        </div>
        {cartContent}
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
