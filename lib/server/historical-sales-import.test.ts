import { describe, expect, test } from "bun:test";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  assertSafeHistoricalImportTarget,
  EXPECTED_HISTORICAL_SALES_IMPORT,
  EXPECTED_HISTORICAL_SALES_NEON_TARGET,
  type HistoricalImportTargetInput,
  type HistoricalSalesImportRepository,
  HistoricalSalesImportValidationError,
  parseHistoricalSalesCsv,
  persistHistoricalSalesImport,
  readHistoricalSalesImport,
} from "./historical-sales-import";

const candidatePath = resolve(
  import.meta.dir,
  "../../export/daily-sales-notebook-authoritative-candidate.csv"
);

async function writeChangedCandidate(
  change: (contents: string) => string
): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "historical-sales-import-test-"));
  const changedPath = join(directory, "daily-sales-notebook-authoritative-candidate.csv");
  const original = await readFile(candidatePath, "utf8");
  await writeFile(changedPath, change(original), "utf8");
  return changedPath;
}

describe("readHistoricalSalesImport", () => {
  test("accepts the immutable notebook-authoritative candidate", async () => {
    const prepared = await readHistoricalSalesImport(candidatePath, "0414694");

    expect(prepared.batch).toEqual({
      expectedEndDate: "2026-02-21",
      expectedKnownAmountCount: 1880,
      expectedNullAmountCount: 37,
      expectedRowCount: 1917,
      expectedStartDate: "2019-06-17",
      expectedTotalAmountMxn: "952814.76",
      repositoryCommit: "0414694",
      selectionPolicy: "notebook_authoritative_managementpro_gap_fill_v1",
      sourceFileName: "daily-sales-notebook-authoritative-candidate.csv",
      sourceFilePath: "export/daily-sales-notebook-authoritative-candidate.csv",
      sourceFileSha256: EXPECTED_HISTORICAL_SALES_IMPORT.sha256,
    });
    expect(prepared.rows).toHaveLength(1917);
    expect(prepared.rows[0]).toMatchObject({
      amountMxn: "135.00",
      businessDate: "2019-06-17",
      mergeStatus: "ready_managementpro_gap_fill",
      selectedSource: "managementpro",
      sourceRowNumber: 2,
    });
    expect(prepared.rows.at(-1)).toMatchObject({
      amountMxn: "290.00",
      businessDate: "2026-02-21",
      selectedSource: "notebook",
      sourceRowNumber: 1918,
    });
    expect(prepared.rows.find((row) => row.businessDate === "2019-12-18")).toMatchObject({
      amountMxn: null,
      mergeStatus: "unresolved_managementpro_blank",
    });
  });

  test("pins every expected checksum and aggregate", () => {
    expect(EXPECTED_HISTORICAL_SALES_IMPORT).toEqual({
      endDate: "2026-02-21",
      knownAmountCount: 1880,
      nullAmountCount: 37,
      rowCount: 1917,
      selectionPolicy: "notebook_authoritative_managementpro_gap_fill_v1",
      // biome-ignore lint/security/noSecrets: This public SHA-256 checksum is an integrity assertion, not a credential.
      sha256: "44cd1a0e0aa1a8e66cc4d25632fc46f589bbc983ac7ccca896af0bf6b06f9014",
      sourceFileName: "daily-sales-notebook-authoritative-candidate.csv",
      sourceFilePath: "export/daily-sales-notebook-authoritative-candidate.csv",
      startDate: "2019-06-17",
      totalAmountMxn: "952814.76",
    });
  });

  test("rejects any byte-level file change before parsing", async () => {
    const changedPath = await writeChangedCandidate((contents) =>
      contents.replace("2019-06-17,135.00", "2019-06-17,136.00")
    );

    await expect(readHistoricalSalesImport(changedPath, null)).rejects.toThrow("SHA-256");
  });

  test("reports strict header, duplicate-date, and source/status violations", async () => {
    const original = await readFile(candidatePath, "utf8");
    const [header, firstRow] = original.split("\n");
    const invalidVariants = [
      original.replace("date,amount_mxn", "business_date,amount_mxn"),
      `${header}\n${firstRow}\n${firstRow}\n`,
      original.replace(
        "managementpro,managementpro_nonoverlap_gap_fill,ready_managementpro_gap_fill",
        "notebook,managementpro_nonoverlap_gap_fill,ready_managementpro_gap_fill"
      ),
    ];

    const expectedMessages = ["header", "Duplicate business date", "inconsistent"];

    for (const [index, contents] of invalidVariants.entries()) {
      expect(() => parseHistoricalSalesCsv(contents)).toThrow(expectedMessages[index]);
    }
  });
});

describe("assertSafeHistoricalImportTarget", () => {
  type ExecutionAwareTargetInput = HistoricalImportTargetInput & {
    confirmationToken?: string;
    continuousIntegration?: string;
    executionFlag: string | undefined;
    executionMode: "development" | "production";
  };
  interface ExpectedTargetFixture {
    branchId: string;
    branchName: string;
    computeId: string;
    confirmationToken: string;
    endpointHosts: readonly [string];
  }
  const assertExecutionAwareTarget = assertSafeHistoricalImportTarget as unknown as (
    input: ExecutionAwareTargetInput,
    expectedProductionTarget?: ExpectedTargetFixture
  ) => {
    branchId: string;
    branchName: string;
    computeId: string;
    endpointHost: string;
  };
  const productionTargetFixture = {
    branchId: "br-production-fixture",
    branchName: "verified-production-fixture",
    computeId: "ep-production-fixture",
    confirmationToken: "production-fixture-confirmation",
    endpointHosts: ["ep-production-fixture.c-4.us-east-1.aws.neon.tech"],
  } as const satisfies ExpectedTargetFixture;
  const safeTarget = {
    databaseUrl: `postgresql://redacted@${EXPECTED_HISTORICAL_SALES_NEON_TARGET.endpointHosts[1]}/neondb`,
    continuousIntegration: undefined,
    executionFlag: "--execute-development-import",
    executionMode: "development",
    nodeEnv: "development",
    verifiedBranchId: EXPECTED_HISTORICAL_SALES_NEON_TARGET.branchId,
    verifiedBranchName: "development",
    verifiedComputeId: EXPECTED_HISTORICAL_SALES_NEON_TARGET.computeId,
    verifiedEndpointHost: EXPECTED_HISTORICAL_SALES_NEON_TARGET.endpointHosts[1],
    vercelEnv: undefined,
  } satisfies ExecutionAwareTargetInput;

  test("accepts only an independently verified development endpoint", () => {
    expect(assertExecutionAwareTarget(safeTarget)).toEqual({
      branchId: "br-calm-fog-aibvaxvs",
      branchName: "development",
      computeId: "ep-delicate-dream-ai62k4vd",
      endpointHost: "ep-delicate-dream-ai62k4vd-pooler.c-4.us-east-1.aws.neon.tech",
    });

    expect(
      assertExecutionAwareTarget({
        ...safeTarget,
        databaseUrl:
          "postgresql://redacted@ep-delicate-dream-ai62k4vd.c-4.us-east-1.aws.neon.tech/neondb",
        verifiedEndpointHost: "ep-delicate-dream-ai62k4vd.c-4.us-east-1.aws.neon.tech",
      })
    ).toMatchObject({ computeId: "ep-delicate-dream-ai62k4vd" });
  });

  test("rejects production signals, ambiguous branches, and endpoint mismatches", () => {
    const unsafeTargets = [
      { ...safeTarget, executionFlag: undefined },
      { ...safeTarget, executionFlag: "--execute-production-import" },
      { ...safeTarget, continuousIntegration: "1" },
      { ...safeTarget, nodeEnv: "production" },
      { ...safeTarget, vercelEnv: "production" },
      { ...safeTarget, verifiedBranchName: "main" },
      { ...safeTarget, verifiedBranchName: "feature-history" },
      {
        ...safeTarget,
        verifiedEndpointHost: "ep-some-other-endpoint.us-east-2.aws.neon.tech",
      },
    ];

    for (const target of unsafeTargets) {
      expect(() => assertExecutionAwareTarget(target)).toThrow();
    }
  });

  test("rejects plausible but wrong Neon branch and compute IDs", () => {
    expect(() =>
      assertExecutionAwareTarget({
        ...safeTarget,
        verifiedBranchId: "br-calm-fog-aibvaxvt",
      })
    ).toThrow("pinned development branch");

    expect(() =>
      assertExecutionAwareTarget({
        ...safeTarget,
        verifiedComputeId: "ep-delicate-dream-ai62k4ve",
      })
    ).toThrow("pinned development compute");
  });

  test("accepts production only with an explicit flag and injected verified target", () => {
    const [productionEndpointHost] = productionTargetFixture.endpointHosts;
    const verified = assertExecutionAwareTarget(
      {
        databaseUrl: `postgresql://redacted@${productionEndpointHost}/neondb?sslmode=require`,
        confirmationToken: productionTargetFixture.confirmationToken,
        continuousIntegration: undefined,
        executionFlag: "--execute-production-import",
        executionMode: "production",
        nodeEnv: "production",
        verifiedBranchId: productionTargetFixture.branchId,
        verifiedBranchName: productionTargetFixture.branchName,
        verifiedComputeId: productionTargetFixture.computeId,
        verifiedEndpointHost: productionEndpointHost,
        vercelEnv: undefined,
      },
      productionTargetFixture
    );

    expect(verified).toEqual({
      branchId: productionTargetFixture.branchId,
      branchName: productionTargetFixture.branchName,
      computeId: productionTargetFixture.computeId,
      endpointHost: productionEndpointHost,
    });
  });

  test("rejects every unsafe production execution signal and target mismatch", () => {
    const [productionEndpointHost] = productionTargetFixture.endpointHosts;
    const safeProductionTarget = {
      databaseUrl: `postgresql://redacted@${productionEndpointHost}/neondb?sslmode=require`,
      confirmationToken: productionTargetFixture.confirmationToken,
      continuousIntegration: undefined,
      executionFlag: "--execute-production-import",
      executionMode: "production",
      nodeEnv: "production",
      verifiedBranchId: productionTargetFixture.branchId,
      verifiedBranchName: productionTargetFixture.branchName,
      verifiedComputeId: productionTargetFixture.computeId,
      verifiedEndpointHost: productionEndpointHost,
      vercelEnv: undefined,
    } as const;
    const unsafeTargets = [
      { ...safeProductionTarget, executionFlag: undefined },
      { ...safeProductionTarget, executionFlag: "--execute-development-import" },
      { ...safeProductionTarget, confirmationToken: undefined },
      { ...safeProductionTarget, confirmationToken: "wrong-confirmation" },
      { ...safeProductionTarget, continuousIntegration: "1" },
      { ...safeProductionTarget, nodeEnv: "development" },
      { ...safeProductionTarget, vercelEnv: "production" },
      { ...safeProductionTarget, vercelEnv: "preview" },
      { ...safeProductionTarget, vercelEnv: "development" },
      { ...safeProductionTarget, databaseUrl: undefined },
      { ...safeProductionTarget, verifiedBranchId: undefined },
      { ...safeProductionTarget, verifiedComputeId: undefined },
      { ...safeProductionTarget, verifiedEndpointHost: undefined },
      {
        ...safeProductionTarget,
        databaseUrl: safeProductionTarget.databaseUrl.replace(
          `${productionTargetFixture.computeId}.`,
          `${productionTargetFixture.computeId}-pooler.`
        ),
        verifiedEndpointHost: productionEndpointHost.replace(
          `${productionTargetFixture.computeId}.`,
          `${productionTargetFixture.computeId}-pooler.`
        ),
      },
      { ...safeProductionTarget, verifiedBranchName: "development" },
      {
        ...safeProductionTarget,
        verifiedBranchId: `${productionTargetFixture.branchId}-wrong`,
      },
      {
        ...safeProductionTarget,
        verifiedComputeId: `${productionTargetFixture.computeId}-wrong`,
      },
      {
        ...safeProductionTarget,
        verifiedEndpointHost: `wrong-${productionEndpointHost}`,
      },
      {
        ...safeProductionTarget,
        databaseUrl:
          "postgresql://redacted@ep-other-fixture.us-east-1.aws.neon.tech/neondb",
      },
    ];

    expect(() => assertExecutionAwareTarget(safeProductionTarget)).toThrow();
    for (const target of unsafeTargets) {
      expect(() => assertExecutionAwareTarget(target, productionTargetFixture)).toThrow();
    }
  });
});

describe("persistHistoricalSalesImport", () => {
  test("creates one batch and every daily row inside one transaction", async () => {
    const prepared = await readHistoricalSalesImport(candidatePath, "0414694");
    const calls: string[] = [];
    const repository: HistoricalSalesImportRepository = {
      transaction: async (operation) => {
        calls.push("transaction:start");
        const result = await operation({
          findConflictingBusinessDate: async () => null,
          insertBatch: async () => {
            calls.push("batch");
            return "019ff344-acb0-7cd0-ae62-707756045abf";
          },
          insertDailyRows: async (rows) => {
            calls.push(`rows:${rows.length}:${rows[147].amountMxn}`);
          },
        });
        calls.push("transaction:commit");
        return result;
      },
    };

    const result = await persistHistoricalSalesImport(prepared, repository);

    expect(result).toEqual({
      batchId: "019ff344-acb0-7cd0-ae62-707756045abf",
      importedRowCount: 1917,
    });
    expect(calls).toEqual([
      "transaction:start",
      "batch",
      "rows:1917:null",
      "transaction:commit",
    ]);
  });

  test("rejects an exact rerun before checking dates or inserting rows", async () => {
    const prepared = await readHistoricalSalesImport(candidatePath, null);
    const repository: HistoricalSalesImportRepository = {
      transaction: async (operation) =>
        operation({
          findConflictingBusinessDate: async () => {
            throw new Error("must not check dates after a hash conflict");
          },
          insertBatch: async () => null,
          insertDailyRows: async () => {
            throw new Error("must not insert rows after a hash conflict");
          },
        }),
    };

    await expect(
      persistHistoricalSalesImport(prepared, repository)
    ).rejects.toBeInstanceOf(HistoricalSalesImportValidationError);
  });

  test("rejects existing dates without inserting daily rows", async () => {
    const prepared = await readHistoricalSalesImport(candidatePath, null);
    let insertedRows = false;
    const repository: HistoricalSalesImportRepository = {
      transaction: async (operation) =>
        operation({
          findConflictingBusinessDate: async () => "2023-01-02",
          insertBatch: async () => "new-batch-id",
          insertDailyRows: async () => {
            insertedRows = true;
          },
        }),
    };

    await expect(persistHistoricalSalesImport(prepared, repository)).rejects.toThrow(
      "2023-01-02"
    );
    expect(insertedRows).toBe(false);
  });
});
