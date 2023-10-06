import type { PayloadRequest } from 'payload/types'

import { sql } from 'drizzle-orm'
import { readMigrationFiles } from 'payload/database'
import prompts from 'prompts'

import type { PostgresAdapter } from './types'

/**
 * Drop the current database and run all migrate up functions
 */
export async function migrateFresh(this: PostgresAdapter): Promise<void> {
  const { payload } = this

  const { confirm: acceptWarning } = await prompts(
    {
      name: 'confirm',
      initial: false,
      message: `WARNING: This will drop your database and run all migrations. Are you sure you want to proceed?`,
      type: 'confirm',
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

  payload.logger.info({
    msg: `Dropping database.`,
  })

  await this.drizzle.execute(sql`drop schema public cascade;\ncreate schema public;`)

  const migrationFiles = await readMigrationFiles({ payload })
  payload.logger.debug({
    msg: `Found ${migrationFiles.length} migration files.`,
  })

  let transactionID
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
          batch: 1,
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
