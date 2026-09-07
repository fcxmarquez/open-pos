import { inArray } from "drizzle-orm";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import type * as schema from "@/db/schema";
import { historicalDailySales, historicalSalesImportBatches } from "@/db/schema";
import type { HistoricalSalesImportRepository } from "./historical-sales-import";

type HistoricalSalesDatabase = NeonDatabase<typeof schema>;

export function createDrizzleHistoricalSalesImportRepository(
  database: HistoricalSalesDatabase
): HistoricalSalesImportRepository {
  return {
    transaction: (operation) =>
      database.transaction(async (databaseTransaction) =>
        operation({
          findConflictingBusinessDate: async (dates) => {
            const conflict = await databaseTransaction
              .select({ businessDate: historicalDailySales.businessDate })
              .from(historicalDailySales)
              .where(inArray(historicalDailySales.businessDate, dates))
              .limit(1);
            return conflict[0]?.businessDate ?? null;
          },
          insertBatch: async (batch) => {
            const inserted = await databaseTransaction
              .insert(historicalSalesImportBatches)
              .values(batch)
              .onConflictDoNothing({
                target: historicalSalesImportBatches.sourceFileSha256,
              })
              .returning({ id: historicalSalesImportBatches.id });
            return inserted[0]?.id ?? null;
          },
          insertDailyRows: async (rows) => {
            for (let index = 0; index < rows.length; index += 250) {
              await databaseTransaction.insert(historicalDailySales).values(
                rows.slice(index, index + 250).map((row) => ({
                  amountMxn: row.amountMxn,
                  businessDate: row.businessDate,
                  importBatchId: row.importBatchId,
                  mergeStatus: row.mergeStatus,
                  notes: row.notes,
                  provenance: row.provenance,
                  selectedSource: row.selectedSource,
                  selectionBasis: row.selectionBasis,
                  sourceRowNumber: row.sourceRowNumber,
                }))
              );
            }
          },
        })
      ),
  };
}
