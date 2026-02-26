CREATE TABLE `link` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `results` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`tags` text NOT NULL,
	`link` text NOT NULL,
	`by` text NOT NULL,
	`data` text
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`tags` text NOT NULL,
	`link` text NOT NULL,
	`by` text
);
--> statement-breakpoint
CREATE TABLE `token` (
	`data` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL
);
