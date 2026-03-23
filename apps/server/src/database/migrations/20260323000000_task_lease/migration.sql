ALTER TABLE "tasks" ADD COLUMN "worker_id" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "lease_expires_at" timestamp;
