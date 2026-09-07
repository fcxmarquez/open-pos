import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

const CSV_HEADERS = [
  "date",
  "amount_mxn",
  "selected_source",
  "selection_basis",
  "merge_status",
  "notebook_amount_mxn",
  "notebook_review_status",
  "notebook_recognition_confidence",
  "notebook_source_page",
  "managementpro_amount_mxn",
  "managementpro_journal_sales_mxn",
  "managementpro_amount_basis",
  "managementpro_validation_status",
  "managementpro_source_method",
  "managementpro_source_snapshot",
  "notes",
] as const;

const PROVENANCE_HEADERS = CSV_HEADERS.slice(5, -1);

export const EXPECTED_HISTORICAL_SALES_IMPORT = {
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
} as const;

export const EXPECTED_HISTORICAL_SALES_NEON_TARGET = {
  branchId: "br-calm-fog-aibvaxvs",
  branchName: "development",
  computeId: "ep-delicate-dream-ai62k4vd",
  endpointHosts: [
    "ep-delicate-dream-ai62k4vd.c-4.us-east-1.aws.neon.tech",
    "ep-delicate-dream-ai62k4vd-pooler.c-4.us-east-1.aws.neon.tech",
  ],
} as const;

type SelectedSource = "managementpro" | "notebook";
type SelectionBasis = "managementpro_nonoverlap_gap_fill" | "notebook_authoritative";
type MergeStatus =
  | "ready_managementpro_gap_fill"
  | "ready_notebook_authoritative"
  | "unresolved_managementpro_blank"
  | "unresolved_notebook_blank";

export interface PreparedHistoricalSalesRow {
  amountMxn: string | null;
  businessDate: string;
  mergeStatus: MergeStatus;
  notes: string | null;
  provenance: Record<string, string | null>;
  selectedSource: SelectedSource;
  selectionBasis: SelectionBasis;
  sourceRowNumber: number;
}

export interface PreparedHistoricalSalesImport {
  batch: {
    expectedEndDate: string;
    expectedKnownAmountCount: number;
    expectedNullAmountCount: number;
    expectedRowCount: number;
    expectedStartDate: string;
    expectedTotalAmountMxn: string;
    repositoryCommit: string | null;
    selectionPolicy: string;
    sourceFileName: string;
    sourceFilePath: string;
    sourceFileSha256: string;
  };
  rows: PreparedHistoricalSalesRow[];
}

interface HistoricalSalesImportTransaction {
  findConflictingBusinessDate(dates: string[]): Promise<string | null>;
  insertBatch(batch: PreparedHistoricalSalesImport["batch"]): Promise<string | null>;
  insertDailyRows(
    rows: Array<PreparedHistoricalSalesRow & { importBatchId: string }>
  ): Promise<void>;
}

export interface HistoricalSalesImportRepository {
  transaction<T>(
    operation: (transaction: HistoricalSalesImportTransaction) => Promise<T>
  ): Promise<T>;
}

export class HistoricalSalesImportValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HistoricalSalesImportValidationError";
  }
}

function fail(message: string): never {
  throw new HistoricalSalesImportValidationError(message);
}

function parseCsvRows(contents: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < contents.length; index += 1) {
    const character = contents[index];

    if (inQuotes) {
      if (character === '"') {
        if (contents[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') {
      if (field.length > 0) {
        fail("Malformed CSV: a quoted field must start immediately after a separator.");
      }
      inQuotes = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.endsWith("\r") ? field.slice(0, -1) : field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (inQuotes) {
    fail("Malformed CSV: unterminated quoted field.");
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.endsWith("\r") ? field.slice(0, -1) : field);
    rows.push(row);
  }

  while (rows.length > 0 && rows.at(-1)?.every((value) => value === "")) {
    rows.pop();
  }

  return rows;
}

function assertExactHeaders(headers: string[]): void {
  const expected = CSV_HEADERS.join(",");
  const actual = headers.join(",");
  if (actual !== expected) {
    fail(`Unexpected CSV header. Expected exactly: ${expected}`);
  }
}

function assertDate(value: string, rowNumber: number): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    fail(`Invalid business date at CSV row ${rowNumber}.`);
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    fail(`Invalid business date at CSV row ${rowNumber}.`);
  }
}

function parseAmount(
  value: string,
  rowNumber: number
): {
  cents: number;
  stored: string | null;
} {
  if (value === "") {
    return { cents: 0, stored: null };
  }

  if (!/^\d+\.\d{2}$/.test(value)) {
    fail(`Invalid amount_mxn at CSV row ${rowNumber}; expected blank or decimal cents.`);
  }

  const [pesos, cents] = value.split(".");
  const amountInCents = Number.parseInt(pesos, 10) * 100 + Number.parseInt(cents, 10);
  if (!Number.isSafeInteger(amountInCents)) {
    fail(`amount_mxn is outside the supported range at CSV row ${rowNumber}.`);
  }

  return { cents: amountInCents, stored: value };
}

function assertSourceConsistency(
  values: Record<(typeof CSV_HEADERS)[number], string>,
  amountMxn: string | null,
  rowNumber: number
): {
  mergeStatus: MergeStatus;
  selectedSource: SelectedSource;
  selectionBasis: SelectionBasis;
} {
  const selectedSource = values.selected_source;
  const selectionBasis = values.selection_basis;
  const mergeStatus = values.merge_status;
  const isKnown = amountMxn !== null;

  const isValidNotebook =
    selectedSource === "notebook" &&
    selectionBasis === "notebook_authoritative" &&
    ((isKnown && mergeStatus === "ready_notebook_authoritative") ||
      (!isKnown && mergeStatus === "unresolved_notebook_blank")) &&
    (values.notebook_amount_mxn || null) === amountMxn;

  const isValidManagementPro =
    selectedSource === "managementpro" &&
    selectionBasis === "managementpro_nonoverlap_gap_fill" &&
    ((isKnown && mergeStatus === "ready_managementpro_gap_fill") ||
      (!isKnown && mergeStatus === "unresolved_managementpro_blank")) &&
    (values.managementpro_amount_mxn || null) === amountMxn;

  if (!(isValidNotebook || isValidManagementPro)) {
    fail(
      `Selected source, status, basis, or amount is inconsistent at CSV row ${rowNumber}.`
    );
  }

  return {
    mergeStatus: mergeStatus as MergeStatus,
    selectedSource: selectedSource as SelectedSource,
    selectionBasis: selectionBasis as SelectionBasis,
  };
}

function formatCents(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

export function parseHistoricalSalesCsv(contents: string): PreparedHistoricalSalesRow[] {
  const csvRows = parseCsvRows(contents);
  if (csvRows.length === 0) {
    fail("Historical sales CSV is empty.");
  }

  const [headers, ...dataRows] = csvRows;
  assertExactHeaders(headers);

  const seenDates = new Set<string>();
  const rows: PreparedHistoricalSalesRow[] = [];
  let knownAmountCount = 0;
  let nullAmountCount = 0;
  let totalCents = 0;
  let previousDate: string | null = null;

  for (const [rowIndex, fields] of dataRows.entries()) {
    const sourceRowNumber = rowIndex + 2;
    if (fields.length !== CSV_HEADERS.length) {
      fail(
        `Unexpected column count at CSV row ${sourceRowNumber}; expected ${CSV_HEADERS.length}.`
      );
    }

    const values = Object.fromEntries(
      CSV_HEADERS.map((header, index) => [header, fields[index]])
    ) as Record<(typeof CSV_HEADERS)[number], string>;

    assertDate(values.date, sourceRowNumber);
    if (seenDates.has(values.date)) {
      fail(`Duplicate business date ${values.date} at CSV row ${sourceRowNumber}.`);
    }
    if (previousDate !== null && values.date <= previousDate) {
      fail(
        `Business dates must be strictly chronological at CSV row ${sourceRowNumber}.`
      );
    }
    seenDates.add(values.date);
    previousDate = values.date;

    const amount = parseAmount(values.amount_mxn, sourceRowNumber);
    const source = assertSourceConsistency(values, amount.stored, sourceRowNumber);
    totalCents += amount.cents;
    if (amount.stored === null) {
      nullAmountCount += 1;
    } else {
      knownAmountCount += 1;
    }

    rows.push({
      amountMxn: amount.stored,
      businessDate: values.date,
      mergeStatus: source.mergeStatus,
      notes: values.notes || null,
      provenance: Object.fromEntries(
        PROVENANCE_HEADERS.map((header) => [header, values[header] || null])
      ),
      selectedSource: source.selectedSource,
      selectionBasis: source.selectionBasis,
      sourceRowNumber,
    });
  }

  const actualStartDate = rows[0]?.businessDate;
  const actualEndDate = rows.at(-1)?.businessDate;
  const actualTotal = formatCents(totalCents);
  const expected = EXPECTED_HISTORICAL_SALES_IMPORT;

  if (rows.length !== expected.rowCount) {
    fail(`Expected ${expected.rowCount} data rows, received ${rows.length}.`);
  }
  if (knownAmountCount !== expected.knownAmountCount) {
    fail(
      `Expected ${expected.knownAmountCount} known amounts, received ${knownAmountCount}.`
    );
  }
  if (nullAmountCount !== expected.nullAmountCount) {
    fail(
      `Expected ${expected.nullAmountCount} null amounts, received ${nullAmountCount}.`
    );
  }
  if (actualStartDate !== expected.startDate || actualEndDate !== expected.endDate) {
    fail(
      `Expected date range ${expected.startDate}..${expected.endDate}, received ${actualStartDate}..${actualEndDate}.`
    );
  }
  if (actualTotal !== expected.totalAmountMxn) {
    fail(`Expected selected total ${expected.totalAmountMxn}, received ${actualTotal}.`);
  }

  return rows;
}

function assertRepositoryCommit(value: string | null): void {
  if (value !== null && !/^[0-9a-f]{7,40}$/.test(value)) {
    fail("Repository commit must be a 7 to 40 character lowercase Git SHA.");
  }
}

export async function readHistoricalSalesImport(
  filePath: string,
  repositoryCommit: string | null
): Promise<PreparedHistoricalSalesImport> {
  assertRepositoryCommit(repositoryCommit);
  if (basename(filePath) !== EXPECTED_HISTORICAL_SALES_IMPORT.sourceFileName) {
    fail(`Unexpected source filename: ${basename(filePath)}.`);
  }

  const contents = await readFile(filePath);
  const actualSha256 = createHash("sha256").update(contents).digest("hex");
  if (actualSha256 !== EXPECTED_HISTORICAL_SALES_IMPORT.sha256) {
    fail(
      `Historical sales CSV SHA-256 mismatch; expected ${EXPECTED_HISTORICAL_SALES_IMPORT.sha256}.`
    );
  }

  const rows = parseHistoricalSalesCsv(contents.toString("utf8"));
  const expected = EXPECTED_HISTORICAL_SALES_IMPORT;

  return {
    batch: {
      expectedEndDate: expected.endDate,
      expectedKnownAmountCount: expected.knownAmountCount,
      expectedNullAmountCount: expected.nullAmountCount,
      expectedRowCount: expected.rowCount,
      expectedStartDate: expected.startDate,
      expectedTotalAmountMxn: expected.totalAmountMxn,
      repositoryCommit,
      selectionPolicy: expected.selectionPolicy,
      sourceFileName: expected.sourceFileName,
      sourceFilePath: expected.sourceFilePath,
      sourceFileSha256: expected.sha256,
    },
    rows,
  };
}

export interface HistoricalImportTargetInput {
  confirmationToken?: string;
  continuousIntegration?: string;
  databaseUrl: string | undefined;
  executionFlag?: string;
  executionMode?: "development" | "production";
  nodeEnv: string | undefined;
  verifiedBranchId: string | undefined;
  verifiedBranchName: string | undefined;
  verifiedComputeId: string | undefined;
  verifiedEndpointHost: string | undefined;
  vercelEnv: string | undefined;
}

export interface VerifiedHistoricalImportTarget {
  branchId: string;
  branchName: string;
  computeId: string;
  endpointHost: string;
}

export interface ExpectedHistoricalImportTarget {
  branchId: string;
  branchName: string;
  computeId: string;
  confirmationToken: string;
  endpointHosts: readonly string[];
}

export function assertSafeHistoricalImportTarget(
  input: HistoricalImportTargetInput,
  expectedProductionTarget?: ExpectedHistoricalImportTarget
): VerifiedHistoricalImportTarget {
  if (input.continuousIntegration) {
    fail("Historical sales import is prohibited in CI runtimes.");
  }
  if (input.vercelEnv) {
    fail("Historical sales import is prohibited in Vercel runtimes.");
  }

  const executionMode = input.executionMode ?? "development";
  let expectedTarget: ExpectedHistoricalImportTarget;

  if (executionMode === "development") {
    if (input.executionFlag !== "--execute-development-import") {
      fail("Development import requires the exact --execute-development-import flag.");
    }
    if (input.nodeEnv === "production") {
      fail("Development import is prohibited when NODE_ENV is production.");
    }
    expectedTarget = {
      ...EXPECTED_HISTORICAL_SALES_NEON_TARGET,
      confirmationToken: "",
    };
  } else {
    if (input.executionFlag !== "--execute-production-import") {
      fail("Production import requires the exact --execute-production-import flag.");
    }
    if (input.nodeEnv !== "production") {
      fail("Production import requires NODE_ENV=production.");
    }
    if (!expectedProductionTarget) {
      fail("Production import requires separately injected verified target metadata.");
    }
    if (input.confirmationToken !== expectedProductionTarget.confirmationToken) {
      fail("Production import confirmation does not match the injected target.");
    }
    expectedTarget = expectedProductionTarget;
  }

  if (input.verifiedBranchName !== expectedTarget.branchName) {
    fail(
      `The independently verified Neon branch name must be exactly "${expectedTarget.branchName}".`
    );
  }
  if (input.verifiedBranchId !== expectedTarget.branchId) {
    fail(
      `The verified Neon branch ID does not match the pinned ${executionMode} branch.`
    );
  }
  if (input.verifiedComputeId !== expectedTarget.computeId) {
    fail(
      `The verified Neon compute ID does not match the pinned ${executionMode} compute.`
    );
  }
  if (!input.databaseUrl || !input.verifiedEndpointHost) {
    fail("A database URL and verified Neon endpoint host are required.");
  }

  let databaseUrl: URL;
  try {
    databaseUrl = new URL(input.databaseUrl);
  } catch {
    fail("DATABASE_URL is not a valid URL.");
  }

  if (!["postgres:", "postgresql:"].includes(databaseUrl.protocol)) {
    fail("DATABASE_URL must use the PostgreSQL protocol.");
  }
  if (!databaseUrl.hostname.endsWith(".neon.tech")) {
    fail("DATABASE_URL must reference a Neon endpoint.");
  }
  const normalizedVerifiedHost = input.verifiedEndpointHost.toLowerCase();
  if (!expectedTarget.endpointHosts.some((host) => host === normalizedVerifiedHost)) {
    fail(
      `The verified endpoint host does not match the pinned ${executionMode} compute.`
    );
  }
  if (databaseUrl.hostname.toLowerCase() !== normalizedVerifiedHost) {
    fail(
      `DATABASE_URL does not match the independently verified ${executionMode} endpoint.`
    );
  }
  if (
    executionMode === "production" &&
    databaseUrl.hostname.split(".")[0]?.endsWith("-pooler")
  ) {
    fail("Production import requires a direct, non-pooler Neon endpoint.");
  }
  if (
    executionMode === "production" &&
    databaseUrl.searchParams.get("sslmode") !== "require"
  ) {
    fail("Production import requires sslmode=require.");
  }

  return {
    branchId: expectedTarget.branchId,
    branchName: expectedTarget.branchName,
    computeId: expectedTarget.computeId,
    endpointHost: databaseUrl.hostname,
  };
}

export async function persistHistoricalSalesImport(
  prepared: PreparedHistoricalSalesImport,
  repository: HistoricalSalesImportRepository
): Promise<{ batchId: string; importedRowCount: number }> {
  return repository.transaction(async (transaction) => {
    const batchId = await transaction.insertBatch(prepared.batch);
    if (batchId === null) {
      fail(`Import batch ${prepared.batch.sourceFileSha256} has already been imported.`);
    }

    const conflictingDate = await transaction.findConflictingBusinessDate(
      prepared.rows.map((row) => row.businessDate)
    );
    if (conflictingDate !== null) {
      fail(`Historical daily sales already contains business date ${conflictingDate}.`);
    }

    await transaction.insertDailyRows(
      prepared.rows.map((row) => ({ ...row, importBatchId: batchId }))
    );

    return { batchId, importedRowCount: prepared.rows.length };
  });
}
