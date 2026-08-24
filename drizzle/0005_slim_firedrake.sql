CREATE TABLE `kyc_applications` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`user_email` text NOT NULL,
	`user_display_name` text NOT NULL,
	`full_name` text NOT NULL,
	`birth_year` integer NOT NULL,
	`nationality` text NOT NULL,
	`pan_last4` text NOT NULL,
	`mobile_last4` text NOT NULL,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`pincode` text NOT NULL,
	`id_type` text NOT NULL,
	`evidence_summary` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`risk_level` text DEFAULT 'unrated' NOT NULL,
	`review_note` text,
	`review_checks` text DEFAULT '[]' NOT NULL,
	`reviewed_by` text,
	`submitted_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`reviewed_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_kyc_applications_user_email` ON `kyc_applications` (`user_email`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_kyc_applications_reference` ON `kyc_applications` (`reference`);--> statement-breakpoint
CREATE INDEX `idx_kyc_applications_status_updated` ON `kyc_applications` (`status`,`updated_at`);--> statement-breakpoint
CREATE TABLE `kyc_review_events` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`actor_email` text NOT NULL,
	`action` text NOT NULL,
	`note` text,
	`checks` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_kyc_review_events_application_created` ON `kyc_review_events` (`application_id`,`created_at`);