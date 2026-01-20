import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "others" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"content" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "others_id" integer;
  CREATE INDEX "others_updated_at_idx" ON "others" USING btree ("updated_at");
  CREATE INDEX "others_created_at_idx" ON "others" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_others_fk" FOREIGN KEY ("others_id") REFERENCES "public"."others"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_others_id_idx" ON "payload_locked_documents_rels" USING btree ("others_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "others" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "others" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_others_fk";
  
  DROP INDEX "payload_locked_documents_rels_others_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "others_id";`)
}
