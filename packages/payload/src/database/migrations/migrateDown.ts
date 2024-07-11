import type { PayloadRequest } from '../../types/index.js'
import type { BaseDatabaseAdapter } from '../types.js'

import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { getMigrations } from './getMigrations.js'
import { readMigrationFiles } from './readMigrationFiles.js'

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

  const latestBatchMigrations = existingMigrations.filter(({ batch }) => batch === latestBatch)

  for (const migration of latestBatchMigrations) {
    const migrationFile = migrationFiles.find((m) => m.name === migration.name)
    if (!migrationFile) {
      throw new Error(`Migration ${migration.name} not found locally.`)
    }

    const start = Date.now()
    const req = { payload } as PayloadRequest

    try {
      payload.logger.info({ msg: `Migrating down: ${migrationFile.name}` })
      await initTransaction(req)
      await migrationFile.down({ payload, req })
      payload.logger.info({
        msg: `Migrated down:  ${migrationFile.name} (${Date.now() - start}ms)`,
      })
      // Waiting for implementation here
      await payload.delete({
        id: migration.id,
        collection: 'payload-migrations',
        req,
      })

      await commitTransaction(req)
    } catch (err: unknown) {
      await killTransaction(req)
      payload.logger.error({
        err,
        msg: `Error running migration ${migrationFile.name}`,
      })
      process.exit(1)
    }
  }
}
