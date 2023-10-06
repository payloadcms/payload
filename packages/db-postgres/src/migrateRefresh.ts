/* eslint-disable no-restricted-syntax, no-await-in-loop */
import type { PayloadRequest } from 'payload/types'

import { getMigrations, readMigrationFiles } from 'payload/database'

import type { PostgresAdapter } from './types'

import { migrationTableExists } from './utilities/migrationTableExists'

/**
 * Run all migration down functions before running up
 */
export async function migrateRefresh(this: PostgresAdapter) {
  const { payload } = this
  const migrationFiles = await readMigrationFiles({ payload })

  const { existingMigrations, latestBatch } = await getMigrations({
    payload,
  })

  const migrationsToRollback = existingMigrations.filter(
    (migration) => migration.batch === latestBatch && migration.batch !== -1,
  )

  if (!migrationsToRollback?.length) {
    payload.logger.info({ msg: 'No migrations to rollback.' })
    return
  }

  payload.logger.info({
    msg: `Rolling back batch ${latestBatch} consisting of ${migrationsToRollback.length} migration(s).`,
  })

  let transactionID

  // Reverse order of migrations to rollback
  migrationsToRollback.reverse()

  for (const migration of migrationsToRollback) {
    try {
      const migrationFile = migrationFiles.find((m) => m.name === migration.name)
      if (!migrationFile) {
        throw new Error(`Migration ${migration.name} not found locally.`)
      }

      payload.logger.info({ msg: `Migrating down: ${migration.name}` })
      const start = Date.now()
      transactionID = await this.beginTransaction()
      await migrationFile.down({ payload })
      payload.logger.info({
        msg: `Migrated down:  ${migration.name} (${Date.now() - start}ms)`,
      })

      const tableExists = await migrationTableExists(this.drizzle)
      if (tableExists) {
        await payload.delete({
          collection: 'payload-migrations',
          req: {
            transactionID,
          } as PayloadRequest,
          where: {
            name: {
              equals: migration.name,
            },
          },
        })
      }
    } catch (err: unknown) {
      await this.rollbackTransaction(transactionID)
      let msg = `Error running migration ${migration.name}. Rolling back.`
      if (err instanceof Error) {
        msg += ` ${err.message}`
      }
      payload.logger.error({
        err,
        msg,
      })
      throw err
    }
  }

  // Run all migrate up
  for (const migration of migrationFiles) {
    payload.logger.info({ msg: `Migrating: ${migration.name}` })
    try {
      const start = Date.now()
      transactionID = await this.beginTransaction()
      await migration.up({ payload })
      await payload.create({
        collection: 'payload-migrations',
        data: {
          name: migration.name,
          executed: true,
        },
        req: {
          transactionID,
        } as PayloadRequest,
      })
      await this.commitTransaction(transactionID)

      payload.logger.info({ msg: `Migrated:  ${migration.name} (${Date.now() - start}ms)` })
    } catch (err: unknown) {
      await this.rollbackTransaction(transactionID)
      payload.logger.error({
        err,
        msg: `Error running migration ${migration.name}. Rolling back.`,
      })
      throw err
    }
  }
}
