import { resolve } from "node:path";
import {
  assertSafeHistoricalImportTarget,
  type ExpectedHistoricalImportTarget,
  persistHistoricalSalesImport,
  readHistoricalSalesImport,
} from "@/lib/server/historical-sales-import";
import { createDrizzleHistoricalSalesImportRepository } from "@/lib/server/historical-sales-import-repository";

type ImportTarget = "development" | "production";

const developmentExecutionFlag = "--execute-development-import";
const productionExecutionFlag = "--execute-production-import";
const dryRunFlag = "--dry-run";

function fail(message: string): never {
  throw new Error(message);
}

function readArgument(prefix: string): string | undefined {
  return process.argv
    .find((argument) => argument.startsWith(prefix))
    ?.slice(prefix.length);
}

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name];
  if (!value) {
    fail(`${name} is required.`);
  }
  return value;
}

function assertManualRuntime(): void {
  if (process.env.VERCEL) {
    fail("Historical sales import is prohibited in Vercel runtimes.");
  }
  if (process.env.CI) {
    fail("Historical sales import is prohibited in CI runtimes.");
  }
}

function readOperation(): {
  dryRun: boolean;
  executionFlag: string;
  target: ImportTarget;
} {
  const selectedFlags = [
    developmentExecutionFlag,
    productionExecutionFlag,
    dryRunFlag,
  ].filter((flag) => process.argv.includes(flag));

  if (selectedFlags.length !== 1) {
    fail(
      `Choose exactly one operation: ${dryRunFlag}, ${developmentExecutionFlag}, or ${productionExecutionFlag}.`
    );
  }

  const selectedFlag = selectedFlags[0];
  const requestedTarget = readArgument("--target=");
  if (
    requestedTarget !== undefined &&
    requestedTarget !== "development" &&
    requestedTarget !== "production"
  ) {
    fail('--target must be exactly "development" or "production".');
  }

  if (selectedFlag === productionExecutionFlag && requestedTarget !== "production") {
    fail("Production import requires the explicit --target=production argument.");
  }
  if (selectedFlag === developmentExecutionFlag && requestedTarget === "production") {
    fail("The development execution flag cannot target production.");
  }
  if (selectedFlag === dryRunFlag && requestedTarget === undefined) {
    fail(
      "Dry run requires an explicit --target=development or --target=production argument."
    );
  }

  const target: ImportTarget =
    selectedFlag === productionExecutionFlag || requestedTarget === "production"
      ? "production"
      : "development";

  return {
    dryRun: selectedFlag === dryRunFlag,
    executionFlag:
      target === "production" ? productionExecutionFlag : developmentExecutionFlag,
    target,
  };
}

function readExpectedProductionTarget(): ExpectedHistoricalImportTarget {
  return {
    branchId: requireEnvironmentVariable(
      "HISTORICAL_IMPORT_EXPECTED_PRODUCTION_NEON_BRANCH_ID"
    ),
    branchName: requireEnvironmentVariable(
      "HISTORICAL_IMPORT_EXPECTED_PRODUCTION_NEON_BRANCH_NAME"
    ),
    computeId: requireEnvironmentVariable(
      "HISTORICAL_IMPORT_EXPECTED_PRODUCTION_NEON_COMPUTE_ID"
    ),
    confirmationToken: requireEnvironmentVariable(
      "HISTORICAL_IMPORT_PRODUCTION_CONFIRMATION_TOKEN"
    ),
    endpointHosts: [
      requireEnvironmentVariable(
        "HISTORICAL_IMPORT_EXPECTED_PRODUCTION_NEON_ENDPOINT_HOST"
      ),
    ],
  };
}

async function verifyProductionTargetWithNeon(
  expectedTarget: ExpectedHistoricalImportTarget
): Promise<void> {
  const projectId = requireEnvironmentVariable("HISTORICAL_IMPORT_NEON_PROJECT_ID");
  const apiKey = requireEnvironmentVariable("NEON_API_KEY");
  const headers = { Authorization: `Bearer ${apiKey}` };
  const baseUrl = `https://console.neon.tech/api/v2/projects/${encodeURIComponent(projectId)}`;
  const [branchResponse, endpointsResponse] = await Promise.all([
    fetch(`${baseUrl}/branches/${encodeURIComponent(expectedTarget.branchId)}`, {
      headers,
    }),
    fetch(`${baseUrl}/endpoints`, { headers }),
  ]);

  if (!branchResponse.ok || !endpointsResponse.ok) {
    fail("Read-only Neon target verification failed.");
  }

  const branchPayload = (await branchResponse.json()) as {
    branch?: { id?: string; name?: string };
  };
  const endpointsPayload = (await endpointsResponse.json()) as {
    endpoints?: Array<{ branch_id?: string; host?: string; id?: string }>;
  };
  const branch = branchPayload.branch;
  const endpoint = endpointsPayload.endpoints?.find(
    (candidate) =>
      candidate.id === expectedTarget.computeId &&
      candidate.branch_id === expectedTarget.branchId
  );
  const expectedEndpointHost = expectedTarget.endpointHosts[0];

  if (
    branch?.id !== expectedTarget.branchId ||
    branch.name !== expectedTarget.branchName ||
    endpoint?.host !== expectedEndpointHost
  ) {
    fail("Read-only Neon target verification did not match the injected metadata.");
  }
}

function assertDirectDatabaseUrl(databaseUrl: string): void {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    fail("DATABASE_URL_UNPOOLED is not a valid URL.");
  }

  if (parsedUrl.hostname.split(".")[0]?.endsWith("-pooler")) {
    fail("DATABASE_URL_UNPOOLED must use a direct, non-pooler Neon endpoint.");
  }
}

async function main(): Promise<void> {
  assertManualRuntime();
  const operation = readOperation();
  const databaseUrl = requireEnvironmentVariable("DATABASE_URL_UNPOOLED");
  assertDirectDatabaseUrl(databaseUrl);

  const expectedProductionTarget =
    operation.target === "production" ? readExpectedProductionTarget() : undefined;
  if (expectedProductionTarget) {
    await verifyProductionTargetWithNeon(expectedProductionTarget);
  }

  const productionEndpointHost = expectedProductionTarget?.endpointHosts[0];
  const verifiedTarget = assertSafeHistoricalImportTarget(
    {
      confirmationToken: readArgument("--confirm="),
      continuousIntegration: process.env.CI,
      databaseUrl,
      executionFlag: operation.executionFlag,
      executionMode: operation.target,
      nodeEnv: process.env.NODE_ENV,
      verifiedBranchId:
        operation.target === "production"
          ? expectedProductionTarget?.branchId
          : process.env.HISTORICAL_IMPORT_VERIFIED_NEON_BRANCH_ID,
      verifiedBranchName:
        operation.target === "production"
          ? expectedProductionTarget?.branchName
          : process.env.HISTORICAL_IMPORT_VERIFIED_NEON_BRANCH_NAME,
      verifiedComputeId:
        operation.target === "production"
          ? expectedProductionTarget?.computeId
          : process.env.HISTORICAL_IMPORT_VERIFIED_NEON_COMPUTE_ID,
      verifiedEndpointHost:
        operation.target === "production"
          ? productionEndpointHost
          : process.env.HISTORICAL_IMPORT_VERIFIED_NEON_ENDPOINT_HOST,
      vercelEnv: process.env.VERCEL_ENV,
    },
    expectedProductionTarget
  );

  const candidatePath = resolve(
    process.cwd(),
    "export/daily-sales-notebook-authoritative-candidate.csv"
  );
  const prepared = await readHistoricalSalesImport(
    candidatePath,
    process.env.GIT_COMMIT_SHA ?? null
  );

  console.info(
    `Verified Neon target: branch ${verifiedTarget.branchName} (${verifiedTarget.branchId}), compute ${verifiedTarget.computeId}, endpoint ${verifiedTarget.endpointHost}.`
  );
  console.info(`Validated ${prepared.rows.length} historical daily-sales rows.`);

  if (operation.dryRun) {
    console.info(
      "Dry run completed; no database connection was opened and no rows were written."
    );
    return;
  }

  console.info(`Starting one atomic ${operation.target} import.`);
  const [neon, drizzleModule, schema, websocket] = await Promise.all([
    import("@neondatabase/serverless"),
    import("drizzle-orm/neon-serverless"),
    import("@/db/schema"),
    import("ws"),
  ]);
  neon.neonConfig.webSocketConstructor = websocket.default;
  const pool = new neon.Pool({ connectionString: databaseUrl, max: 1 });

  try {
    const database = drizzleModule.drizzle({ client: pool, schema });
    const result = await persistHistoricalSalesImport(
      prepared,
      createDrizzleHistoricalSalesImportRepository(database)
    );
    console.info(
      `Imported ${result.importedRowCount} rows in batch ${result.batchId}. Exact reruns and overlapping business dates are rejected.`
    );
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Historical sales import failed."
  );
  process.exitCode = 1;
});
