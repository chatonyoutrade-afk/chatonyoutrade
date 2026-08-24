CREATE TABLE `ai_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_email` text NOT NULL,
	`asset` text NOT NULL,
	`decision` text NOT NULL,
	`confidence` integer NOT NULL,
	`reasons` text NOT NULL,
	`indicators` text NOT NULL,
	`entry_price` real NOT NULL,
	`stop_price` real,
	`target_price` real,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `paper_settings` ADD `daily_stop_required` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `paper_settings` ADD `trade_alerts` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `paper_settings` ADD `ai_alerts` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `paper_settings` ADD `loss_alerts` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `paper_settings` ADD `weekly_report` integer DEFAULT false NOT NULL;