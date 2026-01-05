CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"data" jsonb,
	"hold" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token" (
	"data" text PRIMARY KEY NOT NULL
);
