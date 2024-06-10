import type { Connect } from 'payload/database'

import { createClient } from '@libsql/client'
import { sql } from 'drizzle-orm'
import { type LibSQLDatabase, drizzle } from 'drizzle-orm/libsql'

import type { SQLiteAdapter } from './types.js'

import { pushDevSchema } from '../../drizzle/src/utilities/pushDevSchema.js'

export const connect: Connect = async function connect(
  this: SQLiteAdapter,
  options = {
    hotReload: false,
  },
) {
  const { hotReload } = options

  this.schema = {
    ...this.tables,
    ...this.relations,
  }

  try {
    if (!this.client) {
      this.client = createClient(this.clientConfig)
    }

    const logger = this.logger || false || true
    this.drizzle = drizzle(this.client, { logger, schema: this.schema }) as LibSQLDatabase

    if (!hotReload) {
      if (process.env.PAYLOAD_DROP_DATABASE === 'true') {
        this.payload.logger.info(`---- DROPPING TABLES SCHEMA(${this.schemaName || 'public'}) ----`)
        await this.dropDatabase({ adapter: this })
        this.payload.logger.info('---- DROPPED TABLES ----')
      }
    }
  } catch (err) {
    this.payload.logger.error(`Error: cannot connect to SQLite. Details: ${err.message}`, err)
    if (typeof this.rejectInitializing === 'function') this.rejectInitializing()
    process.exit(1)
  }

  // Only push schema if not in production
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.PAYLOAD_MIGRATING !== 'true' &&
    this.push !== false
  ) {
    await pushDevSchema(this)
  }

  if (typeof this.resolveInitializing === 'function') this.resolveInitializing()
}
