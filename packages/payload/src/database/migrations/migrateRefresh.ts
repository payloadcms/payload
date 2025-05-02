// @ts-strict-ignore
import type { BaseDatabaseAdapter } from '../types.js'

import { commitTransaction } from '../../utilities/commitTransaction.js'
import { createLocalReq } from '../../utilities/createLocalReq.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { getMigrations } from './getMigrations.js'
import { readMigrationFiles } from './readMigrationFiles.js'

/**
 * Run all migration down functions before running up
 */
export async function migrateRefresh(this: BaseDatabaseAdapter) {
  const { payload } = this
  const migrationFiles = await readMigrationFiles({ payload })

  const { existingMigrations } = await getMigrations({
    payload,
  })

  const req = await createLocalReq({}, payload)

  if (existingMigrations?.length) {
    payload.logger.info({
      msg: `Rolling back all ${existingMigrations.length} migration(s).`,
    })
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
        const session = payload.db.sessions?.[await req.transactionID]
        await migrationFile.down({ payload, req, session })
        payload.logger.info({
          msg: `Migrated down:  ${migration.name} (${Date.now() - start}ms)`,
        })
        await payload.delete({
          collection: 'payload-migrations',
          req,
          where: {
            name: {
              equals: migration.name,
            },
          },
        })
      } catch (err: unknown) {
        await killTransaction(req)
        let msg = `Error running migration ${migration.name}. Rolling back.`
        if (err instanceof Error) {
          msg += ` ${err.message}`
        }
        payload.logger.error({
          err,
          msg,
        })
        process.exit(1)
      }
    }
  } else {
    payload.logger.info({ msg: 'No migrations to rollback.' })
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
      let msg = `Error running migration ${migration.name}. Rolling back.`
      if (err instanceof Error) {
        msg += ` ${err.message}`
      }
      payload.logger.error({
        err,
        msg,
      })
      process.exit(1)
    }
  }
}
