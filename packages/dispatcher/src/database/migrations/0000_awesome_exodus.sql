CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"data" jsonb NOT NULL,
	CONSTRAINT "tasks_data_unique" UNIQUE("data")
);
--> statement-breakpoint
CREATE TABLE "token" (
	"data" text PRIMARY KEY NOT NULL
);
