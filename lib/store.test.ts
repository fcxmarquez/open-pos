import { beforeEach, describe, expect, test } from "bun:test";
import type { Product } from "./store";
import { useStore } from "./store";

const productA: Product = {
  id: "prod-a",
  barcode: "0001",
  name: "Pluma Bic",
  price: 7,
  category: "Escritura",
  createdAt: new Date().toISOString(),
};

const productB: Product = {
  id: "prod-b",
  barcode: "0002",
  name: "Cuaderno",
  price: 5,
  category: "Cuadernos",
  createdAt: new Date().toISOString(),
};

beforeEach(() => {
  useStore.setState({ cart: [], discountPercent: 0 });
});

describe("removeFromCart", () => {
  test("cart-percentage-discount.DISCOUNT_INPUT.4 resets the discount once the last item is removed", () => {
    useStore.setState({
      cart: [{ product: productA, quantity: 1, unitPrice: 7 }],
      discountPercent: 15,
    });

    useStore.getState().removeFromCart(productA.id);

    expect(useStore.getState().cart).toHaveLength(0);
    expect(useStore.getState().discountPercent).toBe(0);
  });

  test("keeps the discount when other items remain in the cart", () => {
    useStore.setState({
      cart: [
        { product: productA, quantity: 1, unitPrice: 7 },
        { product: productB, quantity: 1, unitPrice: 5 },
      ],
      discountPercent: 15,
    });

    useStore.getState().removeFromCart(productA.id);

    expect(useStore.getState().cart).toHaveLength(1);
    expect(useStore.getState().discountPercent).toBe(15);
  });
});

describe("updateCartQuantity", () => {
  test("cart-percentage-discount.DISCOUNT_INPUT.4 resets the discount when quantity drops the cart to empty", () => {
    useStore.setState({
      cart: [{ product: productA, quantity: 1, unitPrice: 7 }],
      discountPercent: 20,
    });

    useStore.getState().updateCartQuantity(productA.id, 0);

    expect(useStore.getState().cart).toHaveLength(0);
    expect(useStore.getState().discountPercent).toBe(0);
  });
});

describe("setDiscountPercent", () => {
  test("cart-percentage-discount.RULES.1-2 clamps the stored value to 0-60", () => {
    useStore.getState().setDiscountPercent(85);
    expect(useStore.getState().discountPercent).toBe(60);

    useStore.getState().setDiscountPercent(-5);
    expect(useStore.getState().discountPercent).toBe(0);
  });
});

describe("clearCart", () => {
  test("cart-percentage-discount.DISCOUNT_INPUT.4 resets the cart and the discount together", () => {
    useStore.setState({
      cart: [{ product: productA, quantity: 1, unitPrice: 7 }],
      discountPercent: 30,
    });

    useStore.getState().clearCart();

    expect(useStore.getState().cart).toHaveLength(0);
    expect(useStore.getState().discountPercent).toBe(0);
  });
});

// biome-ignore lint/security/noSecrets: false positive on the function name identifier
describe("getDiscountBreakdown", () => {
  test("cart-percentage-discount.CART_TOTALS.5 stays consistent with getDiscountAmount and getCartTotal", () => {
    useStore.setState({
      cart: [{ product: productA, quantity: 2, unitPrice: 7 }],
      discountPercent: 10,
    });

    const state = useStore.getState();
    const breakdown = state.getDiscountBreakdown();

    expect(breakdown.subtotal).toBe(14);
    expect(breakdown.discountAmount).toBe(1.4);
    expect(breakdown.total).toBe(12.6);
    expect(state.getDiscountAmount()).toBe(breakdown.discountAmount);
    expect(state.getCartTotal()).toBe(breakdown.total);
  });
});
