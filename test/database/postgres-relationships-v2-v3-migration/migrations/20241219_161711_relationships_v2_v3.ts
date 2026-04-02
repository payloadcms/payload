import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { migratePostgresV2toV3 } from '@payloadcms/db-postgres/migration-utils'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await migratePostgresV2toV3({
    // enables logging of changes that will be made to the database
    debug: true,
    payload,
    req,
  })
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Migration code
}
