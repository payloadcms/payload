import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-aurora-serverless'

import { sql } from '@payloadcms/db-aurora-serverless'

/**
 * A minimal additive migration used to prove the up/down cycle runs over the RDS Data API.
 * Each statement is issued on its own: the Data API only accepts one statement per call, so a
 * multi-statement `db.execute` (as generated migrations use) would fail here.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "lifecycle_marker" (
   	"id" serial PRIMARY KEY NOT NULL,
   	"note" varchar
   );`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "lifecycle_marker";`)
}
