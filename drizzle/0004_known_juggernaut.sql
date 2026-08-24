CREATE TABLE `testnet_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_email` text NOT NULL,
	`asset` text NOT NULL,
	`symbol` text NOT NULL,
	`side` text DEFAULT 'BUY' NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`binance_status` text DEFAULT 'PENDING' NOT NULL,
	`client_order_id` text NOT NULL,
	`binance_order_id` text,
	`protection_order_list_id` text,
	`quote_amount` real NOT NULL,
	`quantity` real DEFAULT 0 NOT NULL,
	`entry_price` real NOT NULL,
	`stop_price` real NOT NULL,
	`target_price` real NOT NULL,
	`exit_price` real,
	`pnl_quote` real DEFAULT 0 NOT NULL,
	`confidence` integer NOT NULL,
	`error` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`closed_at` integer
);
--> statement-breakpoint
CREATE TABLE `trading_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_email` text NOT NULL,
	`category` text NOT NULL,
	`action` text NOT NULL,
	`entity_id` text,
	`detail` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `paper_settings` ADD `emergency_stop` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `paper_settings` ADD `auto_testnet_enabled` integer DEFAULT false NOT NULL;