import type { BaseDatabaseAdapter } from '../types.js'

import { commitTransaction } from '../../utilities/commitTransaction.js'
import { createLocalReq } from '../../utilities/createLocalReq.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { acquireMigrationLock } from './acquireMigrationLock.js'
import { getMigrations } from './getMigrations.js'
import { readMigrationFiles } from './readMigrationFiles.js'
import { releaseMigrationLock } from './releaseMigrationLock.js'

export const migrate: BaseDatabaseAdapter['migrate'] = async function migrate(
  this: BaseDatabaseAdapter,
  args,
): Promise<void> {
  const { payload } = this
  const migrationFiles = args?.migrations || (await readMigrationFiles({ payload }))

  if (!migrationFiles.length) {
    payload.logger.info({ msg: 'No migrations to run.' })
    return
  }

  // Acquire migration lock to prevent concurrent migrations
  const lockReq = await createLocalReq({}, payload)

  const { acquired, instanceId } = await acquireMigrationLock({
    payload,
    req: lockReq,
    timeout: 300000,
  })

  if (!acquired) {
    payload.logger.info({
      msg: 'Another instance is running migrations. Skipping.',
    })
    return
  }

  payload.logger.info({
    instanceId,
    msg: 'Acquired migration lock',
  })

  try {
    const { existingMigrations, latestBatch } = await getMigrations({ payload })

    const newBatch = latestBatch + 1

    // Execute 'up' function for each migration sequentially
    for (const migration of migrationFiles) {
      const existingMigration = existingMigrations.find(
        (existing) => existing.name === migration.name,
      )

      // Run migration if not found in database
      if (existingMigration) {
        continue
      }

      const start = Date.now()
      const req = await createLocalReq({}, payload)

      payload.logger.info({ msg: `Migrating: ${migration.name}` })

      try {
        await initTransaction(req)
        const session = payload.db.sessions?.[await req.transactionID!]
        await migration.up({ payload, req, session })
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
  } finally {
    await releaseMigrationLock({ instanceId, payload, req: lockReq })
    payload.logger.info({ instanceId, msg: 'Released migration lock' })
  }
}
