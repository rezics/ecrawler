CREATE TABLE "results" (
	"id" uuid PRIMARY KEY NOT NULL,
	"worker_id" uuid NOT NULL,
	"reported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"data" jsonb,
	"error" jsonb
);
