import type { DrizzleAdapter } from '@payloadcms/drizzle/types'

import { createClient } from '@libsql/client'
import { pushDevSchema } from '@payloadcms/drizzle'
import { drizzle } from 'drizzle-orm/libsql'
import { captureError, type Connect } from 'payload'

import type { SQLiteAdapter } from './types.js'

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

    const logger = this.logger || false
    this.drizzle = drizzle(this.client, { logger, schema: this.schema })

    if (!hotReload) {
      if (process.env.PAYLOAD_DROP_DATABASE === 'true') {
        this.payload.logger.info(`---- DROPPING TABLES ----`)
        await this.dropDatabase({ adapter: this })
        this.payload.logger.info('---- DROPPED TABLES ----')
      }
    }
  } catch (err) {
    if (typeof this.rejectInitializing === 'function') {
      this.rejectInitializing()
    }
    await captureError({
      err,
      msg: `Error: cannot connect to SQLite: ${err.message}`,
      payload: this.payload,
    })
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

  if (typeof this.resolveInitializing === 'function') {
    this.resolveInitializing()
  }

  if (process.env.NODE_ENV === 'production' && this.prodMigrations) {
    await this.migrate({ migrations: this.prodMigrations })
  }
}
