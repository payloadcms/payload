import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-sqlite'

import { sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`relation\` (
  	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  	\`name\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`relation_updated_at_idx\` ON \`relation\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`relation_created_at_idx\` ON \`relation\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`posts_versioned_blocks_text_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`relation_id\` integer,
  	\`block_name\` text,
  	FOREIGN KEY (\`relation_id\`) REFERENCES \`relation\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`posts_versioned\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`posts_versioned_blocks_text_block_order_idx\` ON \`posts_versioned_blocks_text_block\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`posts_versioned_blocks_text_block_parent_id_idx\` ON \`posts_versioned_blocks_text_block\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`posts_versioned_blocks_text_block_path_idx\` ON \`posts_versioned_blocks_text_block\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`posts_versioned_blocks_text_block_relation_idx\` ON \`posts_versioned_blocks_text_block\` (\`relation_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`posts_versioned\` (
  	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  	\`title\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft'
  );
  `)
  await db.run(
    sql`CREATE INDEX \`posts_versioned_updated_at_idx\` ON \`posts_versioned\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`posts_versioned_created_at_idx\` ON \`posts_versioned\` (\`created_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`posts_versioned__status_idx\` ON \`posts_versioned\` (\`_status\`);`,
  )
  await db.run(sql`CREATE TABLE \`posts_versioned_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`relation_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`posts_versioned\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`relation_id\`) REFERENCES \`relation\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`posts_versioned_rels_order_idx\` ON \`posts_versioned_rels\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`posts_versioned_rels_parent_idx\` ON \`posts_versioned_rels\` (\`parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`posts_versioned_rels_path_idx\` ON \`posts_versioned_rels\` (\`path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`posts_versioned_rels_relation_id_idx\` ON \`posts_versioned_rels\` (\`relation_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_posts_versioned_v_blocks_text_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  	\`text\` text,
  	\`relation_id\` integer,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`relation_id\`) REFERENCES \`relation\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_posts_versioned_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_posts_versioned_v_blocks_text_block_order_idx\` ON \`_posts_versioned_v_blocks_text_block\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_posts_versioned_v_blocks_text_block_parent_id_idx\` ON \`_posts_versioned_v_blocks_text_block\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_posts_versioned_v_blocks_text_block_path_idx\` ON \`_posts_versioned_v_blocks_text_block\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_posts_versioned_v_blocks_text_block_relation_idx\` ON \`_posts_versioned_v_blocks_text_block\` (\`relation_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`_posts_versioned_v\` (
  	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  	\`parent_id\` integer,
  	\`version_title\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`published_locale\` text,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`posts_versioned\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_posts_versioned_v_parent_idx\` ON \`_posts_versioned_v\` (\`parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_posts_versioned_v_version_version_updated_at_idx\` ON \`_posts_versioned_v\` (\`version_updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_posts_versioned_v_version_version_created_at_idx\` ON \`_posts_versioned_v\` (\`version_created_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_posts_versioned_v_version_version__status_idx\` ON \`_posts_versioned_v\` (\`version__status\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_posts_versioned_v_created_at_idx\` ON \`_posts_versioned_v\` (\`created_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_posts_versioned_v_updated_at_idx\` ON \`_posts_versioned_v\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_posts_versioned_v_published_locale_idx\` ON \`_posts_versioned_v\` (\`published_locale\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_posts_versioned_v_latest_idx\` ON \`_posts_versioned_v\` (\`latest\`);`,
  )
  await db.run(sql`CREATE TABLE \`_posts_versioned_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`relation_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_posts_versioned_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`relation_id\`) REFERENCES \`relation\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_posts_versioned_v_rels_order_idx\` ON \`_posts_versioned_v_rels\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_posts_versioned_v_rels_parent_idx\` ON \`_posts_versioned_v_rels\` (\`parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_posts_versioned_v_rels_path_idx\` ON \`_posts_versioned_v_rels\` (\`path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_posts_versioned_v_rels_relation_id_idx\` ON \`_posts_versioned_v_rels\` (\`relation_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`posts_batches_blocks_text_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`posts_batches\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`posts_batches_blocks_text_block_order_idx\` ON \`posts_batches_blocks_text_block\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`posts_batches_blocks_text_block_parent_id_idx\` ON \`posts_batches_blocks_text_block\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`posts_batches_blocks_text_block_path_idx\` ON \`posts_batches_blocks_text_block\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`posts_batches\` (
  	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  	\`title\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(
    sql`CREATE INDEX \`posts_batches_updated_at_idx\` ON \`posts_batches\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`posts_batches_created_at_idx\` ON \`posts_batches\` (\`created_at\`);`,
  )
  await db.run(sql`CREATE TABLE \`posts_blocks_text_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`select\` text,
  	\`relation_id\` integer,
  	\`block_name\` text,
  	FOREIGN KEY (\`relation_id\`) REFERENCES \`relation\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`posts_blocks_text_block_order_idx\` ON \`posts_blocks_text_block\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`posts_blocks_text_block_parent_id_idx\` ON \`posts_blocks_text_block\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`posts_blocks_text_block_path_idx\` ON \`posts_blocks_text_block\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`posts_blocks_text_block_relation_idx\` ON \`posts_blocks_text_block\` (\`relation_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`posts_blocks_block_second\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`posts_blocks_block_second_order_idx\` ON \`posts_blocks_block_second\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`posts_blocks_block_second_parent_id_idx\` ON \`posts_blocks_block_second\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`posts_blocks_block_second_path_idx\` ON \`posts_blocks_block_second\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`posts_blocks_block_third\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`posts_blocks_block_third_order_idx\` ON \`posts_blocks_block_third\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`posts_blocks_block_third_parent_id_idx\` ON \`posts_blocks_block_third\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`posts_blocks_block_third_path_idx\` ON \`posts_blocks_block_third\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`posts_blocks_text_block_localized\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`posts_blocks_text_block_localized_order_idx\` ON \`posts_blocks_text_block_localized\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`posts_blocks_text_block_localized_parent_id_idx\` ON \`posts_blocks_text_block_localized\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`posts_blocks_text_block_localized_path_idx\` ON \`posts_blocks_text_block_localized\` (\`_path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`posts_blocks_text_block_localized_locale_idx\` ON \`posts_blocks_text_block_localized\` (\`_locale\`);`,
  )
  await db.run(sql`CREATE TABLE \`posts\` (
  	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  	\`title\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`posts_updated_at_idx\` ON \`posts\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`posts_created_at_idx\` ON \`posts\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`posts_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`relation_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`relation_id\`) REFERENCES \`relation\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`posts_rels_order_idx\` ON \`posts_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`posts_rels_parent_idx\` ON \`posts_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`posts_rels_path_idx\` ON \`posts_rels\` (\`path\`);`)
  await db.run(
    sql`CREATE INDEX \`posts_rels_relation_id_idx\` ON \`posts_rels\` (\`relation_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`CREATE TABLE \`users_sessions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`created_at\` text,
  	\`expires_at\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_sessions_order_idx\` ON \`users_sessions\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX \`users_sessions_parent_id_idx\` ON \`users_sessions\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`users\` (
  	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`email\` text NOT NULL,
  	\`reset_password_token\` text,
  	\`reset_password_expiration\` text,
  	\`salt\` text,
  	\`hash\` text,
  	\`login_attempts\` numeric DEFAULT 0,
  	\`lock_until\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents\` (
  	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  	\`global_slug\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_global_slug_idx\` ON \`payload_locked_documents\` (\`global_slug\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_updated_at_idx\` ON \`payload_locked_documents\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_created_at_idx\` ON \`payload_locked_documents\` (\`created_at\`);`,
  )
  await db.run(sql`CREATE TABLE \`payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`relation_id\` integer,
  	\`posts_versioned_id\` integer,
  	\`posts_batches_id\` integer,
  	\`posts_id\` integer,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`relation_id\`) REFERENCES \`relation\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_versioned_id\`) REFERENCES \`posts_versioned\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_batches_id\`) REFERENCES \`posts_batches\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_relation_id_idx\` ON \`payload_locked_documents_rels\` (\`relation_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_posts_versioned_id_idx\` ON \`payload_locked_documents_rels\` (\`posts_versioned_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_posts_batches_id_idx\` ON \`payload_locked_documents_rels\` (\`posts_batches_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_posts_id_idx\` ON \`payload_locked_documents_rels\` (\`posts_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`payload_preferences\` (
  	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  	\`key\` text,
  	\`value\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(
    sql`CREATE INDEX \`payload_preferences_key_idx\` ON \`payload_preferences\` (\`key\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_preferences_updated_at_idx\` ON \`payload_preferences\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_preferences_created_at_idx\` ON \`payload_preferences\` (\`created_at\`);`,
  )
  await db.run(sql`CREATE TABLE \`payload_preferences_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`payload_preferences_rels_order_idx\` ON \`payload_preferences_rels\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_preferences_rels_parent_idx\` ON \`payload_preferences_rels\` (\`parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_preferences_rels_path_idx\` ON \`payload_preferences_rels\` (\`path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_preferences_rels_users_id_idx\` ON \`payload_preferences_rels\` (\`users_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`payload_migrations\` (
  	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  	\`name\` text,
  	\`batch\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(
    sql`CREATE INDEX \`payload_migrations_updated_at_idx\` ON \`payload_migrations\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_migrations_created_at_idx\` ON \`payload_migrations\` (\`created_at\`);`,
  )
  await db.run(sql`CREATE TABLE \`global_versioned_blocks_text_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`global_versioned\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`global_versioned_blocks_text_block_order_idx\` ON \`global_versioned_blocks_text_block\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`global_versioned_blocks_text_block_parent_id_idx\` ON \`global_versioned_blocks_text_block\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`global_versioned_blocks_text_block_path_idx\` ON \`global_versioned_blocks_text_block\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`global_versioned\` (
  	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(
    sql`CREATE INDEX \`global_versioned__status_idx\` ON \`global_versioned\` (\`_status\`);`,
  )
  await db.run(sql`CREATE TABLE \`_global_versioned_v_blocks_text_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  	\`text\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_global_versioned_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_global_versioned_v_blocks_text_block_order_idx\` ON \`_global_versioned_v_blocks_text_block\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_global_versioned_v_blocks_text_block_parent_id_idx\` ON \`_global_versioned_v_blocks_text_block\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_global_versioned_v_blocks_text_block_path_idx\` ON \`_global_versioned_v_blocks_text_block\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`_global_versioned_v\` (
  	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  	\`version__status\` text DEFAULT 'draft',
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`published_locale\` text,
  	\`latest\` integer
  );
  `)
  await db.run(
    sql`CREATE INDEX \`_global_versioned_v_version_version__status_idx\` ON \`_global_versioned_v\` (\`version__status\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_global_versioned_v_created_at_idx\` ON \`_global_versioned_v\` (\`created_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_global_versioned_v_updated_at_idx\` ON \`_global_versioned_v\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_global_versioned_v_published_locale_idx\` ON \`_global_versioned_v\` (\`published_locale\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_global_versioned_v_latest_idx\` ON \`_global_versioned_v\` (\`latest\`);`,
  )
  await db.run(sql`CREATE TABLE \`global_blocks_text_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`global\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`global_blocks_text_block_order_idx\` ON \`global_blocks_text_block\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`global_blocks_text_block_parent_id_idx\` ON \`global_blocks_text_block\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`global_blocks_text_block_path_idx\` ON \`global_blocks_text_block\` (\`_path\`);`,
  )
  await db.run(sql`CREATE TABLE \`global\` (
  	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`relation\`;`)
  await db.run(sql`DROP TABLE \`posts_versioned_blocks_text_block\`;`)
  await db.run(sql`DROP TABLE \`posts_versioned\`;`)
  await db.run(sql`DROP TABLE \`posts_versioned_rels\`;`)
  await db.run(sql`DROP TABLE \`_posts_versioned_v_blocks_text_block\`;`)
  await db.run(sql`DROP TABLE \`_posts_versioned_v\`;`)
  await db.run(sql`DROP TABLE \`_posts_versioned_v_rels\`;`)
  await db.run(sql`DROP TABLE \`posts_batches_blocks_text_block\`;`)
  await db.run(sql`DROP TABLE \`posts_batches\`;`)
  await db.run(sql`DROP TABLE \`posts_blocks_text_block\`;`)
  await db.run(sql`DROP TABLE \`posts_blocks_block_second\`;`)
  await db.run(sql`DROP TABLE \`posts_blocks_block_third\`;`)
  await db.run(sql`DROP TABLE \`posts_blocks_text_block_localized\`;`)
  await db.run(sql`DROP TABLE \`posts\`;`)
  await db.run(sql`DROP TABLE \`posts_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`DROP TABLE \`users_sessions\`;`)
  await db.run(sql`DROP TABLE \`users\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_migrations\`;`)
  await db.run(sql`DROP TABLE \`global_versioned_blocks_text_block\`;`)
  await db.run(sql`DROP TABLE \`global_versioned\`;`)
  await db.run(sql`DROP TABLE \`_global_versioned_v_blocks_text_block\`;`)
  await db.run(sql`DROP TABLE \`_global_versioned_v\`;`)
  await db.run(sql`DROP TABLE \`global_blocks_text_block\`;`)
  await db.run(sql`DROP TABLE \`global\`;`)
}
