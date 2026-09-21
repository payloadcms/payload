import type { MigrationResult } from 'payload'

import { commitTransaction, initTransaction, killTransaction, readMigrationFiles } from 'payload'
import prompts from 'prompts'

import type { MongooseAdapter } from './index.js'

/**
 * Drop the current database and run all migrate up functions
 */
export async function migrateFresh(
  this: MongooseAdapter,
  {
    forceAcceptWarning = false,
    shouldPrompt = true,
  }: { forceAcceptWarning?: boolean; shouldPrompt?: boolean },
): Promise<MigrationResult> {
  const { payload } = this

  if (!forceAcceptWarning) {
    if (!shouldPrompt) {
      return { cancelled: true, migrated: [], rolledBack: [] }
    }

    const { confirm: acceptWarning } = await prompts({
      name: 'confirm',
      type: 'confirm',
      initial: false,
      message: `WARNING: This will drop your database and run all migrations. Are you sure you want to proceed?`,
    })

    if (!acceptWarning) {
      return { cancelled: true, migrated: [], rolledBack: [] }
    }
  }

  payload.logger.info({
    msg: `Dropping database.`,
  })

  await this.connection.dropDatabase()

  const migrationFiles = await readMigrationFiles({ payload })
  payload.logger.debug({
    msg: `Found ${migrationFiles.length} migration files.`,
  })

  const req = { payload }
  const migrated: string[] = []

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
      migrated.push(migration.name)

      payload.logger.info({ msg: `Migrated:  ${migration.name} (${Date.now() - start}ms)` })
    } catch (err: unknown) {
      await killTransaction(req)
      payload.logger.error({
        err,
        msg: `Error running migration ${migration.name}. Rolling back.`,
      })
      throw err
    }
  }

  return { batch: 1, migrated, rolledBack: [] }
}
