import type { DrizzleAdapter } from '@payloadcms/drizzle/types'
import type { Connect, Migration, Payload } from 'payload'

import { pushDevSchema } from '@payloadcms/drizzle'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'

import type { PostgresAdapter } from './types.js'

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
    } catch (ignore) {
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
    } catch (ignore) {
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
    pgSchema: this.pgSchema,
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
    this.drizzle = drizzle({ client: this.pool, logger, schema: this.schema })

    if (!hotReload) {
      if (process.env.PAYLOAD_DROP_DATABASE === 'true') {
        this.payload.logger.info(`---- DROPPING TABLES SCHEMA(${this.schemaName || 'public'}) ----`)
        await this.dropDatabase({ adapter: this })
        this.payload.logger.info('---- DROPPED TABLES ----')
      }
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    if (err.message?.match(/database .* does not exist/i) && !this.disableCreateDatabase) {
      // capitalize first char of the err msg
      this.payload.logger.info(
        `${err.message.charAt(0).toUpperCase() + err.message.slice(1)}, creating...`,
      )
      const isCreated = await this.createDatabase()

      if (isCreated && this.connect) {
        await this.connect(options)
        return
      }
    } else {
      this.payload.logger.error({
        err,
        msg: `Error: cannot connect to Postgres. Details: ${err.message}`,
      })
    }

    if (typeof this.rejectInitializing === 'function') {
      this.rejectInitializing()
    }
    process.exit(1)
  }

  await this.createExtensions()

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
    await this.migrate({ migrations: this.prodMigrations as unknown as Migration[] })
  }
}
