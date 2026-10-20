import {
  afterEach,
  beforeEach,
  describe,
  expect,
  type Mock,
  mock,
  spyOn,
  test,
} from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/types";
import messages from "@/messages/es.json";

const LAPIS_ID = "11111111-1111-4111-8111-111111111111";
const GOMA_ID = "22222222-2222-4222-8222-222222222222";

const searchParams = new URLSearchParams();
const router = {
  replace: mock(() => {}),
};

const productRows = [
  {
    id: LAPIS_ID,
    barcode: "10001",
    pluCode: "1001",
    name: "Lápiz",
    price: "5.00",
    costPrice: null,
    category: "Escritura",
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    lastSoldAt: null,
  },
  {
    id: GOMA_ID,
    barcode: "10002",
    pluCode: "1002",
    name: "Goma",
    price: "4.00",
    costPrice: null,
    category: "Escritura",
    isActive: true,
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    lastSoldAt: null,
  },
];

const getProducts = mock(async () => ({
  rows: productRows,
  total: productRows.length,
  page: 1,
  pageSize: 100,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
}));

const getPendingProducts = mock(async () => []);

const bulkDeleteProducts = mock(
  async (input: { ids: string[] }): Promise<ActionResult<{ deletedCount: number }>> => ({
    success: true,
    data: { deletedCount: input.ids.length },
    error: null,
  })
);

const createProduct = mock(async () => ({
  success: true,
  data: null,
  error: null,
}));
const updateProduct = mock(async () => ({
  success: true,
  data: null,
  error: null,
}));
const deleteProduct = mock(async () => ({
  success: true,
  data: null,
  error: null,
}));
const bulkUpdateProducts = mock(async () => ({
  success: true,
  data: { updatedCount: 0 },
  error: null,
}));

mock.module("next/navigation", () => ({
  usePathname: () => "/productos",
  useRouter: () => router,
  useSearchParams: () => searchParams,
}));

mock.module("@/app/actions/product-queries", () => ({
  getPendingProducts,
  getProducts,
}));

mock.module("@/app/actions/products", () => ({
  bulkDeleteProducts,
  bulkUpdateProducts,
  createProduct,
  deleteProduct,
  updateProduct,
}));

async function loadProductosScreen() {
  const screenModule = await import("./index");
  return screenModule.ProductosScreen;
}

const DELETE_SELECTED_NAME = "Eliminar seleccionados (2 producto(s))";
const DELETE_TITLE = "¿Eliminar 2 productos seleccionados?";
const DELETE_DESCRIPTION = "Estos 2 productos desaparecerán del catálogo y de ventas.";

async function renderProductosScreen() {
  const ProductosScreen = await loadProductosScreen();
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <QueryClientProvider client={queryClient}>
        <ProductosScreen />
      </QueryClientProvider>
    </NextIntlClientProvider>
  );
}

async function selectBothProducts(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole("checkbox", { name: "Seleccionar Lápiz" });
  await user.click(screen.getByRole("checkbox", { name: "Seleccionar Lápiz" }));
  await user.click(screen.getByRole("checkbox", { name: "Seleccionar Goma" }));
}

async function openDeleteDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: DELETE_SELECTED_NAME }));
  const dialog = await screen.findByRole("alertdialog", { name: DELETE_TITLE });
  expect(within(dialog).getByText(DELETE_DESCRIPTION)).toBeInTheDocument();
  return dialog;
}

describe("ProductosScreen bulk delete", () => {
  let infoToast: Mock<typeof toast.info>;
  let successToast: Mock<typeof toast.success>;

  beforeEach(() => {
    infoToast = spyOn(toast, "info");
    successToast = spyOn(toast, "success");
    bulkDeleteProducts.mockClear();
    getProducts.mockClear();
    getPendingProducts.mockClear();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1280,
    });
  });

  afterEach(() => {
    infoToast.mockRestore();
    successToast.mockRestore();
  });

  test("confirms the selected products, deletes those ids, and clears the selection", async () => {
    const user = userEvent.setup();
    await renderProductosScreen();
    await selectBothProducts(user);

    const productCalls = getProducts.mock.calls.length;
    const pendingCalls = getPendingProducts.mock.calls.length;
    let sawZeroProductDialog = false;
    const observer = new MutationObserver(() => {
      if (document.body.textContent?.includes("¿Eliminar 0 productos")) {
        sawZeroProductDialog = true;
      }
    });
    observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    const dialog = await openDeleteDialog(user);
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }));

    await waitFor(() => {
      expect(bulkDeleteProducts).toHaveBeenCalledTimes(1);
    });
    expect(bulkDeleteProducts).toHaveBeenCalledWith({
      ids: [LAPIS_ID, GOMA_ID],
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: DELETE_SELECTED_NAME })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("alertdialog", { name: DELETE_TITLE })
      ).not.toBeInTheDocument();
    });
    expect(screen.getByRole("checkbox", { name: "Seleccionar Lápiz" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Seleccionar Goma" })).not.toBeChecked();
    await waitFor(() => {
      expect(getProducts.mock.calls.length).toBeGreaterThan(productCalls);
      expect(getPendingProducts.mock.calls.length).toBeGreaterThan(pendingCalls);
    });
    observer.disconnect();
    expect(sawZeroProductDialog).toBe(false);
  });

  test("says the products were already deleted when none were still active", async () => {
    bulkDeleteProducts.mockImplementationOnce(async () => ({
      success: true,
      data: { deletedCount: 0 },
      error: null,
    }));
    const user = userEvent.setup();
    await renderProductosScreen();
    await selectBothProducts(user);

    const productCalls = getProducts.mock.calls.length;
    const dialog = await openDeleteDialog(user);
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }));

    await waitFor(() => {
      expect(
        screen.queryByRole("alertdialog", { name: DELETE_TITLE })
      ).not.toBeInTheDocument();
    });
    expect(infoToast).toHaveBeenCalledWith(
      "Los productos seleccionados ya estaban eliminados"
    );
    expect(successToast).not.toHaveBeenCalled();
    expect(screen.getByRole("checkbox", { name: "Seleccionar Lápiz" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Seleccionar Goma" })).not.toBeChecked();
    await waitFor(() => {
      expect(getProducts.mock.calls.length).toBeGreaterThan(productCalls);
    });
  });

  test("cancel closes the dialog and keeps the selection", async () => {
    const user = userEvent.setup();
    await renderProductosScreen();
    await selectBothProducts(user);

    const dialog = await openDeleteDialog(user);
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    expect(bulkDeleteProducts).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("alertdialog", { name: DELETE_TITLE })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: DELETE_SELECTED_NAME })
    ).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Seleccionar Lápiz" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Seleccionar Goma" })).toBeChecked();
  });

  test("keeps the dialog and the selection when delete fails", async () => {
    bulkDeleteProducts.mockImplementationOnce(async () => ({
      success: false,
      data: null,
      error: "No se pudieron eliminar los productos",
    }));

    const user = userEvent.setup();
    await renderProductosScreen();
    await selectBothProducts(user);

    const productCalls = getProducts.mock.calls.length;
    const dialog = await openDeleteDialog(user);
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }));

    await waitFor(() => {
      expect(bulkDeleteProducts).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole("alertdialog", { name: DELETE_TITLE })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { hidden: true, name: DELETE_SELECTED_NAME })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { hidden: true, name: "Seleccionar Lápiz" })
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { hidden: true, name: "Seleccionar Goma" })
    ).toBeChecked();
    expect(getProducts.mock.calls.length).toBe(productCalls);
  });
});
