ALTER TABLE `paper_bot_alerts` ADD `kind` text DEFAULT 'ai' NOT NULL;--> statement-breakpoint
ALTER TABLE `paper_bot_alerts` ADD `title` text;--> statement-breakpoint
ALTER TABLE `paper_bot_alerts` ADD `message` text;--> statement-breakpoint
ALTER TABLE `paper_bot_alerts` ADD `href` text;