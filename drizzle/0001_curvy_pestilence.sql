ALTER TABLE "products" ADD COLUMN "plu_code" text;--> statement-breakpoint
CREATE INDEX "idx_products_plu_code" ON "products" USING btree ("plu_code") WHERE plu_code IS NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_plu_code_unique" UNIQUE("plu_code");