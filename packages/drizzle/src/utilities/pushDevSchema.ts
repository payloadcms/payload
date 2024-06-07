import { pushSQLiteSchema } from 'drizzle-kit/payload'
import { sql } from 'drizzle-orm'
import { createRequire } from 'module'
import prompts from 'prompts'

import type { DrizzleAdapter } from '../types.js'

const require = createRequire(import.meta.url)

/**
 * Pushes the development schema to the database using Drizzle.
 *
 * @param {PostgresAdapter} adapter - The PostgresAdapter instance connected to the database.
 * @returns {Promise<void>} - A promise that resolves once the schema push is complete.
 */
export const pushDevSchema = async (adapter: DrizzleAdapter) => {
  let pushSchema
  if (adapter.name === 'postgres') {
    ;({ pushSchema } = require('drizzle-kit/payload'))
  }
  if (adapter.name === 'sqlite') {
    ;({ pushSQLiteSchema: pushSchema } = require('drizzle-kit/payload'))
  }

  // This will prompt if clarifications are needed for Drizzle to push new schema
  const { apply, hasDataLoss, statementsToExecute, warnings } = await pushSchema(
    adapter.schema,
    adapter.drizzle,
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

  // TODO: type this
  const result: any = await adapter.execute({
    drizzle: adapter.drizzle,
    sql: sql`SELECT * FROM payload_migrations WHERE batch = '-1'`,
  })

  const devPush = result.rows
  const table = adapter.schemaName
    ? `"${adapter.schemaName}"."payload_migrations"`
    : '"payload_migrations"'

  if (!devPush.length) {
    await adapter.execute({
      drizzle: adapter.drizzle,
      raw: `INSERT INTO ${table} (name, batch) VALUES ('dev', '-1')`,
    })
  } else {
    await adapter.execute({
      drizzle: adapter.drizzle,
      raw: `UPDATE ${table} SET updated_at = ${new Date()} WHERE batch = '-1'`,
    })
  }
}
