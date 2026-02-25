"use client";

import { create } from "zustand";

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
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  updateCartItemPrice: (productId: string, price: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
}

export const useStore = create<PosStore>()((set, get) => ({
  cart: [],

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
    set((state) => ({
      cart: state.cart.filter((item) => item.product.id !== productId),
    }));
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

  clearCart: () => set({ cart: [] }),

  getCartTotal: () => {
    return get().cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  },
}));
