import { beforeEach, describe, expect, mock, test } from "bun:test";
import { getTableName, type SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

interface CapturedQuery {
  condition: SQL;
  tableName: string;
}

const capturedQueries: CapturedQuery[] = [];
const rowsByTable: Record<string, unknown[]> = {
  historical_daily_sales: [
    {
      bucket: "2026-06-05",
      closedSessions: 0,
      revenue: 125,
      source: "historical",
    },
  ],
  sales_sessions: [
    {
      bucket: "2026-06-10",
      closedSessions: 1,
      revenue: 75,
      source: "live",
    },
  ],
};

const selectMock = mock((_selection: unknown) => {
  let tableName = "";

  const builder = {
    from(table: Parameters<typeof getTableName>[0]) {
      tableName = getTableName(table);
      return builder;
    },
    groupBy(_expression: unknown) {
      return builder;
    },
    orderBy(_expression: unknown) {
      return builder;
    },
    then<TResult1 = unknown[], TResult2 = never>(
      onFulfilled?: ((value: unknown[]) => TResult1 | PromiseLike<TResult1>) | null,
      onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ) {
      return Promise.resolve(rowsByTable[tableName] ?? []).then(onFulfilled, onRejected);
    },
    where(condition: SQL) {
      capturedQueries.push({ condition, tableName });
      return builder;
    },
  };

  return builder;
});

mock.module("@/db", () => ({
  db: { select: selectMock },
}));

mock.module("next-intl/server", () => ({
  getLocale: async () => "es",
}));

mock.module("@/lib/utils", () => ({
  getTodayDateString: () => "2026-07-04",
}));

async function getCorteHistoryData(
  params: Parameters<typeof import("./corte-history")["getCorteHistoryData"]>[0]
) {
  const { getCorteHistoryData: query } = await import("./corte-history");
  return query(params);
}

describe("getCorteHistoryData", () => {
  beforeEach(() => {
    capturedQueries.length = 0;
    selectMock.mockClear();
  });

  test("bounds both live and historical queries to the exact requested window", async () => {
    await getCorteHistoryData({ offset: 1, range: "1M" });

    expect(capturedQueries).toHaveLength(2);

    const dialect = new PgDialect();
    const queryByTable = new Map(
      capturedQueries.map(({ condition, tableName }) => [
        tableName,
        dialect.sqlToQuery(condition),
      ])
    );
    const liveQuery = queryByTable.get("sales_sessions");
    const historicalQuery = queryByTable.get("historical_daily_sales");

    expect(liveQuery?.sql).toContain('"sales_sessions"."session_date"');
    expect(liveQuery?.params).toContain("2026-06-01");
    expect(liveQuery?.params).toContain("2026-06-30");
    expect(liveQuery?.params).toContain("closed");

    expect(historicalQuery?.sql).toContain('"historical_daily_sales"."business_date"');
    expect(historicalQuery?.params).toContain("2026-06-01");
    expect(historicalQuery?.params).toContain("2026-06-30");
  });
});
