/* eslint-disable no-restricted-syntax, no-await-in-loop */
import type { PayloadRequest } from 'payload/types'

import { getMigrations, readMigrationFiles } from 'payload/database'
import { commitTransaction } from 'payload/dist/utilities/commitTransaction'
import { initTransaction } from 'payload/dist/utilities/initTransaction'
import { killTransaction } from 'payload/dist/utilities/killTransaction'

import type { PostgresAdapter } from './types'

import { migrationTableExists } from './utilities/migrationTableExists'
import { parseError } from './utilities/parseError'

/**
 * Run all migration down functions before running up
 */
export async function migrateRefresh(this: PostgresAdapter) {
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

  const req = { payload } as PayloadRequest

  // Reverse order of migrations to rollback
  existingMigrations.reverse()

  for (const migration of existingMigrations) {
    try {
      const migrationFile = migrationFiles.find((m) => m.name === migration.name)
      if (!migrationFile) {
        throw new Error(`Migration ${migration.name} not found locally.`)
      }

      payload.logger.info({ msg: `Migrating down: ${migration.name}` })
      const start = Date.now()
      await initTransaction(req)
      await migrationFile.down({ payload, req })
      payload.logger.info({
        msg: `Migrated down:  ${migration.name} (${Date.now() - start}ms)`,
      })

      const tableExists = await migrationTableExists(this.drizzle)
      if (tableExists) {
        await payload.delete({
          collection: 'payload-migrations',
          req,
          where: {
            name: {
              equals: migration.name,
            },
          },
        })
      }
      await commitTransaction(req)
    } catch (err: unknown) {
      await killTransaction(req)
      payload.logger.error({
        err,
        msg: parseError(err, `Error running migration ${migration.name}. Rolling back.`),
      })
      process.exit(1)
    }
  }

  // Run all migrate up
  for (const migration of migrationFiles) {
    payload.logger.info({ msg: `Migrating: ${migration.name}` })
    try {
      const start = Date.now()
      await initTransaction(req)
      await migration.up({ payload, req })
      await payload.create({
        collection: 'payload-migrations',
        data: {
          name: migration.name,
          executed: true,
        },
        req,
      })
      await commitTransaction(req)

      payload.logger.info({ msg: `Migrated:  ${migration.name} (${Date.now() - start}ms)` })
    } catch (err: unknown) {
      await killTransaction(req)
      payload.logger.error({
        err,
        msg: parseError(err, `Error running migration ${migration.name}. Rolling back.`),
      })
      process.exit(1)
    }
  }
}
