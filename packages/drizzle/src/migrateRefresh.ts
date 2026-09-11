import type { MigrationResult } from 'payload'

import {
  commitTransaction,
  createLocalReq,
  getMigrations,
  initTransaction,
  killTransaction,
  readMigrationFiles,
} from 'payload'

import type { DrizzleAdapter } from './types.js'

import { getTransaction } from './utilities/getTransaction.js'
import { migrationTableExists } from './utilities/migrationTableExists.js'
import { parseError } from './utilities/parseError.js'

/**
 * Run all migration down functions before running up
 */
export async function migrateRefresh(this: DrizzleAdapter): Promise<MigrationResult> {
  const { payload } = this
  const migrationFiles = await readMigrationFiles({ payload })

  const { existingMigrations, latestBatch } = await getMigrations({
    payload,
  })

  if (!existingMigrations?.length) {
    payload.logger.info({ msg: 'No migrations to rollback.' })
    return { migrated: [], rolledBack: [] }
  }

  payload.logger.info({
    msg: `Rolling back batch ${latestBatch} consisting of ${existingMigrations.length} migration(s).`,
  })

  const req = await createLocalReq({}, payload)
  const migrated: string[] = []
  const rolledBack: string[] = []

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
      const db = await getTransaction(this, req)
      await migrationFile.down({ db, payload, req })
      payload.logger.info({
        msg: `Migrated down:  ${migration.name} (${Date.now() - start}ms)`,
      })

      const tableExists = await migrationTableExists(this, db)
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
      rolledBack.push(migration.name)
    } catch (err: unknown) {
      await killTransaction(req)
      payload.logger.error({
        err,
        msg: parseError(err, `Error running migration ${migration.name}. Rolling back.`),
      })
      throw err
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
      migrated.push(migration.name)

      payload.logger.info({ msg: `Migrated:  ${migration.name} (${Date.now() - start}ms)` })
    } catch (err: unknown) {
      await killTransaction(req)
      payload.logger.error({
        err,
        msg: parseError(err, `Error running migration ${migration.name}. Rolling back.`),
      })
      throw err
    }
  }

  return { migrated, rolledBack }
}
