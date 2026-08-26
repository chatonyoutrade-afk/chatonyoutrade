CREATE TABLE `compliance_evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`reference` text NOT NULL,
	`issuer` text NOT NULL,
	`status` text DEFAULT 'recorded' NOT NULL,
	`document_date` integer,
	`expires_at` integer,
	`note` text,
	`added_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_compliance_evidence_category_updated` ON `compliance_evidence` (`category`,`updated_at`);--> statement-breakpoint
CREATE INDEX `idx_compliance_evidence_status_expiry` ON `compliance_evidence` (`status`,`expires_at`);