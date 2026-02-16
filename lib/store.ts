"use client";

import { create } from "zustand";

// Types
export type Category =
  | "General"
  | "Papelería"
  | "Útiles escolares"
  | "Arte"
  | "Oficina"
  | "Otro";

export interface Product {
  id: string;
  barcode: string;
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
}

export interface Sale {
  id: string;
  items: CartItem[];
  total: number;
  payment: number;
  change: number;
  timestamp: string;
  date: string; // YYYY-MM-DD
}

export interface Reconciliation {
  id: string;
  date: string;
  systemTotal: number;
  countedTotal: number;
  difference: number;
  salesCount: number;
  itemsSold: number;
  closedAt: string;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function getYesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

const SEED_PRODUCTS: Omit<Product, "id" | "createdAt">[] = [
  {
    barcode: "7501000611072",
    name: "Cuaderno profesional 100 hojas",
    price: 45.0,
    category: "Papelería",
  },
  { barcode: "7501000611089", name: "Lápiz #2 HB", price: 5.0, category: "Papelería" },
  {
    barcode: "7501000611096",
    name: "Pluma azul punto medio",
    price: 8.5,
    category: "Papelería",
  },
  {
    barcode: "7501000611102",
    name: "Borrador blanco",
    price: 6.0,
    category: "Papelería",
  },
  {
    barcode: "7501000611119",
    name: "Sacapuntas metálico",
    price: 7.0,
    category: "Papelería",
  },
  {
    barcode: "7501000611126",
    name: "Regla 30cm transparente",
    price: 12.0,
    category: "Útiles escolares",
  },
  {
    barcode: "7501000611133",
    name: "Tijeras escolares",
    price: 25.0,
    category: "Útiles escolares",
  },
  {
    barcode: "7501000611140",
    name: "Pegamento en barra 20g",
    price: 15.0,
    category: "Útiles escolares",
  },
  {
    barcode: "7501000611157",
    name: "Marcadores colores (10 pzas)",
    price: 65.0,
    category: "Arte",
  },
  {
    barcode: "7501000611164",
    name: "Cinta adhesiva transparente",
    price: 18.0,
    category: "Oficina",
  },
  {
    barcode: "7501000611171",
    name: "Post-it notas 3x3",
    price: 35.0,
    category: "Oficina",
  },
  {
    barcode: "7501000611188",
    name: "Folder tamaño carta (paq 25)",
    price: 55.0,
    category: "Oficina",
  },
];

function createSeedProducts(): Product[] {
  return SEED_PRODUCTS.map((p) => ({
    ...p,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }));
}

function createSeedSales(products: Product[]): Sale[] {
  const yesterday = getYesterdayDate();
  const sales: Sale[] = [
    {
      id: generateId(),
      items: [
        { product: products[0], quantity: 2 },
        { product: products[1], quantity: 3 },
      ],
      total: 105.0,
      payment: 120.0,
      change: 15.0,
      timestamp: `${yesterday}T09:30:00`,
      date: yesterday,
    },
    {
      id: generateId(),
      items: [
        { product: products[8], quantity: 1 },
        { product: products[7], quantity: 2 },
      ],
      total: 95.0,
      payment: 100.0,
      change: 5.0,
      timestamp: `${yesterday}T11:15:00`,
      date: yesterday,
    },
    {
      id: generateId(),
      items: [
        { product: products[10], quantity: 1 },
        { product: products[9], quantity: 1 },
        { product: products[11], quantity: 1 },
      ],
      total: 108.0,
      payment: 110.0,
      change: 2.0,
      timestamp: `${yesterday}T14:45:00`,
      date: yesterday,
    },
    {
      id: generateId(),
      items: [
        { product: products[5], quantity: 1 },
        { product: products[6], quantity: 1 },
      ],
      total: 37.0,
      payment: 50.0,
      change: 13.0,
      timestamp: `${yesterday}T16:20:00`,
      date: yesterday,
    },
  ];
  return sales;
}

function createSeedReconciliations(): Reconciliation[] {
  const yesterday = getYesterdayDate();
  return [
    {
      id: generateId(),
      date: yesterday,
      systemTotal: 345.0,
      countedTotal: 345.0,
      difference: 0,
      salesCount: 4,
      itemsSold: 11,
      closedAt: `${yesterday}T18:00:00`,
    },
  ];
}

// Helper to load persisted state from localStorage
const STORAGE_KEY = "papeleria-pos-storage";

interface PersistedState {
  products: Product[];
  sales: Sale[];
  reconciliations: Reconciliation[];
}

function loadPersistedState(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as PersistedState;
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

function saveState(state: PersistedState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

function getInitialData(): PersistedState & { _initialized: boolean } {
  const persisted = loadPersistedState();
  if (persisted && persisted.products.length > 0) {
    return { ...persisted, _initialized: true };
  }
  const products = createSeedProducts();
  const sales = createSeedSales(products);
  const reconciliations = createSeedReconciliations();
  const data = { products, sales, reconciliations };
  saveState(data);
  return { ...data, _initialized: true };
}

// Store interface
interface PosStore {
  // Products
  products: Product[];
  addProduct: (product: Omit<Product, "id" | "createdAt">) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  findProductByBarcode: (barcode: string) => Product | undefined;
  searchProducts: (query: string) => Product[];

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;

  // Sales
  sales: Sale[];
  completeSale: (payment: number) => Sale;
  getTodaySales: () => Sale[];
  getTodayTotal: () => number;

  // Reconciliations
  reconciliations: Reconciliation[];
  addReconciliation: (countedTotal: number) => void;

  // Initialization
  _initialized: boolean;
}

const initial =
  typeof window !== "undefined"
    ? getInitialData()
    : { products: [], sales: [], reconciliations: [], _initialized: false };

export const useStore = create<PosStore>()((set, get) => ({
  _initialized: initial._initialized,
  products: initial.products,
  cart: [],
  sales: initial.sales,
  reconciliations: initial.reconciliations,

  addProduct: (productData) => {
    const newProduct: Product = {
      ...productData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const next = { products: [...state.products, newProduct] };
      saveState({
        products: next.products,
        sales: state.sales,
        reconciliations: state.reconciliations,
      });
      return next;
    });
    return newProduct;
  },

  updateProduct: (id, updates) => {
    set((state) => {
      const products = state.products.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      );
      saveState({ products, sales: state.sales, reconciliations: state.reconciliations });
      return { products };
    });
  },

  deleteProduct: (id) => {
    set((state) => {
      const products = state.products.filter((p) => p.id !== id);
      saveState({ products, sales: state.sales, reconciliations: state.reconciliations });
      return { products };
    });
  },

  findProductByBarcode: (barcode) => {
    return get().products.find((p) => p.barcode === barcode);
  },

  searchProducts: (query) => {
    const q = query.toLowerCase();
    return get().products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.barcode.includes(q)
    );
  },

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
        cart: [...state.cart, { product, quantity }],
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

  clearCart: () => set({ cart: [] }),

  getCartTotal: () => {
    return get().cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  },

  completeSale: (payment) => {
    const state = get();
    const total = state.getCartTotal();
    const now = new Date();

    const soldProductIds = state.cart.map((item) => item.product.id);

    const sale: Sale = {
      id: generateId(),
      items: [...state.cart],
      total,
      payment,
      change: payment - total,
      timestamp: now.toISOString(),
      date: getTodayDate(),
    };

    set((prev) => {
      const sales = [...prev.sales, sale];
      const products = prev.products.map((p) =>
        soldProductIds.includes(p.id) ? { ...p, lastSoldAt: now.toISOString() } : p
      );
      saveState({ products, sales, reconciliations: prev.reconciliations });
      return { sales, cart: [], products };
    });

    return sale;
  },

  getTodaySales: () => {
    const today = getTodayDate();
    return get().sales.filter((s) => s.date === today);
  },

  getTodayTotal: () => {
    const today = getTodayDate();
    return get()
      .sales.filter((s) => s.date === today)
      .reduce((sum, s) => sum + s.total, 0);
  },

  addReconciliation: (countedTotal) => {
    const state = get();
    const todaySales = state.getTodaySales();
    const systemTotal = todaySales.reduce((sum, s) => sum + s.total, 0);
    const itemsSold = todaySales.reduce(
      (sum, s) => sum + s.items.reduce((is, i) => is + i.quantity, 0),
      0
    );

    const reconciliation: Reconciliation = {
      id: generateId(),
      date: getTodayDate(),
      systemTotal,
      countedTotal,
      difference: countedTotal - systemTotal,
      salesCount: todaySales.length,
      itemsSold,
      closedAt: new Date().toISOString(),
    };

    set((prev) => {
      const reconciliations = [...prev.reconciliations, reconciliation];
      saveState({ products: prev.products, sales: prev.sales, reconciliations });
      return { reconciliations };
    });
  },
}));
