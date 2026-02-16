CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"barcode" text,
	"name" text,
	"price" numeric(10, 2) NOT NULL,
	"cost_price" numeric(10, 2),
	"category" text DEFAULT 'General',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
CREATE TABLE "sale_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"product_id" uuid,
	"barcode" text,
	"product_name" text NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"payment_amount" numeric(10, 2) NOT NULL,
	"change_amount" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_date" date NOT NULL,
	"system_total" numeric(10, 2) DEFAULT '0',
	"counted_total" numeric(10, 2),
	"difference" numeric(10, 2),
	"status" text DEFAULT 'open',
	"opened_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	CONSTRAINT "sales_sessions_session_date_unique" UNIQUE("session_date")
);
--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_session_id_sales_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sales_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_products_barcode" ON "products" USING btree ("barcode") WHERE barcode IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_products_name" ON "products" USING btree ("name") WHERE name IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_sale_items_sale_id" ON "sale_items" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "idx_sales_session_id" ON "sales" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_sales_created_at" ON "sales" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_sales_sessions_date" ON "sales_sessions" USING btree ("session_date");--> statement-breakpoint
CREATE INDEX "idx_sales_sessions_status" ON "sales_sessions" USING btree ("status");