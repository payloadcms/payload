import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { sql } from '@payloadcms/db-postgres'
import { getBlocksToJsonMigrator } from '@payloadcms/db-postgres/migration-utils'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Configure migration options (optional)
const BATCH_SIZE = 100 // Number of entities to process per batch
const TEMP_FOLDER = path.resolve(dirname, '.payload-blocks-migration') // Folder path to store migration batch

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  const migrator = getBlocksToJsonMigrator(payload)
  migrator.setTempFolder(TEMP_FOLDER)
  await migrator.collectAndSaveEntitiesToBatches(req, { batchSize: BATCH_SIZE })

  await db.execute(sql`
   CREATE TABLE "posts_locales" (
  	"localized_content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  DROP TABLE "posts_versioned_blocks_text_block" CASCADE;
  DROP TABLE "posts_versioned_rels" CASCADE;
  DROP TABLE "_posts_versioned_v_blocks_text_block" CASCADE;
  DROP TABLE "_posts_versioned_v_rels" CASCADE;
  DROP TABLE "posts_batches_blocks_text_block" CASCADE;
  DROP TABLE "posts_blocks_text_block" CASCADE;
  DROP TABLE "posts_blocks_block_second" CASCADE;
  DROP TABLE "posts_blocks_block_third" CASCADE;
  DROP TABLE "posts_blocks_text_block_localized" CASCADE;
  DROP TABLE "posts_rels" CASCADE;
  DROP TABLE "global_versioned_blocks_text_block" CASCADE;
  DROP TABLE "_global_versioned_v_blocks_text_block" CASCADE;
  DROP TABLE "global_blocks_text_block" CASCADE;
  ALTER TABLE "posts_versioned" ADD COLUMN "content" jsonb;
  ALTER TABLE "_posts_versioned_v" ADD COLUMN "version_content" jsonb;
  ALTER TABLE "posts_batches" ADD COLUMN "content" jsonb;
  ALTER TABLE "posts" ADD COLUMN "content" jsonb;
  ALTER TABLE "global_versioned" ADD COLUMN "content" jsonb;
  ALTER TABLE "_global_versioned_v" ADD COLUMN "version_content" jsonb;
  ALTER TABLE "global" ADD COLUMN "content" jsonb;
  ALTER TABLE "posts_locales" ADD CONSTRAINT "posts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "posts_locales_locale_parent_id_unique" ON "posts_locales" USING btree ("_locale","_parent_id");
  DROP TYPE "public"."enum_posts_blocks_text_block_select";`)
  payload.logger.info('Executed blocks to JSON migration statements.')

  await migrator.migrateEntitiesFromTempFolder(req, { clearBatches: true })
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Migration code
}
