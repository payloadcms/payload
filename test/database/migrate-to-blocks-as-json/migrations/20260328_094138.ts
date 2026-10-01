import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('en', 'fr');
  CREATE TYPE "public"."enum_posts_versioned_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__posts_versioned_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__posts_versioned_v_published_locale" AS ENUM('en', 'fr');
  CREATE TYPE "public"."enum_posts_blocks_text_block_select" AS ENUM('option1', 'option2');
  CREATE TYPE "public"."enum_global_versioned_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__global_versioned_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__global_versioned_v_published_locale" AS ENUM('en', 'fr');
  CREATE TABLE "relation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "posts_versioned_blocks_text_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"relation_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "posts_versioned" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_posts_versioned_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "posts_versioned_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"relation_id" integer
  );
  
  CREATE TABLE "_posts_versioned_v_blocks_text_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"relation_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_posts_versioned_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__posts_versioned_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__posts_versioned_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_posts_versioned_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"relation_id" integer
  );
  
  CREATE TABLE "posts_batches_blocks_text_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "posts_batches" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "posts_blocks_text_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"select" "enum_posts_blocks_text_block_select",
  	"relation_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "posts_blocks_block_second" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "posts_blocks_block_third" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "posts_blocks_text_block_localized" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"relation_id" integer
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"relation_id" integer,
  	"posts_versioned_id" integer,
  	"posts_batches_id" integer,
  	"posts_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "global_versioned_blocks_text_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "global_versioned" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_status" "enum_global_versioned_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_global_versioned_v_blocks_text_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_global_versioned_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version__status" "enum__global_versioned_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__global_versioned_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "global_blocks_text_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "global" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "posts_versioned_blocks_text_block" ADD CONSTRAINT "posts_versioned_blocks_text_block_relation_id_relation_id_fk" FOREIGN KEY ("relation_id") REFERENCES "public"."relation"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_versioned_blocks_text_block" ADD CONSTRAINT "posts_versioned_blocks_text_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts_versioned"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_versioned_rels" ADD CONSTRAINT "posts_versioned_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts_versioned"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_versioned_rels" ADD CONSTRAINT "posts_versioned_rels_relation_fk" FOREIGN KEY ("relation_id") REFERENCES "public"."relation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_versioned_v_blocks_text_block" ADD CONSTRAINT "_posts_versioned_v_blocks_text_block_relation_id_relation_id_fk" FOREIGN KEY ("relation_id") REFERENCES "public"."relation"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_versioned_v_blocks_text_block" ADD CONSTRAINT "_posts_versioned_v_blocks_text_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_versioned_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_versioned_v" ADD CONSTRAINT "_posts_versioned_v_parent_id_posts_versioned_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts_versioned"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_versioned_v_rels" ADD CONSTRAINT "_posts_versioned_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_posts_versioned_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_versioned_v_rels" ADD CONSTRAINT "_posts_versioned_v_rels_relation_fk" FOREIGN KEY ("relation_id") REFERENCES "public"."relation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_batches_blocks_text_block" ADD CONSTRAINT "posts_batches_blocks_text_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts_batches"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_text_block" ADD CONSTRAINT "posts_blocks_text_block_relation_id_relation_id_fk" FOREIGN KEY ("relation_id") REFERENCES "public"."relation"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_blocks_text_block" ADD CONSTRAINT "posts_blocks_text_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_block_second" ADD CONSTRAINT "posts_blocks_block_second_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_block_third" ADD CONSTRAINT "posts_blocks_block_third_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_blocks_text_block_localized" ADD CONSTRAINT "posts_blocks_text_block_localized_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_relation_fk" FOREIGN KEY ("relation_id") REFERENCES "public"."relation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_relation_fk" FOREIGN KEY ("relation_id") REFERENCES "public"."relation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_versioned_fk" FOREIGN KEY ("posts_versioned_id") REFERENCES "public"."posts_versioned"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_batches_fk" FOREIGN KEY ("posts_batches_id") REFERENCES "public"."posts_batches"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "global_versioned_blocks_text_block" ADD CONSTRAINT "global_versioned_blocks_text_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."global_versioned"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_global_versioned_v_blocks_text_block" ADD CONSTRAINT "_global_versioned_v_blocks_text_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_global_versioned_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "global_blocks_text_block" ADD CONSTRAINT "global_blocks_text_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."global"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "relation_updated_at_idx" ON "relation" USING btree ("updated_at");
  CREATE INDEX "relation_created_at_idx" ON "relation" USING btree ("created_at");
  CREATE INDEX "posts_versioned_blocks_text_block_order_idx" ON "posts_versioned_blocks_text_block" USING btree ("_order");
  CREATE INDEX "posts_versioned_blocks_text_block_parent_id_idx" ON "posts_versioned_blocks_text_block" USING btree ("_parent_id");
  CREATE INDEX "posts_versioned_blocks_text_block_path_idx" ON "posts_versioned_blocks_text_block" USING btree ("_path");
  CREATE INDEX "posts_versioned_blocks_text_block_relation_idx" ON "posts_versioned_blocks_text_block" USING btree ("relation_id");
  CREATE INDEX "posts_versioned_updated_at_idx" ON "posts_versioned" USING btree ("updated_at");
  CREATE INDEX "posts_versioned_created_at_idx" ON "posts_versioned" USING btree ("created_at");
  CREATE INDEX "posts_versioned__status_idx" ON "posts_versioned" USING btree ("_status");
  CREATE INDEX "posts_versioned_rels_order_idx" ON "posts_versioned_rels" USING btree ("order");
  CREATE INDEX "posts_versioned_rels_parent_idx" ON "posts_versioned_rels" USING btree ("parent_id");
  CREATE INDEX "posts_versioned_rels_path_idx" ON "posts_versioned_rels" USING btree ("path");
  CREATE INDEX "posts_versioned_rels_relation_id_idx" ON "posts_versioned_rels" USING btree ("relation_id");
  CREATE INDEX "_posts_versioned_v_blocks_text_block_order_idx" ON "_posts_versioned_v_blocks_text_block" USING btree ("_order");
  CREATE INDEX "_posts_versioned_v_blocks_text_block_parent_id_idx" ON "_posts_versioned_v_blocks_text_block" USING btree ("_parent_id");
  CREATE INDEX "_posts_versioned_v_blocks_text_block_path_idx" ON "_posts_versioned_v_blocks_text_block" USING btree ("_path");
  CREATE INDEX "_posts_versioned_v_blocks_text_block_relation_idx" ON "_posts_versioned_v_blocks_text_block" USING btree ("relation_id");
  CREATE INDEX "_posts_versioned_v_parent_idx" ON "_posts_versioned_v" USING btree ("parent_id");
  CREATE INDEX "_posts_versioned_v_version_version_updated_at_idx" ON "_posts_versioned_v" USING btree ("version_updated_at");
  CREATE INDEX "_posts_versioned_v_version_version_created_at_idx" ON "_posts_versioned_v" USING btree ("version_created_at");
  CREATE INDEX "_posts_versioned_v_version_version__status_idx" ON "_posts_versioned_v" USING btree ("version__status");
  CREATE INDEX "_posts_versioned_v_created_at_idx" ON "_posts_versioned_v" USING btree ("created_at");
  CREATE INDEX "_posts_versioned_v_updated_at_idx" ON "_posts_versioned_v" USING btree ("updated_at");
  CREATE INDEX "_posts_versioned_v_snapshot_idx" ON "_posts_versioned_v" USING btree ("snapshot");
  CREATE INDEX "_posts_versioned_v_published_locale_idx" ON "_posts_versioned_v" USING btree ("published_locale");
  CREATE INDEX "_posts_versioned_v_latest_idx" ON "_posts_versioned_v" USING btree ("latest");
  CREATE INDEX "_posts_versioned_v_rels_order_idx" ON "_posts_versioned_v_rels" USING btree ("order");
  CREATE INDEX "_posts_versioned_v_rels_parent_idx" ON "_posts_versioned_v_rels" USING btree ("parent_id");
  CREATE INDEX "_posts_versioned_v_rels_path_idx" ON "_posts_versioned_v_rels" USING btree ("path");
  CREATE INDEX "_posts_versioned_v_rels_relation_id_idx" ON "_posts_versioned_v_rels" USING btree ("relation_id");
  CREATE INDEX "posts_batches_blocks_text_block_order_idx" ON "posts_batches_blocks_text_block" USING btree ("_order");
  CREATE INDEX "posts_batches_blocks_text_block_parent_id_idx" ON "posts_batches_blocks_text_block" USING btree ("_parent_id");
  CREATE INDEX "posts_batches_blocks_text_block_path_idx" ON "posts_batches_blocks_text_block" USING btree ("_path");
  CREATE INDEX "posts_batches_updated_at_idx" ON "posts_batches" USING btree ("updated_at");
  CREATE INDEX "posts_batches_created_at_idx" ON "posts_batches" USING btree ("created_at");
  CREATE INDEX "posts_blocks_text_block_order_idx" ON "posts_blocks_text_block" USING btree ("_order");
  CREATE INDEX "posts_blocks_text_block_parent_id_idx" ON "posts_blocks_text_block" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_text_block_path_idx" ON "posts_blocks_text_block" USING btree ("_path");
  CREATE INDEX "posts_blocks_text_block_relation_idx" ON "posts_blocks_text_block" USING btree ("relation_id");
  CREATE INDEX "posts_blocks_block_second_order_idx" ON "posts_blocks_block_second" USING btree ("_order");
  CREATE INDEX "posts_blocks_block_second_parent_id_idx" ON "posts_blocks_block_second" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_block_second_path_idx" ON "posts_blocks_block_second" USING btree ("_path");
  CREATE INDEX "posts_blocks_block_third_order_idx" ON "posts_blocks_block_third" USING btree ("_order");
  CREATE INDEX "posts_blocks_block_third_parent_id_idx" ON "posts_blocks_block_third" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_block_third_path_idx" ON "posts_blocks_block_third" USING btree ("_path");
  CREATE INDEX "posts_blocks_text_block_localized_order_idx" ON "posts_blocks_text_block_localized" USING btree ("_order");
  CREATE INDEX "posts_blocks_text_block_localized_parent_id_idx" ON "posts_blocks_text_block_localized" USING btree ("_parent_id");
  CREATE INDEX "posts_blocks_text_block_localized_path_idx" ON "posts_blocks_text_block_localized" USING btree ("_path");
  CREATE INDEX "posts_blocks_text_block_localized_locale_idx" ON "posts_blocks_text_block_localized" USING btree ("_locale");
  CREATE INDEX "posts_updated_at_idx" ON "posts" USING btree ("updated_at");
  CREATE INDEX "posts_created_at_idx" ON "posts" USING btree ("created_at");
  CREATE INDEX "posts_rels_order_idx" ON "posts_rels" USING btree ("order");
  CREATE INDEX "posts_rels_parent_idx" ON "posts_rels" USING btree ("parent_id");
  CREATE INDEX "posts_rels_path_idx" ON "posts_rels" USING btree ("path");
  CREATE INDEX "posts_rels_relation_id_idx" ON "posts_rels" USING btree ("relation_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_relation_id_idx" ON "payload_locked_documents_rels" USING btree ("relation_id");
  CREATE INDEX "payload_locked_documents_rels_posts_versioned_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_versioned_id");
  CREATE INDEX "payload_locked_documents_rels_posts_batches_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_batches_id");
  CREATE INDEX "payload_locked_documents_rels_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "global_versioned_blocks_text_block_order_idx" ON "global_versioned_blocks_text_block" USING btree ("_order");
  CREATE INDEX "global_versioned_blocks_text_block_parent_id_idx" ON "global_versioned_blocks_text_block" USING btree ("_parent_id");
  CREATE INDEX "global_versioned_blocks_text_block_path_idx" ON "global_versioned_blocks_text_block" USING btree ("_path");
  CREATE INDEX "global_versioned__status_idx" ON "global_versioned" USING btree ("_status");
  CREATE INDEX "_global_versioned_v_blocks_text_block_order_idx" ON "_global_versioned_v_blocks_text_block" USING btree ("_order");
  CREATE INDEX "_global_versioned_v_blocks_text_block_parent_id_idx" ON "_global_versioned_v_blocks_text_block" USING btree ("_parent_id");
  CREATE INDEX "_global_versioned_v_blocks_text_block_path_idx" ON "_global_versioned_v_blocks_text_block" USING btree ("_path");
  CREATE INDEX "_global_versioned_v_version_version__status_idx" ON "_global_versioned_v" USING btree ("version__status");
  CREATE INDEX "_global_versioned_v_created_at_idx" ON "_global_versioned_v" USING btree ("created_at");
  CREATE INDEX "_global_versioned_v_updated_at_idx" ON "_global_versioned_v" USING btree ("updated_at");
  CREATE INDEX "_global_versioned_v_snapshot_idx" ON "_global_versioned_v" USING btree ("snapshot");
  CREATE INDEX "_global_versioned_v_published_locale_idx" ON "_global_versioned_v" USING btree ("published_locale");
  CREATE INDEX "_global_versioned_v_latest_idx" ON "_global_versioned_v" USING btree ("latest");
  CREATE INDEX "global_blocks_text_block_order_idx" ON "global_blocks_text_block" USING btree ("_order");
  CREATE INDEX "global_blocks_text_block_parent_id_idx" ON "global_blocks_text_block" USING btree ("_parent_id");
  CREATE INDEX "global_blocks_text_block_path_idx" ON "global_blocks_text_block" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "relation" CASCADE;
  DROP TABLE "posts_versioned_blocks_text_block" CASCADE;
  DROP TABLE "posts_versioned" CASCADE;
  DROP TABLE "posts_versioned_rels" CASCADE;
  DROP TABLE "_posts_versioned_v_blocks_text_block" CASCADE;
  DROP TABLE "_posts_versioned_v" CASCADE;
  DROP TABLE "_posts_versioned_v_rels" CASCADE;
  DROP TABLE "posts_batches_blocks_text_block" CASCADE;
  DROP TABLE "posts_batches" CASCADE;
  DROP TABLE "posts_blocks_text_block" CASCADE;
  DROP TABLE "posts_blocks_block_second" CASCADE;
  DROP TABLE "posts_blocks_block_third" CASCADE;
  DROP TABLE "posts_blocks_text_block_localized" CASCADE;
  DROP TABLE "posts" CASCADE;
  DROP TABLE "posts_rels" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "global_versioned_blocks_text_block" CASCADE;
  DROP TABLE "global_versioned" CASCADE;
  DROP TABLE "_global_versioned_v_blocks_text_block" CASCADE;
  DROP TABLE "_global_versioned_v" CASCADE;
  DROP TABLE "global_blocks_text_block" CASCADE;
  DROP TABLE "global" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_posts_versioned_status";
  DROP TYPE "public"."enum__posts_versioned_v_version_status";
  DROP TYPE "public"."enum__posts_versioned_v_published_locale";
  DROP TYPE "public"."enum_posts_blocks_text_block_select";
  DROP TYPE "public"."enum_global_versioned_status";
  DROP TYPE "public"."enum__global_versioned_v_version_status";
  DROP TYPE "public"."enum__global_versioned_v_published_locale";`)
}
