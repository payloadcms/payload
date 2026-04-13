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

export async function migrateDown(this: DrizzleAdapter): Promise<void> {
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
    const req = await createLocalReq({}, payload)

    try {
      payload.logger.info({ msg: `Migrating down: ${migrationFile.name}` })
      await initTransaction(req)
      const db = await getTransaction(this, req)
      await migrationFile.down({ db, payload, req })
      payload.logger.info({
        msg: `Migrated down:  ${migrationFile.name} (${Date.now() - start}ms)`,
      })

      const tableExists = await migrationTableExists(this, db)

      if (tableExists) {
        await payload.delete({
          id: migration.id,
          collection: 'payload-migrations',
          req,
        })
      }

      await commitTransaction(req)
    } catch (err: unknown) {
      await killTransaction(req)

      payload.logger.error({
        err,
        msg: parseError(err, `Error migrating down ${migrationFile.name}. Rolling back.`),
      })
      process.exit(1)
    }
  }
}
