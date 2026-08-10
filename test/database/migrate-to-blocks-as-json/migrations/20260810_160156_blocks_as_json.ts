import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-sqlite'

import { sql } from '@payloadcms/db-sqlite'
import { getBlocksToJsonMigrator } from '@payloadcms/db-sqlite/migration-utils'
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

  await db.run(sql`CREATE TABLE \`posts_locales\` (
  	\`localized_content\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX \`posts_locales_locale_parent_id_unique\` ON \`posts_locales\` (\`_locale\`,\`_parent_id\`);`,
  )
  await db.run(sql`DROP TABLE \`posts_versioned_blocks_text_block\`;`)
  await db.run(sql`DROP TABLE \`posts_versioned_rels\`;`)
  await db.run(sql`DROP TABLE \`_posts_versioned_v_blocks_text_block\`;`)
  await db.run(sql`DROP TABLE \`_posts_versioned_v_rels\`;`)
  await db.run(sql`DROP TABLE \`posts_batches_blocks_text_block\`;`)
  await db.run(sql`DROP TABLE \`posts_blocks_text_block\`;`)
  await db.run(sql`DROP TABLE \`posts_blocks_block_second\`;`)
  await db.run(sql`DROP TABLE \`posts_blocks_block_third\`;`)
  await db.run(sql`DROP TABLE \`posts_blocks_text_block_localized\`;`)
  await db.run(sql`DROP TABLE \`posts_rels\`;`)
  await db.run(sql`DROP TABLE \`global_versioned_blocks_text_block\`;`)
  await db.run(sql`DROP TABLE \`_global_versioned_v_blocks_text_block\`;`)
  await db.run(sql`DROP TABLE \`global_blocks_text_block\`;`)
  await db.run(sql`ALTER TABLE \`posts_versioned\` ADD \`content\` text;`)
  await db.run(sql`ALTER TABLE \`_posts_versioned_v\` ADD \`version_content\` text;`)
  await db.run(sql`ALTER TABLE \`posts_batches\` ADD \`content\` text;`)
  await db.run(sql`ALTER TABLE \`posts\` ADD \`content\` text;`)
  await db.run(sql`ALTER TABLE \`global_versioned\` ADD \`content\` text;`)
  await db.run(sql`ALTER TABLE \`_global_versioned_v\` ADD \`version_content\` text;`)
  await db.run(sql`ALTER TABLE \`global\` ADD \`content\` text;`)
  payload.logger.info('Executed blocks to JSON migration statements.')

  await migrator.migrateEntitiesFromTempFolder(req, { clearBatches: true })
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Migration code
}
