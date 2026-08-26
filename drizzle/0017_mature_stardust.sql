CREATE TABLE `readiness_drills` (
	`id` text PRIMARY KEY NOT NULL,
	`user_email` text NOT NULL,
	`status` text NOT NULL,
	`automatic_checks` text DEFAULT '[]' NOT NULL,
	`manual_checks` text DEFAULT '[]' NOT NULL,
	`note` text NOT NULL,
	`conducted_by` text NOT NULL,
	`conducted_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_readiness_drills_user_conducted` ON `readiness_drills` (`user_email`,`conducted_at`);