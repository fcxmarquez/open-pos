# Papelería Luna Historical Daily Sales Archive

Archive prepared on 2026-08-24 for long-term cloud storage and a future database migration.

## Purpose

This package preserves the two primary historical daily-sales sources and the derived notebook-authoritative import candidate. All monetary values are in Mexican pesos (MXN).

The CSV files must remain unchanged when copied to cloud storage. Keep them as CSV files rather than converting the canonical copies into Google Sheets. A separate Google Sheets viewing copy may be created later if needed.

## Archive contents

| File | Role | Data rows | Date range | Known amounts | Unresolved amounts | Selected-value total |
| --- | --- | ---: | --- | ---: | ---: | ---: |
| `notebook-sales-transcription.csv` | Reviewed transcription of the handwritten notebook and the authoritative source wherever it contains a dated row | 908 | 2023-01-02 to 2026-02-21 | 883 | 25 | MXN 679,244.50 |
| `managementpro-daily-sales-rescue.csv` | Daily sales rescued from the former ManagementPro POS backups and journals | 1,089 | 2019-06-17 to 2023-04-05 | 1,077 | 12 | MXN 304,552.76 |
| `daily-sales-notebook-authoritative-candidate.csv` | Derived migration candidate combining both sources under the policy documented below | 1,917 | 2019-06-17 to 2026-02-21 | 1,880 | 37 | MXN 952,814.76 |

The totals above are validation checksums. They should not be interpreted as proof of complete store revenue because ManagementPro-only dates may contain only sales recorded in that POS system.

## Integrity checksums

Use these SHA-256 values to confirm that a cloud copy or future working copy is byte-for-byte identical:

| File | SHA-256 |
| --- | --- |
| `daily-sales-notebook-authoritative-candidate.csv` | `44cd1a0e0aa1a8e66cc4d25632fc46f589bbc983ac7ccca896af0bf6b06f9014` |
| `notebook-sales-transcription.csv` | `1ede938df7c28d1c077b7880e5ca8449e8ca8713e60632bfc574731b4686af89` |
| `managementpro-daily-sales-rescue.csv` | `aee709b1f545f8fc8d6a487193b6aad12d08e59acbbc172e562a1a16f5c6cbb9` |

## Selection policy

The derived candidate uses the policy `notebook_authoritative_managementpro_gap_fill_v1`:

1. Build the union of all dates from both source CSVs.
2. When a notebook row exists, select the notebook amount exactly, including an unresolved blank.
3. When a date exists in both sources, never add the two amounts. The ManagementPro amount remains only in audit columns.
4. When no notebook row exists, select the ManagementPro amount as a historical gap fill.
5. Preserve unresolved amounts as blank (`NULL` in a future database), never as zero.
6. Preserve source, validation, confidence and provenance fields for later auditing.

There are 80 shared recorded dates between 2023-01-02 and 2023-04-05. The notebook is selected for all 80, so there is no source-handoff gap and no overlap double-counting.

## Candidate status summary

| Status | Rows | Meaning |
| --- | ---: | --- |
| `ready_notebook_authoritative` | 883 | Notebook amount selected |
| `unresolved_notebook_blank` | 25 | Notebook date is authoritative but its amount remains unknown |
| `ready_managementpro_gap_fill` | 997 | No notebook row exists; validated ManagementPro amount selected |
| `unresolved_managementpro_blank` | 12 | No notebook row exists and the ManagementPro amount remains unresolved |

The 12 unresolved ManagementPro rows retain their journal candidate amounts in `managementpro_journal_sales_mxn`, but those candidates are intentionally excluded from `amount_mxn`.

## Calendar gaps

The candidate covers 1,917 of the 2,442 calendar dates from 2019-06-17 through 2026-02-21. A missing calendar date is not automatically a missing sale; it may represent a Sunday, another closure day or a day with no source entry.

- 525 calendar dates have no row.
- 279 of those absent dates are Sundays.
- 37 additional dates have a row but an unresolved blank amount.
- The longest continuous absence is 2020-04-01 through 2020-05-31 (61 days).
- The next longest is 2019-06-18 through 2019-07-17 (30 days).

The two long gaps should remain documented as unknown. The CSV evidence alone does not establish whether they represent store closures or unavailable historical data.

## ManagementPro extraction boundary

ManagementPro amounts represent recorded POS sales, not guaranteed complete store revenue. The canonical MDB extraction grouped `Venta.Vn_Precio_Neto_Importe` by `Vn_Fecha`, restricted records to `Vn_Tabla LIKE 'POS-%'`, and excluded canceled rows where `Es_Cve_Estado = 'CA'`.

Returns and cash movements were treated as separate series and were not blindly added to gross sales. Journal evidence was used for validation and carefully adjudicated gap candidates, not as a raw total to sum.

## Database model

The implemented model keeps historical daily aggregates separate from normal POS tickets:

- `historical_daily_sales`: one authoritative aggregate row per business date, with a nullable amount, source, status and provenance.
- `historical_sales_import_batches`: one metadata row for the imported CSV, including its filename, SHA-256, selection policy, expected row count and import timestamp.

The import-batch table is not intended to store the CSV contents. It records the identity of the file used for an import. A future implementation may also record the cloud file ID, repository path and Git commit.

Historical aggregates should contribute only to revenue totals. Ticket counts, products, units, categories and cash-reconciliation history must continue to use genuine transactional POS data.

## Production import procedure

The importer is a manual, one-time CLI. Vercel and CI runtimes are blocked, and deployment builds never run database migrations or historical imports. The application continues using the pooled `DATABASE_URL`; migrations and this importer require the direct `DATABASE_URL_UNPOOLED` connection.

Run `bun run db:import:historical-sales -- --dry-run --target=production --confirm=<confirmation>` before execution. A production dry run and import require separately injected expected branch, compute, endpoint and confirmation metadata, plus `HISTORICAL_IMPORT_NEON_PROJECT_ID` and `NEON_API_KEY`. The CLI verifies that metadata with read-only Neon control-plane requests before it opens any database connection. It never stores production identifiers or credentials in this archive.

The eventual write requires the additional explicit `--execute-production-import` flag. Do not place execution flags in package scripts, deployment configuration or CI. Keep the exact commands and target metadata outside this archive until an authorized production maintenance window.

## Import validation

Before any production import:

1. Verify the candidate SHA-256.
2. Confirm exactly 1,917 unique chronological dates.
3. Confirm 1,880 known amounts and 37 unresolved blank amounts.
4. Confirm the selected-value checksum of MXN 952,814.76.
5. Reject duplicate dates and any attempt to convert blanks into zero.
6. Import the batch metadata and daily rows atomically.
7. Rehearse the migration and reporting queries against an isolated development database branch.
8. Compare daily, monthly and overall totals before considering production.

## Preservation notes

- Treat these three CSVs as immutable archive files.
- Create a new version rather than overwriting a canonical CSV after any correction.
- Recalculate and document the SHA-256 for every new version.
- Keep the original notebook scans and ManagementPro backups separately; they are not included in this export package.
- Intermediate image crops, previews, temporary scripts and audit workbooks were intentionally excluded from this final archive.
