import type { BaseDatabaseAdapter } from '../types.js'

import { commitTransaction } from '../../utilities/commitTransaction.js'
import { createLocalReq } from '../../utilities/createLocalReq.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { getMigrations } from './getMigrations.js'
import { readMigrationFiles } from './readMigrationFiles.js'

export const migrate: BaseDatabaseAdapter['migrate'] = async function migrate(
  this: BaseDatabaseAdapter,
  args,
): Promise<void> {
  const { payload } = this

  // Skip migrations in development mode when using push (drizzle adapters)
  // The `push` property only exists on drizzle adapters and defaults to enabled when undefined
  // Only skip if the adapter has push capability AND it's not explicitly disabled
  if ('push' in this && process.env.NODE_ENV !== 'production') {
    const adapterPush = (this as unknown as { push: boolean }).push
    if (adapterPush !== false) {
      payload.logger.info({
        msg: 'Skipping migrations in development mode when using push. In production, migrations will run automatically.',
      })
      return
    }
  }

  const migrationFiles = args?.migrations || (await readMigrationFiles({ payload }))
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
}
