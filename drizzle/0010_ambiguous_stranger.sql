CREATE TABLE `paper_bots` (
	`user_email` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`strategy` text NOT NULL,
	`coins` text DEFAULT '[]' NOT NULL,
	`timeframe` text DEFAULT '15m' NOT NULL,
	`min_confidence` integer DEFAULT 80 NOT NULL,
	`risk_pct` real DEFAULT 1 NOT NULL,
	`daily_loss_pct` real DEFAULT 3 NOT NULL,
	`active` integer DEFAULT false NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
