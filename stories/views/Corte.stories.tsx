import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CorteScreen } from "@/components/pos/corte-screen";
import {
  openSessionQueryKey,
  openSessionSalesQueryKey,
} from "@/components/pos/corte-screen/query";

// ─── Types ────────────────────────────────────────────────────────────────────

type Session = {
  id: string;
  sessionDate: string;
  sessionNumber: number;
  systemTotal: string | null;
  countedTotal: string | null;
  difference: string | null;
  status: string | null;
  closedReason: string | null;
  openedAt: Date;
  closedAt: Date | null;
};

type SaleItem = {
  id: string;
  saleId: string;
  productId: string | null;
  barcode: string | null;
  productName: string;
  unitPrice: string;
  quantity: number;
  subtotal: string;
};

type SessionSale = {
  id: string;
  sessionId: string;
  total: string;
  paymentAmount: string;
  changeAmount: string;
  createdAt: Date;
  items: SaleItem[];
};

type SessionSales = SessionSale[];

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_SESSION: Session = {
  id: "session-abc-1",
  sessionDate: "2026-03-29",
  sessionNumber: 1,
  systemTotal: "347.50",
  countedTotal: null,
  difference: null,
  status: "open",
  closedReason: null,
  openedAt: new Date("2026-03-29T08:00:00.000Z"),
  closedAt: null,
};

const MOCK_SALES: SessionSales = [
  {
    id: "sale-1",
    sessionId: "session-abc-1",
    total: "75.00",
    paymentAmount: "100.00",
    changeAmount: "25.00",
    createdAt: new Date("2026-03-29T09:15:00.000Z"),
    items: [
      {
        id: "item-1",
        saleId: "sale-1",
        productId: null,
        barcode: "7501000000001",
        productName: "Cuaderno universitario",
        unitPrice: "25.00",
        quantity: 2,
        subtotal: "50.00",
      },
      {
        id: "item-2",
        saleId: "sale-1",
        productId: null,
        barcode: null,
        productName: "Pluma BIC",
        unitPrice: "5.00",
        quantity: 5,
        subtotal: "25.00",
      },
    ],
  },
  {
    id: "sale-2",
    sessionId: "session-abc-1",
    total: "120.00",
    paymentAmount: "120.00",
    changeAmount: "0.00",
    createdAt: new Date("2026-03-29T10:42:00.000Z"),
    items: [
      {
        id: "item-3",
        saleId: "sale-2",
        productId: null,
        barcode: "7501000000002",
        productName: "Folder manila carta",
        unitPrice: "6.00",
        quantity: 10,
        subtotal: "60.00",
      },
      {
        id: "item-4",
        saleId: "sale-2",
        productId: null,
        barcode: null,
        productName: "Cinta adhesiva",
        unitPrice: "12.00",
        quantity: 5,
        subtotal: "60.00",
      },
    ],
  },
  {
    id: "sale-3",
    sessionId: "session-abc-1",
    total: "152.50",
    paymentAmount: "200.00",
    changeAmount: "47.50",
    createdAt: new Date("2026-03-29T11:58:00.000Z"),
    items: [
      {
        id: "item-5",
        saleId: "sale-3",
        productId: null,
        barcode: "7501000000003",
        productName: "Papel bond 75g c/500",
        unitPrice: "152.50",
        quantity: 1,
        subtotal: "152.50",
      },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createQueryClient(session: Session | null, sales: SessionSales) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
    },
  });
  qc.setQueryData(openSessionQueryKey, session);
  qc.setQueryData(openSessionSalesQueryKey, sales);
  return qc;
}

function withQueryLayout(qc: QueryClient): Decorator {
  return (Story) => (
    <QueryClientProvider client={qc}>
      <div className="min-h-screen bg-background">
        <Story />
      </div>
    </QueryClientProvider>
  );
}

function withData(session: Session | null, sales: SessionSales): Decorator {
  return (Story, context) =>
    withQueryLayout(createQueryClient(session, sales))(Story, context);
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
  title: "Views/Corte",
  component: CorteScreen,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof CorteScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── States ───────────────────────────────────────────────────────────────────

function withPending(): Decorator {
  return (Story, context) => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    qc.prefetchQuery({
      queryKey: openSessionQueryKey,
      queryFn: (): Promise<Session | null> => new Promise(() => {}),
    });
    qc.prefetchQuery({
      queryKey: openSessionSalesQueryKey,
      queryFn: (): Promise<SessionSales> => new Promise(() => {}),
    });
    return withQueryLayout(qc)(Story, context);
  };
}

export const Loading: Story = {
  decorators: [withPending()],
};

export const SinSesionActiva: Story = {
  name: "Sin sesión activa",
  decorators: [withData(null, [])],
};

export const ConSesionYVentas: Story = {
  name: "Sesión abierta con ventas",
  decorators: [withData(MOCK_SESSION, MOCK_SALES)],
};

export const SesionSinVentas: Story = {
  name: "Sesión abierta sin ventas",
  decorators: [withData(MOCK_SESSION, [])],
};
