CREATE TABLE `paper_accounts` (
	`user_email` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`balance_paise` integer DEFAULT 1000000 NOT NULL,
	`starting_balance_paise` integer DEFAULT 1000000 NOT NULL,
	`mode` text DEFAULT 'copilot' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `paper_settings` (
	`user_email` text PRIMARY KEY NOT NULL,
	`capital_paise` integer DEFAULT 1000000 NOT NULL,
	`max_risk_pct` real DEFAULT 1 NOT NULL,
	`daily_loss_pct` real DEFAULT 3 NOT NULL,
	`max_positions` integer DEFAULT 2 NOT NULL,
	`min_confidence` integer DEFAULT 80 NOT NULL,
	`stop_loss_required` integer DEFAULT true NOT NULL,
	`take_profit_required` integer DEFAULT true NOT NULL,
	`volatility_protection` integer DEFAULT true NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `paper_trades` (
	`id` text PRIMARY KEY NOT NULL,
	`user_email` text NOT NULL,
	`asset` text NOT NULL,
	`side` text NOT NULL,
	`amount_paise` integer NOT NULL,
	`entry_price` real NOT NULL,
	`stop_price` real NOT NULL,
	`target_price` real NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`pnl_paise` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
