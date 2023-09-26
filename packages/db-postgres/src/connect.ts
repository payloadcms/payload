import type { Connect } from 'payload/database'

import { generateDrizzleJson, pushSchema } from 'drizzle-kit/utils'
import { eq, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { jsonb, numeric, pgTable, varchar } from 'drizzle-orm/pg-core'
import fs from 'fs'
import { configToJSONSchema } from 'payload/utilities'
import { Pool } from 'pg'
import prompts from 'prompts'

import type { PostgresAdapter } from './types'

// Migration table def in order to use query using drizzle
const migrationsSchema = pgTable('payload_migrations', {
  name: varchar('name'),
  batch: numeric('batch'),
  schema: jsonb('schema'),
})

export const connect: Connect = async function connect(this: PostgresAdapter, payload) {
  this.schema = {
    ...this.tables,
    ...this.relations,
    ...this.enums,
  }

  try {
    this.pool = new Pool(this.client)
    await this.pool.connect()

    this.db = drizzle(this.pool, { schema: this.schema })
    if (process.env.PAYLOAD_DROP_DATABASE === 'true') {
      this.payload.logger.info('---- DROPPING TABLES ----')
      await this.db.execute(sql`drop schema public cascade;\ncreate schema public;`)
      this.payload.logger.info('---- DROPPED TABLES ----')
    }
  } catch (err) {
    payload.logger.error(`Error: cannot connect to Postgres. Details: ${err.message}`, err)
    process.exit(1)
  }

  this.payload.logger.info('Connected to Postgres successfully')

  // Only push schema if not in production
  if (process.env.NODE_ENV === 'production' || process.env.PAYLOAD_MIGRATING === 'true') return

  // This will prompt if clarifications are needed for Drizzle to push new schema
  const { apply, hasDataLoss, statementsToExecute, warnings } = await pushSchema(
    this.schema,
    this.db,
  )

  this.payload.logger.debug({
    hasDataLoss,
    msg: 'Schema push results',
    statementsToExecute,
    warnings,
  })

  if (warnings.length) {
    this.payload.logger.warn({
      msg: `Warnings detected during schema push: ${warnings.join('\n')}`,
      warnings,
    })

    if (hasDataLoss) {
      this.payload.logger.warn({
        msg: 'DATA LOSS WARNING: Possible data loss detected if schema is pushed.',
      })
    }

    const { confirm: acceptWarnings } = await prompts(
      {
        name: 'confirm',
        initial: false,
        message: 'Accept warnings and push schema to database?',
        type: 'confirm',
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
}
