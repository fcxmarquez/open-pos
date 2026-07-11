import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminDashboardScreen } from "@/components/admin/dashboard-screen";
import { adminCorteHistoryQueryKey } from "@/components/admin/dashboard-screen/history-panel/query";
import { adminDashboardQueryKey } from "@/components/admin/dashboard-screen/query";
import {
  buildCorteHistoryData,
  CORTE_HISTORY_RANGES,
  type CorteHistoryData,
  getCorteHistoryWindow,
} from "@/lib/corte-history";
import type { AdminDashboardData } from "@/lib/server/queries/admin-dashboard";

// ─── Mock data ────────────────────────────────────────────────────────────────
// Dates anchored to 2026-04-06–2026-04-12 so the current-week history stays visible.
// 11 transactions triggers LatestTransactionsPanel scroll.

const STORY_TODAY = "2026-04-11";

const MOCK_TRANSACTIONS: AdminDashboardData["latestTransactions"] = Array.from(
  { length: 11 },
  (_, i) => ({
    id: `t${i + 1}`,
    createdAt: `2026-04-11T${String(8 + i).padStart(2, "0")}:${String(i * 5).padStart(2, "0")}:00.000Z`,
    items: [{ name: `Producto ${i + 1}`, quantity: i + 1 }],
    total: (i + 1) * 10,
  })
);

const MOCK_CORTE_HISTORY = buildCorteHistoryData(
  getCorteHistoryWindow("1S", 0, STORY_TODAY),
  [
    { bucket: "2026-04-06", closedSessions: 1, revenue: 860 },
    { bucket: "2026-04-07", closedSessions: 2, revenue: 1460 },
    { bucket: "2026-04-08", closedSessions: 2, revenue: 515 },
    { bucket: "2026-04-09", closedSessions: 2, revenue: 740 },
    { bucket: "2026-04-10", closedSessions: 2, revenue: 940 },
    { bucket: "2026-04-11", closedSessions: 3, revenue: 595 },
  ]
);

const EMPTY_CORTE_HISTORY = buildCorteHistoryData(
  getCorteHistoryWindow("1S", 0, STORY_TODAY),
  []
);

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
  topProduct: { name: "IMPRESION Y COPIA T/C", category: "Oficina", units: 15 },
  transactionCount: MOCK_TRANSACTIONS.length,
};

const STALE_SESSION = {
  id: "stale-1",
  sessionDate: "2026-04-10",
  sessionNumber: 1,
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function seedCorteHistoryQueries(qc: QueryClient, currentHistory: CorteHistoryData) {
  for (const range of CORTE_HISTORY_RANGES) {
    for (const offset of [0, 1]) {
      const window = getCorteHistoryWindow(range, offset, STORY_TODAY);
      qc.setQueryData(
        adminCorteHistoryQueryKey(range, offset),
        buildCorteHistoryData(window, [])
      );
    }
  }

  qc.setQueryData(
    adminCorteHistoryQueryKey(currentHistory.range, currentHistory.offset),
    currentHistory
  );
}

function createQueryClient(
  data: AdminDashboardData,
  currentHistory = MOCK_CORTE_HISTORY
) {
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
  seedCorteHistoryQueries(qc, currentHistory);
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

function withData(
  data: AdminDashboardData,
  currentHistory = MOCK_CORTE_HISTORY
): Decorator {
  return withQueryLayout(createQueryClient(data, currentHistory));
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
  decorators: [withData(BASE_DATA, EMPTY_CORTE_HISTORY)],
};
