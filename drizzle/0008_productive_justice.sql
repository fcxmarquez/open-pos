CREATE TABLE "historical_daily_sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_batch_id" uuid NOT NULL,
	"business_date" date NOT NULL,
	"amount_mxn" numeric(12, 2),
	"selected_source" text NOT NULL,
	"selection_basis" text NOT NULL,
	"merge_status" text NOT NULL,
	"source_row_number" integer NOT NULL,
	"provenance" jsonb NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ck_historical_daily_sales_amount" CHECK ("historical_daily_sales"."amount_mxn" IS NULL OR "historical_daily_sales"."amount_mxn" >= 0),
	CONSTRAINT "ck_historical_daily_sales_source_row" CHECK ("historical_daily_sales"."source_row_number" >= 2),
	CONSTRAINT "ck_historical_daily_sales_source_status" CHECK ((
          "historical_daily_sales"."selected_source" = 'notebook'
          AND "historical_daily_sales"."selection_basis" = 'notebook_authoritative'
          AND (
            ("historical_daily_sales"."amount_mxn" IS NOT NULL AND "historical_daily_sales"."merge_status" = 'ready_notebook_authoritative')
            OR ("historical_daily_sales"."amount_mxn" IS NULL AND "historical_daily_sales"."merge_status" = 'unresolved_notebook_blank')
          )
        ) OR (
          "historical_daily_sales"."selected_source" = 'managementpro'
          AND "historical_daily_sales"."selection_basis" = 'managementpro_nonoverlap_gap_fill'
          AND (
            ("historical_daily_sales"."amount_mxn" IS NOT NULL AND "historical_daily_sales"."merge_status" = 'ready_managementpro_gap_fill')
            OR ("historical_daily_sales"."amount_mxn" IS NULL AND "historical_daily_sales"."merge_status" = 'unresolved_managementpro_blank')
          )
        ))
);
--> statement-breakpoint
CREATE TABLE "historical_sales_import_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_file_name" text NOT NULL,
	"source_file_path" text NOT NULL,
	"source_file_sha256" text NOT NULL,
	"selection_policy" text NOT NULL,
	"expected_row_count" integer NOT NULL,
	"expected_known_amount_count" integer NOT NULL,
	"expected_null_amount_count" integer NOT NULL,
	"expected_start_date" date NOT NULL,
	"expected_end_date" date NOT NULL,
	"expected_total_amount_mxn" numeric(14, 2) NOT NULL,
	"repository_commit" text,
	"imported_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ck_historical_import_batches_sha256" CHECK ("historical_sales_import_batches"."source_file_sha256" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "ck_historical_import_batches_counts" CHECK ("historical_sales_import_batches"."expected_row_count" > 0
        AND "historical_sales_import_batches"."expected_known_amount_count" >= 0
        AND "historical_sales_import_batches"."expected_null_amount_count" >= 0
        AND "historical_sales_import_batches"."expected_known_amount_count" + "historical_sales_import_batches"."expected_null_amount_count" = "historical_sales_import_batches"."expected_row_count"),
	CONSTRAINT "ck_historical_import_batches_date_range" CHECK ("historical_sales_import_batches"."expected_start_date" <= "historical_sales_import_batches"."expected_end_date"),
	CONSTRAINT "ck_historical_import_batches_total" CHECK ("historical_sales_import_batches"."expected_total_amount_mxn" >= 0)
);
--> statement-breakpoint
ALTER TABLE "historical_daily_sales" ADD CONSTRAINT "historical_daily_sales_import_batch_id_historical_sales_import_batches_id_fk" FOREIGN KEY ("import_batch_id") REFERENCES "public"."historical_sales_import_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_historical_daily_sales_business_date" ON "historical_daily_sales" USING btree ("business_date");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_historical_daily_sales_batch_row" ON "historical_daily_sales" USING btree ("import_batch_id","source_row_number");--> statement-breakpoint
CREATE INDEX "idx_historical_daily_sales_batch" ON "historical_daily_sales" USING btree ("import_batch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_historical_import_batches_sha256" ON "historical_sales_import_batches" USING btree ("source_file_sha256");