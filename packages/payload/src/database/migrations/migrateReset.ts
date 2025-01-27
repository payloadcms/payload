/* eslint-disable no-restricted-syntax, no-await-in-loop */
import type { PayloadRequest } from '../../express/types'
import type { BaseDatabaseAdapter } from '../types'

import { commitTransaction } from '../../utilities/commitTransaction'
import { initTransaction } from '../../utilities/initTransaction'
import { killTransaction } from '../../utilities/killTransaction'
import { getMigrations } from './getMigrations'
import { readMigrationFiles } from './readMigrationFiles'

export async function migrateReset(this: BaseDatabaseAdapter): Promise<void> {
  const { payload } = this
  const migrationFiles = await readMigrationFiles({ payload })

  const { existingMigrations } = await getMigrations({ payload })

  if (!existingMigrations?.length) {
    payload.logger.info({ msg: 'No migrations to reset.' })
    return
  }

  const req = { payload } as PayloadRequest

  // Rollback all migrations in order
  for (const migration of migrationFiles) {
    // Create or update migration in database
    const existingMigration = existingMigrations.find(
      (existing) => existing.name === migration.name,
    )
    if (existingMigration) {
      payload.logger.info({ msg: `Migrating down: ${migration.name}` })
      try {
        const start = Date.now()
        await initTransaction(req)
        await migration.down({ payload, req })
        await payload.delete({
          collection: 'payload-migrations',
          req,
          where: {
            id: {
              equals: existingMigration.id,
            },
          },
        })
        await commitTransaction(req)
        payload.logger.info({ msg: `Migrated down:  ${migration.name} (${Date.now() - start}ms)` })
      } catch (err: unknown) {
        await killTransaction(req)
        payload.logger.error({ err, msg: `Error running migration ${migration.name}` })
        throw err
      }
    }
  }

  // Delete dev migration
  try {
    await payload.delete({
      collection: 'payload-migrations',
      where: {
        batch: {
          equals: -1,
        },
      },
    })
  } catch (err: unknown) {
    payload.logger.error({ error: err, msg: 'Error deleting dev migration' })
  }
}
