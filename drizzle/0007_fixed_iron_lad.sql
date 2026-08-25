CREATE TABLE `auth_throttle` (
	`key` text PRIMARY KEY NOT NULL,
	`failures` integer NOT NULL,
	`first_failure_at` integer NOT NULL,
	`locked_until` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_auth_throttle_locked_until` ON `auth_throttle` (`locked_until`);