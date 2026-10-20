import { beforeEach, describe, expect, mock, test } from "bun:test";
import { getTableName, type SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

interface CapturedUpdate {
  condition: SQL | null;
  setValues: Record<string, unknown>;
  tableName: string;
}

const capturedUpdates: CapturedUpdate[] = [];
const deletedRows = [{ id: "returned-1" }, { id: "returned-2" }];

const updateMock = mock((table: Parameters<typeof getTableName>[0]) => {
  const captured: CapturedUpdate = {
    condition: null,
    setValues: {},
    tableName: getTableName(table),
  };

  const builder = {
    returning(_selection: unknown) {
      return builder;
    },
    set(values: Record<string, unknown>) {
      captured.setValues = values;
      return builder;
    },
    then<TResult1 = unknown[], TResult2 = never>(
      onFulfilled?: ((value: unknown[]) => TResult1 | PromiseLike<TResult1>) | null,
      onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ) {
      capturedUpdates.push(captured);
      return Promise.resolve(deletedRows).then(onFulfilled, onRejected);
    },
    where(condition: SQL) {
      captured.condition = condition;
      return builder;
    },
  };

  return builder;
});

mock.module("@/db", () => ({
  db: { update: updateMock },
}));

async function deleteProducts(ids: string[]) {
  const { bulkDeleteProducts } = await import("./products");
  return bulkDeleteProducts(ids);
}

describe("bulkDeleteProducts", () => {
  beforeEach(() => {
    capturedUpdates.length = 0;
    updateMock.mockClear();
  });

  test("returns 0 and does not query when the id list is empty", async () => {
    await expect(deleteProducts([])).resolves.toBe(0);
    expect(updateMock).not.toHaveBeenCalled();
    expect(capturedUpdates).toHaveLength(0);
  });

  test("soft-deletes active products in one update", async () => {
    const ids = [
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
    ];
    const before = Date.now();

    await expect(deleteProducts(ids)).resolves.toBe(deletedRows.length);

    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(capturedUpdates).toHaveLength(1);

    const update = capturedUpdates[0];
    expect(update?.tableName).toBe("products");
    expect(update?.setValues.isActive).toBe(false);
    expect(update?.setValues.updatedAt).toBeInstanceOf(Date);

    const updatedAt = update?.setValues.updatedAt;
    if (updatedAt instanceof Date) {
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(updatedAt.getTime()).toBeLessThanOrEqual(Date.now());
    }

    const dialect = new PgDialect();
    const query = dialect.sqlToQuery(update?.condition as SQL);

    expect(query.sql).toContain('"products"."is_active"');
    expect(query.sql).toContain('"products"."id"');
    expect(query.params).toEqual([true, ...ids]);
  });
});
