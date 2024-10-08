import type { PayloadRequest } from 'payload/types'

import { sql } from 'drizzle-orm'
import { readMigrationFiles } from 'payload/database'
import { commitTransaction } from 'payload/dist/utilities/commitTransaction'
import { initTransaction } from 'payload/dist/utilities/initTransaction'
import { killTransaction } from 'payload/dist/utilities/killTransaction'
import prompts from 'prompts'

import type { PostgresAdapter } from './types'

import { parseError } from './utilities/parseError'

/**
 * Drop the current database and run all migrate up functions
 */
export async function migrateFresh(
  this: PostgresAdapter,
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

  await this.drizzle.execute(
    sql.raw(`drop schema ${this.schemaName || 'public'} cascade;
  create schema ${this.schemaName || 'public'};`),
  )

  const migrationFiles = await readMigrationFiles({ payload })
  payload.logger.debug({
    msg: `Found ${migrationFiles.length} migration files.`,
  })

  const req = { payload } as PayloadRequest
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
