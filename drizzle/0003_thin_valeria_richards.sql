CREATE TABLE `exchange_connections` (
	`user_email` text PRIMARY KEY NOT NULL,
	`exchange` text DEFAULT 'binance' NOT NULL,
	`environment` text DEFAULT 'testnet' NOT NULL,
	`encrypted_credentials` text NOT NULL,
	`credential_iv` text NOT NULL,
	`api_key_hint` text NOT NULL,
	`can_trade` integer DEFAULT false NOT NULL,
	`permissions` text DEFAULT '[]' NOT NULL,
	`balances` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'connected' NOT NULL,
	`connected_at` integer NOT NULL,
	`last_checked_at` integer NOT NULL
);
