import {
  commitTransaction,
  createLocalReq,
  initTransaction,
  killTransaction,
  readMigrationFiles,
} from 'payload'
import prompts from 'prompts'

import type { DrizzleAdapter } from './types.js'

import { getTransaction } from './utilities/getTransaction.js'
import { parseError } from './utilities/parseError.js'

/**
 * Drop the current database and run all migrate up functions
 */
export async function migrateFresh(
  this: DrizzleAdapter,
  { forceAcceptWarning = false },
): Promise<void> {
  const { payload } = this

  if (forceAcceptWarning === false) {
    const { confirm: acceptWarning } = await prompts(
      {
        name: 'confirm',
        type: 'confirm',
        initial: false,
        message: `WARNING: This will drop your database and run all migrations. Are you sure you want to proceed?`,
      },
      {
        onCancel: () => {
          process.exit(0)
        },
      },
    )

    if (!acceptWarning) {
      process.exit(0)
    }
  }

  payload.logger.info({
    msg: `Dropping database.`,
  })

  await this.dropDatabase({ adapter: this })

  const migrationFiles = await readMigrationFiles({ payload })
  payload.logger.debug({
    msg: `Found ${migrationFiles.length} migration files.`,
  })

  const req = await createLocalReq({}, payload)

  if ('createExtensions' in this && typeof this.createExtensions === 'function') {
    await this.createExtensions()
  }

  // Run all migrate up
  for (const migration of migrationFiles) {
    payload.logger.info({ msg: `Migrating: ${migration.name}` })
    try {
      const start = Date.now()
      await initTransaction(req)
      const db = await getTransaction(this, req)
      await migration.up({ db, payload, req })
      await payload.create({
        collection: 'payload-migrations',
        data: {
          name: migration.name,
          batch: 1,
        },
        req,
      })
      await commitTransaction(req)

      payload.logger.info({ msg: `Migrated:  ${migration.name} (${Date.now() - start}ms)` })
    } catch (err: unknown) {
      await killTransaction(req)
      payload.logger.error({
        err,
        msg: parseError(err, `Error running migration ${migration.name}. Rolling back`),
      })
      process.exit(1)
    }
  }
}
