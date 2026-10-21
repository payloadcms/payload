CREATE TABLE `_articles_v` (
	`id` integer PRIMARY KEY NOT NULL,
	`parent_id` text,
	`version_shared` text,
	`version_updated_at` text,
	`version_created_at` text,
	`version__status` text DEFAULT 'draft',
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`snapshot` integer,
	`published_locale` text,
	`latest` integer,
	`autosave` integer,
	FOREIGN KEY (`parent_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE TABLE `_articles_v_locales` (
	`version_title` text,
	`id` integer PRIMARY KEY NOT NULL,
	`_locale` text NOT NULL,
	`_parent_id` integer NOT NULL,
	FOREIGN KEY (`_parent_id`) REFERENCES `_articles_v`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `_articles_v_version_sections` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`label` text,
	`_uuid` text,
	FOREIGN KEY (`_parent_id`) REFERENCES `_articles_v`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `_articles_v_version_sections_locales` (
	`translation` text,
	`id` integer PRIMARY KEY NOT NULL,
	`_locale` text NOT NULL,
	`_parent_id` integer NOT NULL,
	FOREIGN KEY (`_parent_id`) REFERENCES `_articles_v_version_sections`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `_settings_v` (
	`id` integer PRIMARY KEY NOT NULL,
	`version_shared` text,
	`version__status` text DEFAULT 'draft',
	`version_updated_at` text,
	`version_created_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`snapshot` integer,
	`published_locale` text,
	`latest` integer,
	`autosave` integer
);

CREATE TABLE `_settings_v_locales` (
	`version_title` text,
	`id` integer PRIMARY KEY NOT NULL,
	`_locale` text NOT NULL,
	`_parent_id` integer NOT NULL,
	FOREIGN KEY (`_parent_id`) REFERENCES `_settings_v`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `_settings_v_version_sections` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`label` text,
	`_uuid` text,
	FOREIGN KEY (`_parent_id`) REFERENCES `_settings_v`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `_settings_v_version_sections_locales` (
	`translation` text,
	`id` integer PRIMARY KEY NOT NULL,
	`_locale` text NOT NULL,
	`_parent_id` integer NOT NULL,
	FOREIGN KEY (`_parent_id`) REFERENCES `_settings_v_version_sections`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `articles` (
	`id` text PRIMARY KEY NOT NULL,
	`shared` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`_status` text DEFAULT 'draft'
);

CREATE TABLE `articles_locales` (
	`title` text,
	`id` integer PRIMARY KEY NOT NULL,
	`_locale` text NOT NULL,
	`_parent_id` text NOT NULL,
	FOREIGN KEY (`_parent_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `articles_sections` (
	`_order` integer NOT NULL,
	`_parent_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`label` text,
	FOREIGN KEY (`_parent_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `articles_sections_locales` (
	`translation` text,
	`id` integer PRIMARY KEY NOT NULL,
	`_locale` text NOT NULL,
	`_parent_id` text NOT NULL,
	FOREIGN KEY (`_parent_id`) REFERENCES `articles_sections`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `payload_jobs` (
	`id` integer PRIMARY KEY NOT NULL,
	`input` text,
	`completed_at` text,
	`total_tried` numeric DEFAULT 0,
	`has_error` integer DEFAULT false,
	`error` text,
	`task_slug` text,
	`queue` text DEFAULT 'default',
	`wait_until` text,
	`processing` integer DEFAULT false,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);

CREATE TABLE `payload_jobs_log` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`executed_at` text NOT NULL,
	`completed_at` text NOT NULL,
	`task_slug` text NOT NULL,
	`task_i_d` text NOT NULL,
	`input` text,
	`output` text,
	`state` text NOT NULL,
	`error` text,
	FOREIGN KEY (`_parent_id`) REFERENCES `payload_jobs`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `payload_kv` (
	`id` integer PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`data` text NOT NULL
);

CREATE TABLE `payload_locked_documents` (
	`id` integer PRIMARY KEY NOT NULL,
	`global_slug` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);

CREATE TABLE `payload_locked_documents_rels` (
	`id` integer PRIMARY KEY NOT NULL,
	`order` integer,
	`parent_id` integer NOT NULL,
	`path` text NOT NULL,
	`articles_id` text,
	`users_id` integer,
	FOREIGN KEY (`parent_id`) REFERENCES `payload_locked_documents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`articles_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`users_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `payload_migrations` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text,
	`batch` numeric,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);

CREATE TABLE `payload_preferences` (
	`id` integer PRIMARY KEY NOT NULL,
	`key` text,
	`value` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);

CREATE TABLE `payload_preferences_rels` (
	`id` integer PRIMARY KEY NOT NULL,
	`order` integer,
	`parent_id` integer NOT NULL,
	`path` text NOT NULL,
	`users_id` integer,
	FOREIGN KEY (`parent_id`) REFERENCES `payload_preferences`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`users_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`shared` text,
	`_status` text DEFAULT 'draft',
	`updated_at` text,
	`created_at` text
);

CREATE TABLE `settings_locales` (
	`title` text,
	`id` integer PRIMARY KEY NOT NULL,
	`_locale` text NOT NULL,
	`_parent_id` integer NOT NULL,
	FOREIGN KEY (`_parent_id`) REFERENCES `settings`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `settings_sections` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`label` text,
	FOREIGN KEY (`_parent_id`) REFERENCES `settings`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `settings_sections_locales` (
	`translation` text,
	`id` integer PRIMARY KEY NOT NULL,
	`_locale` text NOT NULL,
	`_parent_id` text NOT NULL,
	FOREIGN KEY (`_parent_id`) REFERENCES `settings_sections`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`email` text NOT NULL,
	`reset_password_token` text,
	`reset_password_expiration` text,
	`salt` text,
	`hash` text,
	`reset_password_requested_at` text,
	`login_attempts` numeric DEFAULT 0,
	`lock_until` text
);

CREATE TABLE `users_sessions` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`_parent_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX `_articles_v_autosave_idx` ON `_articles_v` (`autosave`);

CREATE INDEX `_articles_v_created_at_idx` ON `_articles_v` (`created_at`);

CREATE INDEX `_articles_v_latest_idx` ON `_articles_v` (`latest`);

CREATE UNIQUE INDEX `_articles_v_locales_locale_parent_id_unique` ON `_articles_v_locales` (`_locale`,`_parent_id`);

CREATE INDEX `_articles_v_locales_parent_id_idx` ON `_articles_v_locales` (`_parent_id`);

CREATE INDEX `_articles_v_parent_idx` ON `_articles_v` (`parent_id`);

CREATE INDEX `_articles_v_published_locale_idx` ON `_articles_v` (`published_locale`);

CREATE INDEX `_articles_v_snapshot_idx` ON `_articles_v` (`snapshot`);

CREATE INDEX `_articles_v_updated_at_idx` ON `_articles_v` (`updated_at`);

CREATE UNIQUE INDEX `_articles_v_version_sections_locales_locale_parent_id_unique` ON `_articles_v_version_sections_locales` (`_locale`,`_parent_id`);

CREATE INDEX `_articles_v_version_sections_locales_parent_id_idx` ON `_articles_v_version_sections_locales` (`_parent_id`);

CREATE INDEX `_articles_v_version_sections_order_idx` ON `_articles_v_version_sections` (`_order`);

CREATE INDEX `_articles_v_version_sections_parent_id_idx` ON `_articles_v_version_sections` (`_parent_id`);

CREATE INDEX `_articles_v_version_version__status_idx` ON `_articles_v` (`version__status`);

CREATE INDEX `_articles_v_version_version_created_at_idx` ON `_articles_v` (`version_created_at`);

CREATE INDEX `_articles_v_version_version_updated_at_idx` ON `_articles_v` (`version_updated_at`);

CREATE INDEX `_settings_v_autosave_idx` ON `_settings_v` (`autosave`);

CREATE INDEX `_settings_v_created_at_idx` ON `_settings_v` (`created_at`);

CREATE INDEX `_settings_v_latest_idx` ON `_settings_v` (`latest`);

CREATE UNIQUE INDEX `_settings_v_locales_locale_parent_id_unique` ON `_settings_v_locales` (`_locale`,`_parent_id`);

CREATE INDEX `_settings_v_locales_parent_id_idx` ON `_settings_v_locales` (`_parent_id`);

CREATE INDEX `_settings_v_published_locale_idx` ON `_settings_v` (`published_locale`);

CREATE INDEX `_settings_v_snapshot_idx` ON `_settings_v` (`snapshot`);

CREATE INDEX `_settings_v_updated_at_idx` ON `_settings_v` (`updated_at`);

CREATE UNIQUE INDEX `_settings_v_version_sections_locales_locale_parent_id_unique` ON `_settings_v_version_sections_locales` (`_locale`,`_parent_id`);

CREATE INDEX `_settings_v_version_sections_locales_parent_id_idx` ON `_settings_v_version_sections_locales` (`_parent_id`);

CREATE INDEX `_settings_v_version_sections_order_idx` ON `_settings_v_version_sections` (`_order`);

CREATE INDEX `_settings_v_version_sections_parent_id_idx` ON `_settings_v_version_sections` (`_parent_id`);

CREATE INDEX `_settings_v_version_version__status_idx` ON `_settings_v` (`version__status`);

CREATE INDEX `articles__status_idx` ON `articles` (`_status`);

CREATE INDEX `articles_created_at_idx` ON `articles` (`created_at`);

CREATE UNIQUE INDEX `articles_locales_locale_parent_id_unique` ON `articles_locales` (`_locale`,`_parent_id`);

CREATE INDEX `articles_locales_parent_id_idx` ON `articles_locales` (`_parent_id`);

CREATE UNIQUE INDEX `articles_sections_locales_locale_parent_id_unique` ON `articles_sections_locales` (`_locale`,`_parent_id`);

CREATE INDEX `articles_sections_locales_parent_id_idx` ON `articles_sections_locales` (`_parent_id`);

CREATE INDEX `articles_sections_order_idx` ON `articles_sections` (`_order`);

CREATE INDEX `articles_sections_parent_id_idx` ON `articles_sections` (`_parent_id`);

CREATE INDEX `articles_updated_at_idx` ON `articles` (`updated_at`);

CREATE INDEX `payload_jobs_completed_at_idx` ON `payload_jobs` (`completed_at`);

CREATE INDEX `payload_jobs_created_at_idx` ON `payload_jobs` (`created_at`);

CREATE INDEX `payload_jobs_has_error_idx` ON `payload_jobs` (`has_error`);

CREATE INDEX `payload_jobs_log_order_idx` ON `payload_jobs_log` (`_order`);

CREATE INDEX `payload_jobs_log_parent_id_idx` ON `payload_jobs_log` (`_parent_id`);

CREATE INDEX `payload_jobs_processing_idx` ON `payload_jobs` (`processing`);

CREATE INDEX `payload_jobs_queue_idx` ON `payload_jobs` (`queue`);

CREATE INDEX `payload_jobs_task_slug_idx` ON `payload_jobs` (`task_slug`);

CREATE INDEX `payload_jobs_total_tried_idx` ON `payload_jobs` (`total_tried`);

CREATE INDEX `payload_jobs_updated_at_idx` ON `payload_jobs` (`updated_at`);

CREATE INDEX `payload_jobs_wait_until_idx` ON `payload_jobs` (`wait_until`);

CREATE UNIQUE INDEX `payload_kv_key_idx` ON `payload_kv` (`key`);

CREATE INDEX `payload_locked_documents_created_at_idx` ON `payload_locked_documents` (`created_at`);

CREATE INDEX `payload_locked_documents_global_slug_idx` ON `payload_locked_documents` (`global_slug`);

CREATE INDEX `payload_locked_documents_rels_articles_id_idx` ON `payload_locked_documents_rels` (`articles_id`);

CREATE INDEX `payload_locked_documents_rels_order_idx` ON `payload_locked_documents_rels` (`order`);

CREATE INDEX `payload_locked_documents_rels_parent_idx` ON `payload_locked_documents_rels` (`parent_id`);

CREATE INDEX `payload_locked_documents_rels_path_idx` ON `payload_locked_documents_rels` (`path`);

CREATE INDEX `payload_locked_documents_rels_users_id_idx` ON `payload_locked_documents_rels` (`users_id`);

CREATE INDEX `payload_locked_documents_updated_at_idx` ON `payload_locked_documents` (`updated_at`);

CREATE INDEX `payload_migrations_created_at_idx` ON `payload_migrations` (`created_at`);

CREATE INDEX `payload_migrations_updated_at_idx` ON `payload_migrations` (`updated_at`);

CREATE INDEX `payload_preferences_created_at_idx` ON `payload_preferences` (`created_at`);

CREATE INDEX `payload_preferences_key_idx` ON `payload_preferences` (`key`);

CREATE INDEX `payload_preferences_rels_order_idx` ON `payload_preferences_rels` (`order`);

CREATE INDEX `payload_preferences_rels_parent_idx` ON `payload_preferences_rels` (`parent_id`);

CREATE INDEX `payload_preferences_rels_path_idx` ON `payload_preferences_rels` (`path`);

CREATE INDEX `payload_preferences_rels_users_id_idx` ON `payload_preferences_rels` (`users_id`);

CREATE INDEX `payload_preferences_updated_at_idx` ON `payload_preferences` (`updated_at`);

CREATE INDEX `settings__status_idx` ON `settings` (`_status`);

CREATE UNIQUE INDEX `settings_locales_locale_parent_id_unique` ON `settings_locales` (`_locale`,`_parent_id`);

CREATE INDEX `settings_locales_parent_id_idx` ON `settings_locales` (`_parent_id`);

CREATE UNIQUE INDEX `settings_sections_locales_locale_parent_id_unique` ON `settings_sections_locales` (`_locale`,`_parent_id`);

CREATE INDEX `settings_sections_locales_parent_id_idx` ON `settings_sections_locales` (`_parent_id`);

CREATE INDEX `settings_sections_order_idx` ON `settings_sections` (`_order`);

CREATE INDEX `settings_sections_parent_id_idx` ON `settings_sections` (`_parent_id`);

CREATE INDEX `users_created_at_idx` ON `users` (`created_at`);

CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);

CREATE INDEX `users_sessions_order_idx` ON `users_sessions` (`_order`);

CREATE INDEX `users_sessions_parent_id_idx` ON `users_sessions` (`_parent_id`);

CREATE INDEX `users_updated_at_idx` ON `users` (`updated_at`);
