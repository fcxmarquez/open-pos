ALTER TABLE "sales" ADD COLUMN "subtotal" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "discount_type" text;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "discount_value" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "discount_amount" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
UPDATE "sales" SET "subtotal" = "total" WHERE "subtotal" IS NULL;--> statement-breakpoint
ALTER TABLE "sales" ALTER COLUMN "subtotal" SET NOT NULL;