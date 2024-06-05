import { eq } from 'drizzle-orm'
import { numeric, timestamp, varchar } from 'drizzle-orm/pg-core'
import { createRequire } from 'module'
import prompts from 'prompts'

import type { PostgresAdapter } from '../types.js'

const require = createRequire(import.meta.url)

/**
 * Pushes the development schema to the database using Drizzle.
 *
 * @param {PostgresAdapter} db - The PostgresAdapter instance connected to the database.
 * @returns {Promise<void>} - A promise that resolves once the schema push is complete.
 */
export const pushDevSchema = async (db: PostgresAdapter) => {
  const { pushSchema } = require('drizzle-kit/payload')

  // This will prompt if clarifications are needed for Drizzle to push new schema
  const { apply, hasDataLoss, warnings } = await pushSchema(db.schema, db.drizzle)

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

  // Migration table def in order to use query using drizzle
  const migrationsSchema = db.pgSchema.table('payload_migrations', {
    name: varchar('name'),
    batch: numeric('batch'),
    created_at: timestamp('created_at'),
    updated_at: timestamp('updated_at'),
  })

  const devPush = await db.drizzle
    .select()
    .from(migrationsSchema)
    .where(eq(migrationsSchema.batch, '-1'))

  if (!devPush.length) {
    await db.drizzle.insert(migrationsSchema).values({
      name: 'dev',
      batch: '-1',
    })
  } else {
    await db.drizzle
      .update(migrationsSchema)
      .set({
        updated_at: new Date(),
      })
      .where(eq(migrationsSchema.batch, '-1'))
  }
}
