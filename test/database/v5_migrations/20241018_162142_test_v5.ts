import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from 'drizzle-orm'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`

DO $$ BEGIN
 CREATE TYPE "_locales" AS ENUM('en', 'es');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "selectEnum" AS ENUM('a', 'b', 'c');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "radioEnum" AS ENUM('a', 'b', 'c');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "enum_customs_status" AS ENUM('draft', 'published');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "enum__customs_v_version_status" AS ENUM('draft', 'published');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"throw_after_change" boolean,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "relation_a" (
	"id" serial PRIMARY KEY NOT NULL,
	"rich_text" jsonb,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "relation_a_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"relation_b_id" integer
);

CREATE TABLE IF NOT EXISTS "relation_b" (
	"id" serial PRIMARY KEY NOT NULL,
	"rich_text" jsonb,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "relation_b_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"relation_a_id" integer
);

CREATE TABLE IF NOT EXISTS "customs_customSelect" (
	"order" integer NOT NULL,
	"parent_id" integer NOT NULL,
	"value" "selectEnum",
	"id" serial PRIMARY KEY NOT NULL
);

CREATE TABLE IF NOT EXISTS "customArrays" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"text" varchar
);

CREATE TABLE IF NOT EXISTS "customArrays_locales" (
	"localized_text" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL,
	CONSTRAINT "customArrays_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id")
);

CREATE TABLE IF NOT EXISTS "customBlocks" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"text" varchar,
	"block_name" varchar
);

CREATE TABLE IF NOT EXISTS "customBlocks_locales" (
	"localized_text" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL,
	CONSTRAINT "customBlocks_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id")
);

CREATE TABLE IF NOT EXISTS "customs" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" varchar,
	"radio" "radioEnum",
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"_status" "enum_customs_status"
);

CREATE TABLE IF NOT EXISTS "customs_locales" (
	"localized_text" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL,
	CONSTRAINT "customs_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id")
);

CREATE TABLE IF NOT EXISTS "customs_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"relation_a_id" integer
);

CREATE TABLE IF NOT EXISTS "_customs_v_version_customSelect" (
	"order" integer NOT NULL,
	"parent_id" integer NOT NULL,
	"value" "selectEnum",
	"id" serial PRIMARY KEY NOT NULL
);

CREATE TABLE IF NOT EXISTS "_customArrays_v" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"text" varchar,
	"_uuid" varchar
);

CREATE TABLE IF NOT EXISTS "_customArrays_v_locales" (
	"localized_text" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL,
	CONSTRAINT "_customArrays_v_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id")
);

CREATE TABLE IF NOT EXISTS "_customBlocks_v" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"text" varchar,
	"_uuid" varchar,
	"block_name" varchar
);

CREATE TABLE IF NOT EXISTS "_customBlocks_v_locales" (
	"localized_text" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL,
	CONSTRAINT "_customBlocks_v_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id")
);

CREATE TABLE IF NOT EXISTS "_customs_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"version_text" varchar,
	"version_radio" "radioEnum",
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"version__status" "enum__customs_v_version_status",
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"latest" boolean
);

CREATE TABLE IF NOT EXISTS "_customs_v_locales" (
	"version_localized_text" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL,
	CONSTRAINT "_customs_v_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id")
);

CREATE TABLE IF NOT EXISTS "_customs_v_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"customs_id" integer,
	"relation_a_id" integer
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"email" varchar NOT NULL,
	"reset_password_token" varchar,
	"reset_password_expiration" timestamp(3) with time zone,
	"salt" varchar,
	"hash" varchar,
	"login_attempts" numeric,
	"lock_until" timestamp(3) with time zone
);

CREATE TABLE IF NOT EXISTS "payload_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar,
	"value" jsonb,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "payload_preferences_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"users_id" integer
);

CREATE TABLE IF NOT EXISTS "payload_migrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar,
	"batch" numeric,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "customGlobal" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" varchar,
	"updated_at" timestamp(3) with time zone,
	"created_at" timestamp(3) with time zone
);

CREATE TABLE IF NOT EXISTS "_customGlobal_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"version_text" varchar,
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "posts_created_at_idx" ON "posts" ("created_at");
CREATE INDEX IF NOT EXISTS "relation_a_created_at_idx" ON "relation_a" ("created_at");
CREATE INDEX IF NOT EXISTS "relation_a_rels_order_idx" ON "relation_a_rels" ("order");
CREATE INDEX IF NOT EXISTS "relation_a_rels_parent_idx" ON "relation_a_rels" ("parent_id");
CREATE INDEX IF NOT EXISTS "relation_a_rels_path_idx" ON "relation_a_rels" ("path");
CREATE INDEX IF NOT EXISTS "relation_b_created_at_idx" ON "relation_b" ("created_at");
CREATE INDEX IF NOT EXISTS "relation_b_rels_order_idx" ON "relation_b_rels" ("order");
CREATE INDEX IF NOT EXISTS "relation_b_rels_parent_idx" ON "relation_b_rels" ("parent_id");
CREATE INDEX IF NOT EXISTS "relation_b_rels_path_idx" ON "relation_b_rels" ("path");
CREATE INDEX IF NOT EXISTS "customs_customSelect_order_idx" ON "customs_customSelect" ("order");
CREATE INDEX IF NOT EXISTS "customs_customSelect_parent_idx" ON "customs_customSelect" ("parent_id");
CREATE INDEX IF NOT EXISTS "customArrays_order_idx" ON "customArrays" ("_order");
CREATE INDEX IF NOT EXISTS "customArrays_parent_id_idx" ON "customArrays" ("_parent_id");
CREATE INDEX IF NOT EXISTS "customBlocks_order_idx" ON "customBlocks" ("_order");
CREATE INDEX IF NOT EXISTS "customBlocks_parent_id_idx" ON "customBlocks" ("_parent_id");
CREATE INDEX IF NOT EXISTS "customBlocks_path_idx" ON "customBlocks" ("_path");
CREATE INDEX IF NOT EXISTS "customs_created_at_idx" ON "customs" ("created_at");
CREATE INDEX IF NOT EXISTS "customs__status_idx" ON "customs" ("_status");
CREATE INDEX IF NOT EXISTS "customs_rels_order_idx" ON "customs_rels" ("order");
CREATE INDEX IF NOT EXISTS "customs_rels_parent_idx" ON "customs_rels" ("parent_id");
CREATE INDEX IF NOT EXISTS "customs_rels_path_idx" ON "customs_rels" ("path");
CREATE INDEX IF NOT EXISTS "_customs_v_version_customSelect_order_idx" ON "_customs_v_version_customSelect" ("order");
CREATE INDEX IF NOT EXISTS "_customs_v_version_customSelect_parent_idx" ON "_customs_v_version_customSelect" ("parent_id");
CREATE INDEX IF NOT EXISTS "_customArrays_v_order_idx" ON "_customArrays_v" ("_order");
CREATE INDEX IF NOT EXISTS "_customArrays_v_parent_id_idx" ON "_customArrays_v" ("_parent_id");
CREATE INDEX IF NOT EXISTS "_customBlocks_v_order_idx" ON "_customBlocks_v" ("_order");
CREATE INDEX IF NOT EXISTS "_customBlocks_v_parent_id_idx" ON "_customBlocks_v" ("_parent_id");
CREATE INDEX IF NOT EXISTS "_customBlocks_v_path_idx" ON "_customBlocks_v" ("_path");
CREATE INDEX IF NOT EXISTS "_customs_v_version_version_created_at_idx" ON "_customs_v" ("version_created_at");
CREATE INDEX IF NOT EXISTS "_customs_v_version_version__status_idx" ON "_customs_v" ("version__status");
CREATE INDEX IF NOT EXISTS "_customs_v_created_at_idx" ON "_customs_v" ("created_at");
CREATE INDEX IF NOT EXISTS "_customs_v_updated_at_idx" ON "_customs_v" ("updated_at");
CREATE INDEX IF NOT EXISTS "_customs_v_latest_idx" ON "_customs_v" ("latest");
CREATE INDEX IF NOT EXISTS "_customs_v_rels_order_idx" ON "_customs_v_rels" ("order");
CREATE INDEX IF NOT EXISTS "_customs_v_rels_parent_idx" ON "_customs_v_rels" ("parent_id");
CREATE INDEX IF NOT EXISTS "_customs_v_rels_path_idx" ON "_customs_v_rels" ("path");
CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users" ("created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "payload_preferences_key_idx" ON "payload_preferences" ("key");
CREATE INDEX IF NOT EXISTS "payload_preferences_created_at_idx" ON "payload_preferences" ("created_at");
CREATE INDEX IF NOT EXISTS "payload_preferences_rels_order_idx" ON "payload_preferences_rels" ("order");
CREATE INDEX IF NOT EXISTS "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" ("parent_id");
CREATE INDEX IF NOT EXISTS "payload_preferences_rels_path_idx" ON "payload_preferences_rels" ("path");
CREATE INDEX IF NOT EXISTS "payload_migrations_created_at_idx" ON "payload_migrations" ("created_at");
DO $$ BEGIN
 ALTER TABLE "relation_a_rels" ADD CONSTRAINT "relation_a_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "relation_a"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "relation_a_rels" ADD CONSTRAINT "relation_a_rels_relation_b_fk" FOREIGN KEY ("relation_b_id") REFERENCES "relation_b"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "relation_b_rels" ADD CONSTRAINT "relation_b_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "relation_b"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "relation_b_rels" ADD CONSTRAINT "relation_b_rels_relation_a_fk" FOREIGN KEY ("relation_a_id") REFERENCES "relation_a"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "customs_customSelect" ADD CONSTRAINT "customs_customSelect_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "customs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "customArrays" ADD CONSTRAINT "customArrays_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "customs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "customArrays_locales" ADD CONSTRAINT "customArrays_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "customArrays"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "customBlocks" ADD CONSTRAINT "customBlocks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "customs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "customBlocks_locales" ADD CONSTRAINT "customBlocks_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "customBlocks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "customs_locales" ADD CONSTRAINT "customs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "customs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "customs_rels" ADD CONSTRAINT "customs_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "customs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "customs_rels" ADD CONSTRAINT "customs_rels_relation_a_fk" FOREIGN KEY ("relation_a_id") REFERENCES "relation_a"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "_customs_v_version_customSelect" ADD CONSTRAINT "_customs_v_version_customSelect_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "_customs_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "_customArrays_v" ADD CONSTRAINT "_customArrays_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "_customs_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "_customArrays_v_locales" ADD CONSTRAINT "_customArrays_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "_customArrays_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "_customBlocks_v" ADD CONSTRAINT "_customBlocks_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "_customs_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "_customBlocks_v_locales" ADD CONSTRAINT "_customBlocks_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "_customBlocks_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "_customs_v_locales" ADD CONSTRAINT "_customs_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "_customs_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "_customs_v_rels" ADD CONSTRAINT "_customs_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "_customs_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "_customs_v_rels" ADD CONSTRAINT "_customs_v_rels_custom_schema_fk" FOREIGN KEY ("customs_id") REFERENCES "customs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "_customs_v_rels" ADD CONSTRAINT "_customs_v_rels_relation_a_fk" FOREIGN KEY ("relation_a_id") REFERENCES "relation_a"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
`)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`

DROP TABLE "posts";
DROP TABLE "relation_a";
DROP TABLE "relation_a_rels";
DROP TABLE "relation_b";
DROP TABLE "relation_b_rels";
DROP TABLE "customs_customSelect";
DROP TABLE "customArrays";
DROP TABLE "customArrays_locales";
DROP TABLE "customBlocks";
DROP TABLE "customBlocks_locales";
DROP TABLE "customs";
DROP TABLE "customs_locales";
DROP TABLE "customs_rels";
DROP TABLE "_customs_v_version_customSelect";
DROP TABLE "_customArrays_v";
DROP TABLE "_customArrays_v_locales";
DROP TABLE "_customBlocks_v";
DROP TABLE "_customBlocks_v_locales";
DROP TABLE "_customs_v";
DROP TABLE "_customs_v_locales";
DROP TABLE "_customs_v_rels";
DROP TABLE "users";
DROP TABLE "payload_preferences";
DROP TABLE "payload_preferences_rels";
DROP TABLE "payload_migrations";
DROP TABLE "customGlobal";
DROP TABLE "_customGlobal_v";`)
}
