import type { DrizzleAdapter } from '@payloadcms/drizzle'
import type { Connect, Migration } from 'payload'

import { pushDevSchema } from '@payloadcms/drizzle'
import { assertOperatorHandlerExtensionsInstalled } from '@payloadcms/drizzle/postgres'
import { drizzle } from 'drizzle-orm/aws-data-api/pg'

import type { AuroraServerlessAdapter } from './types.js'

/**
 * Connects to Aurora Serverless / RDS through the RDS Data API.
 *
 * Unlike the node-postgres adapter there is no connection pool and no reconnect loop: the
 * `RDSDataClient` is stateless (HTTP) and each query is a single `ExecuteStatement` call. This is
 * what allows Aurora Serverless v2 to auto-pause when idle.
 */
export const connect: Connect = async function connect(
  this: AuroraServerlessAdapter,
  options = {
    hotReload: false,
  },
) {
  const { hotReload } = options

  try {
    const logger = this.logger || false

    this.drizzle = drizzle({
      connection: this.connection,
      logger,
      schema: this.schema,
    }) as unknown as AuroraServerlessAdapter['drizzle']

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
        msg: `Error: cannot connect to Aurora Serverless via the RDS Data API. Details: ${err.message}`,
      })
    }

    if (typeof this.rejectInitializing === 'function') {
      this.rejectInitializing()
    }
    throw new Error(`Error: cannot connect to Aurora Serverless: ${err.message}`)
  }

  await this.createExtensions()

  await assertOperatorHandlerExtensionsInstalled({
    drizzle: this.drizzle,
    operatorHandlers: this.operatorHandlers,
  })

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
