ALTER TABLE "sales_sessions" DROP CONSTRAINT "sales_sessions_session_date_unique";--> statement-breakpoint
ALTER TABLE "sales_sessions" ADD COLUMN "session_number" integer DEFAULT 1 NOT NULL;