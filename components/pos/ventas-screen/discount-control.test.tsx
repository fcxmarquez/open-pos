import { beforeEach, describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CartItem, Product } from "@/lib/store";
import { useStore } from "@/lib/store";
import { DiscountControl } from "./discount-control";

const product: Product = {
  id: "prod-1",
  barcode: "0001",
  name: "Pluma Bic",
  price: 7,
  category: "Escritura",
  createdAt: new Date().toISOString(),
};

function setCart(items: CartItem[], discountPercent = 0) {
  useStore.setState({ cart: items, discountPercent });
}

beforeEach(() => {
  setCart([]);
});

describe("DiscountControl", () => {
  test("cart-percentage-discount.DISCOUNT_INPUT.1 shows the + Descuento trigger when no discount is applied", () => {
    setCart([{ product, quantity: 1, unitPrice: 7 }]);
    render(<DiscountControl />);

    expect(screen.getByRole("button", { name: "Descuento" })).toBeInTheDocument();
    expect(screen.queryByText(/% aplicado/)).not.toBeInTheDocument();
  });

  test("cart-percentage-discount.DISCOUNT_INPUT.3 disables the trigger when the cart is empty", () => {
    setCart([]);
    render(<DiscountControl />);

    expect(screen.getByRole("button", { name: "Descuento" })).toBeDisabled();
  });

  test("cart-percentage-discount.DISCOUNT_INPUT.1 clicking the trigger opens the popover with the percent input", async () => {
    const user = userEvent.setup();
    setCart([{ product, quantity: 1, unitPrice: 7 }]);
    render(<DiscountControl />);

    expect(
      screen.queryByRole("textbox", { name: "Porcentaje de descuento" })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Descuento" }));

    expect(
      screen.getByRole("textbox", { name: "Porcentaje de descuento" })
    ).toBeInTheDocument();
  });

  test("cart-percentage-discount.DISCOUNT_INPUT.1-1, cart-percentage-discount.DISCOUNT_INPUT.2 applying a percent updates the store and shows the applied chip", async () => {
    const user = userEvent.setup();
    setCart([{ product, quantity: 1, unitPrice: 7 }]);
    render(<DiscountControl />);

    await user.click(screen.getByRole("button", { name: "Descuento" }));
    const input = screen.getByRole("textbox", { name: "Porcentaje de descuento" });
    await user.clear(input);
    await user.type(input, "15");
    await user.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(screen.getByRole("button", { name: "15% aplicado" })).toBeInTheDocument();
    expect(useStore.getState().discountPercent).toBe(15);
  });

  test("cart-percentage-discount.RULES.3 non-numeric input is ignored, applying no discount", async () => {
    const user = userEvent.setup();
    setCart([{ product, quantity: 1, unitPrice: 7 }]);
    render(<DiscountControl />);

    await user.click(screen.getByRole("button", { name: "Descuento" }));
    await user.type(
      screen.getByRole("textbox", { name: "Porcentaje de descuento" }),
      "abc"
    );
    await user.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(screen.getByRole("button", { name: "Descuento" })).toBeInTheDocument();
    expect(useStore.getState().discountPercent).toBe(0);
  });

  test("cart-percentage-discount.RULES.2 clamps a value above 60 down to 60 on apply", async () => {
    const user = userEvent.setup();
    setCart([{ product, quantity: 1, unitPrice: 7 }]);
    render(<DiscountControl />);

    await user.click(screen.getByRole("button", { name: "Descuento" }));
    await user.type(
      screen.getByRole("textbox", { name: "Porcentaje de descuento" }),
      "150"
    );
    await user.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(screen.getByRole("button", { name: "60% aplicado" })).toBeInTheDocument();
    expect(useStore.getState().discountPercent).toBe(60);
  });

  test("pressing Enter in the input applies the draft without clicking Aplicar", async () => {
    const user = userEvent.setup();
    setCart([{ product, quantity: 1, unitPrice: 7 }]);
    render(<DiscountControl />);

    await user.click(screen.getByRole("button", { name: "Descuento" }));
    await user.type(
      screen.getByRole("textbox", { name: "Porcentaje de descuento" }),
      "25{Enter}"
    );

    expect(screen.getByRole("button", { name: "25% aplicado" })).toBeInTheDocument();
    expect(useStore.getState().discountPercent).toBe(25);
  });

  test("pressing Escape closes the popover without applying the draft", async () => {
    const user = userEvent.setup();
    setCart([{ product, quantity: 1, unitPrice: 7 }]);
    render(<DiscountControl />);

    await user.click(screen.getByRole("button", { name: "Descuento" }));
    await user.type(
      screen.getByRole("textbox", { name: "Porcentaje de descuento" }),
      "40{Escape}"
    );

    expect(
      screen.queryByRole("textbox", { name: "Porcentaje de descuento" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Descuento" })).toBeInTheDocument();
    expect(useStore.getState().discountPercent).toBe(0);
  });

  test("edit reopens the popover prefilled with the current discount", async () => {
    const user = userEvent.setup();
    setCart([{ product, quantity: 1, unitPrice: 7 }], 15);
    render(<DiscountControl />);

    await user.click(screen.getByRole("button", { name: "Editar descuento" }));

    expect(screen.getByRole("textbox", { name: "Porcentaje de descuento" })).toHaveValue(
      "15"
    );
  });

  test("cart-percentage-discount.DISCOUNT_INPUT.4 remove resets the discount back to 0", async () => {
    const user = userEvent.setup();
    setCart([{ product, quantity: 1, unitPrice: 7 }], 15);
    render(<DiscountControl />);

    await user.click(screen.getByRole("button", { name: "Quitar descuento" }));

    expect(screen.getByRole("button", { name: "Descuento" })).toBeInTheDocument();
    expect(useStore.getState().discountPercent).toBe(0);
  });
});
