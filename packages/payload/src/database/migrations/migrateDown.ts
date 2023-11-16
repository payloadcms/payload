/* eslint-disable no-restricted-syntax, no-await-in-loop */
import type { PayloadRequest } from '../../express/types'
import type { BaseDatabaseAdapter } from '../types'

import { getMigrations } from './getMigrations'
import { readMigrationFiles } from './readMigrationFiles'

export async function migrateDown(this: BaseDatabaseAdapter): Promise<void> {
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
      // Waiting for implementation here
      await payload.delete({
        id: migration.id,
        collection: 'payload-migrations',
        req: {
          transactionID,
        } as PayloadRequest,
      })
      await this.commitTransaction(transactionID)
    } catch (err: unknown) {
      await this.rollbackTransaction(transactionID)
      payload.logger.error({
        err,
        msg: `Error running migration ${migrationFile.name}`,
      })
      process.exit(1)
    }
  }
}
