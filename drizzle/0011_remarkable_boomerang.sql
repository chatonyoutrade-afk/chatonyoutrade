CREATE TABLE `paper_bot_alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_email` text NOT NULL,
	`asset` text NOT NULL,
	`decision` text NOT NULL,
	`confidence` integer NOT NULL,
	`period_key` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`provider_reference` text,
	`created_at` integer NOT NULL,
	`sent_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_paper_bot_alerts_dedupe` ON `paper_bot_alerts` (`user_email`,`asset`,`decision`,`period_key`);--> statement-breakpoint
CREATE INDEX `idx_paper_bot_alerts_user_created` ON `paper_bot_alerts` (`user_email`,`created_at`);