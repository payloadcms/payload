import type { DrizzleAdapter } from '@payloadcms/drizzle/types'
import type { Connect } from 'payload'

import { pushDevSchema } from '@payloadcms/drizzle'

import type { PostgresAdapter } from './types.js'

export const connect: Connect = async function connect(
  this: PostgresAdapter,
  options = {
    hotReload: false,
  },
) {
  const { hotReload } = options

  this.schema = {
    pgSchema: this.pgSchema,
    ...this.tables,
    ...this.relations,
    ...this.enums,
  }

  try {
    const logger = this.logger || false

    this.drizzle = await this.getDrizzle({ logger, schema: this.schema })

    if (!hotReload) {
      if (process.env.PAYLOAD_DROP_DATABASE === 'true') {
        this.payload.logger.info(`---- DROPPING TABLES SCHEMA(${this.schemaName || 'public'}) ----`)
        await this.dropDatabase({ adapter: this })
        this.payload.logger.info('---- DROPPED TABLES ----')
      }
    }
  } catch (err) {
    this.payload.logger.error(`Error: cannot connect to Postgres. Details: ${err.message}`, err)
    if (typeof this.rejectInitializing === 'function') this.rejectInitializing()
    process.exit(1)
  }

  // Only push schema if not in production
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.PAYLOAD_MIGRATING !== 'true' &&
    this.push !== false
  ) {
    await pushDevSchema(this as unknown as DrizzleAdapter)
  }

  if (typeof this.resolveInitializing === 'function') this.resolveInitializing()

  if (process.env.NODE_ENV === 'production' && this.prodMigrations) {
    await this.migrate({ migrations: this.prodMigrations })
  }
}
