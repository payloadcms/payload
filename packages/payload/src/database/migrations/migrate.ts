/* eslint-disable no-restricted-syntax, no-await-in-loop */
import type { PayloadRequest } from '../../express/types'
import type { BaseDatabaseAdapter } from '../types'

import { commitTransaction } from '../../utilities/commitTransaction'
import { initTransaction } from '../../utilities/initTransaction'
import { killTransaction } from '../../utilities/killTransaction'
import { getMigrations } from './getMigrations'
import { readMigrationFiles } from './readMigrationFiles'

export async function migrate(this: BaseDatabaseAdapter): Promise<void> {
  const { payload } = this
  const migrationFiles = await readMigrationFiles({ payload })
  const { existingMigrations, latestBatch } = await getMigrations({ payload })

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
    const req = { payload } as PayloadRequest

    payload.logger.info({ msg: `Migrating: ${migration.name}` })

    try {
      await initTransaction(req)
      await migration.up({ payload, req })
      payload.logger.info({ msg: `Migrated:  ${migration.name} (${Date.now() - start}ms)` })
      await payload.create({
        collection: 'payload-migrations',
        data: {
          name: migration.name,
          batch: newBatch,
        },
        req,
      })
      await commitTransaction(req)
    } catch (err: unknown) {
      await killTransaction(req)
      payload.logger.error({ err, msg: `Error running migration ${migration.name}` })
      throw err
    }
  }
}
