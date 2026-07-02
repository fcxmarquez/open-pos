"use client";

import { create } from "zustand";
import { clampDiscountPercent, computeDiscountBreakdown } from "@/lib/discount";

export type Category =
  | "General"
  | "Papelería"
  | "Útiles escolares"
  | "Arte"
  | "Oficina"
  | "Escritura"
  | "Cuadernos"
  | "Papel"
  | "Adhesivos"
  | "Colores y Dibujo"
  | "Corrección"
  | "Corte y Medición"
  | "Cintas"
  | "Notas Adhesivas"
  | "Otro";

export interface Product {
  id: string;
  barcode: string;
  pluCode?: string;
  name: string;
  price: number;
  category: Category;
  costPrice?: number;
  lastSoldAt?: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
}

interface PosStore {
  cart: CartItem[];
  discountPercent: number;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  updateCartItemPrice: (productId: string, price: number) => void;
  setDiscountPercent: (percent: number) => void;
  clearCart: () => void;
  getCartSubtotal: () => number;
  getDiscountBreakdown: () => ReturnType<typeof computeDiscountBreakdown>;
  getDiscountAmount: () => number;
  getCartTotal: () => number;
}

export const useStore = create<PosStore>()((set, get) => ({
  cart: [],
  discountPercent: 0,

  addToCart: (product, quantity = 1) => {
    set((state) => {
      const existing = state.cart.find((item) => item.product.id === product.id);
      if (existing) {
        return {
          cart: state.cart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
        };
      }
      return {
        cart: [...state.cart, { product, quantity, unitPrice: product.price }],
      };
    });
  },

  removeFromCart: (productId) => {
    set((state) => {
      const cart = state.cart.filter((item) => item.product.id !== productId);
      // cart-percentage-discount.DISCOUNT_INPUT.4 — an empty cart can't carry a discount
      return cart.length === 0 ? { cart, discountPercent: 0 } : { cart };
    });
  },

  updateCartQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    set((state) => ({
      cart: state.cart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      ),
    }));
  },

  updateCartItemPrice: (productId, price) => {
    if (!Number.isFinite(price) || price < 0) {
      return;
    }
    set((state) => ({
      cart: state.cart.map((item) =>
        item.product.id === productId ? { ...item, unitPrice: price } : item
      ),
    }));
  },

  // cart-percentage-discount.RULES.1, cart-percentage-discount.RULES.2, cart-percentage-discount.RULES.3
  setDiscountPercent: (percent) => {
    set({ discountPercent: clampDiscountPercent(percent) });
  },

  // cart-percentage-discount.DISCOUNT_INPUT.4 — resets alongside the cart on clear/cancel
  clearCart: () => set({ cart: [], discountPercent: 0 }),

  getCartSubtotal: () => {
    return get().cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  },

  // cart-percentage-discount.CART_TOTALS.5 — always derived from the current subtotal
  getDiscountBreakdown: () => {
    const { getCartSubtotal, discountPercent } = get();
    return computeDiscountBreakdown(getCartSubtotal(), discountPercent);
  },

  getDiscountAmount: () => get().getDiscountBreakdown().discountAmount,

  getCartTotal: () => get().getDiscountBreakdown().total,
}));
