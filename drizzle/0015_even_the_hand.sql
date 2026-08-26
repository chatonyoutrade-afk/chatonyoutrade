CREATE TABLE `owner_security` (
	`user_email` text PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`verified_at` integer,
	`code_hash` text,
	`code_salt` text,
	`code_iterations` integer,
	`challenge_issued_at` integer,
	`challenge_expires_at` integer,
	`failures` integer DEFAULT 0 NOT NULL,
	`locked_until` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_owner_security_challenge_expiry` ON `owner_security` (`challenge_expires_at`);