/* eslint-disable no-restricted-syntax, no-await-in-loop */
import type { PayloadRequest } from 'payload/types'

import { getMigrations, readMigrationFiles } from 'payload/database'

import type { PostgresAdapter } from './types'

import { migrationTableExists } from './utilities/migrationTableExists'
import { parseError } from './utilities/parseError'

export async function migrateDown(this: PostgresAdapter): Promise<void> {
  const { payload } = this
  const migrationFiles = await readMigrationFiles({ payload })

  const { existingMigrations, latestBatch } = await getMigrations({
    payload,
  })

  if (!existingMigrations?.length) {
    payload.logger.info({ msg: 'No migrations to rollback.' })
    return
  }

  payload.logger.info({
    msg: `Rolling back batch ${latestBatch} consisting of ${existingMigrations.length} migration(s).`,
  })

  for (const migration of existingMigrations) {
    const migrationFile = migrationFiles.find((m) => m.name === migration.name)
    if (!migrationFile) {
      throw new Error(`Migration ${migration.name} not found locally.`)
    }

    const start = Date.now()
    let transactionID

    try {
      payload.logger.info({ msg: `Migrating down: ${migrationFile.name}` })
      transactionID = await this.beginTransaction()
      await migrationFile.down({ payload })
      payload.logger.info({
        msg: `Migrated down:  ${migrationFile.name} (${Date.now() - start}ms)`,
      })

      const tableExists = await migrationTableExists(this.drizzle)
      if (tableExists) {
        await payload.delete({
          id: migration.id,
          collection: 'payload-migrations',
          req: {
            transactionID,
          } as PayloadRequest,
        })
      }

      await this.commitTransaction(transactionID)
    } catch (err: unknown) {
      await this.rollbackTransaction(transactionID)

      payload.logger.error({
        err,
        msg: parseError(err, `Error migrating down ${migrationFile.name}. Rolling back.`),
      })
      process.exit(1)
    }
  }
}
