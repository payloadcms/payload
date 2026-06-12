import type { BaseDatabaseAdapter, MigrateResult } from '../types.js'

import { commitTransaction } from '../../utilities/commitTransaction.js'
import { createLocalReq } from '../../utilities/createLocalReq.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { getMigrations } from './getMigrations.js'
import { readMigrationFiles } from './readMigrationFiles.js'

export const migrate: BaseDatabaseAdapter['migrate'] = async function migrate(
  this: BaseDatabaseAdapter,
  args,
): Promise<MigrateResult> {
  const { payload } = this
  const migrationFiles = args?.migrations || (await readMigrationFiles({ payload }))

  if (!migrationFiles.length) {
    payload.logger.info({ msg: 'No migrations to run.' })
    return { migrationsRan: [], pending: 0, status: 'no-pending' }
  }

  const { existingMigrations, latestBatch } = await getMigrations({ payload })

  const pendingMigrations = migrationFiles.filter(
    (migration) => !existingMigrations.find((existing) => existing.name === migration.name),
  )

  if (args?.dryRun) {
    return {
      migrationsRan: [],
      pending: pendingMigrations.length,
      status: 'dry-run',
    }
  }

  if (!pendingMigrations.length) {
    payload.logger.info({ msg: 'No migrations to run.' })
    return { migrationsRan: [], pending: 0, status: 'no-pending' }
  }

  const newBatch = latestBatch + 1
  const migrationsRan: Array<{ durationMs: number; name: string }> = []

  for (const migration of pendingMigrations) {
    const start = Date.now()
    const req = await createLocalReq({}, payload)

    payload.logger.info({ msg: `Migrating: ${migration.name}` })

    try {
      await initTransaction(req)
      const session = payload.db.sessions?.[await req.transactionID!]
      await migration.up({ payload, req, session })
      const durationMs = Date.now() - start
      payload.logger.info({ msg: `Migrated:  ${migration.name} (${durationMs}ms)` })
      await payload.create({
        collection: 'payload-migrations',
        data: {
          name: migration.name,
          batch: newBatch,
        },
        req,
      })
      await commitTransaction(req)
      migrationsRan.push({ name: migration.name, durationMs })
    } catch (err: unknown) {
      await killTransaction(req)
      payload.logger.error({ err, msg: `Error running migration ${migration.name}` })
      throw err
    }
  }

  return { migrationsRan, pending: 0, status: 'completed' }
}
