/* eslint-disable no-restricted-syntax, no-await-in-loop */
import type { PayloadRequest } from 'payload/types'

import { getMigrations, readMigrationFiles } from 'payload/database'
import { commitTransaction } from 'payload/dist/utilities/commitTransaction'
import { initTransaction } from 'payload/dist/utilities/initTransaction'
import { killTransaction } from 'payload/dist/utilities/killTransaction'

import type { PostgresAdapter } from './types'

import { migrationTableExists } from './utilities/migrationTableExists'

/**
 * Run all migrate down functions
 */
export async function migrateReset(this: PostgresAdapter): Promise<void> {
  const { payload } = this
  const migrationFiles = await readMigrationFiles({ payload })

  const { existingMigrations } = await getMigrations({ payload })

  if (!existingMigrations?.length) {
    payload.logger.info({ msg: 'No migrations to reset.' })
    return
  }

  const req = { payload } as PayloadRequest

  // Rollback all migrations in order
  for (const migration of existingMigrations) {
    const migrationFile = migrationFiles.find((m) => m.name === migration.name)
    try {
      if (!migrationFile) {
        throw new Error(`Migration ${migration.name} not found locally.`)
      }

      const start = Date.now()
      payload.logger.info({ msg: `Migrating down: ${migrationFile.name}` })
      await initTransaction(req)
      await migrationFile.down({ payload, req })
      payload.logger.info({
        msg: `Migrated down:  ${migrationFile.name} (${Date.now() - start}ms)`,
      })

      const tableExists = await migrationTableExists(this.drizzle)
      if (tableExists) {
        await payload.delete({
          id: migration.id,
          collection: 'payload-migrations',
          req,
        })
      }

      await commitTransaction(req)
    } catch (err: unknown) {
      let msg = `Error running migration ${migrationFile.name}.`

      if (err instanceof Error) msg += ` ${err.message}`

      await killTransaction(req)
      payload.logger.error({
        err,
        msg,
      })
      process.exit(1)
    }
  }

  // Delete dev migration

  const tableExists = await migrationTableExists(this.drizzle)
  if (tableExists) {
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
}
