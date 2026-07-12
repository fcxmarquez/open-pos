import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { CorteHistoryData } from "@/lib/corte-history";

const authMock = mock(async () => ({ user: { role: "admin" } }));
const queryCorteHistoryDataMock = mock(
  async (_params: { offset: number; range: string }): Promise<CorteHistoryData> => ({
    buckets: [],
    closedSessionsCount: 0,
    endDate: "2026-07-05",
    granularity: "day",
    hasData: false,
    label: "Semana actual",
    offset: 0,
    range: "1S",
    startDate: "2026-06-29",
    totalRevenue: 0,
  })
);

mock.module("@/auth", () => ({
  auth: authMock,
}));

mock.module("@/lib/server/queries/corte-history", () => ({
  getCorteHistoryData: queryCorteHistoryDataMock,
}));

async function getAdminCorteHistoryData(
  params: Parameters<
    typeof import("./admin-corte-history")["getAdminCorteHistoryData"]
  >[0]
) {
  const { getAdminCorteHistoryData: action } = await import("./admin-corte-history");
  return action(params);
}

describe("getAdminCorteHistoryData", () => {
  beforeEach(() => {
    authMock.mockClear();
    queryCorteHistoryDataMock.mockClear();
    authMock.mockResolvedValue({ user: { role: "admin" } });
  });

  test("rejects missing sessions", async () => {
    authMock.mockResolvedValueOnce(null as never);

    await expect(getAdminCorteHistoryData({ offset: 0, range: "1S" })).rejects.toThrow(
      "Unauthorized"
    );
    expect(queryCorteHistoryDataMock).not.toHaveBeenCalled();
  });

  test("rejects non-admin sessions", async () => {
    authMock.mockResolvedValueOnce({ user: { role: "cashier" } });

    await expect(getAdminCorteHistoryData({ offset: 0, range: "1S" })).rejects.toThrow(
      "Unauthorized"
    );
    expect(queryCorteHistoryDataMock).not.toHaveBeenCalled();
  });

  test("rejects invalid corte history ranges", async () => {
    await expect(
      getAdminCorteHistoryData({ offset: 0, range: "30D" as "1S" })
    ).rejects.toThrow("Invalid corte history range");
    expect(queryCorteHistoryDataMock).not.toHaveBeenCalled();
  });

  test("forwards normalized params for admin sessions", async () => {
    const result = await getAdminCorteHistoryData({ offset: -1, range: "1M" });

    expect(queryCorteHistoryDataMock).toHaveBeenCalledTimes(1);
    expect(queryCorteHistoryDataMock).toHaveBeenCalledWith({
      offset: 0,
      range: "1M",
    });
    expect(result).toMatchObject({
      hasData: false,
      range: "1S",
    });
  });
});
