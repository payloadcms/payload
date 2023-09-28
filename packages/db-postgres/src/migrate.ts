/* eslint-disable no-restricted-syntax, no-await-in-loop */
import { generateDrizzleJson } from 'drizzle-kit/utils'
import { readMigrationFiles } from 'payload/database'
import { DatabaseError } from 'pg'

import type { PostgresAdapter } from './types'

import { createMigrationTable } from './utilities/createMigrationTable'
import { migrationTableExists } from './utilities/migrationTableExists'

export async function migrate(this: PostgresAdapter): Promise<void> {
  const { payload } = this
  const migrationFiles = await readMigrationFiles({ payload })

  let latestBatch = 0
  let existingMigrations = []

  const hasMigrationTable = await migrationTableExists(this.db)

  if (hasMigrationTable) {
    ;({ docs: existingMigrations } = await payload.find({
      collection: 'payload-migrations',
      limit: 0,
      sort: '-name',
    }))
    if (typeof existingMigrations[0]?.batch !== 'undefined') {
      latestBatch = Number(existingMigrations[0]?.batch)
    }
  } else {
    await createMigrationTable(this.db)
  }

  const newBatch = latestBatch + 1

  // Execute 'up' function for each migration sequentially
  for (const migration of migrationFiles) {
    const existingMigration = existingMigrations.find(
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
      let msg = `Error running migration ${migration.name}`

      if (err instanceof DatabaseError) {
        msg += `: ${err.message}`
        if (err.hint) msg += `. ${err.hint}`
      }

      payload.logger.error({ err, msg })
      throw err
    }
  }
}
