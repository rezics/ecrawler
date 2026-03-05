CREATE TYPE "task_status" AS ENUM('pending', 'processing', 'completed');--> statement-breakpoint
CREATE TABLE "results" (
	"id" uuid PRIMARY KEY,
	"tags" text[] NOT NULL,
	"link" text NOT NULL,
	"meta" jsonb,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"task_id" uuid
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY,
	"status" "task_status" DEFAULT 'pending'::"task_status" NOT NULL,
	"tags" text[] NOT NULL,
	"link" text NOT NULL,
	"meta" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token" (
	"data" text PRIMARY KEY
);
--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_task_id_tasks_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id");