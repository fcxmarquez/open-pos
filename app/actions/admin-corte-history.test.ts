import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { CorteHistoryData } from "@/lib/corte-history";

const ISOLATED_TEST_ENV = "ADMIN_CORTE_HISTORY_ISOLATED_TEST";

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

async function getAdminCorteHistoryData(
  params: Parameters<
    typeof import("./admin-corte-history")["getAdminCorteHistoryData"]
  >[0]
) {
  const { getAdminCorteHistoryData: action } = await import("./admin-corte-history");
  return action(params);
}

function registerAdminCorteHistoryTests() {
  mock.module("@/auth", () => ({
    auth: authMock,
  }));

  mock.module("@/lib/server/queries/corte-history", () => ({
    getCorteHistoryData: queryCorteHistoryDataMock,
  }));

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
}

if (process.env[ISOLATED_TEST_ENV] === "1") {
  registerAdminCorteHistoryTests();
} else {
  test("runs action contracts in an isolated module registry", async () => {
    const child = Bun.spawn({
      cmd: [process.execPath, "test", "--isolate", import.meta.path],
      cwd: process.cwd(),
      env: { ...process.env, [ISOLATED_TEST_ENV]: "1" },
      stderr: "pipe",
      stdout: "pipe",
    });
    const [exitCode, stdout, stderr] = await Promise.all([
      child.exited,
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
    ]);
    const output = `${stdout}\n${stderr}`;

    if (exitCode !== 0) {
      throw new Error(`Isolated action tests failed:\n${output}`);
    }

    expect(output).toMatch(/\b4 pass\b/);
  });
}
