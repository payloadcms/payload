import type { Connect, Payload } from 'payload'

import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'

import type { PostgresAdapter } from './types.js'

import { pushDevSchema } from './utilities/pushDevSchema.js'

const connectWithReconnect = async function ({
  adapter,
  payload,
  reconnect = false,
}: {
  adapter: PostgresAdapter
  payload: Payload
  reconnect?: boolean
}) {
  let result

  if (!reconnect) {
    result = await adapter.pool.connect()
  } else {
    try {
      result = await adapter.pool.connect()
    } catch (err) {
      setTimeout(() => {
        payload.logger.info('Reconnecting to postgres')
        void connectWithReconnect({ adapter, payload, reconnect: true })
      }, 1000)
    }
  }
  if (!result) {
    return
  }
  result.prependListener('error', (err) => {
    try {
      if (err.code === 'ECONNRESET') {
        void connectWithReconnect({ adapter, payload, reconnect: true })
      }
    } catch (err) {
      // swallow error
    }
  })
}

export const connect: Connect = async function connect(
  this: PostgresAdapter,
  options = {
    hotReload: false,
  },
) {
  const { hotReload } = options

  this.schema = {
    ...this.tables,
    ...this.relations,
    ...this.enums,
  }

  try {
    if (!this.pool) {
      this.pool = new pg.Pool(this.poolOptions)
      await connectWithReconnect({ adapter: this, payload: this.payload })
    }

    const logger = this.logger || false
    this.drizzle = drizzle(this.pool, { logger, schema: this.schema })

    if (!hotReload) {
      if (process.env.PAYLOAD_DROP_DATABASE === 'true') {
        this.payload.logger.info(`---- DROPPING TABLES SCHEMA(${this.schemaName || 'public'}) ----`)
        await this.drizzle.execute(
          sql.raw(`
          drop schema if exists ${this.schemaName || 'public'} cascade;
          create schema ${this.schemaName || 'public'};
        `),
        )
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
    await pushDevSchema(this)
  }

  if (typeof this.resolveInitializing === 'function') this.resolveInitializing()
}
