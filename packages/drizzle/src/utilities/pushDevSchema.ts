import { deepStrictEqual } from 'assert'
import prompts from 'prompts'

import type { BasePostgresAdapter } from '../postgres/types.js'
import type { DrizzleAdapter, PostgresDB, RawTable } from '../types.js'

const previousSchema: {
  localeCodes: null | string[]
  rawTables: null | Record<string, RawTable>
} = {
  localeCodes: null,
  rawTables: null,
}

/**
 * Pushes the development schema to the database using Drizzle.
 *
 * @param {DrizzleAdapter} adapter - The PostgresAdapter instance connected to the database.
 * @returns {Promise<void>} - A promise that resolves once the schema push is complete.
 */
export const pushDevSchema = async (adapter: DrizzleAdapter) => {
  if (process.env.PAYLOAD_FORCE_DRIZZLE_PUSH !== 'true') {
    const localeCodes =
      adapter.payload.config.localization && adapter.payload.config.localization.localeCodes

    try {
      deepStrictEqual(previousSchema, {
        localeCodes,
        rawTables: adapter.rawTables,
      })

      if (adapter.logger) {
        adapter.payload.logger.info('No changes detected in schema, skipping schema push.')
      }

      return
    } catch {
      previousSchema.localeCodes = localeCodes
      previousSchema.rawTables = adapter.rawTables
    }
  }

  const { pushSchema } = adapter.requireDrizzleKit()

  const { extensions = {}, tablesFilter } = adapter as BasePostgresAdapter

  // This will prompt if clarifications are needed for Drizzle to push new schema
  const { apply, hasDataLoss, warnings } = await pushSchema(
    adapter.schema,
    adapter.drizzle,
    adapter.schemaName ? [adapter.schemaName] : undefined,
    tablesFilter,
    // Drizzle extensionsFilter supports only postgis for now
    // https://github.com/drizzle-team/drizzle-orm/blob/83daf2d5cf023112de878bc2249ee2c41a2a5b1b/drizzle-kit/src/cli/validations/cli.ts#L26
    extensions.postgis ? ['postgis'] : undefined,
  )

  if (warnings.length) {
    let message = `Warnings detected during schema push: \n\n${warnings.join('\n')}\n\n`

    if (hasDataLoss) {
      message += `DATA LOSS WARNING: Possible data loss detected if schema is pushed.\n\n`
    }

    message += `Accept warnings and push schema to database?`

    const { confirm: acceptWarnings } = await prompts(
      {
        name: 'confirm',
        type: 'confirm',
        initial: false,
        message,
      },
      {
        onCancel: () => {
          process.exit(0)
        },
      },
    )

    // Exit if user does not accept warnings.
    // Q: Is this the right type of exit for this interaction?
    if (!acceptWarnings) {
      process.exit(0)
    }
  }

  await apply()
  const migrationsTable = adapter.schemaName
    ? `"${adapter.schemaName}"."payload_migrations"`
    : '"payload_migrations"'

  const drizzle = adapter.drizzle as PostgresDB

  const result = await adapter.execute({
    drizzle,
    raw: `SELECT * FROM ${migrationsTable} WHERE batch = '-1'`,
  })

  const devPush = result.rows

  if (!devPush.length) {
    // Use drizzle for insert so $defaultFn's are called
    await drizzle.insert(adapter.tables.payload_migrations).values({
      name: 'dev',
      batch: -1,
    })
  } else {
    await adapter.execute({
      drizzle,
      raw: `UPDATE ${migrationsTable} SET updated_at = CURRENT_TIMESTAMP WHERE batch = '-1'`,
    })
  }
}
