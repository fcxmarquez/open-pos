import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminDashboardScreen } from "@/components/admin/dashboard-screen";
import { adminDashboardQueryKey } from "@/components/admin/dashboard-screen/query";
import type { AdminDashboardData } from "@/lib/server/queries/admin-dashboard";

// ─── Mock data ────────────────────────────────────────────────────────────────
// Dates anchored to 2026-04-05–2026-04-11 so the 7-day filter keeps them visible.
// 13 sessions (>10) triggers HistoryPanel pagination in table view.
// 11 transactions triggers LatestTransactionsPanel scroll.

const MOCK_TRANSACTIONS: AdminDashboardData["latestTransactions"] = Array.from(
  { length: 11 },
  (_, i) => ({
    id: `t${i + 1}`,
    createdAt: `2026-04-11T${String(8 + i).padStart(2, "0")}:${String(i * 5).padStart(2, "0")}:00.000Z`,
    items: [{ name: `Producto ${i + 1}`, quantity: i + 1 }],
    total: (i + 1) * 10,
  })
);

const MOCK_SESSION_HISTORY: AdminDashboardData["sessionHistory"] = [
  // 2026-04-11 — 3 sessions
  {
    id: "s1",
    sessionDate: "2026-04-11",
    sessionNumber: 1,
    revenue: 320,
    salesCount: 6,
    difference: 15,
  },
  {
    id: "s2",
    sessionDate: "2026-04-11",
    sessionNumber: 2,
    revenue: 180,
    salesCount: 3,
    difference: 0,
  },
  {
    id: "s3",
    sessionDate: "2026-04-11",
    sessionNumber: 3,
    revenue: 95,
    salesCount: 2,
    difference: -5,
  },
  // 2026-04-10 — 2 sessions
  {
    id: "s4",
    sessionDate: "2026-04-10",
    sessionNumber: 1,
    revenue: 710,
    salesCount: 14,
    difference: 20,
  },
  {
    id: "s5",
    sessionDate: "2026-04-10",
    sessionNumber: 2,
    revenue: 230,
    salesCount: 5,
    difference: 0,
  },
  // 2026-04-09 — 2 sessions
  {
    id: "s6",
    sessionDate: "2026-04-09",
    sessionNumber: 1,
    revenue: 600,
    salesCount: 11,
    difference: 2,
  },
  {
    id: "s7",
    sessionDate: "2026-04-09",
    sessionNumber: 2,
    revenue: 140,
    salesCount: 3,
    difference: -10,
  },
  // 2026-04-08 — 2 sessions
  {
    id: "s8",
    sessionDate: "2026-04-08",
    sessionNumber: 1,
    revenue: 425,
    salesCount: 8,
    difference: 0,
  },
  {
    id: "s9",
    sessionDate: "2026-04-08",
    sessionNumber: 2,
    revenue: 90,
    salesCount: 2,
    difference: 5,
  },
  // 2026-04-07 — 2 sessions
  {
    id: "s10",
    sessionDate: "2026-04-07",
    sessionNumber: 1,
    revenue: 1150,
    salesCount: 22,
    difference: 50,
  },
  {
    id: "s11",
    sessionDate: "2026-04-07",
    sessionNumber: 2,
    revenue: 310,
    salesCount: 6,
    difference: -3,
  },
  // 2026-04-06 — 1 session
  {
    id: "s12",
    sessionDate: "2026-04-06",
    sessionNumber: 1,
    revenue: 860,
    salesCount: 17,
    difference: -5,
  },
  // 2026-04-05 — 1 session
  {
    id: "s13",
    sessionDate: "2026-04-05",
    sessionNumber: 1,
    revenue: 210,
    salesCount: 4,
    difference: 0,
  },
];

const BASE_DATA: AdminDashboardData = {
  comparisonLabel: "vs sábado pasado",
  generatedAt: "2026-04-11T18:00:00.000Z",
  hasOpenSession: true,
  latestTransactions: MOCK_TRANSACTIONS,
  monthDaysElapsed: 11,
  monthDaysTotal: 30,
  openSessionLabel: "Sesión abierta · Turno 1",
  productsSold: 66,
  revenueMonthProjected: 21319.36,
  revenueMonthToDate: 9628.1,
  revenueToday: 595.0,
  revenueVsLastWeek: 250.6,
  staleSession: null,
  sessionHistory: MOCK_SESSION_HISTORY,
  topProduct: { name: "IMPRESION Y COPIA T/C", category: "Oficina", units: 15 },
  transactionCount: MOCK_TRANSACTIONS.length,
};

const STALE_SESSION = {
  id: "stale-1",
  sessionDate: "2026-04-10",
  sessionNumber: 1,
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createQueryClient(data: AdminDashboardData) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
        gcTime: Infinity,
        enabled: false,
      },
    },
  });
  qc.setQueryData(adminDashboardQueryKey, data);
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

function withData(data: AdminDashboardData): Decorator {
  return withQueryLayout(createQueryClient(data));
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
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  qc.prefetchQuery({
    queryKey: adminDashboardQueryKey,
    queryFn: (): Promise<AdminDashboardData> => new Promise(() => {}),
  });
  return withQueryLayout(qc);
}

function withError(): Decorator {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  qc.prefetchQuery({
    queryKey: adminDashboardQueryKey,
    queryFn: (): Promise<AdminDashboardData> =>
      Promise.reject(new Error("Failed to load")),
  });
  return withQueryLayout(qc);
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
      staleSession: STALE_SESSION,
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

export const NoHistory: Story = {
  name: "Sin historial de cortes",
  decorators: [
    withData({
      ...BASE_DATA,
      sessionHistory: [],
    }),
  ],
};
