import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminDashboardScreen } from "@/components/admin/dashboard-screen";
import { adminDashboardQueryKey } from "@/components/admin/dashboard-screen/query";
import type { AdminDashboardData } from "@/lib/server/queries/admin-dashboard";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_TRANSACTIONS: AdminDashboardData["latestTransactions"] = [
  {
    id: "t1",
    createdAt: "2026-03-14T12:51:00.000Z",
    items: [{ name: "IMPRESION Y COPIA T/C", quantity: 1 }],
    total: 5.0,
  },
  {
    id: "t2",
    createdAt: "2026-03-14T11:37:00.000Z",
    items: [{ name: "IMPRESION Y COPIA T/C", quantity: 4 }],
    total: 8.0,
  },
  {
    id: "t3",
    createdAt: "2026-03-14T11:26:00.000Z",
    items: [{ name: "IMPRESION Y COPIA T/C", quantity: 10 }],
    total: 20.0,
  },
  {
    id: "t4",
    createdAt: "2026-03-14T11:03:00.000Z",
    items: [{ name: "Venta rápida", quantity: 1 }],
    total: 12.0,
  },
  {
    id: "t5",
    createdAt: "2026-03-14T11:02:00.000Z",
    items: [{ name: "Hoja opalina", quantity: 6 }],
    total: 21.0,
  },
];

const MOCK_SESSION_HISTORY: AdminDashboardData["sessionHistory"] = [
  {
    id: "s1",
    sessionDate: "2026-03-14",
    sessionNumber: 1,
    revenue: 305.0,
    salesCount: 6,
    difference: 0,
  },
  {
    id: "s2",
    sessionDate: "2026-03-13",
    sessionNumber: 1,
    revenue: 707.0,
    salesCount: 14,
    difference: -20.0,
  },
  {
    id: "s3",
    sessionDate: "2026-03-12",
    sessionNumber: 1,
    revenue: 598.0,
    salesCount: 11,
    difference: 2.0,
  },
  {
    id: "s4",
    sessionDate: "2026-03-11",
    sessionNumber: 1,
    revenue: 420.5,
    salesCount: 8,
    difference: 0,
  },
  {
    id: "s5",
    sessionDate: "2026-03-10",
    sessionNumber: 1,
    revenue: 1150.0,
    salesCount: 22,
    difference: 50.0,
  },
  {
    id: "s6",
    sessionDate: "2026-03-09",
    sessionNumber: 1,
    revenue: 860.0,
    salesCount: 17,
    difference: -5.0,
  },
  {
    id: "s7",
    sessionDate: "2026-03-08",
    sessionNumber: 1,
    revenue: 210.0,
    salesCount: 4,
    difference: 0,
  },
];

const BASE_DATA: AdminDashboardData = {
  comparisonLabel: "vs sábado pasado",
  generatedAt: "2026-03-14T18:00:00.000Z",
  hasOpenSession: true,
  latestTransactions: MOCK_TRANSACTIONS,
  monthDaysElapsed: 14,
  monthDaysTotal: 31,
  openSessionLabel: "Sesión abierta · Turno 1",
  productsSold: 27,
  revenueMonthProjected: 21319.36,
  revenueMonthToDate: 9628.1,
  revenueToday: 305.0,
  revenueVsLastWeek: 250.6,
  staleSession: null,
  sessionHistory: MOCK_SESSION_HISTORY,
  topProduct: { name: "IMPRESION Y COPIA T/C", category: "Oficina", units: 15 },
  transactionCount: 6,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createQueryClient(data: AdminDashboardData) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
    },
  });
  qc.setQueryData(adminDashboardQueryKey, data);
  return qc;
}

function withData(data: AdminDashboardData): Decorator {
  return (Story) => (
    <QueryClientProvider client={createQueryClient(data)}>
      <div className="min-h-screen bg-background">
        <Story />
      </div>
    </QueryClientProvider>
  );
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
  title: "Views/Dashboard",
  component: AdminDashboardScreen,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AdminDashboardScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── States ───────────────────────────────────────────────────────────────────

function withPending(): Decorator {
  return (Story) => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    qc.prefetchQuery({
      queryKey: adminDashboardQueryKey,
      queryFn: (): Promise<AdminDashboardData> => new Promise(() => {}),
    });
    return (
      <QueryClientProvider client={qc}>
        <div className="min-h-screen bg-background">
          <Story />
        </div>
      </QueryClientProvider>
    );
  };
}

function withError(): Decorator {
  return (Story) => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    qc.prefetchQuery({
      queryKey: adminDashboardQueryKey,
      queryFn: (): Promise<AdminDashboardData> =>
        Promise.reject(new Error("Failed to load")),
    });
    return (
      <QueryClientProvider client={qc}>
        <div className="min-h-screen bg-background">
          <Story />
        </div>
      </QueryClientProvider>
    );
  };
}

export const Loading: Story = {
  decorators: [withPending()],
};

export const ErrorState: Story = {
  name: "Error",
  decorators: [withError()],
};

export const WithOpenSession: Story = {
  name: "Sesión abierta",
  decorators: [withData(BASE_DATA)],
};

export const WithClosedSession: Story = {
  name: "Sin sesión abierta",
  decorators: [
    withData({
      ...BASE_DATA,
      hasOpenSession: false,
      openSessionLabel: null,
    }),
  ],
};

export const WithStaleBanner: Story = {
  name: "Banner de sesión no cerrada",
  decorators: [
    withData({
      ...BASE_DATA,
      hasOpenSession: false,
      openSessionLabel: null,
      staleSession: {
        id: "stale-1",
        sessionDate: "2026-03-13",
        sessionNumber: 1,
      },
    }),
  ],
};

export const EmptyDay: Story = {
  name: "Sin ventas hoy",
  decorators: [
    withData({
      ...BASE_DATA,
      hasOpenSession: true,
      openSessionLabel: "Sesión abierta · Turno 1",
      revenueToday: 0,
      revenueVsLastWeek: null,
      productsSold: 0,
      transactionCount: 0,
      latestTransactions: [],
      topProduct: null,
    }),
  ],
};

export const NegativeComparison: Story = {
  name: "Comparación negativa",
  decorators: [
    withData({
      ...BASE_DATA,
      revenueToday: 85.0,
      revenueVsLastWeek: -72.1,
      comparisonLabel: "vs sábado pasado",
    }),
  ],
};

export const NoComparisonData: Story = {
  name: "Sin datos de comparación",
  decorators: [
    withData({
      ...BASE_DATA,
      revenueVsLastWeek: null,
    }),
  ],
};
