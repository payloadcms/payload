/* eslint-disable no-restricted-syntax, no-await-in-loop */
import type { DatabaseAdapter } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import { generateDrizzleJson } from 'drizzle-kit/utils'
import { readMigrationFiles } from 'payload/database'

import type { PostgresAdapter } from './types'

export async function migrate(this: PostgresAdapter): Promise<void> {
  const { payload } = this
  const migrationFiles = await readMigrationFiles({ payload })
  const migrationQuery = await payload.find({
    collection: 'payload-migrations',
    limit: 0,
    sort: '-name',
  })

  const latestBatch = Number(migrationQuery.docs[0]?.batch ?? 0)

  const newBatch = latestBatch + 1

  // Execute 'up' function for each migration sequentially
  for (const migration of migrationFiles) {
    const existingMigration = migrationQuery.docs.find(
      (existing) => existing.name === migration.name,
    )

    // Run migration if not found in database
    if (existingMigration) {
      continue // eslint-disable-line no-continue
    }

    const start = Date.now()

    payload.logger.info({ msg: `Migrating: ${migration.name}` })

    const pgAdapter = payload.db as PostgresAdapter // TODO: Fix this typing
    const drizzleJSON = generateDrizzleJson(pgAdapter.schema)

    try {
      await migration.up({ payload })
      payload.logger.info({ msg: `Migrated:  ${migration.name} (${Date.now() - start}ms)` })
      await payload.create({
        collection: 'payload-migrations',
        data: {
          name: migration.name,
          batch: newBatch,
          schema: drizzleJSON,
        },
      })
    } catch (err: unknown) {
      payload.logger.error({ err, msg: `Error running migration ${migration.name}` })
      throw err
    }
  }
}
